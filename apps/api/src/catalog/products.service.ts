import {
  isInternalAttribute,
  ListingVariant,
  publicPriceFromMerchant,
  validateListing as validateListingConfiguration,
} from '@westzone/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ModerateDto } from "../commerce/dto";
import { minor, amount } from "../commerce/rules";
import { OrderStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { FX_TO_XOF, isPricingCurrency, toXof } from "../common/currency";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { SupabaseStorageService } from "./supabase-storage.service";
import {
  canonicalSubcategoryLabel,
  categorySubcategoryValues,
  matchCategory,
  normalizeText,
  productCanonicalTaxonomy,
  resolveTopic,
  subcategoryValues,
} from "@westzone/shared";

/** Variantes de casse/accents pour retrouver les valeurs historiques en base. */
function caseVariants(values: string[]): string[] {
  const result = new Set<string>();
  for (const raw of values) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    result.add(value);
    result.add(value.toLowerCase());
    result.add(value.toUpperCase());
    const noAccent = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    result.add(noAccent);
    result.add(noAccent.toLowerCase());
  }
  return Array.from(result);
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private storage: SupabaseStorageService,
  ) {}

  async deleteListing(id: string, role: Role) {
    if (role !== Role.ADMIN) throw new ForbiddenException();
    try {
      await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id }, select: { id: true } });
        if (!product) throw new NotFoundException("Annonce introuvable");
        if (await tx.orderItem.count({ where: { productId: id } })) {
          throw new ConflictException("Cette annonce est liée à une commande. Sa suppression définitive est impossible sans altérer l’historique. Vous pouvez la retirer de la publication.");
        }
        await tx.review.deleteMany({ where: { productId: id } });
        await tx.product.delete({ where: { id } });
      });
      return { deleted: true, id };
    } catch (error) {
      if ((error as { code?: string }).code === "P2003") {
        throw new ConflictException("Cette annonce est liée à une commande et ne peut pas être supprimée définitivement.");
      }
      throw error;
    }
  }

  private computeProductScore(p: any): number {
    let score = 0;
    // 1. Photos réelles téléversées : priorité absolue
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      score += 1000 + Math.min(p.images.length, 5) * 50;
    }
    // 2. Piliers marchands à forte désirabilité en Afrique de l'Ouest
    const nameLower = (p.name || '').toLowerCase();
    const catLower = (p.category?.name || '').toLowerCase();
    const subLower = (p.subcategory || '').toLowerCase();

    if (/toyota|hilux|land cruiser|prado|jetour|sinotruk/i.test(nameLower)) {
      score += 650;
    } else if (/solaire|batterie|onduleur|deye|lifepo4/i.test(nameLower) || /solaire/i.test(catLower)) {
      score += 600;
    } else if (/climatis|split|inverter|tropicalis|gree|midea/i.test(nameLower) || /clim/i.test(subLower)) {
      score += 550;
    } else if (/iphone|galaxy|camon|infinix|thinkpad|macbook/i.test(nameLower)) {
      score += 500;
    } else if (/groupe|electrogene|motopompe|souder|inverter/i.test(nameLower)) {
      score += 450;
    }

    // 3. Facilité d'achat : vente à l'unité
    if (p.minimumOrder === 1) score += 40;

    return score;
  }

  async findAll(params: {
    search?: string;
    categoryId?: string;
    categoryKey?: string;
    universe?: string;
    condition?: string;
    subcategory?: string;
    subcategoryKey?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }) {
    const isFeatured = !params.sort || params.sort === "featured";

    // Index des catégories historiques -> catégories canoniques.
    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true, slug: true, universe: true },
    });
    const topic = resolveTopic(
      params.subcategoryKey || params.categoryKey || params.subcategory,
    );
    const topicCategoryIds = topic
      ? categories
          .filter(
            (category) =>
              matchCategory(category)?.category.slug === topic.category.slug,
          )
          .map((category) => category.id)
      : [];
    const topicSubcategoryValues = topic
      ? topic.subcategory
        ? subcategoryValues(topic.subcategory)
        : categorySubcategoryValues(topic.category)
      : [];
    const legacySubcategoryValues =
      !topic && params.subcategory
        ? caseVariants([params.subcategory])
        : [];
    const universeCategoryIds = params.universe
      ? categories
          .filter(
            (category) =>
              category.universe === params.universe ||
              matchCategory(category)?.universeId === params.universe,
          )
          .map((category) => category.id)
      : [];

    const conditions: any[] = [
      { OR: [{ sellerId: null }, { seller: { status: "APPROVED" } }] },
    ];

    if (params.categoryId) {
      conditions.push({
        OR: [
          { categoryId: params.categoryId },
          { categoryIds: { has: params.categoryId } },
        ],
      });
    }

    if (topic) {
      const or: any[] = [];
      if (topic.level === "subcategory") {
        // Filtre précis : la sous-catégorie demandée uniquement, pour éviter
        // qu'un filtre « Climatiseurs » n'affiche tout l'électroménager.
        if (topicSubcategoryValues.length) {
          or.push({ subcategory: { in: topicSubcategoryValues } });
          or.push({ subcategories: { hasSome: topicSubcategoryValues } });
        }
      } else {
        if (topicCategoryIds.length) {
          or.push({ categoryId: { in: topicCategoryIds } });
          or.push({ categoryIds: { hasSome: topicCategoryIds } });
        }
        if (topicSubcategoryValues.length) {
          or.push({ subcategory: { in: topicSubcategoryValues } });
          or.push({ subcategories: { hasSome: topicSubcategoryValues } });
        }
      }
      if (or.length) conditions.push({ OR: or });
    } else if (legacySubcategoryValues.length) {
      conditions.push({
        OR: [
          { subcategory: { in: legacySubcategoryValues } },
          { subcategories: { hasSome: legacySubcategoryValues } },
        ],
      });
    }

    if (params.universe) {
      if (universeCategoryIds.length) {
        conditions.push({
          OR: [
            { categoryId: { in: universeCategoryIds } },
            { categoryIds: { hasSome: universeCategoryIds } },
          ],
        });
      } else {
        conditions.push({ category: { universe: params.universe } });
      }
    }

    const products = await this.prisma.product.findMany({
      where: {
        moderation: "PUBLISHED",
        AND: conditions,
        ...(params.condition ? { condition: params.condition } : {}),
        ...(params.minPrice || params.maxPrice
          ? {
              price: {
                ...(params.minPrice
                  ? { gte: amount(minor(params.minPrice)) }
                  : {}),
                ...(params.maxPrice
                  ? { lte: amount(minor(params.maxPrice)) }
                  : {}),
              },
            }
          : {}),
      },
      include: { category: true, seller: true },
      orderBy:
        params.sort === "price-asc"
          ? { price: "asc" }
          : params.sort === "price-desc"
            ? { price: "desc" }
            : { createdAt: "desc" },
      // La recherche est faite en mémoire pour être insensible aux accents
      // et couvrir plusieurs champs (nom, description, catégories, vendeur).
      take: params.search ? 1000 : 250,
    });

    const searched = params.search
      ? (() => {
          const topic = resolveTopic(params.search as string);
          return products.filter((product) =>
            this.matchesSearch(product, params.search as string, topic),
          );
        })()
      : products;
    const attached = await this.attachStats(searched);
    const publicList = attached.map((p) => this.publicProduct(p));

    if (isFeatured) {
      publicList.sort((a, b) => this.computeProductScore(b) - this.computeProductScore(a));
    }

    return publicList;
  }

  /** Recherche multi-champs, insensible aux accents et à la casse. */
  private matchesSearch(
    product: any,
    query: string,
    topic = resolveTopic(query),
  ): boolean {
    const tokens = normalizeText(query)
      .split(" ")
      .filter((token) => token.length > 1 || /^\d+$/.test(token));
    if (!tokens.length) return true;
    const canonical = productCanonicalTaxonomy(product);

    // 1. Recherche intelligente : si la requête désigne une catégorie ou une
    // sous-catégorie canonique (même par synonyme), on vérifie l'appartenance.
    if (topic) {
      if (
        topic.level === "category" &&
        canonical.category?.slug === topic.category.slug
      ) {
        return true;
      }
      if (
        topic.level === "subcategory" &&
        topic.subcategory &&
        canonical.subcategories.includes(topic.subcategory.label)
      ) {
        return true;
      }
    }

    // 2. Recherche textuelle enrichie des synonymes des sous-catégories
    // canoniques du produit (frigo, laptop, clim…).
    const synonyms: string[] = [];
    for (const label of canonical.subcategories) {
      const resolved = resolveTopic(label);
      if (resolved?.subcategory) synonyms.push(...resolved.subcategory.aliases);
    }
    if (canonical.category) {
      synonyms.push(canonical.category.label, canonical.category.slug);
      // Produit sans sous-catégorie canonique : ses synonymes de catégorie
      // restent utiles (« laptop », « ordinateur », « pc »…).
      if (!canonical.subcategories.length) {
        const categoryTopic = resolveTopic(canonical.category.slug);
        if (categoryTopic?.category) {
          synonyms.push(...categoryTopic.category.aliases);
        }
      }
    }

    const haystack = normalizeText(
      [
        product.name,
        product.description,
        product.subcategory,
        ...(Array.isArray(product.subcategories) ? product.subcategories : []),
        product.category?.name,
        product.category?.slug,
        canonical.category?.label,
        canonical.category?.slug,
        ...canonical.subcategories,
        ...synonyms,
        product.seller?.shopName,
        product.location,
        ...Object.values(product.attributes || {}),
      ]
        .filter(Boolean)
        .join(" "),
    );
    return tokens.every((token) => haystack.includes(token));
  }


  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: true,
        reviews: { include: { buyer: true } },
      },
    });
    if (
      !product ||
      product.moderation !== "PUBLISHED" ||
      (product.seller && product.seller.status !== "APPROVED")
    )
      throw new NotFoundException("Produit introuvable");

    const [{ soldCount }] = await this.attachStats([product]);
    return {
      ...this.publicProduct(product),
      soldCount,
      avgRating: this.averageRating(product.reviews),
      reviewCount: product.reviews.length,
    };
  }

  async create(userId: string, role: Role, dto: CreateProductDto) {
    const sellerId = (role === Role.ADMIN && dto.sellerId) ? dto.sellerId : await this.resolveSellerId(userId, role);
    let prepared: any = this.normalizePricing(dto);
    if (role !== Role.ADMIN) prepared = this.applyMerchantMarkup(prepared);
    const normalized = this.normalizeVariantListing(this.normalizeCategories(prepared));
    delete normalized.catalogVersion;
    this.validateListing(normalized);
    return this.prisma.product.create({
      data: {
        ...normalized,
        supplierPrice: normalized.supplierPrice ?? normalized.price,
        images: normalized.images ?? [],
        sellerId,
        moderation: role === Role.ADMIN ? "PUBLISHED" : "PENDING",
      },
    });
  }

  async update(
    userId: string,
    role: Role,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const product = await this.assertOwnership(userId, role, productId);
    const hasVariants =
      Array.isArray(product.variants) && product.variants.length > 0;
    const touchesStock =
      dto.stock != null || dto.variants != null || dto.variantOptions != null;
    if ((hasVariants || touchesStock) && dto.catalogVersion == null) {
      throw new ConflictException(
        "Rechargez la fiche avant de modifier le stock ou les variantes.",
      );
    }
    if (
      dto.catalogVersion != null &&
      dto.catalogVersion !== product.catalogVersion
    ) {
      throw new ConflictException(
        "Cette fiche a changé. Rechargez-la pour conserver le stock actuel.",
      );
    }

    let mergedInput: any = this.normalizePricing({ ...product, ...dto });
    const changesPrice =
      role !== Role.ADMIN &&
      (dto.sourcePrice != null ||
        dto.supplierPrice != null ||
        dto.price != null ||
        dto.variants != null);
    if (changesPrice) mergedInput = this.applyMerchantMarkup(mergedInput);

    const merged = this.normalizeVariantListing(
      this.normalizeCategories(mergedInput),
    );
    this.validateListing(merged);

    const prior = (product.variants || []) as unknown as ListingVariant[];
    const next = merged.variants as ListingVariant[];
    for (const old of prior) {
      const current = next.find((variant) => variant.id === old.id);
      if (!current) next.push({ ...old, active: false });
      else if (JSON.stringify(current.values) !== JSON.stringify(old.values)) {
        throw new BadRequestException(
          "Une variante existante conserve ses options. Désactivez-la et créez une nouvelle combinaison.",
        );
      }
    }

    const patch: any = this.normalizeCategories(this.normalizePricing({ ...dto }));
    delete patch.catalogVersion;
    Object.assign(patch, {
      productType: merged.productType,
      variants: next,
      variantOptions: merged.variantOptions,
      stock: merged.stock,
      price: merged.price,
      supplierPrice: merged.supplierPrice,
    });
    const updated = await this.prisma.product.updateMany({
      where: { id: productId, catalogVersion: product.catalogVersion },
      data: {
        ...patch,
        catalogVersion: { increment: 1 },
        ...(role === Role.SELLER ? { moderation: "PENDING" } : {}),
      },
    });
    if (!updated.count) {
      throw new ConflictException(
        "Stock ou fiche modifié entre-temps. Rechargez puis réessayez.",
      );
    }
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  /**
   * Applique la marge publique au prix net commerçant. Le prix public n’est
   * jamais imposé par le client : il est recalculé côté serveur.
   */
  private applyMerchantMarkup<T extends Record<string, any>>(input: T): T {
    const clean: any = { ...input };
    const baseSupplier = Number(clean.supplierPrice ?? clean.price ?? 0);
    if (Number.isFinite(baseSupplier) && baseSupplier >= 0) {
      clean.supplierPrice = baseSupplier;
      clean.price = publicPriceFromMerchant(baseSupplier);
    }
    if (Array.isArray(clean.variants)) {
      clean.variants = clean.variants.map((variant: any) => {
        const supplier = Number(variant?.supplierPrice ?? variant?.price ?? 0);
        const valid = Number.isFinite(supplier) && supplier >= 0;
        return {
          ...variant,
          supplierPrice: valid ? supplier : 0,
          price: valid ? publicPriceFromMerchant(supplier) : 0,
        };
      });
    }
    return clean as T;
  }

  private normalizeVariantListing(input: any): any {
    // Les caractéristiques sont toujours stockées sous forme de texte plat :
    // les anciennes fiches pouvaient contenir des nombres ou des objets.
    const rawAttributes =
      input.attributes &&
      typeof input.attributes === "object" &&
      !Array.isArray(input.attributes)
        ? input.attributes
        : {};
    const attributes = Object.fromEntries(
      Object.entries(rawAttributes)
        .filter(([key, value]) => key.length <= 80 && value != null)
        .filter(([, value]) => typeof value !== "object")
        .map(([key, value]) => [key, String(value)]),
    );

    const clean: any = {
      ...input,
      productType: input.productType || "general",
      attributes,
      variantOptions: Array.isArray(input.variantOptions)
        ? input.variantOptions
        : [],
      variants: Array.isArray(input.variants) ? input.variants : [],
    };

    let errors: string[];
    try {
      errors = validateListingConfiguration(
        clean.productType,
        clean.attributes,
        clean.variantOptions,
        clean.variants,
      );
    } catch {
      throw new BadRequestException("Structure de variantes invalide.");
    }
    if (errors.length) throw new BadRequestException(errors.join(" "));

    clean.variantOptions = clean.variantOptions.map((option: any) => ({
      name: String(option.name).trim(),
      values: Array.from(
        new Map(
          option.values.map((value: any) => {
            const cleanValue = String(value).trim();
            return [cleanValue.toLowerCase(), cleanValue];
          }),
        ).values(),
      ),
    }));

    clean.variants = clean.variants.map((variant: any) => ({
      id: String(variant.id).trim(),
      sku: String(variant.sku ?? "").trim(),
      values: Object.fromEntries(
        Object.entries(variant.values || {}).map(([key, value]) => [
          String(key),
          String(value),
        ]),
      ),
      price: Number.isFinite(Number(variant.price))
        ? Number(variant.price)
        : 0,
      supplierPrice: Number.isFinite(Number(variant.supplierPrice))
        ? Number(variant.supplierPrice)
        : Number.isFinite(Number(variant.price))
          ? Number(variant.price)
          : 0,
      stock: Number.isFinite(Number(variant.stock))
        ? Math.max(0, Math.trunc(Number(variant.stock)))
        : 0,
      images: Array.isArray(variant.images) ? variant.images.map(String) : [],
      active: Boolean(variant.active),
      ...(variant.weightKg != null && Number.isFinite(Number(variant.weightKg))
        ? { weightKg: Number(variant.weightKg) }
        : {}),
    }));

    this.syncVariantAggregates(clean);
    return clean;
  }

  /** Le stock et le prix de la fiche reflètent les variantes actives. */
  private syncVariantAggregates(listing: any) {
    const active = (listing.variants as ListingVariant[]).filter(
      (variant) => variant.active,
    );
    if (!active.length) return;
    listing.stock = active.reduce(
      (total, variant) => total + Math.max(0, Math.trunc(variant.stock)),
      0,
    );
    listing.price = Math.min(...active.map((variant) => variant.price));
    listing.supplierPrice = Math.min(
      ...active.map((variant) => variant.supplierPrice ?? variant.price),
    );
  }

  /**
   * Normalise les catégories multiples :
   * - `categoryId` (principale) est toujours présent dans `categoryIds` ;
   * - `subcategory` (principale) est toujours présent dans `subcategories`.
   * Les doublons et valeurs vides sont supprimés.
   */
  private normalizeCategories<T extends Record<string, any>>(input: T): T {
    const clean: any = { ...input };

    if (typeof clean.categoryId === "string" || Array.isArray(clean.categoryIds)) {
      const primary =
        typeof clean.categoryId === "string" ? clean.categoryId.trim() : "";
      const extras = Array.isArray(clean.categoryIds)
        ? clean.categoryIds
            .filter((id: any) => typeof id === "string" && id.trim())
            .map((id: string) => id.trim())
        : [];
      const all = Array.from(new Set([...(primary ? [primary] : []), ...extras]));
      if (all.length) {
        clean.categoryIds = all;
        if (!primary) clean.categoryId = all[0];
      }
    }

    if (typeof clean.subcategory === "string" || Array.isArray(clean.subcategories)) {
      const primary =
        typeof clean.subcategory === "string"
          ? canonicalSubcategoryLabel(clean.subcategory)
          : "";
      const extras = Array.isArray(clean.subcategories)
        ? clean.subcategories
            .filter((name: any) => typeof name === "string" && name.trim())
            .map((name: string) => canonicalSubcategoryLabel(name))
        : [];
      const all: string[] = [];
      const seen = new Set<string>();
      for (const name of [primary, ...extras]) {
        const key = normalizeText(name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        all.push(name);
      }
      if (all.length) {
        clean.subcategories = all;
        if (!primary) clean.subcategory = all[0];
      }
    }

    return clean as T;
  }

  /**
   * Convertit une saisie en devise commerçant (AED par défaut) vers le XOF
   * qui reste la seule devise stockée en base. Les valeurs d'origine sont
   * conservées dans `attributes` pour l'affichage back-office.
   */
  private normalizePricing<T extends Record<string, any>>(input: T): T {
    const sourceCurrency = String(input.sourceCurrency || "XOF").toUpperCase();
    const sourcePrice = input.sourcePrice != null ? Number(input.sourcePrice) : undefined;
    const sourcePublicPrice =
      input.sourcePublicPrice != null ? Number(input.sourcePublicPrice) : undefined;

    const clean: any = { ...input };
    delete clean.sourceCurrency;
    delete clean.sourcePrice;
    delete clean.sourcePublicPrice;

    if (sourcePrice != null && Number.isFinite(sourcePrice) && isPricingCurrency(sourceCurrency)) {
      // `sourcePrice` = prix fournisseur saisi dans la devise du commerçant.
      // `sourcePublicPrice` = prix public saisi dans la même devise (admin).
      // Tout est converti une seule fois ici, en XOF.
      clean.supplierPrice = toXof(sourcePrice, sourceCurrency);
      clean.price = toXof(
        sourcePublicPrice != null && Number.isFinite(sourcePublicPrice)
          ? sourcePublicPrice
          : sourcePrice,
        sourceCurrency,
      );
      const attributes = { ...(clean.attributes || {}) };
      attributes.sourceCurrency = sourceCurrency;
      attributes.sourcePrice = String(sourcePrice);
      attributes.fxRate = String(FX_TO_XOF[sourceCurrency] ?? 1);
      clean.attributes = attributes;
    }

    return clean as T;
  }

  async addImage(
    userId: string,
    role: Role,
    productId: string,
    file: Express.Multer.File,
  ) {
    const product = await this.assertOwnership(userId, role, productId);
    if ((product.images?.length || 0) >= 20) {
      throw new BadRequestException("Nombre maximal de 20 photos atteint pour ce produit");
    }
    const url = await this.storage.uploadProductImage(file, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        images: { push: url },
        ...(role === Role.SELLER ? { moderation: "PENDING" } : {}),
      },
    });
  }

  async removeImage(
    userId: string,
    role: Role,
    productId: string,
    url: string,
  ) {
    const product = await this.assertOwnership(userId, role, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        images: product.images.filter((i) => i !== url),
        ...(role === Role.SELLER ? { moderation: "PENDING" } : {}),
      },
    });
  }

  async findMineOrAll(userId: string, role: Role) {
    if (role === Role.ADMIN)
      return this.prisma.product.findMany({
        where: { moderation: { not: "ARCHIVED" } },
        include: { category: true, seller: true },
      });
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) return [];
    return this.prisma.product.findMany({
      where: { sellerId: seller.id, moderation: { not: "ARCHIVED" } },
      include: { category: true },
    });
  }

  private validateListing(dto: any) {
    minor(dto.price);
    if (
      dto.supplierPrice != null &&
      minor(dto.supplierPrice) > minor(dto.price)
    )
      throw new BadRequestException(
        "Le prix public doit couvrir le prix fournisseur",
      );
    if (dto.shippingIncluded && !dto.shippingDestination?.trim())
      throw new BadRequestException(
        "Indiquez la destination pour laquelle la livraison est incluse",
      );
    if ((dto.minimumOrder ?? 1) !== 1 && (dto.minimumOrder ?? 1) % (dto.packSize ?? 1) !== 0)
      throw new BadRequestException(
        "Le minimum doit être un multiple du conditionnement",
      );
    if (dto.images && dto.images.length > 20)
      throw new BadRequestException(
        "Un produit peut contenir au maximum 20 photos",
      );
    if (dto.categoryIds && dto.categoryIds.length > 12)
      throw new BadRequestException(
        "Un produit peut être associé à 12 catégories au maximum",
      );
    if (dto.subcategories && dto.subcategories.length > 20)
      throw new BadRequestException(
        "Un produit peut être associé à 20 sous-catégories au maximum",
      );
    if (
      dto.attributes &&
      Object.entries(dto.attributes).some(
        ([k, v]) => k.length > 80 || typeof v !== "string" || v.length > 300,
      )
    )
      throw new BadRequestException("Caractéristiques invalides");
  }
  private publicProduct(product: any) {
    const {
      supplierPrice,
      moderationNote,
      sellerId,
      seller,
      reviews,
      ...safe
    } = product;
    const canonical = productCanonicalTaxonomy(product);
    return {
      ...safe,
      attributes: Object.fromEntries(Object.entries(safe.attributes||{}).filter(([k])=>!isInternalAttribute(k))),
      // Liste blanche : aucun champ interne de la variante ne peut fuiter.
      variants: ((safe.variants||[]) as ListingVariant[])
        .filter((variant) => variant.active)
        .map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          values: variant.values,
          price: variant.price,
          stock: variant.stock,
          images: variant.images,
          ...(variant.weightKg != null ? { weightKg: variant.weightKg } : {}),
          active: true,
        })),
      canonicalCategory: canonical.category,
      canonicalSubcategories: canonical.subcategories,
      seller: seller ? { id: seller.id, shopName: seller.shopName } : null,
      ...(reviews
        ? {
            reviews: reviews.map((r: any) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt,
            })),
          }
        : {}),
    };
  }
  async moderate(id: string, dto: ModerateDto) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (!p) throw new NotFoundException();
    if (
      dto.moderation === "PUBLISHED" &&
      p.seller &&
      p.seller.status !== "APPROVED"
    )
      throw new BadRequestException(
        "Approuvez le commerçant avant publication",
      );
    const normalized = this.normalizeVariantListing(p);
    if (
      (normalized.variants as ListingVariant[]).some((variant) => variant.active) &&
      dto.publicPrice
    ) {
      throw new BadRequestException(
        "Modifiez les prix dans le tableau des variantes.",
      );
    }
    const price = dto.publicPrice
      ? amount(minor(dto.publicPrice))
      : normalized.price;
    if (minor(price) < minor(normalized.supplierPrice ?? normalized.price))
      throw new BadRequestException(
        "Le prix public doit couvrir le prix fournisseur",
      );
    const updated = await this.prisma.product.updateMany({
      where: { id, catalogVersion: p.catalogVersion },
      data: {
        moderation: dto.moderation,
        moderationNote: dto.note,
        price,
        stock: normalized.stock,
        variants: normalized.variants as any,
        variantOptions: normalized.variantOptions as any,
        productType: normalized.productType,
        catalogVersion: { increment: 1 },
      },
    });
    if (!updated.count) {
      throw new ConflictException(
        "La fiche a changé pendant la validation. Rechargez puis réessayez.",
      );
    }
    return this.prisma.product.findUnique({ where: { id } });
  }

  /** Ajoute soldCount (unités livrées) et avgRating/reviewCount à une liste de produits. */
  private async attachStats<
    T extends { id: string; reviews?: { rating: number }[] },
  >(products: T[]) {
    const productIds = products.map((p) => p.id);
    if (productIds.length === 0)
      return products.map((p) => ({
        ...p,
        soldCount: 0,
        avgRating: null,
        reviewCount: 0,
      }));

    const [soldByProduct, ratingByProduct] = await Promise.all([
      this.prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          order: { status: OrderStatus.DELIVERED },
        },
        _sum: { quantity: true },
      }),
      this.prisma.review.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const soldMap = new Map(
      soldByProduct.map((s) => [s.productId, s._sum.quantity ?? 0]),
    );
    const ratingMap = new Map(
      ratingByProduct.map((r) => [
        r.productId,
        { avg: r._avg.rating, count: r._count.rating },
      ]),
    );

    return products.map((p) => ({
      ...p,
      soldCount: soldMap.get(p.id) ?? 0,
      avgRating: ratingMap.get(p.id)?.avg ?? null,
      reviewCount: ratingMap.get(p.id)?.count ?? 0,
    }));
  }

  private averageRating(reviews: { rating: number }[]) {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }

  private async resolveSellerId(
    userId: string,
    role: Role,
  ): Promise<string | null> {
    if (role === Role.ADMIN) {
      const official = await this.prisma.seller.findFirst({
        where: { OR: [{ id: "seller-westzone-official" }, { userId }] },
      });
      return official ? official.id : "seller-westzone-official";
    }
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller || seller.status !== "APPROVED")
      throw new ForbiddenException("Votre profil vendeur doit être approuvé");
    return seller.id;
  }

  private async assertOwnership(userId: string, role: Role, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Produit introuvable");
    if (role === Role.ADMIN) return product;
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (
      !seller ||
      seller.status !== "APPROVED" ||
      product.sellerId !== seller.id
    ) {
      throw new ForbiddenException("Vous ne gérez pas ce produit");
    }
    return product;
  }
}

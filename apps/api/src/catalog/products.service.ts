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
    universe?: string;
    condition?: string;
    subcategory?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }) {
    const isFeatured = !params.sort || params.sort === "featured";
    const universeCategoryIds = params.universe
      ? (
          await this.prisma.category.findMany({
            where: { universe: params.universe },
            select: { id: true },
          })
        ).map((category) => category.id)
      : [];
    const products = await this.prisma.product.findMany({
      where: {
        moderation: "PUBLISHED",
        AND: [
          { OR: [{ sellerId: null }, { seller: { status: "APPROVED" } }] },
          ...(params.categoryId
            ? [
                {
                  OR: [
                    { categoryId: params.categoryId },
                    { categoryIds: { has: params.categoryId } },
                  ],
                },
              ]
            : []),
          ...(params.subcategory
            ? [
                {
                  OR: [
                    { subcategory: params.subcategory },
                    { subcategories: { has: params.subcategory } },
                  ],
                },
              ]
            : []),
          ...(params.universe
            ? [
                {
                  OR: [
                    { category: { universe: params.universe } },
                    ...(universeCategoryIds.length
                      ? [{ categoryIds: { hasSome: universeCategoryIds } }]
                      : []),
                  ],
                },
              ]
            : []),
        ],
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
        ...(params.search
          ? { name: { contains: params.search, mode: "insensitive" as const } }
          : {}),
      },
      include: { category: true, seller: true },
      orderBy:
        params.sort === "price-asc"
          ? { price: "asc" }
          : params.sort === "price-desc"
            ? { price: "desc" }
            : { createdAt: "desc" },
      take: 250,
    });

    const attached = await this.attachStats(products);
    const publicList = attached.map((p) => this.publicProduct(p));

    if (isFeatured) {
      publicList.sort((a, b) => this.computeProductScore(b) - this.computeProductScore(a));
    }

    return publicList;
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
    const normalized = this.normalizeCategories(this.normalizePricing(dto));
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
    const merged = this.normalizeCategories(
      this.normalizePricing({ ...product, ...dto }),
    );
    this.validateListing(merged);
    const patch = this.normalizeCategories(
      this.normalizePricing({ ...(dto as Record<string, any>) }),
    );
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...patch,
        ...(role === Role.SELLER
          ? {
              moderation: "PENDING",
              supplierPrice:
                patch.supplierPrice ??
                patch.price ??
                product.supplierPrice ??
                product.price,
            }
          : {}),
      },
    });
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
        typeof clean.subcategory === "string" ? clean.subcategory.trim() : "";
      const extras = Array.isArray(clean.subcategories)
        ? clean.subcategories
            .filter((name: any) => typeof name === "string" && name.trim())
            .map((name: string) => name.trim())
        : [];
      const all = Array.from(new Set([...(primary ? [primary] : []), ...extras]));
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
    return {
      ...safe,
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
    const price = dto.publicPrice ? amount(minor(dto.publicPrice)) : p.price;
    if (minor(price) < minor(p.supplierPrice ?? p.price))
      throw new BadRequestException(
        "Le prix public doit couvrir le prix fournisseur",
      );
    return this.prisma.product.update({
      where: { id },
      data: { moderation: dto.moderation, moderationNote: dto.note, price },
    });
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
        where: { OR: [{ id: "seller-baobab-official" }, { userId }] },
      });
      return official ? official.id : "seller-baobab-official";
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

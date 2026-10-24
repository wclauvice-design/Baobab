import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ModerateDto } from "../commerce/dto";
import { minor, amount } from "../commerce/rules";
import { OrderStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { SupabaseStorageService } from "./supabase-storage.service";

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private storage: SupabaseStorageService,
  ) {}

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
    const products = await this.prisma.product.findMany({
      where: {
        moderation: "PUBLISHED",
        OR: [{ sellerId: null }, { seller: { status: "APPROVED" } }],
        ...(params.universe ? { category: { universe: params.universe } } : {}),
        ...(params.condition ? { condition: params.condition } : {}),
        ...(params.subcategory ? { subcategory: params.subcategory } : {}),
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
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
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
    const sellerId = await this.resolveSellerId(userId, role);
    this.validateListing(dto);
    return this.prisma.product.create({
      data: {
        ...dto,
        supplierPrice: dto.supplierPrice ?? dto.price,
        images: dto.images ?? [],
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
    this.validateListing({ ...product, ...dto });
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        ...(role === Role.SELLER
          ? {
              moderation: "PENDING",
              supplierPrice:
                dto.supplierPrice ??
                dto.price ??
                product.supplierPrice ??
                product.price,
            }
          : {}),
      },
    });
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
        include: { category: true, seller: true },
      });
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) return [];
    return this.prisma.product.findMany({
      where: { sellerId: seller.id },
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
    if (role === Role.ADMIN) return null;
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

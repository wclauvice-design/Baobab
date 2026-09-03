import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SupabaseStorageService } from './supabase-storage.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private storage: SupabaseStorageService,
  ) {}

  async findAll(params: { search?: string; categoryId?: string }) {
    const products = await this.prisma.product.findMany({
      where: {
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.search
          ? { name: { contains: params.search, mode: 'insensitive' as const } }
          : {}),
      },
      include: { category: true, seller: true },
      orderBy: { createdAt: 'desc' },
    });

    return this.attachStats(products);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, seller: true, reviews: { include: { buyer: true } } },
    });
    if (!product) throw new NotFoundException('Produit introuvable');

    const [{ soldCount }] = await this.attachStats([product]);
    return {
      ...product,
      soldCount,
      avgRating: this.averageRating(product.reviews),
      reviewCount: product.reviews.length,
    };
  }

  async create(userId: string, role: Role, dto: CreateProductDto) {
    const sellerId = await this.resolveSellerId(userId, role);
    return this.prisma.product.create({
      data: { ...dto, images: dto.images ?? [], sellerId },
    });
  }

  async update(userId: string, role: Role, productId: string, dto: UpdateProductDto) {
    await this.assertOwnership(userId, role, productId);
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async addImage(userId: string, role: Role, productId: string, file: Express.Multer.File) {
    await this.assertOwnership(userId, role, productId);
    const url = await this.storage.uploadProductImage(file, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { images: { push: url } },
    });
  }

  async removeImage(userId: string, role: Role, productId: string, url: string) {
    const product = await this.assertOwnership(userId, role, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { images: product.images.filter((i) => i !== url) },
    });
  }

  async findMineOrAll(userId: string, role: Role) {
    if (role === Role.ADMIN)
      return this.prisma.product.findMany({ include: { category: true, seller: true } });
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) return [];
    return this.prisma.product.findMany({
      where: { sellerId: seller.id },
      include: { category: true },
    });
  }

  /** Ajoute soldCount (unités livrées) et avgRating/reviewCount à une liste de produits. */
  private async attachStats<T extends { id: string; reviews?: { rating: number }[] }>(
    products: T[],
  ) {
    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) return products.map((p) => ({ ...p, soldCount: 0, avgRating: null, reviewCount: 0 }));

    const [soldByProduct, ratingByProduct] = await Promise.all([
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds }, order: { status: OrderStatus.DELIVERED } },
        _sum: { quantity: true },
      }),
      this.prisma.review.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const soldMap = new Map(soldByProduct.map((s) => [s.productId, s._sum.quantity ?? 0]));
    const ratingMap = new Map(
      ratingByProduct.map((r) => [r.productId, { avg: r._avg.rating, count: r._count.rating }]),
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

  private async resolveSellerId(userId: string, role: Role): Promise<string | null> {
    if (role === Role.ADMIN) return null;
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new ForbiddenException('Profil vendeur introuvable');
    return seller.id;
  }

  private async assertOwnership(userId: string, role: Role, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable');
    if (role === Role.ADMIN) return product;
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller || product.sellerId !== seller.id) {
      throw new ForbiddenException("Vous ne gérez pas ce produit");
    }
    return product;
  }
}

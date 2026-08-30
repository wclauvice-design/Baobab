import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { search?: string; categoryId?: string }) {
    return this.prisma.product.findMany({
      where: {
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.search
          ? { name: { contains: params.search, mode: 'insensitive' as const } }
          : {}),
      },
      include: { category: true, seller: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, seller: true, reviews: true },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
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

  private async resolveSellerId(userId: string, role: Role): Promise<string | null> {
    if (role === Role.ADMIN) return null;
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new ForbiddenException('Profil vendeur introuvable');
    return seller.id;
  }

  private async assertOwnership(userId: string, role: Role, productId: string) {
    if (role === Role.ADMIN) return;
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable');
    if (!seller || product.sellerId !== seller.id) {
      throw new ForbiddenException("Vous ne gérez pas ce produit");
    }
  }
}

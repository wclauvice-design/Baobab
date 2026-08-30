import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role, SellerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async register(userId: string, shopName: string, city: string) {
    const existing = await this.prisma.seller.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Ce compte est déjà un vendeur');

    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.seller.create({
        data: { userId, shopName, city, status: SellerStatus.PENDING },
      });
      await tx.user.update({ where: { id: userId }, data: { role: Role.SELLER } });
      return seller;
    });
  }

  listAll(status?: SellerStatus) {
    return this.prisma.seller.findMany({
      where: status ? { status } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setStatus(sellerId: string, status: SellerStatus) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Vendeur introuvable');
    return this.prisma.seller.update({ where: { id: sellerId }, data: { status } });
  }

  async dashboard(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Profil vendeur introuvable');

    const [activeProducts, pendingOrders, deliveredItems] = await Promise.all([
      this.prisma.product.count({ where: { sellerId: seller.id } }),
      this.prisma.orderItem.findMany({
        where: {
          product: { sellerId: seller.id },
          order: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] } },
        },
        distinct: ['orderId'],
      }),
      this.prisma.orderItem.findMany({
        where: {
          product: { sellerId: seller.id },
          order: { status: OrderStatus.DELIVERED },
        },
      }),
    ]);

    const revenue = deliveredItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    return {
      seller,
      activeProducts,
      pendingOrders: pendingOrders.length,
      revenue,
    };
  }
}

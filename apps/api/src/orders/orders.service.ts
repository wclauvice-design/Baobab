import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentProviderType, PaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

export const CASH_ON_DELIVERY_FEE = 1000;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async create(buyerId: string, dto: CreateOrderDto) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new NotFoundException(`Produit ${item.productId} introuvable`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock insuffisant pour ${product.name}`);
      }
    }

    const itemsTotal = dto.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const deliveryFee = dto.provider === PaymentProviderType.CASH_ON_DELIVERY ? CASH_ON_DELIVERY_FEE : 0;
    const totalAmount = itemsTotal + deliveryFee;

    const expirationMinutes = Number(this.config.get('ORDER_EXPIRATION_MINUTES') ?? 45);
    const expiresAt = new Date(Date.now() + expirationMinutes * 60_000);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          buyerId,
          totalAmount,
          deliveryFee,
          deliveryAddress: dto.deliveryAddress,
          deliveryMode: dto.deliveryMode,
          expiresAt,
          items: {
            create: dto.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return { productId: item.productId, quantity: item.quantity, unitPrice: product.price };
            }),
          },
        },
        include: { items: true },
      });

      await tx.deliveryEvent.create({ data: { orderId: order.id, status: order.status } });

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }

  findMine(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: { items: { include: { product: true } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, role: Role, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        payment: true,
        deliveryEvents: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    if (role === Role.BUYER && order.buyerId !== userId) throw new ForbiddenException();
    if (role === Role.SELLER) {
      const seller = await this.prisma.seller.findUnique({ where: { userId } });
      const owns = order.items.some((i) => i.product.sellerId === seller?.id);
      if (!owns) throw new ForbiddenException();
    }

    return order;
  }

  async updateStatus(userId: string, role: Role, orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    if (role === Role.SELLER) {
      const seller = await this.prisma.seller.findUnique({ where: { userId } });
      const owns = order.items.some((i) => i.product.sellerId === seller?.id);
      if (!owns) throw new ForbiddenException();
    }

    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status } });
    await this.prisma.deliveryEvent.create({ data: { orderId, status } });
    return updated;
  }

  async markConfirmed(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      });
      await tx.deliveryEvent.create({ data: { orderId, status: OrderStatus.CONFIRMED } });
      return order;
    });
  }

  async markCancelled(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.deliveryEvent.create({ data: { orderId, status: OrderStatus.CANCELLED } });
      return order;
    });
  }

  listForSeller(sellerId: string) {
    return this.prisma.order.findMany({
      where: { items: { some: { product: { sellerId } } } },
      include: { items: { include: { product: true } }, buyer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllForAdmin() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: true } }, buyer: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async expireUnpaidOrders() {
    const expired = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING_PAYMENT, expiresAt: { lt: new Date() } },
      include: { items: true, payment: true },
    });

    for (const order of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.EXPIRED } });
        await tx.deliveryEvent.create({ data: { orderId: order.id, status: OrderStatus.EXPIRED } });
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        if (order.payment && order.payment.status === PaymentStatus.PENDING) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: PaymentStatus.EXPIRED },
          });
        }
      });
      this.logger.log(`Commande ${order.id} expirée, stock libéré`);
    }
  }
}

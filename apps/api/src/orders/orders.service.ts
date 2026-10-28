import { ListingVariant, variantLabel } from '@baobab/shared';
import { quantity } from '../commerce/rules';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
    return this.prisma.$transaction(async (tx) => {
      const grouped = new Map<
        string,
        { productId: string; variantId?: string; quantity: number }
      >();
      for (const item of dto.items) {
        const key = JSON.stringify([item.productId, item.variantId || null]);
        const previous = grouped.get(key);
        grouped.set(key, {
          ...item,
          quantity: (previous?.quantity || 0) + item.quantity,
        });
      }
      const lines = [...grouped.values()];
      const productIds = [...new Set(lines.map((line) => line.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { seller: true },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException('Un produit est introuvable');
      }

      const snapshots: any[] = [];
      let cents = 0;

      for (const product of products) {
        if (
          product.moderation !== 'PUBLISHED' ||
          (product.seller && product.seller.status !== 'APPROVED')
        ) {
          throw new BadRequestException('Annonce indisponible');
        }
        const variants = this.variantList(product);
        const activeVariants = variants.filter((variant) => variant.active);
        let stock = Number(product.stock);

        for (const item of lines.filter((line) => line.productId === product.id)) {
          quantity(item.quantity, product.minimumOrder, product.packSize);

          let variant: ListingVariant | undefined;
          if (activeVariants.length) {
            if (!item.variantId) {
              throw new BadRequestException(
                `Choisissez une variante disponible pour ${product.name}.`,
              );
            }
            variant = activeVariants.find(
              (candidate) => candidate.id === item.variantId,
            );
            if (!variant) {
              throw new BadRequestException(
                'Variante indisponible pour cet article.',
              );
            }
          } else if (item.variantId) {
            throw new BadRequestException(
              'Cet article ne possède pas de variante.',
            );
          }

          const available = variant ? variant.stock : stock;
          if (available < item.quantity) {
            throw new BadRequestException(
              `Stock insuffisant pour ${product.name}${
                variant ? ` (${variantLabel(variant)})` : ''
              }.`,
            );
          }

          const price = variant ? Number(variant.price) : Number(product.price);
          if (!Number.isFinite(price) || price <= 0) {
            throw new BadRequestException(
              `Prix indisponible pour ${product.name}.`,
            );
          }

          cents += Math.round(price * 100) * item.quantity;
          snapshots.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice: price,
            ...(variant
              ? {
                  variantId: variant.id,
                  variantLabel: variantLabel(variant),
                  variantSku: variant.sku,
                }
              : {}),
          });

          if (variant) variant.stock -= item.quantity;
          stock -= item.quantity;
        }

        const reserved = await tx.product.updateMany({
          where: {
            id: product.id,
            catalogVersion: product.catalogVersion,
            moderation: 'PUBLISHED',
          },
          data: {
            stock,
            variants: variants as any,
            catalogVersion: { increment: 1 },
          },
        });
        if (!reserved.count) {
          throw new BadRequestException(
            'Le stock ou le prix vient de changer. Actualisez puis réessayez.',
          );
        }
      }

      if (snapshots.length !== lines.length) {
        throw new NotFoundException('Un produit est introuvable');
      }
      const deliveryFee =
        dto.provider === PaymentProviderType.CASH_ON_DELIVERY
          ? CASH_ON_DELIVERY_FEE
          : 0;
      const expirationMinutes = Number(
        this.config.get('ORDER_EXPIRATION_MINUTES') ?? 45,
      );
      const order = await tx.order.create({
        data: {
          buyerId,
          totalAmount: cents / 100 + deliveryFee,
          deliveryFee,
          deliveryAddress: dto.deliveryAddress,
          deliveryMode: dto.deliveryMode,
          expiresAt: new Date(Date.now() + expirationMinutes * 60000),
          items: { create: snapshots },
        },
        include: { items: true },
      });
      await tx.deliveryEvent.create({
        data: { orderId: order.id, status: order.status },
      });
      return order;
    });
  }

  /** Copie sûre des variantes stockées en JSON. */
  private variantList(product: any): ListingVariant[] {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    return raw.map((variant: any) => ({
      ...variant,
      values: variant?.values || {},
      images: Array.isArray(variant?.images) ? variant.images : [],
      active: Boolean(variant?.active),
    }));
  }

  /**
   * Restitue le stock réservé par une commande annulée ou expirée.
   * Le verrou optimiste évite d’écraser un stock modifié entre-temps.
   */
  private async releaseReservedStock(tx: any, order: any) {
    for (const item of order.items || []) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;
      const variants = this.variantList(product);
      if (item.variantId) {
        const variant = variants.find(
          (candidate) => candidate.id === item.variantId,
        );
        if (variant) variant.stock += item.quantity;
        else {
          this.logger.warn(
            `Variante ${item.variantId} introuvable pour la commande ${order.id}`,
          );
        }
      }
      const released = await tx.product.updateMany({
        where: { id: product.id, catalogVersion: product.catalogVersion },
        data: {
          stock: { increment: item.quantity },
          variants: variants as any,
          catalogVersion: { increment: 1 },
        },
      });
      if (!released.count) {
        throw new ConflictException(
          'Stock modifié pendant la restitution. Une nouvelle tentative sera faite.',
        );
      }
    }
  }

  findMine(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true, price: true } } } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, role: Role, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true, price: true } } } },
        payment: true,
        deliveryEvents: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    if (role === Role.BUYER && order.buyerId !== userId) throw new ForbiddenException();
    if (role === Role.SELLER) throw new ForbiddenException('Les commandes clients sont gérées exclusivement par Baobab');


    return order;
  }

  async updateStatus(userId: string, role: Role, orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true, price: true } } } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    if (role === Role.SELLER) throw new ForbiddenException('Les commandes clients sont gérées exclusivement par Baobab');

    if (status === OrderStatus.CANCELLED) {
      return this.markCancelled(orderId);
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
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });
      if (!order) throw new NotFoundException('Commande introuvable');
      if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.EXPIRED
      ) {
        return order;
      }
      await this.releaseReservedStock(tx, order);
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.deliveryEvent.create({ data: { orderId, status: OrderStatus.CANCELLED } });
      if (order.payment && order.payment.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
      return updated;
    });
  }

  listForSeller(sellerId: string) {
    throw new ForbiddenException('Les commandes clients sont gérées exclusivement par Baobab');
  }

  listAllForAdmin() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: { select: { id: true, name: true, images: true, price: true } } } }, buyer: true, payment: true },
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
      try {
        const expiredNow = await this.prisma.$transaction(async (tx) => {
          const claimed = await tx.order.updateMany({
            where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
            data: { status: OrderStatus.EXPIRED },
          });
          if (!claimed.count) return false;
          await tx.deliveryEvent.create({
            data: { orderId: order.id, status: OrderStatus.EXPIRED },
          });
          await this.releaseReservedStock(tx, order);
          if (order.payment && order.payment.status === PaymentStatus.PENDING) {
            await tx.payment.update({
              where: { id: order.payment.id },
              data: { status: PaymentStatus.EXPIRED },
            });
          }
          return true;
        });
        if (expiredNow) {
          this.logger.log(`Commande ${order.id} expirée, stock libéré`);
        }
      } catch (error) {
        this.logger.error(
          `Libération du stock impossible pour la commande ${order.id}: ${
            (error as Error).message
          }`,
        );
      }
    }
  }
}

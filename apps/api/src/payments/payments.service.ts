import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentAuditAction,
  PaymentProviderType,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentProvider } from './providers/payment-provider.interface';
import { ManualOrangeMoneyProvider } from './providers/manual-orange-money.provider';
import { CashOnDeliveryProvider } from './providers/cash-on-delivery.provider';

@Injectable()
export class PaymentsService {
  private providers: Record<PaymentProviderType, PaymentProvider>;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private orders: OrdersService,
    manualOrangeMoney: ManualOrangeMoneyProvider,
    cashOnDelivery: CashOnDeliveryProvider,
  ) {
    this.providers = {
      [PaymentProviderType.MANUAL_ORANGE_MONEY]: manualOrangeMoney,
      [PaymentProviderType.CASH_ON_DELIVERY]: cashOnDelivery,
    };
  }

  async initiate(userId: string, orderId: string, providerType: PaymentProviderType) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId) throw new ForbiddenException();
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Cette commande ne peut plus être payée');
    }

    const existing = await this.prisma.payment.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('Un paiement existe déjà pour cette commande');

    const provider = this.providers[providerType];
    const result = await provider.initiate(order);

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider: providerType,
        reference: result.reference,
        status: result.status,
        amount: order.totalAmount,
      },
    });

    if (result.status === PaymentStatus.CONFIRMED) {
      await this.orders.markConfirmed(orderId);
      await this.notifications.notifyUser(
        order.buyerId,
        order.buyer.phone,
        `Votre commande ${orderId} est confirmée (paiement à la livraison). Elle passe en préparation.`,
      );
    }

    return { payment, instructions: result.instructions, merchantNumber: result.merchantNumber };
  }

  async status(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId) throw new ForbiddenException();
    return { orderStatus: order.status, payment: order.payment };
  }

  queue() {
    return this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      include: { order: { include: { buyer: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async validate(adminId: string, paymentId: string) {
    return this.resolve(adminId, paymentId, PaymentAuditAction.VALIDATE);
  }

  async reject(adminId: string, paymentId: string) {
    return this.resolve(adminId, paymentId, PaymentAuditAction.REJECT);
  }

  private async resolve(adminId: string, paymentId: string, action: PaymentAuditAction) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { buyer: true } } },
    });
    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Ce paiement a déjà été traité');
    }

    const newStatus =
      action === PaymentAuditAction.VALIDATE ? PaymentStatus.CONFIRMED : PaymentStatus.FAILED;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: newStatus, validatedBy: adminId, validatedAt: new Date() },
      }),
      this.prisma.paymentAudit.create({
        data: { paymentId, adminId, action, amount: payment.amount },
      }),
    ]);

    if (action === PaymentAuditAction.VALIDATE) {
      await this.orders.markConfirmed(payment.orderId);
      await this.notifications.notifyUser(
        payment.order.buyerId,
        payment.order.buyer.phone,
        `Votre paiement pour la commande ${payment.orderId} est confirmé. Votre commande est en préparation.`,
      );
    } else {
      await this.orders.markCancelled(payment.orderId);
      await this.notifications.notifyUser(
        payment.order.buyerId,
        payment.order.buyer.phone,
        `Votre paiement pour la commande ${payment.orderId} n'a pas pu être validé. Contactez le support si besoin.`,
      );
    }

    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }
}

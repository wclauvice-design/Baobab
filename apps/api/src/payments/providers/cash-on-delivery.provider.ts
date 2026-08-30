import { Injectable } from '@nestjs/common';
import { Order, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentInitiationResult, PaymentProvider } from './payment-provider.interface';

/**
 * No online payment gate: the order is confirmed immediately and cash changes
 * hands at delivery. Kept behind the same interface so checkout/order code
 * never branches on payment method.
 */
@Injectable()
export class CashOnDeliveryProvider implements PaymentProvider {
  constructor(private prisma: PrismaService) {}

  async initiate(order: Order): Promise<PaymentInitiationResult> {
    return {
      reference: `COD-${order.id.slice(-8).toUpperCase()}`,
      status: PaymentStatus.CONFIRMED,
      instructions: 'Paiement en espèces à la livraison.',
    };
  }

  async checkStatus(reference: string): Promise<PaymentStatus> {
    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    return payment?.status ?? PaymentStatus.CONFIRMED;
  }
}

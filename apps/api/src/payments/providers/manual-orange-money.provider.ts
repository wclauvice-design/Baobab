import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentInitiationResult, PaymentProvider } from './payment-provider.interface';

/**
 * MVP implementation: no API call. Generates a unique reference and instructions
 * for the buyer; the merchant account statement is the only source of truth,
 * reconciled by an admin in the back-office (never by trusting client-submitted proof).
 */
@Injectable()
export class ManualOrangeMoneyProvider implements PaymentProvider {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async initiate(order: Order): Promise<PaymentInitiationResult> {
    const reference = await this.generateUniqueReference();
    const merchantNumber = this.config.get<string>('ORANGE_MONEY_MERCHANT_NUMBER');

    return {
      reference,
      status: PaymentStatus.PENDING,
      merchantNumber,
      instructions:
        `Composez #144# ou ouvrez l'app Orange Money, envoyez ${order.totalAmount} ${order.currency} ` +
        `au ${merchantNumber} en indiquant la référence ${reference}. Confirmation sous 5 à 15 minutes.`,
    };
  }

  async checkStatus(reference: string): Promise<PaymentStatus> {
    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    return payment?.status ?? PaymentStatus.PENDING;
  }

  private async generateUniqueReference(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `BA-${Math.floor(1000 + Math.random() * 9000)}`;
      const existing = await this.prisma.payment.findUnique({ where: { reference: candidate } });
      if (!existing) return candidate;
    }
    return `BA-${Date.now()}`;
  }
}

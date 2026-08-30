import { Order, PaymentStatus } from '@prisma/client';

export interface PaymentInitiationResult {
  reference: string;
  status: PaymentStatus;
  instructions: string;
  merchantNumber?: string;
}

/**
 * Every payment method — manual today, an automated aggregator tomorrow —
 * implements this interface. Nothing in orders/cart/back-office talks to a
 * concrete provider directly, only to this contract.
 */
export interface PaymentProvider {
  initiate(order: Order): Promise<PaymentInitiationResult>;
  checkStatus(reference: string): Promise<PaymentStatus>;
  onWebhook?(payload: unknown): Promise<void>;
}

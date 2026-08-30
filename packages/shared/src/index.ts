export enum Role {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export enum SellerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum DeliveryMode {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
}

export enum PaymentProviderType {
  MANUAL_ORANGE_MONEY = 'MANUAL_ORANGE_MONEY',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentAuditAction {
  VALIDATE = 'VALIDATE',
  REJECT = 'REJECT',
}

export enum NotificationChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export const DEFAULT_CURRENCY = 'XOF';

export const ORDER_EXPIRATION_MINUTES = 45;

export interface PaymentInstructions {
  provider: PaymentProviderType;
  reference: string;
  amount: number;
  currency: string;
  merchantNumber?: string;
  instructions: string;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  categoryId: string;
  sellerId: string | null;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

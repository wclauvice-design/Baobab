export * from './taxonomy';

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

export type SupportedCurrency = 'XOF' | 'AED' | 'EUR' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  flag: string;
  rateFromXof: number;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    label: 'FCFA (UEMOA)',
    flag: '🌍',
    rateFromXof: 1,
    decimals: 0,
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    label: 'AED (Dubaï)',
    flag: '🇦🇪',
    rateFromXof: 1 / 165,
    decimals: 0,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'EUR (Europe)',
    flag: '🇪🇺',
    rateFromXof: 1 / 655.957,
    decimals: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'USD ($)',
    flag: '🇺🇸',
    rateFromXof: 1 / 600,
    decimals: 2,
  },
};

export function convertFromXof(
  amountInXof: number,
  targetCurrency: SupportedCurrency,
): number {
  const config = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.XOF;
  return amountInXof * config.rateFromXof;
}

export function formatMultiCurrency(
  amountInXof: number,
  targetCurrency: SupportedCurrency = 'XOF',
  includeApproxXof = false,
): string {
  const config = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.XOF;
  const converted = convertFromXof(amountInXof, targetCurrency);
  const formatted = converted.toLocaleString('fr-FR', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  if (targetCurrency === 'XOF') {
    return `${formatted} FCFA`;
  }

  const main = `${formatted} ${config.symbol}`;
  if (includeApproxXof) {
    const xofFormatted = Math.round(amountInXof).toLocaleString('fr-FR');
    return `${main} (~${xofFormatted} FCFA)`;
  }
  return main;
}

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

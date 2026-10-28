export function formatXof(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

/**
 * Taux fixes Westzone (aucune API payante).
 * Les prix sont stockés en XOF ; le commerçant saisit dans sa devise (AED par défaut).
 */
export const FX_TO_XOF: Record<string, number> = {
  XOF: 1,
  AED: 165,
  EUR: 655.957,
  USD: 600,
};

export const MERCHANT_DEFAULT_CURRENCY = 'AED';

export const PRICING_CURRENCIES = [
  { code: 'AED', label: 'AED — Dirham de Dubaï', symbol: 'AED' },
  { code: 'XOF', label: 'FCFA — Franc CFA', symbol: 'FCFA' },
  { code: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { code: 'USD', label: 'USD — Dollar', symbol: '$' },
] as const;

export function toXof(amount: number, currency: string = 'XOF'): number {
  const rate = FX_TO_XOF[currency] ?? 1;
  return Math.round(Number(amount) * rate * 100) / 100;
}

export function fromXof(amountXof: number, currency: string = 'XOF'): number {
  const rate = FX_TO_XOF[currency] ?? 1;
  return Math.round((Number(amountXof) / rate) * 100) / 100;
}

export function formatInCurrency(amountXof: number, currency: string): string {
  const value = fromXof(amountXof, currency);
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: currency === 'XOF' ? 0 : 2,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(value);
  return currency === 'XOF' ? `${formatted} FCFA` : `${formatted} ${currency}`;
}

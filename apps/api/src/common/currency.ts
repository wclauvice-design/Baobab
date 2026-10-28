/**
 * Taux de change fixes utilisés par Westzone (aucune API payante).
 * Les prix sont TOUJOURS stockés en XOF (FCFA) en base.
 * Le commerçant peut saisir son prix dans sa devise (AED par défaut),
 * la conversion est faite ici, côté serveur, pour rester fiable.
 */
export const FX_TO_XOF: Record<string, number> = {
  XOF: 1,
  AED: 165,
  EUR: 655.957,
  USD: 600,
};

export type PricingCurrency = keyof typeof FX_TO_XOF;

export function isPricingCurrency(value: unknown): value is PricingCurrency {
  return typeof value === 'string' && value in FX_TO_XOF;
}

/** Convertit un montant saisi dans une devise source vers le XOF. */
export function toXof(amount: number, currency: string = 'XOF'): number {
  const rate = FX_TO_XOF[currency] ?? 1;
  return Math.round(Number(amount) * rate * 100) / 100;
}

/** Convertit un montant XOF vers une devise d'affichage. */
export function fromXof(amountXof: number, currency: string = 'XOF'): number {
  const rate = FX_TO_XOF[currency] ?? 1;
  return Math.round((Number(amountXof) / rate) * 100) / 100;
}

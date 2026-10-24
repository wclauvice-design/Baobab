export type ShippingMode = "AIR" | "SEA";

export interface FreightDestination {
  airRate: number; // XOF par kg taxable (aérien)
  seaRate: number; // XOF par tranche de 200 kg taxables (groupage maritime)
}

export const AIR_VOLUMETRIC_DIVISOR = 6000; // cm³ par kg (norme IATA)
export const SEA_KG_PER_CBM = 250; // 1 m³ de groupage ≈ 250 kg taxables
export const DEFAULT_UNIT_WEIGHT_KG = 0.45;
export const MIN_AIR_WEIGHT_KG = 0.5;
export const MIN_SEA_CHARGE = 45000;

/** Extrait L x l x h (cm) d'une chaîne comme "30x20x10 cm" ou "30 × 20 × 10". */
export function parseDimensionsCm(value?: string | null): [number, number, number] | null {
  if (!value) return null;
  const nums = String(value)
    .replace(/,/g, ".")
    .match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 3) return null;
  const [l, w, h] = nums.slice(0, 3).map(Number);
  if (![l, w, h].every((n) => Number.isFinite(n) && n > 0)) return null;
  return [l, w, h];
}

export interface FreightInput {
  mode: ShippingMode;
  destination: FreightDestination;
  quantity: number;
  unitWeightKg?: number | string | null;
  dimensions?: string | null;
}

export interface FreightResult {
  realWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  volumeCbm: number;
  cost: number;
  basis: "real" | "volumetric";
}

export function estimateFreight(input: FreightInput): FreightResult {
  const qty = Math.max(1, Number(input.quantity) || 1);
  const unitWeight = Number(input.unitWeightKg) || DEFAULT_UNIT_WEIGHT_KG;
  const realWeightKg = unitWeight * qty;
  const dims = parseDimensionsCm(input.dimensions);
  const unitVolumeCm3 = dims ? dims[0] * dims[1] * dims[2] : 0;
  const volumeCbm = (unitVolumeCm3 * qty) / 1_000_000;
  const volumetricWeightKg =
    input.mode === "AIR"
      ? (unitVolumeCm3 * qty) / AIR_VOLUMETRIC_DIVISOR
      : volumeCbm * SEA_KG_PER_CBM;
  const basis = volumetricWeightKg > realWeightKg ? "volumetric" : "real";
  const chargeable = Math.max(realWeightKg, volumetricWeightKg);
  const chargeableWeightKg =
    input.mode === "AIR" ? Math.max(MIN_AIR_WEIGHT_KG, chargeable) : chargeable;
  const cost =
    input.mode === "AIR"
      ? Math.round(chargeableWeightKg * input.destination.airRate)
      : Math.max(
          MIN_SEA_CHARGE,
          Math.round((chargeableWeightKg / 200) * input.destination.seaRate),
        );
  return { realWeightKg, volumetricWeightKg, chargeableWeightKg, volumeCbm, cost, basis };
}

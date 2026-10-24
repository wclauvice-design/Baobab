export type ShippingMode = "EXPRESS" | "CARGO" | "SEA";

export interface FreightDestination {
  id?: string;
  flag?: string;
  name?: string;
  cbmRate: number; // Tarif en XOF par m³ (CBM) pour le groupage maritime
  daysExpress?: string;
  daysCargo?: string;
  daysSea?: string;
}

// Tarifs aériens officiels par kg
export const EXPRESS_RATE_PER_KG = 12500; // 12 500 FCFA / kg (3 à 6 jours)
export const CARGO_RATE_PER_KG = 8600;   // 8 600 FCFA / kg (14 à 16 jours)

// Délais standards de transit
export const EXPRESS_DAYS = "3–6 j";
export const CARGO_DAYS = "14–16 j";
export const SEA_DAYS = "45–50 j";

// Règles de poids métiers
export const MIN_SEA_WEIGHT_KG = 5;      // Maritime absent si poids < 5 kg
export const MAX_AIR_WEIGHT_KG = 100;    // Express & Cargo indisponibles si poids >= 100 kg
export const MIN_BILLABLE_AIR_KG = 0.5;  // Seuil minimum de facturation aérienne
export const MIN_BILLABLE_CBM = 0.1;     // Seuil minimum de facturation maritime (0.1 m³)
export const CBM_DENSITY_KG = 300;       // Densité standard groupage LCL Dubaï : 1 m³ ≈ 300 kg
export const AIR_VOLUMETRIC_DIVISOR = 6000; // Norme IATA cm³/kg

export const DEFAULT_UNIT_WEIGHT_KG = 0.5;

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

/**
 * Filtre les modes d'expédition autorisés selon le poids total réel du colis :
 * - Poids < 5 kg : Express & Cargo disponibles (Maritime ABSENT)
 * - 5 kg <= Poids < 100 kg : Express, Cargo & Maritime disponibles au choix
 * - Poids >= 100 kg : Maritime SEUL disponible (Express & Cargo ABSENTS)
 */
export function getAvailableShippingModes(totalRealWeightKg: number): ShippingMode[] {
  if (totalRealWeightKg >= MAX_AIR_WEIGHT_KG) {
    return ["SEA"];
  }
  if (totalRealWeightKg < MIN_SEA_WEIGHT_KG) {
    return ["EXPRESS", "CARGO"];
  }
  return ["EXPRESS", "CARGO", "SEA"];
}

export interface FreightInput {
  mode: ShippingMode;
  destination: FreightDestination;
  quantity: number;
  unitWeightKg?: number | string | null;
  dimensions?: string | null;
}

export interface FreightResult {
  mode: ShippingMode;
  modeLabel: string;
  transitDays: string;
  realWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  volumeCbm: number;
  ratePerUnit: number;
  cost: number;
  basis: "real" | "volumetric" | "cbm";
  availableModes: ShippingMode[];
  restrictionNote?: string;
}

export function estimateFreight(input: FreightInput): FreightResult {
  const qty = Math.max(1, Number(input.quantity) || 1);
  const parsedWeight = Number(input.unitWeightKg);
  const unitWeight = parsedWeight > 0 ? parsedWeight : DEFAULT_UNIT_WEIGHT_KG;
  const realWeightKg = Number((unitWeight * qty).toFixed(2));

  const dims = parseDimensionsCm(input.dimensions);
  const unitVolumeCm3 = dims ? dims[0] * dims[1] * dims[2] : 0;
  const volumeFromDimsCbm = (unitVolumeCm3 * qty) / 1_000_000;
  // Si les dimensions ne sont pas renseignées, calcul du volume CBM au prorata de la densité maritime 300kg/m³
  const rawVolumeCbm = volumeFromDimsCbm > 0 ? volumeFromDimsCbm : realWeightKg / CBM_DENSITY_KG;
  const volumeCbm = Number(rawVolumeCbm.toFixed(3));

  const availableModes = getAvailableShippingModes(realWeightKg);

  // Bascule automatique si le mode demandé n'est pas autorisé pour ce poids
  let effectiveMode: ShippingMode = input.mode;
  if (!availableModes.includes(effectiveMode)) {
    effectiveMode = availableModes[0];
  }

  let restrictionNote: string | undefined;
  if (realWeightKg >= MAX_AIR_WEIGHT_KG) {
    restrictionNote = "Colis lourd (≥ 100 kg) : Acheminement conteneur maritime uniquement.";
  } else if (realWeightKg < MIN_SEA_WEIGHT_KG) {
    restrictionNote = "Colis léger (< 5 kg) : Fret maritime non applicable.";
  }

  if (effectiveMode === "EXPRESS") {
    const volumetricWeightKg = unitVolumeCm3 > 0 ? Number(((unitVolumeCm3 * qty) / AIR_VOLUMETRIC_DIVISOR).toFixed(2)) : 0;
    const chargeable = Math.max(realWeightKg, volumetricWeightKg);
    const chargeableWeightKg = Math.max(MIN_BILLABLE_AIR_KG, Number(chargeable.toFixed(2)));
    const cost = Math.round(chargeableWeightKg * EXPRESS_RATE_PER_KG);
    return {
      mode: "EXPRESS",
      modeLabel: "✈️ Aérien Express (3–6 jours)",
      transitDays: EXPRESS_DAYS,
      realWeightKg,
      volumetricWeightKg,
      chargeableWeightKg,
      volumeCbm,
      ratePerUnit: EXPRESS_RATE_PER_KG,
      cost,
      basis: volumetricWeightKg > realWeightKg ? "volumetric" : "real",
      availableModes,
      restrictionNote,
    };
  }

  if (effectiveMode === "CARGO") {
    const volumetricWeightKg = unitVolumeCm3 > 0 ? Number(((unitVolumeCm3 * qty) / AIR_VOLUMETRIC_DIVISOR).toFixed(2)) : 0;
    const chargeable = Math.max(realWeightKg, volumetricWeightKg);
    const chargeableWeightKg = Math.max(MIN_BILLABLE_AIR_KG, Number(chargeable.toFixed(2)));
    const cost = Math.round(chargeableWeightKg * CARGO_RATE_PER_KG);
    return {
      mode: "CARGO",
      modeLabel: "✈️ Aérien Cargo (14–16 jours)",
      transitDays: CARGO_DAYS,
      realWeightKg,
      volumetricWeightKg,
      chargeableWeightKg,
      volumeCbm,
      ratePerUnit: CARGO_RATE_PER_KG,
      cost,
      basis: volumetricWeightKg > realWeightKg ? "volumetric" : "real",
      availableModes,
      restrictionNote,
    };
  }

  // Maritime / Conteneur (SEA)
  const cbmRate = input.destination?.cbmRate || 185000;
  const billableCbm = Math.max(MIN_BILLABLE_CBM, volumeCbm);
  const cost = Math.round(billableCbm * cbmRate);

  return {
    mode: "SEA",
    modeLabel: "🚢 Maritime / Conteneur (45–50 jours)",
    transitDays: SEA_DAYS,
    realWeightKg,
    volumetricWeightKg: Number((volumeCbm * CBM_DENSITY_KG).toFixed(2)),
    chargeableWeightKg: realWeightKg,
    volumeCbm: Number(billableCbm.toFixed(3)),
    ratePerUnit: cbmRate,
    cost,
    basis: "cbm",
    availableModes,
    restrictionNote,
  };
}

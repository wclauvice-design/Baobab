/**
 * Utilitaires et normalisation pour la catégorie Véhicules (Motors)
 * Format Dubizzle Motors UAE
 */

export interface VehicleSpecs {
  isVehicle: boolean;
  conditionKey: 'NEW' | 'USED' | 'REFURBISHED';
  conditionLabel: string;
  conditionBadgeClass: string;
  brand: string;
  model: string;
  trim: string;
  year: string;
  mileage: string;
  regionalSpecs: string;
  fuelType: string;
  transmission: string;
  engine: string;
  horsepower: string;
  drivetrain: string;
  cylinders: string;
  doors: string;
  seatingCapacity: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  steeringSide: string;
  warranty: string;
  targetMarket: string;
}

export function isVehicleProduct(p: any): boolean {
  if (!p) return false;

  const name = (p.name || '').toLowerCase();
  const subcat = (p.subcategory || '').toLowerCase();
  const catName = (p.category?.name || '').toLowerCase();
  const catSlug = (p.category?.slug || '').toLowerCase();
  const universe = (p.category?.universe || '').toLowerCase();

  // Exclusion explicite des pièces détachées ou accessoires
  if (
    subcat.includes('pièce') ||
    subcat.includes('accessoire') ||
    catName.includes('pièce') ||
    catSlug.includes('piece') ||
    name.includes('filtre') ||
    name.includes('plaquette') ||
    name.includes('batterie') ||
    name.includes('amortisseur') ||
    name.includes('pneu')
  ) {
    return false;
  }

  // Détection des véhicules
  if (
    universe === 'motors' ||
    catSlug.includes('voiture') ||
    catSlug.includes('utilitaire') ||
    catSlug.includes('moto') ||
    subcat.includes('voiture') ||
    subcat.includes('suv') ||
    subcat.includes('pick-up') ||
    subcat.includes('utilitaire') ||
    subcat.includes('moto') ||
    subcat.includes('tricycle')
  ) {
    return true;
  }

  const attrs = p.attributes || {};
  const strongSignal = ['Kilométrage', 'Boîte', 'Cylindrée', 'Motricité'].some(
    (key) => attrs[key],
  );
  const supportingSignal = ['Marque', 'Modèle', 'Carburant', 'Année'].some(
    (key) => attrs[key],
  );
  if (strongSignal && supportingSignal) {
    return true;
  }

  const carKeywords = ['toyota', 'jetour', 'land cruiser', 'prado', 'hilux', 'lexus', 'mercedes', 'dashing', 'x70', 'suv', 'pick-up', 'jakarta 110cc', 'tricycle'];
  return carKeywords.some((kw) => name.includes(kw));
}

export function parseVehicleData(p: any): VehicleSpecs {
  const isVeh = isVehicleProduct(p);
  const attrs = p?.attributes || {};
  const name = p?.name || '';
  const desc = p?.description || '';

  const rawCondition = (p?.condition || 'NEW').toUpperCase();
  let conditionKey: 'NEW' | 'USED' | 'REFURBISHED' = 'NEW';
  let conditionLabel = isVeh ? 'Neuf (0 km)' : 'Neuf';
  let conditionBadgeClass = 'bg-emerald-600 text-white';

  if (rawCondition === 'USED' || name.toLowerCase().includes('occasion')) {
    conditionKey = 'USED';
    conditionLabel = 'Occasion certifiée';
    conditionBadgeClass = 'bg-sky-600 text-white';
  } else if (rawCondition === 'REFURBISHED' || rawCondition === 'RENEWED' || name.toLowerCase().includes('reconditionn')) {
    conditionKey = 'REFURBISHED';
    conditionLabel = 'Reconditionné (Renewed)';
    conditionBadgeClass = 'bg-amber-500 text-slate-950 font-bold';
  }

  let year = attrs['Année'] || '';
  if (!year) {
    const yearMatch = name.match(/\b(201\d|202\d)\b/);
    year = yearMatch ? yearMatch[1] : '2024';
  }
  const cleanYear = year.match(/\b(201\d|202\d)\b/)?.[1] || year;

  let mileage =
    attrs['Kilométrage'] ||
    (isVeh ? (conditionKey === 'NEW' ? '0 km' : '25 000 km') : '');
  if (isVeh && conditionKey === 'NEW' && !attrs['Kilométrage']) {
    mileage = '0 km';
  }

  let brand = attrs['Marque'] || '';
  if (!brand) {
    if (/toyota/i.test(name)) brand = 'Toyota';
    else if (/jetour/i.test(name)) brand = 'Jetour';
    else if (/lexus/i.test(name)) brand = 'Lexus';
    else if (/mercedes/i.test(name)) brand = 'Mercedes-Benz';
    else if (/hyundai/i.test(name)) brand = 'Hyundai';
    else if (/nissan/i.test(name)) brand = 'Nissan';
    else if (/suzuki/i.test(name)) brand = 'Suzuki';
    else if (/mitsubishi/i.test(name)) brand = 'Mitsubishi';
    else brand = 'WESTZONE Motors';
  }

  let model = attrs['Modèle'] || '';
  let trim = attrs['Trim'] || attrs['Finition'] || '';
  if (!model) {
    if (/land cruiser 79/i.test(name)) {
      model = 'Land Cruiser 79';
      trim = 'Double Cabine Pick-Up';
    } else if (/prado/i.test(name)) {
      model = 'Land Cruiser Prado';
      trim = /vx/i.test(name) ? 'VX Flagship' : 'TX-L Full Options';
    } else if (/hilux/i.test(name)) {
      model = 'Hilux';
      trim = 'Double Cabine 4x4';
    } else if (/t2|traveller/i.test(name)) {
      model = 'T2 Traveller';
      trim = '2.0T 4x4 Luxury';
    } else if (/dashing/i.test(name)) {
      model = 'Dashing';
      trim = '1.6T Sport Edition';
    } else if (/x70/i.test(name)) {
      model = 'X70 Plus';
      trim = '1.6T 7 Places';
    } else {
      model = name.split('—')[0].trim();
      trim = 'Standard GCC';
    }
  }

  let fuelType = attrs['Carburant'] || '';
  if (!fuelType) {
    if (/diesel/i.test(name) || /diesel/i.test(desc)) fuelType = 'Diesel';
    else if (/hybride|hybrid/i.test(name)) fuelType = 'Hybride';
    else if (/electri|électri/i.test(name)) fuelType = '100% Électrique';
    else fuelType = 'Essence (Petrol)';
  }

  let transmission = attrs['Boîte'] || attrs['Transmission'] || '';
  if (!transmission) {
    if (/manuelle/i.test(name) || /manuelle/i.test(desc)) transmission = 'Manuelle';
    else transmission = 'Automatique';
  }

  let engine = attrs['Moteur'] || '';
  if (!engine) {
    const engMatch = name.match(/(\d\.\d[L|l]?\s*(?:Turbo|V6|V8|DCT|Diesel)?)/i);
    engine = engMatch ? engMatch[1] : 'Moteur Tropicalisé';
  }

  return {
    isVehicle: isVeh,
    conditionKey,
    conditionLabel,
    conditionBadgeClass,
    brand,
    model,
    trim,
    year: cleanYear,
    mileage,
    regionalSpecs: attrs['Spécifications'] || 'GCC Specs (Dubaï)',
    fuelType,
    transmission,
    engine,
    horsepower: attrs['Puissance'] || 'Tropicalisé',
    drivetrain: attrs['Motricité'] || '4x4 Tout-Terrain',
    cylinders: attrs['Cylindres'] || (/v8/i.test(name) ? '8 (V8)' : /v6/i.test(name) ? '6 (V6)' : '4 cylindres'),
    doors: attrs['Portes'] || '5 portes',
    seatingCapacity: attrs['Places'] || (/7 places/i.test(name) ? '7 Places' : '5 Places'),
    bodyType: /pick-up/i.test(name) ? 'Pick-up' : 'SUV / 4x4',
    exteriorColor: attrs['Couleur extérieure'] || 'Origine',
    interiorColor: attrs['Couleur intérieure'] || 'Cuir Beige',
    steeringSide: attrs['Direction'] || 'Volant à gauche (LHD)',
    warranty: attrs['Garantie'] || '1 an constructeur',
    targetMarket: 'Export Dubaï ➔ Afrique de l’Ouest',
  };
}

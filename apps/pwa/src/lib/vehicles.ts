/**
 * Utilitaires et normalisation pour la catégorie Véhicules (Motors)
 * Inspiré de la structure Dubizzle Motors UAE
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
  features: {
    entertainment: string[];
    comfort: string[];
    exterior: string[];
  };
  exportTransitInfo: {
    origin: string;
    corridor: string;
    transitDuration: string;
    customsAssistance: string;
  };
}

export function isVehicleProduct(p: any): boolean {
  if (!p) return false;

  const name = (p.name || '').toLowerCase();
  const subcat = (p.subcategory || '').toLowerCase();
  const catName = (p.category?.name || '').toLowerCase();
  const catSlug = (p.category?.slug || '').toLowerCase();
  const universe = (p.category?.universe || '').toLowerCase();

  // Exclusion explicite des pièces détachées, accessoires ou outillage
  if (
    subcat.includes('pièce') ||
    subcat.includes('accessoire') ||
    catName.includes('pièce') ||
    catSlug.includes('piece') ||
    name.includes('filtre') ||
    name.includes('plaquette') ||
    name.includes('batterie') ||
    name.includes('amortisseur') ||
    name.includes('bougie') ||
    name.includes('pneu')
  ) {
    return false;
  }

  // Détection des véhicules (voitures, SUV, pick-up, camions, motos, tricycles)
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

  // Détection par attributs réellement automobiles. On exige un signal fort
  // (kilométrage, boîte, cylindrée, motricité) ET un signal de description :
  // un groupe électrogène ou un appareil avec un simple champ « Moteur » ou
  // « Année » ne doit jamais être affiché comme un véhicule (« Neuf 0 km »).
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

  // 1. Condition (Neuf / Occasion / Reconditionné)
  const rawCondition = (p?.condition || 'NEW').toUpperCase();
  let conditionKey: 'NEW' | 'USED' | 'REFURBISHED' = 'NEW';
  let conditionLabel = isVeh ? 'Neuf (0 km)' : 'Neuf';
  let conditionBadgeClass = 'bg-emerald-500/90 text-white border-emerald-400';

  if (rawCondition === 'USED' || name.toLowerCase().includes('occasion')) {
    conditionKey = 'USED';
    conditionLabel = 'Occasion certifiée';
    conditionBadgeClass = 'bg-sky-500/90 text-white border-sky-400';
  } else if (rawCondition === 'REFURBISHED' || rawCondition === 'RENEWED' || name.toLowerCase().includes('reconditionn')) {
    conditionKey = 'REFURBISHED';
    conditionLabel = 'Reconditionné (Renewed)';
    conditionBadgeClass = 'bg-amber-500/90 text-slate-950 font-bold border-amber-400';
  }

  // 2. Année
  let year = attrs['Année'] || '';
  if (!year) {
    const yearMatch = name.match(/\b(201\d|202\d)\b/);
    year = yearMatch ? yearMatch[1] : '2024';
  }
  // Nettoyer si format "2024 (Neuf 0 km)"
  const cleanYear = year.match(/\b(201\d|202\d)\b/)?.[1] || year;

  // 3. Kilométrage
  let mileage =
    attrs['Kilométrage'] ||
    (isVeh ? (conditionKey === 'NEW' ? '0 km' : '25 000 km') : '');
  if (isVeh && conditionKey === 'NEW' && !attrs['Kilométrage']) {
    mileage = '0 km';
  }

  // 4. Marque
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
    else if (/jakarta/i.test(name)) brand = 'Jakarta';
    else brand = 'Baobab Motors';
  }

  // 5. Modèle & Trim
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
    } else if (/jakarta/i.test(name)) {
      model = '110cc Star';
      trim = 'Standard';
    } else {
      model = name.split('—')[0].trim();
      trim = 'Standard GCC';
    }
  }

  // 6. Carburant
  let fuelType = attrs['Carburant'] || '';
  if (!fuelType) {
    if (/diesel/i.test(name) || /diesel/i.test(desc)) fuelType = 'Diesel';
    else if (/hybride|hybrid/i.test(name)) fuelType = 'Hybride';
    else if (/electri|électri/i.test(name)) fuelType = '100% Électrique';
    else fuelType = 'Essence (Petrol)';
  }

  // 7. Boîte de vitesses
  let transmission = attrs['Boîte'] || attrs['Transmission'] || '';
  if (!transmission) {
    if (/manuelle/i.test(name) || /manuelle/i.test(desc)) transmission = 'Manuelle';
    else transmission = 'Automatique';
  }

  // 8. Moteur / Cylindrée
  let engine = attrs['Moteur'] || '';
  if (!engine) {
    const engMatch = name.match(/(\d\.\d[L|l]?\s*(?:Turbo|V6|V8|DCT|Diesel)?)/i);
    engine = engMatch ? engMatch[1] : 'Moteur Tropicalisé Haute Performance';
  }

  // 9. Puissance
  let horsepower = attrs['Puissance'] || '';
  if (!horsepower) {
    if (/254/i.test(name) || /254/i.test(desc)) horsepower = '254 ch';
    else if (/197/i.test(name)) horsepower = '197 ch';
    else if (/v8/i.test(name)) horsepower = '400 - 450 HP';
    else if (/v6/i.test(name)) horsepower = '271 ch';
    else horsepower = 'Puissance Tropicalisée';
  }

  // 10. Motricité
  let drivetrain = attrs['Motricité'] || attrs['Transmission intégrale'] || '';
  if (!drivetrain) {
    if (/4x4|awd|tout-terrain/i.test(name) || /4x4/i.test(desc)) drivetrain = '4x4 Tout-Terrain Sélectif';
    else drivetrain = 'Traction Intégrale';
  }

  // 11. Cylindres
  let cylinders = attrs['Cylindres'] || '';
  if (!cylinders) {
    if (/v8/i.test(name) || /v8/i.test(desc)) cylinders = '8 (V8)';
    else if (/v6/i.test(name) || /v6/i.test(desc)) cylinders = '6 (V6)';
    else cylinders = '4 cylindres en ligne';
  }

  // 12. Places & Portes
  let seatingCapacity = attrs['Places'] || '';
  let doors = attrs['Portes'] || '5 portes';
  if (!seatingCapacity) {
    if (/7 places/i.test(name) || /7 places/i.test(desc)) seatingCapacity = '7 Places';
    else if (/simple cabine/i.test(name)) {
      seatingCapacity = '2 - 3 Places';
      doors = '2 portes';
    } else seatingCapacity = '5 Places';
  }

  // 13. Couleurs & Direction
  let exteriorColor = attrs['Couleur extérieure'] || '';
  if (!exteriorColor) {
    if (/sable/i.test(name)) exteriorColor = 'Sable Sahara Métallisé';
    else if (/vert safari/i.test(name)) exteriorColor = 'Vert Safari Baroudeur';
    else if (/blanc/i.test(name)) exteriorColor = 'Blanc Arctique Perlé';
    else if (/noir/i.test(name)) exteriorColor = 'Noir Obsidienne';
    else exteriorColor = 'Peinture Métallisée d’Origine';
  }

  let interiorColor = attrs['Couleur intérieure'] || '';
  if (!interiorColor) {
    if (/cuir brun|brun/i.test(name)) interiorColor = 'Cuir Brun Cognac';
    else if (/beige/i.test(name)) interiorColor = 'Cuir Beige Premium';
    else interiorColor = 'Cuir Noir Ébène';
  }

  const steeringSide = attrs['Direction'] || 'Volant à gauche (Left Hand - LHD conforme CEDEAO)';
  const regionalSpecs = attrs['Spécifications'] || 'GCC Specs (Tropicalisé Émirats/Sahel)';
  const warranty = attrs['Garantie'] || '1 an constructeur / Assistance & Garantie Baobab';
  const targetMarket = 'Export Dubaï ➔ Burkina Faso & Afrique de l’Ouest';

  // 14. Équipements / Features (Sections Dubizzle)
  const defaultFeatures = {
    entertainment: [
      'Écran tactile multimédia haute définition',
      'Apple CarPlay & Android Auto intégrés',
      'Système audio haute fidélité (HP Sony/JBL)',
      'Commandes audio & téléphone au volant',
      'Connectivité Bluetooth & ports USB-C avant/arrière',
      'Cockpit numérique avec écran d’instruments digital',
      'Système de navigation GPS intégré',
    ],
    comfort: [
      'Climatisation automatique multizone tropicalisée',
      'Bouton de démarrage sans clé (Push Start Engine)',
      'Caméra de recul haute résolution avec lignes de guidage',
      'Sellerie ergonomique cuir avec surpiqûres',
      'Régulateur et limiteur de vitesse adaptatif',
      'Rétroviseurs électriques dégivrants rabattables',
      'Vitres électriques teintées anti-chaleur',
      'Accoudoir central avec compartiment réfrigéré',
    ],
    exterior: [
      'Transmission 4x4 avec sélecteur de terrain (Sable, Boue, Roches)',
      'Jantes en alliage léger tout-terrain',
      'Phares Full LED à haute intensité et feux diurnes',
      'Toit ouvrant panoramique électrique',
      'Barres de toit aluminium & marchepieds renforcés',
      'Filtre à air haute performance anti-poussière / Snorkel',
      'Double réservoir grande autonomie longue distance',
      'Roue de secours d’origine avec support antivol',
    ],
  };

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
    regionalSpecs,
    fuelType,
    transmission,
    engine,
    horsepower,
    drivetrain,
    cylinders,
    doors,
    seatingCapacity,
    bodyType: /pick-up/i.test(name) ? 'Pick-up Tout-Terrain' : /moto|tricycle/i.test(name) ? 'Deux/Trois roues' : 'SUV / 4x4',
    exteriorColor,
    interiorColor,
    steeringSide,
    warranty,
    targetMarket,
    features: defaultFeatures,
    exportTransitInfo: {
      origin: 'Dubaï (Zone Franche Export / Jebel Ali Port)',
      corridor: 'Maritime vers Cotonou / Lomé / Abidjan ➔ Convoi sécurisé Ouagadougou / Bamako',
      transitDuration: '25 à 35 jours (Maritime) ou 5 à 7 jours (Aérien express)',
      customsAssistance: 'Prise en charge intégrale des formalités douanières et certificat d’immatriculation',
    },
  };
}

/**
 * Modèle de publication partagé entre l'API, l'administration et la PWA.
 *
 * Principe : une famille d'articles décrit les caractéristiques *descriptives*
 * (marque, composition, tension…), tandis que les options vendables décrivent
 * les combinaisons réellement disponibles (couleur, taille, stockage…).
 * Une combinaison active possède son propre prix, son stock, son SKU et ses
 * médias. Le serveur reste l'autorité de validation.
 */

export interface ListingField {
  key: string;
  label: string;
  unit?: string;
  choices?: string[];
  required?: boolean;
  numeric?: boolean;
  placeholder?: string;
  help?: string;
}

export interface ListingProfile {
  id: string;
  label: string;
  description: string;
  fields: ListingField[];
  /** Noms d'axes suggérés pour cette famille. */
  options: string[];
  /** Une annonce individuelle (véhicule, prestation) n'a pas de variantes. */
  unique?: boolean;
}

const text = (
  key: string,
  required = false,
  placeholder?: string,
): ListingField => ({ key, label: key, required, placeholder });

const number = (
  key: string,
  unit: string,
  required = false,
  placeholder?: string,
): ListingField => ({
  key,
  label: key,
  unit,
  numeric: true,
  required,
  placeholder,
});

const choice = (
  key: string,
  choices: string[],
  required = false,
): ListingField => ({ key, label: key, choices, required });

/** Marge publique appliquée au prix net commerçant (produits importés). */
export const PUBLIC_PRICE_MARKUP = 1.75;

/**
 * Caractéristiques strictement internes : elles ne doivent jamais être
 * exposées à l’acheteur (prix d’achat, marge, devise et taux source).
 */
const INTERNAL_ATTRIBUTE_KEY =
  /^(sourceprice|sourcecurrency|sourcepublicprice|fxrate|supplierprice|margin|marge|commission|purchaseprice|costprice|prixachat|prixfournisseur)$/i;
const INTERNAL_ATTRIBUTE_FRAGMENT =
  /fournisseur|supplier|marge|margin|commission|fxrate|sourceprice|sourcecurrency|purchaseprice|costprice|prix\s*d['’]?\s*achat|co[uû]t\s+de\s+revient/i;

export function isInternalAttribute(key: string): boolean {
  const value = String(key ?? '').trim();
  if (!value) return false;
  return (
    INTERNAL_ATTRIBUTE_KEY.test(value) ||
    INTERNAL_ATTRIBUTE_FRAGMENT.test(value)
  );
}

/**
 * Prix public Baobab à partir du prix net commerçant.
 * Arrondi au centime pour rester compatible avec les montants stockés.
 */
export function publicPriceFromMerchant(merchantPrice: number): number {
  const value = Number(merchantPrice);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * PUBLIC_PRICE_MARKUP * 100) / 100;
}

export const LISTING_PROFILES: ListingProfile[] = [
  {
    id: 'general',
    label: 'Autre article / fiche personnalisée',
    description:
      'Pour les articles qui ne relèvent pas encore d’une famille dédiée. Ajoutez les caractéristiques utiles et les options réellement vendues.',
    fields: [
      text('Marque'),
      text('Référence fabricant'),
      text('Matière'),
      text('Contenu du lot'),
    ],
    options: ['Couleur', 'Format', 'Lot'],
  },
  {
    id: 'vehicle',
    label: 'Véhicule, moto ou utilitaire',
    description:
      'Une annonce par véhicule : chaque véhicule est unique. Les caractéristiques décrivent l’état réel du véhicule, sans valeur inventée.',
    unique: true,
    fields: [
      text('Marque', true, 'Ex. Toyota'),
      text('Modèle', true, 'Ex. Hilux'),
      number('Année', 'année', true, 'Ex. 2021'),
      number('Kilométrage', 'km', true, 'Ex. 45000'),
      choice('Carburant', ['Essence', 'Diesel', 'Hybride', 'Électrique', 'Autre'], true),
      choice('Boîte', ['Manuelle', 'Automatique', 'Autre'], true),
      text('Finition'),
      text('Couleur extérieure'),
      text('Couleur intérieure'),
      number('Places', 'places'),
      text('Motricité'),
      text('Moteur'),
      text('Spécifications'),
      text('Direction'),
      text('Équipements'),
    ],
    options: [],
  },
  {
    id: 'phone',
    label: 'Téléphone / tablette',
    description:
      'Décrivez le modèle exact, puis les combinaisons de couleur, stockage et mémoire réellement disponibles.',
    fields: [
      text('Marque', true, 'Ex. Samsung'),
      text('Modèle', true, 'Ex. Galaxy S24'),
      text('Système'),
      text('Réseau'),
      text('SIM'),
      number('Écran', 'pouces'),
      number('Batterie', 'mAh'),
      text('Accessoires inclus'),
    ],
    options: ['Couleur', 'Stockage', 'Mémoire RAM'],
  },
  {
    id: 'computer',
    label: 'Ordinateur / écran / informatique',
    description:
      'Ordinateurs, écrans, imprimantes et accessoires informatiques. Les configurations vendables ont leur propre prix et stock.',
    fields: [
      text('Marque', true, 'Ex. Lenovo'),
      text('Modèle', true, 'Ex. ThinkPad T14'),
      text('Processeur'),
      text('Carte graphique'),
      text('Système'),
      number('Écran', 'pouces'),
      text('Résolution'),
      text('Connectique'),
    ],
    options: ['Couleur', 'Stockage', 'Mémoire RAM'],
  },
  {
    id: 'hair',
    label: 'Mèches, extensions ou perruque',
    description:
      'Mèches, tissages, closures, perruques et extensions. La longueur, la couleur et le conditionnement sont des axes de vente.',
    fields: [
      choice('Composition', ['Cheveux humains', 'Fibre synthétique', 'Mélange'], true),
      choice(
        'Type de pose',
        ['Clips', 'Adhésif', 'Crochet', 'Tissage', 'Micro-anneaux', 'Perruque', 'Autre'],
        true,
      ),
      text('Texture', true, 'Ex. Lisse, bouclé, ondulé'),
      text('Référence fabricant'),
      text('Entretien'),
      text('Résistance à la chaleur'),
    ],
    options: ['Couleur', 'Longueur (pouces)', 'Conditionnement'],
  },
  {
    id: 'clothing',
    label: 'Vêtement / textile',
    description:
      'Vêtements, tissus et accessoires textiles. Utilisez les tailles et couleurs réellement proposées.',
    fields: [
      text('Marque'),
      text('Composition', true, 'Ex. 100 % coton'),
      text('Coupe'),
      text('Public'),
      text('Guide des tailles'),
      text('Entretien'),
    ],
    options: ['Couleur', 'Taille', 'Lot'],
  },
  {
    id: 'shoes',
    label: 'Chaussures',
    description:
      'Chaussures, sandales, baskets et bottes. Indiquez le système de pointure pour éviter les erreurs de taille.',
    fields: [
      text('Marque'),
      text('Modèle'),
      text('Matière', true),
      text('Système de pointure', true, 'Ex. EU, UK, US'),
      text('Guide des tailles'),
    ],
    options: ['Couleur', 'Pointure', 'Largeur'],
  },
  {
    id: 'beauty',
    label: 'Cosmétique / soin / parfum',
    description:
      'Soins, cosmétiques et parfums. La composition et l’usage sont obligatoires ; les teintes et contenances sont des variantes.',
    fields: [
      text('Marque'),
      text('Référence fabricant'),
      text('Composition / ingrédients', true),
      text('Usage', true),
      text('Précautions'),
      text('Date limite / durée après ouverture'),
    ],
    options: ['Teinte', 'Contenance', 'Lot'],
  },
  {
    id: 'appliance',
    label: 'Électroménager / climatisation',
    description:
      'Appareils électroménagers et climatisation. La tension et la puissance doivent correspondre au marché de destination.',
    fields: [
      text('Marque', true),
      text('Modèle', true),
      number('Tension', 'V', true, 'Ex. 220'),
      number('Puissance', 'W'),
      text('Capacité'),
      text('Classe énergétique'),
      text('Installation'),
      text('Accessoires inclus'),
    ],
    options: ['Couleur', 'Capacité', 'Puissance'],
  },
  {
    id: 'energy',
    label: 'Solaire / batterie / groupe électrogène',
    description:
      'Panneaux, batteries, onduleurs et groupes. La puissance, la capacité et la configuration du kit sont vendables séparément.',
    fields: [
      text('Marque'),
      text('Modèle', true),
      text('Technologie', true, 'Ex. Lithium LiFePO4'),
      number('Tension', 'V', true),
      text('Puissance nominale'),
      text('Capacité'),
      text('Compatibilité'),
      text('Contenu du kit'),
    ],
    options: ['Puissance', 'Capacité', 'Configuration'],
  },
  {
    id: 'machine',
    label: 'Machine / outillage professionnel',
    description:
      'Machines, outillage et équipements professionnels. Précisez l’usage et la configuration livrée.',
    fields: [
      text('Marque'),
      text('Modèle', true),
      text('Usage', true),
      number('Tension', 'V'),
      number('Puissance', 'W'),
      text('Capacité de travail'),
      text('Installation'),
      text('Accessoires inclus'),
    ],
    options: ['Puissance', 'Format', 'Configuration'],
  },
  {
    id: 'furniture',
    label: 'Mobilier / maison / décoration',
    description:
      'Meubles, literie et décoration. Les dimensions et la finition sont des variantes fréquentes.',
    fields: [
      text('Matière', true),
      text('Dimensions article', true, 'Ex. 180 × 90 × 75 cm'),
      text('Montage'),
      text('Entretien'),
    ],
    options: ['Couleur', 'Dimensions', 'Finition'],
  },
  {
    id: 'parts',
    label: 'Pièce détachée / accessoire',
    description:
      'Pièces et accessoires. La compatibilité exacte est obligatoire pour éviter les retours.',
    fields: [
      text('Marque'),
      text('Référence fabricant', true),
      text('Compatibilité exacte', true, 'Ex. modèle, année, motorisation'),
      text('Dimensions article'),
      text('Contenu du lot'),
    ],
    options: ['Référence', 'Format', 'Couleur'],
  },
  {
    id: 'food',
    label: 'Aliment / boisson',
    description:
      'Produits alimentaires et boissons. Les allergènes, la conservation et la date limite sont obligatoires.',
    fields: [
      text('Composition / ingrédients', true),
      text('Allergènes', true, 'Indiquez « Aucun » si applicable'),
      text('Conservation', true),
      text('Date limite', true),
      text('Origine'),
      text('Contenu du lot'),
    ],
    options: ['Saveur', 'Poids net', 'Conditionnement'],
  },
  {
    id: 'jewelry',
    label: 'Bijou / montre / sac',
    description:
      'Bijoux, montres et maroquinerie. La matière et la finition doivent être exactes.',
    fields: [
      text('Marque'),
      text('Matière', true),
      text('Référence fabricant'),
      text('Dimensions article'),
      text('Entretien'),
    ],
    options: ['Couleur', 'Taille', 'Finition'],
  },
  {
    id: 'sports',
    label: 'Sport / loisirs / jouet',
    description:
      'Articles de sport, loisirs et jouets. Précisez le public et l’âge recommandé.',
    fields: [
      text('Marque'),
      text('Matière'),
      text('Public / âge recommandé', true),
      text('Précautions'),
      text('Contenu du lot'),
    ],
    options: ['Couleur', 'Taille', 'Configuration'],
  },
  {
    id: 'baby',
    label: 'Bébé / puériculture',
    description:
      'Puériculture et articles pour bébé. L’âge recommandé et la norme de sécurité sont obligatoires.',
    fields: [
      text('Marque'),
      text('Matière', true),
      text('Âge recommandé', true),
      text('Norme de sécurité', true),
      text('Entretien'),
      text('Contenu du lot'),
    ],
    options: ['Couleur', 'Taille', 'Lot'],
  },
  {
    id: 'stationery',
    label: 'Papeterie / fournitures',
    description:
      'Papeterie, fournitures scolaires et de bureau. Le format et le conditionnement sont des axes de vente.',
    fields: [
      text('Marque'),
      text('Matière'),
      text('Format'),
      text('Contenu du lot'),
    ],
    options: ['Couleur', 'Format', 'Lot'],
  },
  {
    id: 'service',
    label: 'Prestation de service',
    description:
      'Une prestation est unique : décrivez le périmètre, la zone et le délai. Aucune variante de stock n’est nécessaire.',
    unique: true,
    fields: [
      text('Prestation incluse', true),
      text('Zone d’intervention', true),
      text('Délai'),
      text('Exclusions'),
    ],
    options: [],
  },
];

/** Valeurs proposées pour accélérer la saisie, sans jamais l’imposer. */
export const OPTION_VALUE_SUGGESTIONS: Record<string, string[]> = {
  Couleur: [
    'Noir',
    'Blanc',
    'Beige',
    'Marron',
    'Brun',
    'Gris',
    'Bleu',
    'Rouge',
    'Vert',
    'Jaune',
    'Orange',
    'Rose',
    'Violet',
    'Doré',
    'Argenté',
    'Multicolore',
    'Transparent',
  ],
  Teinte: [
    'Clair',
    'Médium',
    'Foncé',
    'Naturel',
    'Beige',
    'Caramel',
    'Miel',
    'Rose',
    'Rouge',
    'Brun',
  ],
  Taille: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
  Pointure: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  'Longueur (pouces)': ['8', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30'],
  Stockage: ['64 Go', '128 Go', '256 Go', '512 Go', '1 To', '2 To'],
  'Mémoire RAM': ['4 Go', '6 Go', '8 Go', '12 Go', '16 Go', '32 Go'],
  Capacité: ['1 L', '1,5 L', '2 L', '3 L', '5 L', '10 L', '20 L', '50 L', '100 L'],
  Puissance: ['500 W', '800 W', '1000 W', '1500 W', '2000 W', '3000 W', '5000 W', '10000 W'],
  Format: ['Petit', 'Moyen', 'Grand', 'XL', 'Standard', 'Compact'],
  Conditionnement: ['À l’unité', 'Lot de 2', 'Lot de 3', 'Lot de 5', 'Lot de 10'],
  Lot: ['À l’unité', 'Lot de 2', 'Lot de 3', 'Lot de 5', 'Lot de 10'],
  Dimensions: ['Petit', 'Moyen', 'Grand', 'Sur mesure'],
  Finition: ['Mat', 'Brillant', 'Satiné', 'Métallisé', 'Naturel'],
  Largeur: ['Étroit', 'Standard', 'Large', 'Très large'],
  Saveur: ['Nature', 'Vanille', 'Chocolat', 'Fraise', 'Citron', 'Épicé', 'Autre'],
  'Poids net': ['100 g', '250 g', '500 g', '1 kg', '2 kg', '5 kg', '10 kg'],
  Configuration: ['Standard', 'Complet', 'Kit de base', 'Kit premium'],
  Contenance: ['30 ml', '50 ml', '100 ml', '200 ml', '250 ml', '500 ml', '1 L'],
};

export function suggestedValues(name: string): string[] {
  return OPTION_VALUE_SUGGESTIONS[name] ?? [];
}

export interface VariantOption {
  name: string;
  values: string[];
}

export interface ListingVariant {
  id: string;
  sku: string;
  values: Record<string, string>;
  price: number;
  supplierPrice?: number;
  stock: number;
  images: string[];
  weightKg?: number;
  active: boolean;
}

export function profileById(id: string): ListingProfile | undefined {
  return LISTING_PROFILES.find((profile) => profile.id === id);
}

export function variantLabel(variant: ListingVariant): string {
  return Object.entries(variant.values ?? {})
    .map(([key, value]) => `${key} : ${value}`)
    .join(' · ');
}

/** Clé stable d’une combinaison, dans l’ordre des axes. */
export function combinationKey(
  options: VariantOption[],
  values: Record<string, string>,
): string {
  return JSON.stringify(options.map((option) => values[option.name] ?? ''));
}

/** Produit cartésien des valeurs d’options. */
export function buildCombinations(
  options: VariantOption[],
): Record<string, string>[] {
  let combinations: Record<string, string>[] = [{}];
  for (const option of options) {
    const values = option.values.map((value) => String(value).trim()).filter(Boolean);
    combinations = combinations.flatMap((combination) =>
      values.map((value) => ({ ...combination, [option.name]: value })),
    );
  }
  return combinations;
}

/**
 * Validation serveur des options et variantes.
 * Les variantes inactives sont tolérées incomplètes : elles conservent leur
 * historique mais ne sont jamais vendues.
 */
export function validateVariants(
  options: VariantOption[],
  variants: ListingVariant[],
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(options) || !Array.isArray(variants)) {
    return ['Options et variantes invalides.'];
  }
  if (options.length > 3) errors.push('Maximum 3 axes de variantes.');
  if (variants.length > 200) errors.push('Maximum 200 variantes.');

  const names = new Set<string>();
  for (const option of options) {
    const name = String(option?.name ?? '').trim();
    if (!name || name.length > 60) {
      errors.push('Chaque option doit avoir un nom (60 caractères maximum).');
      continue;
    }
    const key = name.toLowerCase();
    if (names.has(key)) {
      errors.push(`L’option « ${name} » est répétée.`);
      continue;
    }
    names.add(key);
    if (!Array.isArray(option.values) || option.values.length === 0) {
      errors.push(`Ajoutez au moins une valeur à « ${name} ».`);
      continue;
    }
    if (option.values.length > 100) {
      errors.push(`« ${name} » contient trop de valeurs (100 maximum).`);
    }
    const seen = new Set<string>();
    for (const raw of option.values) {
      const value = String(raw ?? '').trim();
      if (!value || value.length > 80) {
        errors.push(`Valeur invalide pour « ${name} ».`);
      } else if (seen.has(value.toLowerCase())) {
        errors.push(`Valeur « ${value} » répétée dans « ${name} ».`);
      } else {
        seen.add(value.toLowerCase());
      }
    }
  }

  const active = variants.filter((variant) => variant && variant.active);
  if (options.length > 0 && active.length === 0) {
    errors.push('Ajoutez au moins une combinaison active.');
  }
  if (options.length === 0 && active.length > 0) {
    errors.push('Une variante active nécessite des options.');
  }

  const ids = new Set<string>();
  const skus = new Set<string>();
  const combinations = new Set<string>();

  for (const variant of variants) {
    if (!variant || typeof variant.id !== 'string' || !variant.id.trim() || variant.id.length > 80) {
      errors.push('Identifiant de variante invalide.');
      continue;
    }
    if (ids.has(variant.id)) {
      errors.push('Identifiant de variante répété.');
      continue;
    }
    ids.add(variant.id);

    const sku = String(variant.sku ?? '').trim();
    if (sku.length > 80) errors.push('Référence SKU trop longue (80 caractères maximum).');
    if (sku) {
      const key = sku.toLowerCase();
      if (skus.has(key)) errors.push(`Référence SKU « ${sku} » répétée.`);
      else skus.add(key);
    }

    if (!variant.active) continue;

    if (!sku) errors.push('Chaque variante active doit avoir une référence SKU.');
    if (!Number.isInteger(variant.stock) || variant.stock < 0 || variant.stock > 1_000_000) {
      errors.push('Stock de variante invalide.');
    }
    if (
      !Number.isFinite(variant.price) ||
      variant.price <= 0 ||
      variant.price > 1_000_000_000 ||
      Math.abs(variant.price * 100 - Math.round(variant.price * 100)) > 1e-5
    ) {
      errors.push('Prix de variante invalide.');
    }
    if (
      variant.supplierPrice != null &&
      (!Number.isFinite(variant.supplierPrice) ||
        variant.supplierPrice < 0 ||
        variant.supplierPrice > variant.price)
    ) {
      errors.push('Le prix public doit couvrir le prix commerçant de chaque variante.');
    }
    if (
      variant.weightKg != null &&
      (!Number.isFinite(variant.weightKg) ||
        variant.weightKg < 0 ||
        variant.weightKg > 100_000)
    ) {
      errors.push('Poids de variante invalide.');
    }
    if (
      !Array.isArray(variant.images) ||
      variant.images.length > 20 ||
      variant.images.some((url) => {
        try {
          return new URL(url).protocol !== 'https:';
        } catch {
          return true;
        }
      })
    ) {
      errors.push('Médias de variante : 20 URL HTTPS au maximum.');
    }

    const values = variant.values ?? {};
    if (
      Object.keys(values).length !== options.length ||
      options.some(
        (option) =>
          !(option.name in values) ||
          !option.values.includes(values[option.name]),
      )
    ) {
      errors.push('Combinaison incomplète ou valeur inconnue.');
    }
    const key = JSON.stringify(options.map((option) => values[option.name]));
    if (combinations.has(key)) errors.push('Combinaison déjà présente.');
    combinations.add(key);
  }

  return [...new Set(errors)];
}

/** Validation des caractéristiques propres à la famille. */
export function validateProfile(
  id: string,
  attributes: Record<string, string>,
): string[] {
  const profile = profileById(id);
  if (!profile) return ['Famille de produit inconnue.'];
  const values =
    attributes && typeof attributes === 'object' && !Array.isArray(attributes)
      ? attributes
      : {};

  return profile.fields.flatMap((field) => {
    const value = String(values[field.key] ?? '').trim();
    if (!value) return field.required ? [`${field.label} : valeur obligatoire.`] : [];
    if (value.length > 300) return [`${field.label} : 300 caractères maximum.`];
    if (field.numeric) {
      const numeric = Number(value.replace(',', '.'));
      if (!Number.isFinite(numeric) || numeric < 0) {
        return [`${field.label} : nombre positif attendu.`];
      }
    }
    if (field.choices && !field.choices.includes(value)) {
      return [`${field.label} : choisissez une valeur proposée.`];
    }
    return [];
  });
}

/** Validation complète d’une configuration de publication. */
export function validateListing(
  productType: string,
  attributes: Record<string, string>,
  options: VariantOption[],
  variants: ListingVariant[],
): string[] {
  const errors = [
    ...validateProfile(productType, attributes),
    ...validateVariants(options, variants),
  ];
  const profile = profileById(productType);
  if (profile?.unique && options.length > 0) {
    errors.push('Cette famille décrit une annonce individuelle : aucun axe de variante n’est autorisé.');
  }
  if (profile?.unique && variants.some((variant) => variant.active)) {
    errors.push('Cette famille décrit une annonce individuelle : les variantes doivent être désactivées.');
  }
  return [...new Set(errors)];
}

const PROFILE_KEYWORDS: Array<[string, RegExp]> = [
  [
    'hair',
    /meche|perruque|extension|tissage|closure|frontale|wig|cheveux|lace/i,
  ],
  [
    'phone',
    /telephone|smartphone|tablette|iphone|samsung|galaxy|infinix|tecno|redmi|pixel|ipad/i,
  ],
  [
    'computer',
    /ordinateur|portable|laptop|macbook|thinkpad|ecran|moniteur|imprimante|clavier|souris|informatique/i,
  ],
  [
    'vehicle',
    /voiture|vehicule|moto|scooter|utilitaire|camion|pick-up|pickup|4x4|toyota|hilux|prado|jetour|sinotruk/i,
  ],
  [
    'shoes',
    /chaussure|sandale|basket|escarpin|talon|botte|pointure/i,
  ],
  [
    'clothing',
    /vetement|robe|chemise|pantalon|t-shirt|ensemble|abaya|boubou|textile|pagne|foulard/i,
  ],
  [
    'beauty',
    /cosmetique|soin|parfum|creme|serum|huile|savon|maquillage|shampoing|deodorant/i,
  ],
  [
    'energy',
    /solaire|panneau|batterie|onduleur|groupe electrogene|regulateur|chargeur|lifepo4/i,
  ],
  [
    'appliance',
    /electromenager|climatiseur|clim|refrigerateur|ventilateur|micro-ondes|machine a laver|congelateur/i,
  ],
  [
    'machine',
    /machine|outil|compresseur|generateur|pompe|soudeuse|perceuse|tronconneuse|group electrogene/i,
  ],
  [
    'parts',
    /piece|accessoire|filtre|pneu|phare|retroviseur|plaquette|amortisseur|batterie de/i,
  ],
  [
    'furniture',
    /meuble|mobilier|chaise|table|canape|lit|armoire|decoration|tapis|rideau|matelas/i,
  ],
  [
    'food',
    /aliment|boisson|riz|farine|sucre|epice|conserve|jus|the|cafe|lait|huile alimentaire/i,
  ],
  [
    'jewelry',
    /bijou|montre|sac|collier|bracelet|bague|boucle|maroquinerie/i,
  ],
  [
    'sports',
    /sport|football|basket|tapis de course|velo|jouet|jeu|fitness|musculation/i,
  ],
  [
    'baby',
    /bebe|puericulture|poussette|biberon|couche|siege auto/i,
  ],
  [
    'stationery',
    /papeterie|fourniture|stylo|cahier|cartable|classeur|ramette/i,
  ],
  [
    'service',
    /service|prestation|reparation|installation|formation|transport|livraison/i,
  ],
];

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Suggestion de famille à partir du libellé des catégories.
 * Sert uniquement d’aide à la saisie : le commerçant garde le dernier mot.
 */
export function inferProductType(textValue: string): string | null {
  const value = normalizeForMatch(String(textValue ?? ''));
  if (!value.trim()) return null;
  for (const [id, pattern] of PROFILE_KEYWORDS) {
    if (pattern.test(value)) return id;
  }
  return null;
}

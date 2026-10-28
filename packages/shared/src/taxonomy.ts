/**
 * Taxonomie canonique Westzone.
 *
 * Une seule source de vérité pour :
 * - les univers (Motors, Classifieds, Maison, Travaux) ;
 * - les catégories visibles en frontend et dans les formulaires commerçant/admin ;
 * - les sous-catégories ;
 * - les synonymes utilisés par la recherche intelligente ;
 * - le rattachement des catégories historiques de la base (Dubizzle, imports)
 *   aux catégories canoniques.
 *
 * Les catégories historiques restent en base et continuent de fonctionner :
 * `matchCategory()` les rattache à une catégorie canonique, ce qui permet aux
 * filtres frontend de retrouver les produits existants sans migration brutale.
 */

export interface TaxonomySubcategory {
  slug: string;
  label: string;
  /** Synonymes, marques et expressions courantes (recherche + normalisation). */
  aliases: string[];
}

export interface TaxonomyCategory {
  slug: string;
  label: string;
  aliases: string[];
  /** Slugs exacts de catégories historiques rattachées à cette catégorie. */
  dbSlugs?: string[];
  /** Préfixes de slugs historiques (ex. `informatique-`). */
  dbPrefixes?: string[];
  /** Noms exacts de catégories historiques (normalisés). */
  dbNames?: string[];
  subcategories: TaxonomySubcategory[];
}

export interface TaxonomyUniverse {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  categories: TaxonomyCategory[];
}

const sub = (
  slug: string,
  label: string,
  aliases: string[] = [],
): TaxonomySubcategory => ({ slug, label, aliases });

export const TAXONOMY: TaxonomyUniverse[] = [
  {
    id: 'motors',
    name: 'Véhicules & Pièces Auto',
    subtitle: 'Motors',
    icon: 'car',
    categories: [
      {
        slug: 'voitures-suv',
        label: 'Voitures & SUV',
        aliases: [
          'voiture',
          'voitures',
          'suv',
          '4x4',
          'automobile',
          'auto',
          'car',
          'cars',
          'berline',
          'citadine',
          'pickup',
          'pick-up',
        ],
        dbSlugs: ['cat-voitures-suv', 'auto-moto-voitures'],
        dbPrefixes: ['voitures', 'auto-moto-voitures'],
        dbNames: ['voitures', 'voitures & suv', 'vehicules'],
        subcategories: [
          sub('suv-4x4', 'SUV & 4x4', [
            'suv',
            '4x4',
            'tout-terrain',
            'tout terrain',
            'land cruiser',
            'prado',
            'hilux',
            'dashing',
            'x70',
          ]),
          sub('berlines-citadines', 'Berlines & Citadines', [
            'berline',
            'berlines',
            'citadine',
            'citadines',
            'sedan',
            'coupe',
            'corolla',
            'camry',
          ]),
          sub('voitures-electriques', 'Voitures électriques & hybrides', [
            'electrique',
            'electriques',
            'hybride',
            'hybrides',
            'ev',
            'tesla',
            'byd',
            'leaf',
          ]),
        ],
      },
      {
        slug: 'motos-tricycles',
        label: 'Motos & Tricycles',
        aliases: [
          'moto',
          'motos',
          'motocyclette',
          'scooter',
          'scooters',
          'tricycle',
          'tricycles',
          'tuk-tuk',
          'jakarta',
          'deux-roues',
        ],
        dbSlugs: ['cat-motos-tricycles'],
        dbPrefixes: ['motos', 'moto-'],
        dbNames: ['motos & tricycles', 'motos'],
        subcategories: [
          sub('motos', 'Motos', [
            'moto',
            'motos',
            'motocyclette',
            'motocyclettes',
            'yamaha',
            'honda',
            'suzuki',
          ]),
          sub('scooters', 'Scooters & Vélomoteurs', [
            'scooter',
            'scooters',
            'velomoteur',
            'velomoteurs',
            'mobylette',
          ]),
          sub('tricycles', 'Tricycles & Tuk-tuk', [
            'tricycle',
            'tricycles',
            'tuk tuk',
            'tuk-tuk',
            'jakarta',
            'rickshaw',
          ]),
        ],
      },
      {
        slug: 'utilitaires-pick-up',
        label: 'Utilitaires & Pick-up',
        aliases: [
          'utilitaire',
          'utilitaires',
          'pick-up',
          'pickup',
          'pick ups',
          'camionnette',
          'fourgon',
          'van',
          'camion',
          'bus',
        ],
        dbSlugs: ['cat-utilitaires-pick-up'],
        dbPrefixes: ['utilitaires', 'camions', 'fourgons'],
        dbNames: ['utilitaires & pick-up', 'utilitaires'],
        subcategories: [
          sub('pick-up', 'Pick-up', ['pick-up', 'pickup', 'pick ups', 'hilux', 'ranger']),
          sub('fourgons-camionnettes', 'Fourgons & Camionnettes', [
            'fourgon',
            'fourgons',
            'camionnette',
            'camionnettes',
            'van',
            'sprinter',
          ]),
          sub('camions-bus', 'Camions & Bus', [
            'camion',
            'camions',
            'bus',
            'minibus',
            'poids lourd',
            'poids lourds',
          ]),
        ],
      },
      {
        slug: 'pieces-accessoires-auto',
        label: 'Pièces & Accessoires Auto',
        aliases: [
          'piece auto',
          'pieces auto',
          'piece detachee',
          'pieces detachees',
          'accessoire auto',
          'accessoires auto',
          'pneu',
          'pneus',
          'jante',
          'jantes',
          'entretien auto',
          'lubrifiant',
          'pieces & pneus',
        ],
        dbSlugs: ['cat-pieces-pneus', 'cat-accessoires-auto'],
        dbPrefixes: ['pieces-', 'pneus-', 'auto-moto-pieces', 'auto-moto-pneus'],
        dbNames: [
          'pieces & pneus',
          'accessoires auto',
          'pieces & accessoires auto',
          'pieces detachees & accessoires',
        ],
        subcategories: [
          sub('pieces-moteur', 'Pièces moteur', [
            'piece moteur',
            'pieces moteur',
            'moteur',
            'boite de vitesse',
            'embrayage',
            'turbo',
            'alternateur',
          ]),
          sub('pneus-jantes', 'Pneus & Jantes', [
            'pneu',
            'pneus',
            'jante',
            'jantes',
            'roue',
            'roues',
            'michelin',
            'bridgestone',
          ]),
          sub('accessoires-eclairage-auto', 'Accessoires & Éclairage', [
            'accessoire auto',
            'accessoires auto',
            'eclairage auto',
            'phare',
            'phares',
            'led auto',
            'tapis auto',
            'housse siege',
            'gps',
          ]),
          sub('entretien-lubrifiants', 'Entretien & Lubrifiants', [
            'entretien auto',
            'entretien',
            'lubrifiant',
            'lubrifiants',
            'huile moteur',
            'vidange',
            'filtre',
          ]),
        ],
      },
    ],
  },
  {
    id: 'classifieds',
    name: 'High-tech, Maison & Vie quotidienne',
    subtitle: 'Classifieds',
    icon: 'phone',
    categories: [
      {
        slug: 'telephones-tablettes',
        label: 'Téléphones & Tablettes',
        aliases: [
          'telephone',
          'telephones',
          'smartphone',
          'smartphones',
          'tablette',
          'tablettes',
          'telephonie',
          'mobile',
          'mobiles',
          'iphone',
          'android',
        ],
        dbSlugs: ['cat-telephones-tablettes', 'electronique-accessoires-telephone', 'electronique-cables-chargeurs'],
        dbPrefixes: ['telephonie', 'telephones', 'tablettes', 'accessoires-telephone'],
        dbNames: [
          'telephones & tablettes',
          'telephonie & tablettes',
          'telephonie',
          'telephones',
          'tablettes',
        ],
        subcategories: [
          sub('smartphones', 'Smartphones', [
            'smartphone',
            'smartphones',
            'telephone',
            'telephones',
            'iphone',
            'android',
            'samsung',
            'galaxy',
            'tecno',
            'infinix',
            'itel',
            'xiaomi',
            'redmi',
            'oppo',
            'vivo',
            'pixel',
          ]),
          sub('tablettes', 'Tablettes', ['tablette', 'tablettes', 'ipad', 'tab', 'tabllette']),
          sub('accessoires-telephone', 'Accessoires téléphone', [
            'accessoire telephone',
            'accessoires telephone',
            'coque',
            'coques',
            'chargeur',
            'chargeurs',
            'cable',
            'cables',
            'ecouteurs',
            'powerbank',
            'power bank',
            'batterie externe',
            'support telephone',
            'verre trempe',
          ]),
        ],
      },
      {
        slug: 'informatique-pc',
        label: 'Informatique & PC',
        aliases: [
          'informatique',
          'ordinateur',
          'ordinateurs',
          'pc',
          'laptop',
          'laptops',
          'computer',
          'computers',
          'bureau',
          'accessoires informatique',
        ],
        dbSlugs: [
          'cat-informatique-pc',
          'cmvmjgrf60001pyktr49bvw7j',
          'cmvmjoprp00013mdjckqvbelf',
          'cmvmipldy00097pq7b5kxt23n',
        ],
        dbPrefixes: [
          'informatique',
          'ordinateurs',
          'computers',
          'computer-',
          'networking',
          'software',
          'monitors',
          'mining-rigs',
          'pos-machine',
        ],
        dbNames: [
          'informatique & pc',
          'ordinateurs & informatique',
          'informatique & reseaux',
          'informatique & accessoires',
          'computers',
          'computer components',
          'networking & communication',
          'software',
          'monitors, printers & other peripherals',
          'mining rigs & components (cryptocurrency)',
          'pos machine & parts',
        ],
        subcategories: [
          sub('pc-portables', 'PC portables', [
            'pc portable',
            'pc portables',
            'ordinateur portable',
            'ordinateurs portables',
            'laptop',
            'laptops',
            'notebook',
            'notebooks',
            'macbook',
            'macbooks',
            'portable',
            'portables',
          ]),
          sub('pc-fixes', 'PC fixes & bureaux', [
            'pc fixe',
            'pc fixes',
            'ordinateur de bureau',
            'ordinateurs de bureau',
            'desktop',
            'desktops',
            'tour',
            'unite centrale',
            'pc bureau',
            'pc assemble',
          ]),
          sub('ecrans-moniteurs', 'Écrans & moniteurs', [
            'ecran',
            'ecrans',
            'moniteur',
            'moniteurs',
            'monitor',
            'monitors',
            'display',
            'ecran pc',
          ]),
          sub('composants-pieces', 'Composants & pièces', [
            'composant',
            'composants',
            'piece',
            'pieces',
            'carte graphique',
            'gpu',
            'processeur',
            'cpu',
            'ram',
            'memoire',
            'ssd',
            'disque dur',
            'carte mere',
            'alimentation',
          ]),
          sub('reseaux-connectique', 'Réseaux & connectique', [
            'reseau',
            'reseaux',
            'routeur',
            'switch',
            'cable',
            'cables',
            'connectique',
            'wifi',
            'ethernet',
            'rj45',
          ]),
          sub('accessoires-informatique', 'Accessoires informatique', [
            'accessoire informatique',
            'accessoires informatique',
            'clavier',
            'souris',
            'sacoche',
            'housse pc',
            'webcam',
            'imprimante',
            'printer',
          ]),
        ],
      },
      {
        slug: 'tv-audio-photo',
        label: 'TV, Audio & Photo',
        aliases: [
          'tv',
          'television',
          'televiseur',
          'televiseurs',
          'audio',
          'photo',
          'camera',
          'cameras',
          'electronique',
          'electronique & informatique',
          'home cinema',
          'projecteur',
        ],
        dbSlugs: ['cat-televiseurs-son', 'cmtf4retr0008k82073sial0s'],
        dbPrefixes: [
          'electronique',
          'audio',
          'televisions',
          'projectors',
          'cameras',
          'home-audio',
          'dvd',
          'satellite',
          'mp3',
          'car-electronics',
          'gadgets',
          'smart-home',
          'wearable',
          'health-electronics',
          'electronic-accessories',
        ],
        dbNames: [
          'electronique',
          'televisions',
          'televiseurs & son',
          'audio & casques',
          'cameras & accessoires',
          'projecteurs & accessoires',
          'projectors',
          'home audio & turntables',
          'dvd & home theater',
          'satellite & cable tv',
          'mp3 players and portable audio',
          'car electronics',
          'gadgets',
          'gadgets & smart gadgets',
          'smart home',
          'wearable technology',
          'health electronics',
          'electronic accessories',
        ],
        subcategories: [
          sub('televiseurs', 'Téléviseurs', [
            'televiseur',
            'televiseurs',
            'tv',
            'television',
            'smart tv',
            'ecran tv',
            'samsung tv',
            'lg tv',
          ]),
          sub('audio-casques', 'Audio & casques', [
            'audio',
            'casque',
            'casques',
            'ecouteurs',
            'enceinte',
            'enceintes',
            'barre de son',
            'home cinema',
            'hifi',
            'jbl',
            'sony',
          ]),
          sub('photo-cameras', 'Photo & caméras', [
            'photo',
            'camera',
            'cameras',
            'appareil photo',
            'reflex',
            'drone',
            'gopro',
            'action cam',
            'canon',
            'nikon',
          ]),
          sub('projecteurs', 'Projecteurs', [
            'projecteur',
            'projecteurs',
            'video projector',
            'home projector',
            'videoprojecteur',
          ]),
        ],
      },
      {
        slug: 'electromenager',
        label: 'Électroménager',
        aliases: [
          'electromenager',
          'electro menager',
          'appareil menager',
          'appareils menagers',
          'climatiseur',
          'climatisation',
          'refrigerateur',
          'frigo',
          'machine a laver',
        ],
        dbSlugs: ['cmvmjgrnx0003pyktyv2968c4'],
        dbPrefixes: [
          'electromenager',
          'chauffage-climatisation',
          'cuisson',
          'refrigeration',
          'maison-cuisine-nettoyage',
        ],
        dbNames: [
          'electromenager',
          'electromenager & accessoires',
          'chauffage & climatisation',
          'cuisson',
          'refrigeration & conservation',
          'petit electromenager',
          'entretien & nettoyage',
          'large appliances / white goods',
          'small kitchen appliances',
          'small bathroom appliances',
          'vacuums & floor care',
          'irons & sewing machines',
          'beauty, spa & sauna appliances',
          'outdoor appliances',
        ],
        subcategories: [
          sub('refrigeration', 'Réfrigérateurs & congélateurs', [
            'refrigerateur',
            'refrigerateurs',
            'frigo',
            'congelateur',
            'congelateurs',
            'froid',
            'samsung fridge',
          ]),
          sub('cuisson-fours', 'Cuisson & fours', [
            'cuisson',
            'cuisiniere',
            'four',
            'fours',
            'micro-ondes',
            'micro onde',
            'plaque',
            'gaziniere',
          ]),
          sub('lavage-entretien', 'Lavage & entretien', [
            'lave-linge',
            'lave linge',
            'machine a laver',
            'lave-vaisselle',
            'aspirateur',
            'seche-linge',
            'fer a repasser',
            'nettoyage',
          ]),
          sub('climatisation-chauffage', 'Climatisation & chauffage', [
            'climatiseur',
            'climatiseurs',
            'climatisation',
            'split',
            'ac',
            'chauffage',
            'chauffe-eau',
            'ventilateur',
            'radiateur',
            'inverter',
            'gree',
            'midea',
          ]),
          sub('petit-electromenager', 'Petit électroménager', [
            'petit electromenager',
            'mixeur',
            'blender',
            'bouilloire',
            'cafetiere',
            'grille-pain',
            'friteuse',
            'robot cuisine',
          ]),
        ],
      },
      {
        slug: 'energie-solaire',
        label: 'Énergie Solaire & Batteries',
        aliases: [
          'solaire',
          'energie solaire',
          'panneau solaire',
          'panneaux solaires',
          'batterie',
          'batteries',
          'onduleur',
          'onduleurs',
          'photovoltaique',
        ],
        dbSlugs: ['cat-energie-solaire-batteries'],
        dbPrefixes: ['energie-solaire', 'solaire', 'batteries', 'onduleurs'],
        dbNames: ['energie solaire & batteries', 'energie solaire', 'solaire'],
        subcategories: [
          sub('panneaux-solaires', 'Panneaux solaires', [
            'panneau solaire',
            'panneaux solaires',
            'photovoltaique',
            'solaire',
            'kit solaire',
          ]),
          sub('batteries-onduleurs', 'Batteries & onduleurs', [
            'batterie',
            'batteries',
            'onduleur',
            'onduleurs',
            'inverter',
            'stockage energie',
            'batterie solaire',
          ]),
        ],
      },
      {
        slug: 'sport-fitness',
        label: 'Sport & Fitness',
        aliases: [
          'sport',
          'sports',
          'fitness',
          'musculation',
          'gym',
          'sport & fitness',
          'sports & loisirs',
          'musculation & gym',
        ],
        dbSlugs: ['cmvmmwbc900033twwm7yq7f1c', 'cat-sport-musculation'],
        dbPrefixes: ['sports-loisirs', 'sport-fitness', 'fitness-musculation', 'running-cardio'],
        dbNames: [
          'sport & fitness',
          'sports & loisirs',
          'fitness & musculation',
          'sport & musculation',
          'running & cardio',
          'camping & randonnee',
          'natation & plage',
          'peche & chasse',
          'velo & accessoires',
        ],
        subcategories: [
          sub('musculation-gym', 'Musculation & gym', [
            'musculation',
            'gym',
            'haltere',
            'halteres',
            'banc de musculation',
            'poids',
            'fitness',
          ]),
          sub('cardio-running', 'Cardio & running', [
            'cardio',
            'running',
            'tapis de course',
            'velo',
            'velo d appartement',
            'elliptique',
          ]),
          sub('sports-loisirs', 'Sports & loisirs', [
            'sport',
            'sports',
            'loisirs',
            'football',
            'basket',
            'tennis',
            'natation',
            'peche',
            'chasse',
          ]),
          sub('camping-plein-air', 'Camping & plein air', [
            'camping',
            'randonnee',
            'plein air',
            'tente',
            'sac de couchage',
          ]),
        ],
      },
      {
        slug: 'mode-accessoires',
        label: 'Mode & Accessoires',
        aliases: [
          'mode',
          'vetement',
          'vetements',
          'accessoire',
          'accessoires',
          'chaussures',
          'sacs',
          'bagages',
          'bijoux',
          'montres',
          'mode & accessoires',
        ],
        dbSlugs: [
          'cmtf4rdq60005k820o2sp554y',
          'cmvmipk5z00007pq7lsppw7wx',
          'cmvmipkff00017pq7fa9baosz',
          'cmvmipkjr00027pq7vy68p7ct',
          'cmvmipksh00047pq70x9c2dkl',
          'cmvmipkwr00057pq7iwwezut9',
          'cmvmmwbuc00073twwovbikofs',
        ],
        dbPrefixes: [
          'mode-femme',
          'mode-homme',
          'mode-accessoires',
          'chaussures',
          'sacs-bagages',
          'bijoux-',
          'montres',
        ],
        dbNames: [
          'mode & accessoires',
          'mode femme',
          'mode homme',
          'chaussures',
          'sacs & bagages',
          'bijoux & accessoires',
          'bijoux & montres',
          'montres',
        ],
        subcategories: [
          sub('vetements-femme', 'Vêtements femme', [
            'vetement femme',
            'vetements femme',
            'robe',
            'robes',
            'jupe',
            'jupes',
            'top',
            'lingerie',
            'mode femme',
          ]),
          sub('vetements-homme', 'Vêtements homme', [
            'vetement homme',
            'vetements homme',
            'chemise',
            'chemises',
            'pantalon',
            'pantalons',
            'jean',
            'jeans',
            'short',
            'shorts',
            'tshirt',
            'polo',
            'mode homme',
          ]),
          sub('chaussures', 'Chaussures', [
            'chaussure',
            'chaussures',
            'sneakers',
            'baskets',
            'sandales',
            'tongs',
            'bottes',
          ]),
          sub('sacs-bagages', 'Sacs & bagages', [
            'sac',
            'sacs',
            'bagage',
            'bagages',
            'valise',
            'valises',
            'sac a dos',
            'sac a main',
            'portefeuille',
          ]),
          sub('bijoux-montres', 'Bijoux & montres', [
            'bijou',
            'bijoux',
            'montre',
            'montres',
            'bracelet',
            'collier',
            'bague',
            'boucles oreilles',
          ]),
          sub('lunettes-accessoires', 'Lunettes & accessoires', [
            'lunettes',
            'lunette',
            'ceinture',
            'ceintures',
            'cravate',
            'cravates',
          ]),
        ],
      },
      {
        slug: 'beaute-sante',
        label: 'Beauté & Santé',
        aliases: [
          'beaute',
          'sante',
          'beaute & sante',
          'beaute & bien-etre',
          'cosmetique',
          'cosmetiques',
          'soins',
          'parfum',
          'maquillage',
        ],
        dbSlugs: ['cmvmipl1400067pq7htb0u4ki', 'cmtf4retl0007k82010hvhjmf'],
        dbPrefixes: ['beaute-sante', 'beaute-bien-etre', 'maquillage', 'parfums', 'soins-'],
        dbNames: [
          'beaute & sante',
          'beaute & bien-etre',
          'beaute',
          'maquillage',
          'parfums & deodorants',
          'soins corps & cheveux',
          'soins visage',
          'hygiene & bien-etre',
        ],
        subcategories: [
          sub('soins-visage-corps', 'Soins visage & corps', [
            'soin',
            'soins',
            'visage',
            'corps',
            'creme',
            'lotion',
            'serum',
          ]),
          sub('cheveux-coiffure', 'Cheveux & coiffure', [
            'cheveux',
            'coiffure',
            'shampoing',
            'shampooing',
            'huile capillaire',
            'perruque',
          ]),
          sub('parfums', 'Parfums & déodorants', [
            'parfum',
            'parfums',
            'deodorant',
            'deodorants',
            'eau de toilette',
          ]),
          sub('maquillage', 'Maquillage', [
            'maquillage',
            'fond de teint',
            'rouge a levres',
            'mascara',
            'palette',
          ]),
          sub('hygiene-bien-etre', 'Hygiène & bien-être', [
            'hygiene',
            'bien-etre',
            'savon',
            'gel douche',
            'dentifrice',
          ]),
        ],
      },
      {
        slug: 'bebe-enfant',
        label: 'Bébé & Enfant',
        aliases: [
          'bebe',
          'enfants',
          'bebe & enfant',
          'bebes & enfants',
          'puericulture',
          'jouets',
        ],
        dbSlugs: ['cmvmipko700037pq75tlnfgfe'],
        dbPrefixes: ['bebes-enfants', 'vetements-bebe', 'vetements-enfant', 'chaussures-enfant', 'puericulture', 'jouets'],
        dbNames: [
          'bebes & enfants',
          'vetements bebe',
          'vetements enfant',
          'chaussures enfant',
          'puericulture & accessoires',
          'jouets',
        ],
        subcategories: [
          sub('vetements-bebe-enfant', 'Vêtements bébé & enfant', [
            'vetement bebe',
            'vetements bebe',
            'vetement enfant',
            'vetements enfant',
          ]),
          sub('puericulture', 'Puériculture & accessoires', [
            'puericulture',
            'poussette',
            'berceau',
            'biberon',
            'couche',
            'chaise haute',
          ]),
          sub('jouets', 'Jouets & jeux', ['jouet', 'jouets', 'jeu', 'jeux', 'peluche', 'lego']),
          sub('chaussures-enfant', 'Chaussures enfant', [
            'chaussure enfant',
            'chaussures enfant',
            'basket enfant',
          ]),
        ],
      },
      {
        slug: 'animaux',
        label: 'Animaux',
        aliases: ['animal', 'animaux', 'animalerie', 'nourriture animale', 'accessoires animaux'],
        dbSlugs: ['cmvmiplva000d7pq71fko0xlv'],
        dbPrefixes: ['animaux'],
        dbNames: ['animaux', 'accessoires animaux', 'nourriture animale'],
        subcategories: [
          sub('nourriture-soins-animaux', 'Nourriture & soins', [
            'nourriture animale',
            'croquettes',
            'alimentation animale',
            'soins animaux',
          ]),
          sub('accessoires-cages-animaux', 'Accessoires & cages', [
            'accessoire animal',
            'accessoires animaux',
            'cage',
            'litiere',
            'laisse',
            'panier',
          ]),
        ],
      },
      {
        slug: 'bureau-papeterie',
        label: 'Bureau & Papeterie',
        aliases: [
          'bureau',
          'papeterie',
          'fournitures',
          'fournitures scolaires',
          'bureau & fournitures',
          'fournitures & papeterie',
        ],
        dbSlugs: ['cmvmiplzn000e7pq7mzw9umus', 'cmvmmwbgw00043twwugxmihda'],
        dbPrefixes: ['fournitures-papeterie', 'bureau-fournitures', 'bureau-classement', 'impression-consommables'],
        dbNames: [
          'fournitures & papeterie',
          'bureau & fournitures',
          'bureau & classement',
          'impression & consommables',
          'scolaire',
          'scolaire & bureau',
          'emballage & cadeaux',
          'emballage & expedition',
        ],
        subcategories: [
          sub('fournitures-scolaires', 'Fournitures scolaires', [
            'fourniture scolaire',
            'fournitures scolaires',
            'cahier',
            'stylo',
            'cartable',
          ]),
          sub('impression-consommables', 'Impression & consommables', [
            'impression',
            'imprimante',
            'cartouche',
            'toner',
            'papier',
          ]),
          sub('mobilier-classement', 'Mobilier & classement', [
            'mobilier bureau',
            'classement',
            'classeur',
            'bureau',
          ]),
        ],
      },
      {
        slug: 'jeux-consoles',
        label: 'Jeux vidéo & Consoles',
        aliases: ['jeu video', 'jeux video', 'console', 'consoles', 'gaming', 'playstation', 'xbox', 'nintendo'],
        dbSlugs: [],
        dbPrefixes: ['jeux-video', 'consoles', 'gaming'],
        dbNames: ['jeux video & consoles', 'consoles', 'jeux video'],
        subcategories: [
          sub('consoles', 'Consoles', [
            'console',
            'consoles',
            'playstation',
            'ps5',
            'ps4',
            'xbox',
            'nintendo',
            'switch',
          ]),
          sub('jeux-video', 'Jeux vidéo', ['jeu video', 'jeux video', 'game', 'gaming']),
          sub('accessoires-gaming', 'Accessoires gaming', [
            'accessoire gaming',
            'manette',
            'casque gaming',
            'chaise gaming',
            'volant',
          ]),
        ],
      },
      {
        slug: 'auto-moto',
        label: 'Auto & Moto (accessoires)',
        aliases: [
          'auto & moto',
          'auto moto',
          'accessoires auto',
          'accessoires moto',
          'pieces auto',
          'pieces moto',
          'entretien auto',
        ],
        dbSlugs: ['cmvmiplmp000b7pq7fe0f4jso'],
        dbPrefixes: ['auto-moto', 'accessoires-auto', 'accessoires-moto'],
        dbNames: ['auto & moto', 'accessoires auto', 'accessoires moto'],
        subcategories: [
          sub('accessoires-auto', 'Accessoires auto', [
            'accessoire auto',
            'accessoires auto',
            'tapis auto',
            'housse siege',
            'gps',
          ]),
          sub('accessoires-moto', 'Accessoires moto', [
            'accessoire moto',
            'accessoires moto',
            'casque moto',
            'gant moto',
          ]),
          sub('pieces-auto-moto', 'Pièces auto & moto', [
            'piece auto',
            'pieces auto',
            'piece moto',
            'pieces moto',
            'moteur',
            'frein',
            'amortisseur',
          ]),
          sub('entretien-pneus', 'Entretien & pneus', [
            'entretien auto',
            'pneu',
            'pneus',
            'jante',
            'jantes',
            'vidange',
            'lubrifiant',
            'huile moteur',
          ]),
        ],
      },
      {
        slug: 'affaires-industriel',
        label: 'Affaires & Industriel',
        aliases: [
          'affaires',
          'industriel',
          'affaires & industriel',
          'equipement industriel',
          'agriculture',
          'restauration',
        ],
        dbSlugs: ['cmvmjoq0z00033mdj86duwml6'],
        dbPrefixes: ['affaires-industriel', 'industrial-supplies', 'manufacturing', 'healthcare-lab', 'food-beverage', 'agriculture-forestry', 'businesses-for-sale', 'commercial-printing', 'electrical-equipment', 'office-furniture', 'packing-shipping', 'retail-services'],
        dbNames: [
          'affaires & industriel',
          'agriculture & forestry',
          'businesses for sale',
          'commercial printing & copy machines',
          'construction',
          'electrical equipment',
          'food & beverage',
          'healthcare & lab',
          'industrial supplies',
          'manufacturing',
          'office furniture & equipment',
          'packing & shipping',
          'retail & services',
        ],
        subcategories: [
          sub('equipement-industriel', 'Équipement industriel', [
            'equipement industriel',
            'industrial supplies',
            'manufacturing',
          ]),
          sub('agriculture-forestry', 'Agriculture & forêt', [
            'agriculture',
            'forestry',
            'agriculture & forestry',
          ]),
          sub('construction-industrielle', 'Construction', ['construction']),
          sub('restauration', 'Restauration & food', ['food', 'beverage', 'restauration']),
          sub('sante-laboratoire', 'Santé & laboratoire', [
            'sante',
            'laboratoire',
            'healthcare',
            'lab',
          ]),
          sub('bureaux-commerces', 'Bureaux & commerces', [
            'bureau',
            'commerce',
            'retail',
            'office furniture',
          ]),
        ],
      },
    ],
  },
  {
    id: 'home',
    name: 'Maison & Jardin',
    subtitle: 'Furniture & Garden',
    icon: 'home',
    categories: [
      {
        slug: 'salons-mobilier',
        label: 'Salons & Mobilier',
        aliases: [
          'mobilier',
          'meuble',
          'meubles',
          'salon',
          'salons',
          'ameublement',
          'meubles & ameublement',
        ],
        dbSlugs: ['cat-salons-mobilier', 'cmvmjgrwp0005pyktmxyyp7i4'],
        dbPrefixes: ['meubles-ameublement', 'salons-mobilier', 'maison-cuisine-rangement'],
        dbNames: ['salons & mobilier', 'meubles & ameublement', 'rangement & organisation'],
        subcategories: [
          sub('canapes-fauteuils', 'Canapés & fauteuils', [
            'canape',
            'canapes',
            'fauteuil',
            'fauteuils',
            'salon',
          ]),
          sub('tables-chaises', 'Tables & chaises', [
            'table',
            'tables',
            'chaise',
            'chaises',
            'salle a manger',
          ]),
          sub('rangements-commodes', 'Rangements & commodes', [
            'rangement',
            'commode',
            'commodes',
            'armoire',
            'etagere',
            'bibliotheque',
          ]),
          sub('mobilier-bureau', 'Mobilier de bureau', [
            'mobilier bureau',
            'bureau',
            'chaise bureau',
            'fauteuil bureau',
          ]),
        ],
      },
      {
        slug: 'literie-matelas',
        label: 'Literie & Matelas',
        aliases: ['literie', 'matelas', 'literie & matelas', 'lit', 'lits', 'sommier'],
        dbSlugs: ['cat-literie-matelas'],
        dbPrefixes: ['literie-matelas', 'maison-cuisine-literie'],
        dbNames: ['literie & matelas', 'literie & draps'],
        subcategories: [
          sub('matelas', 'Matelas', ['matelas', 'matelas mousse', 'matelas ressort']),
          sub('lits-sommiers', 'Lits & sommiers', [
            'lit',
            'lits',
            'sommier',
            'sommiers',
            'cadre de lit',
          ]),
          sub('draps-couettes', 'Draps & couettes', [
            'drap',
            'draps',
            'couette',
            'couettes',
            'oreiller',
            'literie',
          ]),
        ],
      },
      {
        slug: 'cuisine-cuisson',
        label: 'Cuisine & Cuisson',
        aliases: ['cuisine', 'cuisson', 'cuisine & cuisson', 'arts de table', 'ustensiles'],
        dbSlugs: ['cat-cuisine-cuisson', 'maison-cuisine', 'cmtf4rern0006k8206xeuwki9'],
        dbPrefixes: [
          'cuisine-cuisson',
          'maison-cuisine-arts-de-table',
          'maison-cuisine-ustensiles',
        ],
        dbNames: ['cuisine & cuisson', 'maison & cuisine'],
        subcategories: [
          sub('arts-de-table', 'Arts de la table', [
            'art de table',
            'arts de table',
            'vaisselle',
            'assiette',
            'verre',
            'couverts',
          ]),
          sub('ustensiles-cuisine', 'Ustensiles de cuisine', [
            'ustensile',
            'ustensiles',
            'casserole',
            'poele',
            'marmite',
          ]),
          sub('cuisson', 'Cuisson', ['cuisson', 'four', 'cuisiniere', 'plaque']),
        ],
      },
      {
        slug: 'decoration',
        label: 'Décoration & Luminaires',
        aliases: ['decoration', 'luminaires', 'decoration & luminaires', 'lampe', 'lampes'],
        dbSlugs: ['cat-decoration'],
        dbPrefixes: [
          'decoration',
          'maison-cuisine-decoration',
          'maison-cuisine-eclairage',
          'maison-cuisine-rideaux',
        ],
        dbNames: ['decoration', 'decoration & luminaires'],
        subcategories: [
          sub('decoration-interieure', 'Décoration intérieure', [
            'decoration',
            'deco',
            'interieur',
            'tableau',
            'vase',
            'tapis',
          ]),
          sub('eclairage-lampes', 'Éclairage & lampes', [
            'eclairage',
            'lampe',
            'lampes',
            'lustre',
            'ampoule',
          ]),
          sub('rideaux-textiles', 'Rideaux & textiles', [
            'rideau',
            'rideaux',
            'textile',
            'coussin',
          ]),
        ],
      },
      {
        slug: 'jardin-exterieur',
        label: 'Jardin & Extérieur',
        aliases: [
          'jardin',
          'exterieur',
          'jardin & exterieur',
          'terrasse',
          'plantes',
          'arrosage',
          'barbecue',
          'maison & jardin',
        ],
        dbSlugs: ['cat-jardin-exterieur', 'cmvmjgsim000apykt1jnvcu4x', 'westzone-home'],
        dbPrefixes: [
          'jardin-exterieur',
          'jardin',
          'plantes',
          'arrosage',
          'barbecues',
          'maison-jardin',
        ],
        dbNames: [
          'jardin & exterieur',
          'maison & jardin',
          'jardin',
          'plantes & graines',
          'arrosage & irrigation',
          'barbecues & accessoires',
          'outils de jardin',
          'mobilier jardin leger',
          'eclairage exterieur',
        ],
        subcategories: [
          sub('jardin-exterieur', 'Jardin & extérieur', [
            'jardin',
            'exterieur',
            'terrasse',
            'balcon',
          ]),
          sub('mobilier-exterieur', 'Mobilier extérieur', [
            'mobilier exterieur',
            'salon de jardin',
            'table jardin',
            'chaise jardin',
          ]),
          sub('plantes-graines', 'Plantes & graines', [
            'plante',
            'plantes',
            'graine',
            'graines',
            'fleur',
            'fleurs',
          ]),
          sub('arrosage-irrigation', 'Arrosage & irrigation', [
            'arrosage',
            'irrigation',
            'tuyau',
            'arrosoir',
            'pompe',
          ]),
        ],
      },
    ],
  },
  {
    id: 'trade',
    name: 'Travaux & Artisans',
    subtitle: 'Matériel & services',
    icon: 'tool',
    categories: [
      {
        slug: 'outillage',
        label: 'Outillage & Bricolage',
        aliases: [
          'outillage',
          'bricolage',
          'outils',
          'outil',
          'outillage & bricolage',
          'quincaillerie',
          'perceuse',
        ],
        dbSlugs: ['cat-outillage-electroportatif', 'cmvmiplr0000c7pq7ivs4mcp4'],
        dbPrefixes: ['outils-bricolage', 'outillage'],
        dbNames: ['outillage & bricolage', 'outils & bricolage', 'outillage', 'outillage electroportatif'],
        subcategories: [
          sub('outillage-main', 'Outillage à main', [
            'outillage main',
            'marteau',
            'tournevis',
            'cle',
            'pince',
            'scie',
          ]),
          sub('outillage-electroportatif', 'Outillage électroportatif', [
            'outillage electroportatif',
            'perceuse',
            'meuleuse',
            'scie circulaire',
            'visseuse',
          ]),
          sub('quincaillerie', 'Quincaillerie', [
            'quincaillerie',
            'vis',
            'clou',
            'serrure',
            'charniere',
          ]),
        ],
      },
      {
        slug: 'electricite-energie',
        label: 'Électricité & Énergie',
        aliases: [
          'electricite',
          'energie',
          'electricite & energie',
          'groupe electrogene',
          'groupes electrogenes',
          'motopompe',
          'motopompes',
          'pompe',
          'pompes',
        ],
        dbSlugs: ['cat-groupes-electrogenes', 'cat-pompes-motopompes'],
        dbPrefixes: ['electricite', 'electrical', 'groupes-electrogenes', 'pompes-motopompes'],
        dbNames: [
          'electricite & energie',
          'electricite & domotique',
          'electrical equipment',
          'groupes electrogenes',
          'pompes & motopompes',
        ],
        subcategories: [
          sub('installations-electriques', 'Installations électriques', [
            'installation electrique',
            'electricite',
            'cable electrique',
            'disjoncteur',
            'tableau electrique',
          ]),
          sub('groupes-electrogenes', 'Groupes électrogènes', [
            'groupe electrogene',
            'groupes electrogenes',
            'generator',
            'generateur',
          ]),
          sub('motopompes', 'Motopompes & pompes', [
            'motopompe',
            'motopompes',
            'pompe',
            'pompes',
            'pompe a eau',
          ]),
        ],
      },
      {
        slug: 'plomberie-sanitaire',
        label: 'Plomberie & Sanitaire',
        aliases: ['plomberie', 'sanitaire', 'plomberie & sanitaire', 'tuyauterie', 'robinetterie'],
        dbSlugs: [],
        dbPrefixes: ['plomberie', 'sanitaire'],
        dbNames: ['plomberie & sanitaire', 'plomberie & tuyauterie', 'sanitaire'],
        subcategories: [
          sub('tuyauterie', 'Tuyauterie', ['tuyauterie', 'tuyau', 'tube', 'pvc', 'raccord']),
          sub('sanitaire', 'Sanitaire & robinetterie', [
            'sanitaire',
            'robinet',
            'robinetterie',
            'wc',
            'toilette',
            'lavabo',
            'douche',
          ]),
        ],
      },
      {
        slug: 'construction-renovation',
        label: 'Construction & Rénovation',
        aliases: [
          'construction',
          'renovation',
          'construction & renovation',
          'materiaux',
          'peinture',
          'soudure',
          'metallerie',
        ],
        dbSlugs: ['cat-soudure-metallerie'],
        dbPrefixes: ['construction', 'peinture-revetements', 'soudure-metallerie'],
        dbNames: [
          'construction & renovation',
          'construction',
          'peinture & revetements',
          'soudure & metallerie',
        ],
        subcategories: [
          sub('materiaux', 'Ciment, briques & matériaux', [
            'materiau',
            'materiaux',
            'ciment',
            'brique',
            'sable',
            'gravier',
            'fer',
          ]),
          sub('peinture-revetements', 'Peinture & revêtements', [
            'peinture',
            'revetement',
            'revetements',
            'carrelage',
            'parquet',
          ]),
          sub('soudure-metallerie', 'Soudure & métallerie', [
            'soudure',
            'metallerie',
            'fer',
            'acier',
            'aluminium',
            'poste a souder',
          ]),
        ],
      },
      {
        slug: 'services-artisans',
        label: 'Services & Artisans',
        aliases: ['services', 'artisans', 'services & artisans', 'plombier', 'electricien', 'menuisier'],
        dbSlugs: ['westzone-trade'],
        dbPrefixes: ['services-artisans', 'services'],
        dbNames: ['services & artisans', 'travaux & artisans'],
        subcategories: [
          sub('plomberie-service', 'Plomberie', ['plomberie', 'plombier']),
          sub('electricite-service', 'Électricité', ['electricite', 'electricien']),
          sub('menuiserie', 'Menuiserie', ['menuiserie', 'menuisier', 'bois']),
          sub('autres-services', 'Autres services', ['service', 'services', 'artisan', 'artisans']),
        ],
      },
    ],
  },
];

/** Normalise une chaîne : minuscules, sans accents, ponctuation remplacée par des espaces. */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function taxonomyCategories(): Array<{
  universe: TaxonomyUniverse;
  category: TaxonomyCategory;
}> {
  return TAXONOMY.flatMap((universe) =>
    universe.categories.map((category) => ({ universe, category })),
  );
}

export function findTaxonomyCategory(slug: string): {
  universe: TaxonomyUniverse;
  category: TaxonomyCategory;
} | null {
  const normalized = normalizeText(slug);
  return (
    taxonomyCategories().find(
      ({ category }) =>
        category.slug === slug || normalizeText(category.slug) === normalized,
    ) || null
  );
}

export function findTaxonomySubcategory(
  slug: string,
): {
  universe: TaxonomyUniverse;
  category: TaxonomyCategory;
  subcategory: TaxonomySubcategory;
} | null {
  const normalized = normalizeText(slug);
  for (const { universe, category } of taxonomyCategories()) {
    const subcategory = category.subcategories.find(
      (item) => item.slug === slug || normalizeText(item.slug) === normalized,
    );
    if (subcategory) return { universe, category, subcategory };
  }
  return null;
}

export interface ResolvedTopic {
  universeId: string;
  category: TaxonomyCategory;
  subcategory?: TaxonomySubcategory;
  /** `category` si l'entrée désigne une catégorie, `subcategory` sinon. */
  level: 'category' | 'subcategory';
}

/**
 * Retrouve une catégorie ou sous-catégorie canonique à partir d'un slug,
 * d'un libellé, d'un synonyme ou d'une valeur historique.
 */
export function resolveTopic(input: unknown): ResolvedTopic | null {
  const normalized = normalizeText(input);
  if (!normalized) return null;

  // 1. Correspondance exacte sur les slugs (le plus fiable).
  for (const { universe, category } of taxonomyCategories()) {
    if (normalizeText(category.slug) === normalized) {
      return { universeId: universe.id, category, level: 'category' };
    }
    const subcategory = category.subcategories.find(
      (item) => normalizeText(item.slug) === normalized,
    );
    if (subcategory) {
      return {
        universeId: universe.id,
        category,
        subcategory,
        level: 'subcategory',
      };
    }
  }

  // 2. Correspondance exacte sur les libellés et synonymes.
  let best: { score: number; topic: ResolvedTopic } | null = null;
  for (const { universe, category } of taxonomyCategories()) {
    const categoryTerms = [category.label, ...category.aliases].map(normalizeText);
    if (categoryTerms.includes(normalized)) {
      const score = 100 + normalized.length;
      if (!best || score > best.score) {
        best = {
          score,
          topic: { universeId: universe.id, category, level: 'category' },
        };
      }
    }
    for (const subcategory of category.subcategories) {
      const terms = [subcategory.label, ...subcategory.aliases].map(normalizeText);
      if (terms.includes(normalized)) {
        const score = 110 + normalized.length;
        if (!best || score > best.score) {
          best = {
            score,
            topic: {
              universeId: universe.id,
              category,
              subcategory,
              level: 'subcategory',
            },
          };
        }
      }
    }
  }
  if (best) return best.topic;

  // 3. Recherche partielle : « ordinateur portable » -> PC portables.
  // On privilégie la correspondance la plus longue, et les sous-catégories
  // (plus précises) à catégorie égale. Les termes très courts (« ac », « pc »)
  // doivent correspondre à un mot entier pour éviter les faux positifs.
  const padded = ` ${normalized} `;
  const containsTerm = (term: string) => {
    if (!term) return false;
    if (padded.includes(` ${term} `)) return true;
    if (term.length >= 4 && normalized.length >= 3 && padded.includes(term)) {
      return true;
    }
    if (term.length >= 4 && normalized.length >= 3) {
      return term
        .split(' ')
        .some((word) => word.length >= 4 && word.startsWith(normalized));
    }
    return false;
  };
  let partial: { score: number; topic: ResolvedTopic } | null = null;
  for (const { universe, category } of taxonomyCategories()) {
    const categoryTerms = [category.label, ...category.aliases].map(normalizeText);
    for (const term of categoryTerms) {
      if (!containsTerm(term)) continue;
      const score = term.length;
      if (!partial || score > partial.score) {
        partial = {
          score,
          topic: { universeId: universe.id, category, level: 'category' },
        };
      }
    }
    for (const subcategory of category.subcategories) {
      const terms = [subcategory.label, ...subcategory.aliases].map(normalizeText);
      for (const term of terms) {
        if (!containsTerm(term)) continue;
        const score = term.length + 20;
        if (!partial || score > partial.score) {
          partial = {
            score,
            topic: {
              universeId: universe.id,
              category,
              subcategory,
              level: 'subcategory',
            },
          };
        }
      }
    }
  }
  if (partial) return partial.topic;

  return null;
}

/** Libellé canonique d'une sous-catégorie (ou valeur nettoyée si inconnue). */
export function canonicalSubcategoryLabel(input: unknown): string {
  const value = String(input ?? '').trim();
  if (!value) return '';
  const resolved = resolveTopic(value);
  if (resolved?.subcategory) return resolved.subcategory.label;
  return value;
}

/** Toutes les valeurs possibles (libellés + synonymes + variantes) d'une sous-catégorie. */
export function subcategoryValues(
  subcategory: TaxonomySubcategory,
): string[] {
  const values = new Set<string>();
  for (const value of [subcategory.label, ...subcategory.aliases]) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    values.add(trimmed);
    values.add(trimmed.toLowerCase());
    values.add(trimmed.toUpperCase());
    const noAccent = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’]/g, "'");
    values.add(noAccent);
    values.add(noAccent.toLowerCase());
    values.add(noAccent.toUpperCase());
  }
  return Array.from(values);
}

export function categorySubcategoryValues(
  category: TaxonomyCategory,
): string[] {
  return Array.from(
    new Set(category.subcategories.flatMap((subcategory) => subcategoryValues(subcategory))),
  );
}

export interface CategoryMatch {
  universeId: string;
  category: TaxonomyCategory;
  score: number;
}

/**
 * Rattache une catégorie historique de la base à une catégorie canonique.
 * Utilise les slugs/noms exacts, les préfixes et les synonymes.
 */
export function matchCategory(category: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  universe?: string | null;
} | null | undefined): CategoryMatch | null {
  if (!category) return null;
  const id = String(category.id || '').trim();
  const slug = normalizeText(category.slug);
  const name = normalizeText(category.name);
  const universe = String(category.universe || '').trim();

  let best: CategoryMatch | null = null;
  for (const { universe: parent, category: candidate } of taxonomyCategories()) {
    let score = 0;
    const dbSlugs = (candidate.dbSlugs || []).map(normalizeText);
    const rawDbSlugs = candidate.dbSlugs || [];
    const dbNames = (candidate.dbNames || []).map(normalizeText);
    const prefixes = (candidate.dbPrefixes || []).map(normalizeText);

    if (
      slug &&
      (candidate.slug === category.slug ||
        dbSlugs.includes(slug) ||
        (id && rawDbSlugs.includes(id)))
    ) {
      score = 200;
    } else if (name && dbNames.includes(name)) {
      score = 180;
    } else if (
      name &&
      [candidate.label, ...candidate.aliases].map(normalizeText).includes(name)
    ) {
      score = 170;
    } else if (slug && prefixes.some((prefix) => slug.startsWith(prefix))) {
      const prefix = prefixes
        .filter((item) => slug.startsWith(item))
        .sort((a, b) => b.length - a.length)[0];
      score = 120 + prefix.length;
    } else if (
      name &&
      [candidate.label, ...candidate.aliases].some((term) => {
        const normalized = normalizeText(term);
        return normalized && name.includes(normalized);
      })
    ) {
      score = 90;
    }

    if (!score) continue;
    if (universe && universe === parent.id) score += 8;
    if (!best || score > best.score) {
      best = { universeId: parent.id, category: candidate, score };
    }
  }
  return best;
}

/** Catégorie canonique d'un produit (priorité à la sous-catégorie si elle est reconnue). */
export function productCanonicalTaxonomy(product: any): {
  category: { slug: string; label: string; universeId: string } | null;
  subcategories: string[];
} {
  const rawSubs: string[] = Array.isArray(product?.subcategories)
    ? product.subcategories
    : product?.subcategory
      ? [product.subcategory]
      : [];
  const subcategories: string[] = [];
  let fromSubcategory: ResolvedTopic | null = null;
  const match = matchCategory(product?.category);

  // Résout une sous-catégorie en priorité dans la catégorie du produit :
  // « Câbles » d'un produit « Téléphones » ne doit pas devenir « Réseaux ».
  const resolveWithinCategory = (
    category: TaxonomyCategory,
    raw: unknown,
  ): TaxonomySubcategory | null => {
    const normalized = normalizeText(raw);
    if (!normalized) return null;
    return (
      category.subcategories.find((item) =>
        [item.slug, item.label, ...item.aliases]
          .map(normalizeText)
          .includes(normalized),
      ) || null
    );
  };

  for (const raw of rawSubs) {
    if (!raw || normalizeText(raw) === 'autres') continue;
    const within = match ? resolveWithinCategory(match.category, raw) : null;
    const resolved: ResolvedTopic | null = within
      ? {
          universeId: match!.universeId,
          category: match!.category,
          subcategory: within,
          level: 'subcategory',
        }
      : resolveTopic(raw);
    if (resolved?.subcategory) {
      if (!subcategories.includes(resolved.subcategory.label)) {
        subcategories.push(resolved.subcategory.label);
      }
      if (!fromSubcategory) fromSubcategory = resolved;
    } else {
      const label = String(raw).trim();
      if (label && !subcategories.includes(label)) subcategories.push(label);
    }
  }

  const topic =
    fromSubcategory ||
    (match ? { universeId: match.universeId, category: match.category } : null);
  return {
    category: topic
      ? {
          slug: topic.category.slug,
          label: topic.category.label,
          universeId: topic.universeId,
        }
      : null,
    subcategories,
  };
}

export interface TaxonomySearchResult {
  type: 'category' | 'subcategory';
  universeId: string;
  universeName: string;
  categorySlug: string;
  categoryLabel: string;
  subcategorySlug?: string;
  subcategoryLabel?: string;
  label: string;
  group: string;
  keywords: string[];
  score: number;
}

/** Recherche intelligente dans la taxonomie (accents, casse, synonymes). */
export function searchTaxonomy(query: string, limit = 30): TaxonomySearchResult[] {
  const tokens = normalizeText(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];

  const results: TaxonomySearchResult[] = [];
  for (const { universe, category } of taxonomyCategories()) {
    const categoryHaystack = normalizeText(
      [category.slug, category.label, ...category.aliases].join(' '),
    );
    const categoryScore = tokens.reduce(
      (score, token) => (categoryHaystack.includes(token) ? score + 1 : score),
      0,
    );
    if (categoryScore === tokens.length) {
      const exact = normalizeText(category.label) === tokens.join(' ');
      results.push({
        type: 'category',
        universeId: universe.id,
        universeName: universe.name,
        categorySlug: category.slug,
        categoryLabel: category.label,
        label: category.label,
        group: universe.name,
        keywords: category.aliases,
        score: (exact ? 100 : 60) + categoryScore * 5,
      });
    }

    for (const subcategory of category.subcategories) {
      const haystack = normalizeText(
        [
          subcategory.slug,
          subcategory.label,
          ...subcategory.aliases,
          category.label,
          ...category.aliases,
        ].join(' '),
      );
      const score = tokens.reduce(
        (total, token) => (haystack.includes(token) ? total + 1 : total),
        0,
      );
      if (score !== tokens.length) continue;
      const exact = normalizeText(subcategory.label) === tokens.join(' ');
      results.push({
        type: 'subcategory',
        universeId: universe.id,
        universeName: universe.name,
        categorySlug: category.slug,
        categoryLabel: category.label,
        subcategorySlug: subcategory.slug,
        subcategoryLabel: subcategory.label,
        label: subcategory.label,
        group: `${universe.name} · ${category.label}`,
        keywords: [...subcategory.aliases, category.label],
        score: (exact ? 110 : 70) + score * 5,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'fr'))
    .slice(0, limit);
}

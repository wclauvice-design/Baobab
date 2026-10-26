export interface RuntimeTaxonomySubcategory {
  slug: string;
  label: string;
  keywords?: string[];
}

export interface RuntimeTaxonomyCategory {
  slug: string;
  label: string;
  categoryId: string | null;
  categoryIds: string[];
  keywords?: string[];
  subcategories: RuntimeTaxonomySubcategory[];
}

export interface RuntimeTaxonomyUniverse {
  id: string;
  name: string;
  subtitle?: string;
  icon?: string;
  categories: RuntimeTaxonomyCategory[];
}

export interface RuntimeTaxonomy {
  version?: string;
  universes: RuntimeTaxonomyUniverse[];
}

export interface TaxonomyOption {
  value: string;
  label: string;
  group?: string;
  keywords?: string[];
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function categories(taxonomy?: RuntimeTaxonomy | null) {
  return (taxonomy?.universes || []).flatMap((universe) =>
    universe.categories.map((category) => ({ universe, category })),
  );
}

/** Catégories canoniques proposées dans les formulaires admin/commerçant. */
export function taxonomyCategoryOptions(
  taxonomy?: RuntimeTaxonomy | null,
): TaxonomyOption[] {
  return categories(taxonomy)
    .filter(({ category }) => !!category.categoryId)
    .map(({ universe, category }) => ({
      value: category.categoryId as string,
      label: category.label,
      group: universe.name,
      keywords: [...(category.keywords || []), category.slug],
    }));
}

/** Sous-catégories canoniques, groupées par univers et catégorie. */
export function taxonomySubcategoryOptions(
  taxonomy?: RuntimeTaxonomy | null,
): TaxonomyOption[] {
  return categories(taxonomy).flatMap(({ universe, category }) =>
    category.subcategories.map((subcategory) => ({
      value: subcategory.label,
      label: subcategory.label,
      group: `${universe.name} · ${category.label}`,
      keywords: [
        ...(subcategory.keywords || []),
        subcategory.slug,
        category.label,
        ...(category.keywords || []),
      ],
    })),
  );
}

/**
 * Convertit des identifiants historiques en identifiants canoniques.
 * Les identifiants inconnus sont conservés pour ne pas casser une annonce
 * existante qui utilise une catégorie très spécifique.
 */
export function canonicalCategoryIds(
  taxonomy: RuntimeTaxonomy | null | undefined,
  ids: string[],
): string[] {
  const map = new Map<string, string>();
  for (const { category } of categories(taxonomy)) {
    if (!category.categoryId) continue;
    for (const id of category.categoryIds || []) map.set(id, category.categoryId);
    map.set(category.categoryId, category.categoryId);
  }
  return Array.from(new Set(ids.map((id) => map.get(id) || id).filter(Boolean)));
}

/** Retrouve le libellé canonique d'une sous-catégorie historique. */
export function canonicalSubcategoryLabel(
  taxonomy: RuntimeTaxonomy | null | undefined,
  value: string,
): string {
  const normalized = normalize(value);
  if (!normalized) return value;
  for (const { category } of categories(taxonomy)) {
    for (const subcategory of category.subcategories) {
      const terms = [
        subcategory.label,
        subcategory.slug,
        ...(subcategory.keywords || []),
        category.label,
        ...(category.keywords || []),
      ].map(normalize);
      if (terms.includes(normalized)) return subcategory.label;
    }
  }
  return value;
}

export function canonicalSubcategoryLabels(
  taxonomy: RuntimeTaxonomy | null | undefined,
  values: string[],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const label = canonicalSubcategoryLabel(taxonomy, value);
    const key = normalize(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(label);
  }
  return result;
}

/** Sous-catégories d'une catégorie canonique (identifiant en base). */
export function subcategoryOptionsForCategory(
  taxonomy: RuntimeTaxonomy | null | undefined,
  categoryIds: string[],
): TaxonomyOption[] {
  const selected = new Set(categoryIds);
  const result: TaxonomyOption[] = [];
  for (const { universe, category } of categories(taxonomy)) {
    if (!category.categoryId || !selected.has(category.categoryId)) continue;
    for (const subcategory of category.subcategories) {
      result.push({
        value: subcategory.label,
        label: subcategory.label,
        group: `${universe.name} · ${category.label}`,
        keywords: [
          ...(subcategory.keywords || []),
          subcategory.slug,
          category.label,
          ...(category.keywords || []),
        ],
      });
    }
  }
  return result;
}

/** Libellé canonique d'une catégorie à partir de son identifiant en base. */
export function categoryLabelForId(
  taxonomy: RuntimeTaxonomy | null | undefined,
  id: string,
): string {
  for (const { category } of categories(taxonomy)) {
    if (category.categoryId === id) return category.label;
  }
  return id;
}

/**
 * Ajoute aux options canoniques les catégories historiques déjà sélectionnées
 * mais non rattachées, afin qu'elles restent lisibles et supprimables.
 */
export function withLegacyCategoryOptions(
  options: TaxonomyOption[],
  categories: Array<{ id: string; name: string }>,
  values: string[],
): TaxonomyOption[] {
  const known = new Set(options.map((option) => option.value));
  const extras = values
    .filter((value) => value && !known.has(value))
    .map((value) => ({
      value,
      label:
        categories.find((category) => category.id === value)?.name || value,
      group: 'Catégories existantes',
    }));
  return extras.length ? [...options, ...extras] : options;
}

/**
 * Détecte une sélection de véhicule (voiture, moto, utilitaire…).
 * Les catégories « pièces & accessoires » de l'univers Motors ne sont pas
 * considérées comme des véhicules : elles ne doivent pas afficher le
 * formulaire automobile (kilométrage, carburant, etc.).
 */
export function isVehicleSelection(
  taxonomy: RuntimeTaxonomy | null | undefined,
  categoryIds: string[],
  subcategoryLabels: string[] = [],
): boolean {
  if (
    subcategoryLabels.some((label) =>
      /voiture|utilitaire|moto|tricycle|suv|pick-up|pickup/i.test(label),
    ) &&
    !subcategoryLabels.some((label) => /pi[eè]ce|accessoire/i.test(label))
  ) {
    return true;
  }
  const selected = new Set(categoryIds);
  for (const { universe, category } of categories(taxonomy)) {
    if (!category.categoryId || !selected.has(category.categoryId)) continue;
    if (universe.id !== 'motors') continue;
    if (/pi[eè]ce|accessoire/i.test(category.slug)) continue;
    return true;
  }
  return false;
}

/**
 * Catégories canoniques correspondant à des identifiants (potentiellement
 * historiques), pour les filtres de sous-catégories.
 */
export function selectedCanonicalCategories(
  taxonomy: RuntimeTaxonomy | null | undefined,
  categoryIds: string[],
): RuntimeTaxonomyCategory[] {
  const selected = new Set(categoryIds);
  return categories(taxonomy)
    .map(({ category }) => category)
    .filter(
      (category) =>
        !!category.categoryId &&
        ((category.categoryIds || []).some((id) => selected.has(id)) ||
          selected.has(category.categoryId)),
    );
}

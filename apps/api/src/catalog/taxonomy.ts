import { matchCategory, TAXONOMY } from "@baobab/shared";

export interface RuntimeCategory {
  id: string;
  name: string;
  slug: string;
  universe: string;
}

export interface RuntimeTaxonomySubcategory {
  slug: string;
  label: string;
  keywords: string[];
}

export interface RuntimeTaxonomyCategory {
  slug: string;
  label: string;
  /** Identifiant de la catégorie canonique en base (si elle existe). */
  categoryId: string | null;
  /** Toutes les catégories historiques rattachées à cette catégorie. */
  categoryIds: string[];
  keywords: string[];
  subcategories: RuntimeTaxonomySubcategory[];
}

export interface RuntimeTaxonomyUniverse {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  categories: RuntimeTaxonomyCategory[];
}

/**
 * Construit la taxonomie exposée aux interfaces en rattachant chaque
 * catégorie canonique aux catégories réellement présentes en base.
 *
 * Les catégories historiques (imports Dubizzle, doublons, anglais) ne sont
 * pas supprimées : elles sont simplement rattachées à une catégorie
 * canonique, ce qui permet aux filtres de retrouver leurs produits.
 */
export function buildRuntimeTaxonomy(
  categories: RuntimeCategory[],
): { version: string; universes: RuntimeTaxonomyUniverse[] } {
  const byCanonical = new Map<string, RuntimeCategory[]>();
  for (const category of categories) {
    const match = matchCategory(category);
    if (!match) continue;
    const list = byCanonical.get(match.category.slug) || [];
    list.push(category);
    byCanonical.set(match.category.slug, list);
  }

  return {
    version: "2026-10-27",
    universes: TAXONOMY.map((universe) => ({
      id: universe.id,
      name: universe.name,
      subtitle: universe.subtitle,
      icon: universe.icon,
      categories: universe.categories.map((category) => {
        const matches = byCanonical.get(category.slug) || [];
        const preferred =
          matches.find((item) => item.slug === category.slug) || matches[0];
        return {
          slug: category.slug,
          label: category.label,
          categoryId: preferred?.id || null,
          categoryIds: matches.map((item) => item.id),
          keywords: category.aliases,
          subcategories: category.subcategories.map((subcategory) => ({
            slug: subcategory.slug,
            label: subcategory.label,
            keywords: subcategory.aliases,
          })),
        };
      }),
    })),
  };
}

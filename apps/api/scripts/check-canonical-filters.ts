/**
 * Vérifie, à partir des données publiques de production, que les filtres
 * canoniques retrouvent bien les produits des catégories historiques.
 *
 * Usage : npx ts-node scripts/check-canonical-filters.ts [apiUrl]
 */
import {
  matchCategory,
  normalizeText,
  productCanonicalTaxonomy,
  resolveTopic,
  subcategoryValues,
  categorySubcategoryValues,
} from "../../../packages/shared/src/taxonomy";

const API = process.argv[2] || "https://baobab-api-7w7h.onrender.com";

interface Category {
  id: string;
  name: string;
  slug: string;
  universe: string | null;
}

async function main() {
  const [categoriesResponse, productsResponse] = await Promise.all([
    fetch(`${API}/categories`),
    fetch(`${API}/products`),
  ]);
  const categories = (await categoriesResponse.json()) as Category[];
  const products = (await productsResponse.json()) as any[];

  const keys = process.argv.slice(3);
  const topics = keys.length
    ? keys
    : [
        "informatique-pc",
        "telephones-tablettes",
        "electromenager",
        "energie-solaire",
        "salons-mobilier",
        "outillage",
      ];

  for (const key of topics) {
    const topic = resolveTopic(key);
    if (!topic) {
      console.log(`\n${key} : introuvable dans la taxonomie`);
      continue;
    }
    const topicCategoryIds = categories
      .filter(
        (category) =>
          matchCategory(category)?.category.slug === topic.category.slug,
      )
      .map((category) => category.id);
    const values = topic.subcategory
      ? subcategoryValues(topic.subcategory)
      : categorySubcategoryValues(topic.category);
    const normalizedValues = new Set(values.map(normalizeText));

    const matched = products.filter((product) => {
      const ids = [
        product.categoryId,
        ...(Array.isArray(product.categoryIds) ? product.categoryIds : []),
      ].filter(Boolean);
      if (topic.level === "category" && ids.some((id) => topicCategoryIds.includes(id))) {
        return true;
      }
      const rawSubs = [
        product.subcategory,
        ...(Array.isArray(product.subcategories) ? product.subcategories : []),
      ].filter(Boolean);
      return rawSubs.some((value) => normalizedValues.has(normalizeText(value)));
    });

    console.log(
      `\n${topic.category.label} (${key}) → ${matched.length} produit(s) public(s)`,
    );
    for (const product of matched) {
      const canonical = productCanonicalTaxonomy(product);
      console.log(
        `   · ${product.name} | catégorie=${product.category?.name} | canonique=${canonical.category?.label || "—"} | sous-cat=${canonical.subcategories.join(", ") || "—"}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

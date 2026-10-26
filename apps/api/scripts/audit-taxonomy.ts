/**
 * Audit de la taxonomie : récupère les catégories réelles servies par l'API
 * publique et vérifie leur rattachement aux catégories canoniques.
 *
 * Usage : npx ts-node scripts/audit-taxonomy.ts [apiUrl]
 */
import { matchCategory, TAXONOMY } from "../../../packages/shared/src/taxonomy";

const API = process.argv[2] || "https://baobab-api-7w7h.onrender.com";

interface Category {
  id: string;
  name: string;
  slug: string;
  universe: string | null;
  parentId?: string | null;
}

async function main() {
  const response = await fetch(`${API}/categories`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const categories = (await response.json()) as Category[];

  const canonical = new Map<
    string,
    { label: string; universe: string; total: number }
  >();
  for (const universe of TAXONOMY) {
    for (const category of universe.categories) {
      canonical.set(category.slug, {
        label: category.label,
        universe: universe.id,
        total: 0,
      });
    }
  }

  const unmatched: Category[] = [];
  const byCanonical = new Map<string, Category[]>();
  for (const category of categories) {
    const match = matchCategory(category);
    if (!match) {
      unmatched.push(category);
      continue;
    }
    const list = byCanonical.get(match.category.slug) || [];
    list.push(category);
    byCanonical.set(match.category.slug, list);
  }

  console.log(`Catégories en base : ${categories.length}`);
  console.log(`Catégories canoniques : ${canonical.size}`);
  console.log(`Rattachées : ${categories.length - unmatched.length}`);
  console.log(`Non rattachées : ${unmatched.length}`);
  console.log("");

  for (const [slug, info] of canonical) {
    const matches = byCanonical.get(slug) || [];
    if (!matches.length) continue;
    console.log(
      `\n[${info.universe}] ${info.label} (${slug}) — ${matches.length} catégorie(s) historique(s)`,
    );
    for (const category of matches) {
      console.log(
        `   · ${category.name} (slug=${category.slug}, universe=${category.universe})`,
      );
    }
  }

  if (unmatched.length) {
    console.log("\n=== NON RATTACHÉES ===");
    for (const category of unmatched) {
      console.log(
        `   · ${category.name} (slug=${category.slug}, universe=${category.universe})`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

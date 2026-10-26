import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { TAXONOMY } from "../../../packages/shared/src/taxonomy";

const escape = (value: string) => value.replace(/'/g, "''");

const rows: string[] = [];
TAXONOMY.forEach((universe) => {
  universe.categories.forEach((category, index) => {
    const id = `cat-${category.slug}`;
    rows.push(
      `  ('${escape(id)}', '${escape(category.label)}', '${escape(
        category.slug,
      )}', '${escape(universe.id)}', ${index * 10}, true)`,
    );
  });
});

const sql = `-- Taxonomie canonique Baobab.
-- Les catégories historiques restent intactes : elles sont rattachées aux
-- catégories canoniques par le code (matchCategory) et continuent d'afficher
-- leurs produits. Cette migration garantit simplement que chaque catégorie
-- canonique possède une ligne stable en base pour les formulaires admin.

INSERT INTO "Category" ("id", "name", "slug", "universe", "sortOrder", "isActive")
VALUES
${rows.join(",\n")}
ON CONFLICT DO NOTHING;
`;

const dir = join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20261027000000_canonical_taxonomy",
);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "migration.sql"), sql, "utf8");
console.log(`Migration écrite : ${join(dir, "migration.sql")}`);

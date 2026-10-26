-- Un article peut être associé à plusieurs catégories et sous-catégories.
-- `categoryId` / `subcategory` restent la catégorie principale pour compatibilité.

ALTER TABLE "Product"
  ADD COLUMN "categoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "subcategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Reprise des données existantes : la valeur principale devient la première valeur du tableau.
UPDATE "Product"
SET "categoryIds" = ARRAY["categoryId"]
WHERE cardinality("categoryIds") = 0;

UPDATE "Product"
SET "subcategories" = ARRAY["subcategory"]
WHERE cardinality("subcategories") = 0;

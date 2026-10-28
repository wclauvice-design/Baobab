-- WESTZONE — deuxième passe de nettoyage de la marque sur les données.
-- Migration additive : la précédente (20261028130000) est déjà appliquée,
-- on ne la modifie jamais.

-- 1. Identifiants de catégories historiques encore visibles dans l'API
--    publique (`taxonomy[].categoryIds`, `product.categoryIds`).
DO $$
DECLARE
  pair record;
BEGIN
  FOR pair IN
    SELECT *
      FROM (VALUES
        ('baobab-motors', 'westzone-motors'),
        ('baobab-classifieds', 'westzone-classifieds'),
        ('baobab-home', 'westzone-home'),
        ('baobab-trade', 'westzone-trade')
      ) AS t(old_id, new_id)
  LOOP
    IF EXISTS (SELECT 1 FROM "Category" WHERE "id" = pair.old_id)
       AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "id" = pair.new_id) THEN
      -- Les tableaux ne portent pas de clé étrangère : on les réécrit avant
      -- le renommage de la ligne parente, dont le ON UPDATE CASCADE propage
      -- ensuite la nouvelle valeur à Product.categoryId.
      UPDATE "Product"
         SET "categoryIds" = array_replace("categoryIds", pair.old_id, pair.new_id)
       WHERE pair.old_id = ANY("categoryIds");

      UPDATE "Category"
         SET "id" = pair.new_id
       WHERE "id" = pair.old_id;
    END IF;
  END LOOP;
END $$;

-- 2. Descriptions publiques encore signées par l'ancienne marque.
UPDATE "Product"
   SET "description" = replace(
     replace(
       replace("description", 'Baobab Dubaï Officiel', 'WESTZONE Officiel'),
       'Baobab', 'Westzone'
     ),
     'BAOBAB', 'WESTZONE'
   )
 WHERE "description" ILIKE '%baobab%';

-- 3. Attributs JSON éventuellement signés par l'ancienne marque.
UPDATE "Product"
   SET "attributes" = replace(
     replace(
       replace("attributes"::text, 'Baobab Dubaï Officiel', 'WESTZONE Officiel'),
       'Baobab', 'Westzone'
     ),
     'BAOBAB', 'WESTZONE'
   )::jsonb
 WHERE "attributes"::text ILIKE '%baobab%';

-- WESTZONE — alignement des identifiants historiques sur la nouvelle marque.
-- Migration de données non destructive : seules les lignes créées sous
-- l'ancienne marque sont réécrites, et uniquement si la cible est libre.

-- 1. Commerçant officiel : l'identifiant est référencé par Product et Follow.
--    On renomme la ligne parente et on laisse les clés étrangères
--    (ON UPDATE CASCADE) propager la nouvelle valeur aux enfants.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Seller" WHERE "id" = 'seller-baobab-official')
     AND NOT EXISTS (SELECT 1 FROM "Seller" WHERE "id" = 'seller-westzone-official') THEN
    UPDATE "Seller"
       SET "id" = 'seller-westzone-official'
     WHERE "id" = 'seller-baobab-official';
  END IF;
END $$;

-- 2. Catégories historiques : baobab-* devient westzone-*.
UPDATE "Category" AS c
   SET "slug" = 'westzone-' || substring(c."slug" from 8)
 WHERE c."slug" LIKE 'baobab-%'
   AND NOT EXISTS (
     SELECT 1
       FROM "Category" AS other
      WHERE other."slug" = 'westzone-' || substring(c."slug" from 8)
   );

-- 3. Rôles des messages de conciergerie : l'équipe s'appelle désormais WESTZONE.
UPDATE "ChatMessage"
   SET "role" = 'WESTZONE'
 WHERE "role" = 'BAOBAB';

-- 4. Noms de boutique encore préfixés par l'ancienne marque.
UPDATE "Seller"
   SET "shopName" = replace(
     replace(
       replace(
         replace(
           replace(
             replace(
               replace("shopName", 'Baobab Dubaï Officiel', 'WESTZONE Officiel'),
               'Baobab Dubaï Motors', 'WESTZONE Motors'
             ),
             'Baobab Motors', 'WESTZONE Motors'
           ),
           'Baobab Dubaï', 'WESTZONE'
         ),
         'Baobab', 'Westzone'
       ),
       'BAOBAB', 'WESTZONE'
     ),
     'baobab', 'westzone'
   )
 WHERE "shopName" ILIKE '%baobab%';

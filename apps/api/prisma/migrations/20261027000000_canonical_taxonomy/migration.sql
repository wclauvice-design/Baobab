-- Taxonomie canonique Baobab.
-- Les catégories historiques restent intactes : elles sont rattachées aux
-- catégories canoniques par le code (matchCategory) et continuent d'afficher
-- leurs produits. Cette migration garantit simplement que chaque catégorie
-- canonique possède une ligne stable en base pour les formulaires admin.

INSERT INTO "Category" ("id", "name", "slug", "universe", "sortOrder", "isActive")
VALUES
  ('cat-voitures-suv', 'Voitures & SUV', 'voitures-suv', 'motors', 0, true),
  ('cat-motos-tricycles', 'Motos & Tricycles', 'motos-tricycles', 'motors', 10, true),
  ('cat-utilitaires-pick-up', 'Utilitaires & Pick-up', 'utilitaires-pick-up', 'motors', 20, true),
  ('cat-pieces-accessoires-auto', 'Pièces & Accessoires Auto', 'pieces-accessoires-auto', 'motors', 30, true),
  ('cat-telephones-tablettes', 'Téléphones & Tablettes', 'telephones-tablettes', 'classifieds', 0, true),
  ('cat-informatique-pc', 'Informatique & PC', 'informatique-pc', 'classifieds', 10, true),
  ('cat-tv-audio-photo', 'TV, Audio & Photo', 'tv-audio-photo', 'classifieds', 20, true),
  ('cat-electromenager', 'Électroménager', 'electromenager', 'classifieds', 30, true),
  ('cat-energie-solaire', 'Énergie Solaire & Batteries', 'energie-solaire', 'classifieds', 40, true),
  ('cat-sport-fitness', 'Sport & Fitness', 'sport-fitness', 'classifieds', 50, true),
  ('cat-mode-accessoires', 'Mode & Accessoires', 'mode-accessoires', 'classifieds', 60, true),
  ('cat-beaute-sante', 'Beauté & Santé', 'beaute-sante', 'classifieds', 70, true),
  ('cat-bebe-enfant', 'Bébé & Enfant', 'bebe-enfant', 'classifieds', 80, true),
  ('cat-animaux', 'Animaux', 'animaux', 'classifieds', 90, true),
  ('cat-bureau-papeterie', 'Bureau & Papeterie', 'bureau-papeterie', 'classifieds', 100, true),
  ('cat-jeux-consoles', 'Jeux vidéo & Consoles', 'jeux-consoles', 'classifieds', 110, true),
  ('cat-auto-moto', 'Auto & Moto (accessoires)', 'auto-moto', 'classifieds', 120, true),
  ('cat-affaires-industriel', 'Affaires & Industriel', 'affaires-industriel', 'classifieds', 130, true),
  ('cat-salons-mobilier', 'Salons & Mobilier', 'salons-mobilier', 'home', 0, true),
  ('cat-literie-matelas', 'Literie & Matelas', 'literie-matelas', 'home', 10, true),
  ('cat-cuisine-cuisson', 'Cuisine & Cuisson', 'cuisine-cuisson', 'home', 20, true),
  ('cat-decoration', 'Décoration & Luminaires', 'decoration', 'home', 30, true),
  ('cat-jardin-exterieur', 'Jardin & Extérieur', 'jardin-exterieur', 'home', 40, true),
  ('cat-outillage', 'Outillage & Bricolage', 'outillage', 'trade', 0, true),
  ('cat-electricite-energie', 'Électricité & Énergie', 'electricite-energie', 'trade', 10, true),
  ('cat-plomberie-sanitaire', 'Plomberie & Sanitaire', 'plomberie-sanitaire', 'trade', 20, true),
  ('cat-construction-renovation', 'Construction & Rénovation', 'construction-renovation', 'trade', 30, true),
  ('cat-services-artisans', 'Services & Artisans', 'services-artisans', 'trade', 40, true)
ON CONFLICT DO NOTHING;

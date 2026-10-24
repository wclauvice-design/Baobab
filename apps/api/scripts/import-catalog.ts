import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'catalog-massive.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Catalogue introuvable : ${dataPath}`);
  }

  const products: any[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Chargement de ${products.length} produits du catalogue Baobab...`);

  // 1. Recenser et synchroniser les catégories uniques
  const categoryMap = new Map<string, { name: string; universe: string; slug: string }>();
  for (const p of products) {
    if (!p.category) continue;
    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, {
        name: p.category,
        universe: p.universe || 'classifieds',
        slug: slugify(p.category),
      });
    }
  }

  console.log(`Synchronisation de ${categoryMap.size} catégories...`);
  const catNameToId = new Map<string, string>();

  for (const [name, def] of categoryMap.entries()) {
    const cat = await prisma.category.upsert({
      where: { slug: def.slug },
      update: { name: def.name, universe: def.universe },
      create: { name: def.name, slug: def.slug, universe: def.universe },
    });
    catNameToId.set(name, cat.id);
  }

  console.log('Catégories synchronisées.');

  // 2. Préparation des données d'insertion
  const records = [];
  for (const p of products) {
    const categoryId = catNameToId.get(p.category);
    if (!categoryId) {
      console.warn(`Catégorie manquante pour le produit ${p.id} (${p.name})`);
      continue;
    }

    records.push({
      name: p.name,
      description: p.description,
      price: p.price,
      supplierPrice: p.supplierPrice || Math.round(p.price / 1.15),
      currency: p.currency || 'XOF',
      stock: p.stock || 10,
      images: p.images || [],
      categoryId,
      sellerId: null,
      moderation: 'PUBLISHED',
      subcategory: p.subcategory || 'Autres',
      condition: p.condition || 'NEW',
      location: p.location || 'Dubaï',
      minimumOrder: Number(p.minimumOrder) || 1,
      packSize: Number(p.packSize) || 1,
      unit: p.unit || 'pièce',
      shippingIncluded: Boolean(p.shippingIncluded),
      shippingDestination: p.shippingDestination || null,
      weightKg: p.weightKg ? Number(p.weightKg) : null,
      dimensions: p.dimensions || null,
      attributes: p.attributes || {},
    });
  }

  // 3. Insertion en masse par lots (Bulk Chunks)
  const CHUNK_SIZE = 200;
  let totalInserted = 0;
  console.log(`Début de l'importation de ${records.length} produits par lots de ${CHUNK_SIZE}...`);

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    try {
      const result = await prisma.product.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(`Progression : ${Math.min(i + CHUNK_SIZE, records.length)} / ${records.length} produits traités (+${result.count} insérés)...`);
    } catch (e: any) {
      console.error(`Erreur sur le lot ${i} à ${i + CHUNK_SIZE} :`, e.message);
    }
  }

  console.log(`\nImportation terminée avec succès !`);
  console.log(`Total produits insérés en base : ${totalInserted}`);
}

main()
  .catch((e) => {
    console.error('Erreur importation catalogue :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

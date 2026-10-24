import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FX: Record<string, number> = {
  USD: 600,
  EUR: 655,
};

function toXof(sourcePrice: number, currency: string) {
  const rate = FX[currency] || 600;
  const xof = sourcePrice * rate * 1.15;
  // Arrondi à 50 FCFA près pour un affichage propre
  return Math.round(xof / 50) * 50;
}

async function main() {
  const catTree = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../prisma/data/categories-tree.json'), 'utf-8'));
  const products = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../prisma/data/products-test-25.json'), 'utf-8'));

  // Créer les catégories racines d'abord
  const slugToId = new Map<string, string>();

  // Pass 1: roots
  for (const c of catTree.filter((x: any) => !x.parentSlug)) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
      create: { name: c.name, slug: c.slug, sortOrder: c.sortOrder, isActive: true } as any,
    });
    slugToId.set(cat.slug, cat.id);
  }

  // Pass 2: children
  for (const c of catTree.filter((x: any) => x.parentSlug)) {
    const parentId = slugToId.get(c.parentSlug);
    if (!parentId) continue;
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, parentId, sortOrder: c.sortOrder, isActive: true } as any,
      create: { name: c.name, slug: c.slug, parentId, sortOrder: c.sortOrder, isActive: true } as any,
    });
    slugToId.set(cat.slug, cat.id);
  }

  console.log(`Categories upserted: ${catTree.length}`);

  // Créer produits tests
  const ready: any[] = [];
  for (const p of products) {
    const categoryId = slugToId.get(p.categorySlug);
    if (!categoryId) {
      console.warn('Missing category for', p.name, p.categorySlug);
      continue;
    }
    const priceXof = toXof(p.sourcePrice, p.sourceCurrency);
    const compareAt = Math.round(priceXof * 1.12 / 50) * 50; // petite promo visuelle

    const prodId = `test-${p.suggestedFilename.replace('.jpg','').replace(/-/g,'_')}`;
    const created = await prisma.product.upsert({
      where: { id: prodId },
      update: { price: priceXof, compareAtPrice: compareAt, description: p.description, categoryId, images: [] },
      create: {
        id: prodId,
        name: p.name,
        description: p.description,
        price: priceXof,
        compareAtPrice: compareAt,
        currency: 'XOF',
        stock: Math.floor(Math.random() * 40) + 10,
        images: [],
        categoryId,
        sellerId: null, // vendu par plateforme
      } as any,
    });
    ready.push({
      id: created.id,
      name: created.name,
      categorySlug: p.categorySlug,
      source: { platform: p.sourcePlatform, url: p.sourceUrl, currency: p.sourceCurrency, price: p.sourcePrice },
      priceXof,
      compareAtPriceXof: compareAt,
      suggestedImage: p.suggestedFilename,
      localImagePath: `apps/api/uploads/products/${p.suggestedFilename}`,
    });
  }

  fs.writeFileSync(path.resolve(__dirname, '../prisma/data/products-import-ready.json'), JSON.stringify(ready, null, 2));
  console.log(`Products upserted: ${ready.length}`);
  console.log('Ready file:', path.resolve(__dirname, '../prisma/data/products-import-ready.json'));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

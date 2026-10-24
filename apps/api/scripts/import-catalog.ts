import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const file = path.resolve(__dirname, '../prisma/data/catalog-massive.json');
  const raw = fs.readFileSync(file, 'utf-8');
  const products = JSON.parse(raw);

  console.log(`Found ${products.length} products to import`);

  // Get unique categories
  const catSet = new Set<string>();
  for (const p of products) {
    if (p.category) catSet.add(p.category);
  }

  const catNameToId = new Map<string, string>();
  for (const name of Array.from(catSet)) {
    const slug = slugify(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name, isActive: true },
      create: { name, slug, isActive: true } as any,
    });
    catNameToId.set(name, cat.id);
    console.log(`Category upserted: ${name} -> ${cat.id}`);
  }

  let count = 0;
  for (const p of products) {
    const categoryId = catNameToId.get(p.category);
    if (!categoryId) {
      console.warn(`Skipping ${p.id}: missing category ${p.category}`);
      continue;
    }

    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency || 'XOF',
        stock: p.stock || 10,
        images: [],
        categoryId,
        sellerId: null,
        moderation: 'PUBLISHED',
      } as any,
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency || 'XOF',
        stock: p.stock || 10,
        images: [],
        categoryId,
        sellerId: null,
        moderation: 'PUBLISHED',
      } as any,
    });
    count++;
    if (count % 50 === 0) console.log(`Imported ${count}...`);
  }

  console.log(`Done. Imported ${count} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

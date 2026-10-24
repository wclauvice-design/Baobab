import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'catalog-massive.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.name, c.id]));

  let created = 0;
  for (const p of products) {
    const categoryId = catMap.get(p.category);
    if (!categoryId) {
      console.warn('Category not found:', p.category);
      continue;
    }
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { price: p.price, description: p.description, stock: p.stock },
      });
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          categoryId,
          images: [],
        },
      });
      created++;
    }
  }
  console.log(`Import done. Created: ${created}, total: ${products.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jptymtzrfahlhjcqpttg.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  if (!SERVICE_KEY || SERVICE_KEY.startsWith('sb_publishable_')) {
    console.error('❌ ERREUR: La clé SUPABASE_SERVICE_ROLE_KEY dans .env est encore la clé publique ou est vide.');
    console.error('Veuillez renseigner la clé secrète service_role de Supabase dans apps/api/.env');
    process.exit(1);
  }

  const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'catalog-massive.json');
  const products: any[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📦 Chargement de ${products.length} produits...`);

  // 1. Sync Categories
  const categoryMap = new Map<string, any>();
  for (const p of products) {
    if (!p.category) continue;
    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, {
        id: 'cat-' + slugify(p.category),
        name: p.category,
        slug: slugify(p.category),
        universe: p.universe || 'classifieds',
      });
    }
  }

  console.log(`🔄 Synchronisation de ${categoryMap.size} catégories via REST...`);
  const catPayload = Array.from(categoryMap.values());
  const catRes = await fetch(`${SUPABASE_URL}/rest/v1/Category`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(catPayload),
  });

  if (!catRes.ok) {
    const errText = await catRes.text();
    console.error('Erreur sync catégories:', catRes.status, errText);
    process.exit(1);
  }
  console.log('✅ Catégories synchronisées avec succès !');

  // 2. Insert Products in batches of 200
  const CHUNK_SIZE = 200;
  let totalInserted = 0;

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const payload = chunk.map((p) => {
      const cat = categoryMap.get(p.category);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        supplierPrice: p.supplierPrice || Math.round(p.price / 1.15),
        currency: p.currency || 'XOF',
        stock: p.stock || 10,
        images: p.images || [],
        categoryId: cat ? cat.id : 'cat-autres',
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
      };
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/Product`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Erreur sur le lot ${i} - ${i + CHUNK_SIZE}:`, res.status, err);
    } else {
      totalInserted += payload.length;
      console.log(`🚀 Progression : ${totalInserted} / ${products.length} produits insérés...`);
    }
  }

  console.log(`🎉 SUCCÈS TOTAL : ${totalInserted} produits importés dans Supabase !`);
}

main().catch(console.error);

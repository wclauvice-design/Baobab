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
    console.error('❌ ERREUR: La clé SUPABASE_SERVICE_ROLE_KEY dans .env est manquante ou invalide.');
    process.exit(1);
  }

  const curatedPath = path.join(__dirname, '..', 'prisma', 'data', 'catalog-curated-100.json');
  const fallbackPath = path.join(__dirname, '..', 'prisma', 'data', 'catalog-massive.json');
  const dataPath = fs.existsSync(curatedPath) ? curatedPath : fallbackPath;
  const products: any[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📦 Chargement de ${products.length} produits depuis ${path.basename(dataPath)}...`);

  // 1. Fetch all existing categories from Supabase
  console.log('🔄 Récupération des catégories existantes depuis Supabase...');
  const catFetchRes = await fetch(`${SUPABASE_URL}/rest/v1/Category?select=id,name,slug`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  const existingCats: any[] = await catFetchRes.json();
  const slugToId = new Map<string, string>();
  for (const c of existingCats) {
    slugToId.set(c.slug, c.id);
  }
  console.log(`ℹ️ ${existingCats.length} catégories déjà enregistrées dans Supabase.`);

  // 2. Identify missing categories
  const neededCats = new Map<string, any>();
  for (const p of products) {
    if (!p.category) continue;
    const slug = slugify(p.category);
    if (!slugToId.has(slug) && !neededCats.has(slug)) {
      neededCats.set(slug, {
        id: 'cat-' + slug,
        name: p.category,
        slug: slug,
        universe: p.universe || 'classifieds',
      });
    }
  }

  if (neededCats.size > 0) {
    console.log(`Insertion de ${neededCats.size} nouvelles catégories...`);
    const newCatsPayload = Array.from(neededCats.values());
    const insertCatRes = await fetch(`${SUPABASE_URL}/rest/v1/Category?on_conflict=slug`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(newCatsPayload),
    });

    if (!insertCatRes.ok) {
      console.warn('Note sync categories:', await insertCatRes.text());
    } else {
      for (const nc of newCatsPayload) {
        slugToId.set(nc.slug, nc.id);
      }
    }
  }

  // Fallback default category
  const defaultCatId = existingCats[0]?.id || 'cat-autres';

  // 3. Insert Products in chunks of 200 via PostgREST upsert
  const CHUNK_SIZE = 200;
  let totalInserted = 0;
  console.log(`🚀 Début de l'importation de ${products.length} produits par lots de ${CHUNK_SIZE}...`);

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const payload = chunk.map((p) => {
      const slug = slugify(p.category || '');
      const catId = p.categoryId || slugToId.get(slug) || defaultCatId;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        supplierPrice: p.supplierPrice || Math.round(p.price / 1.15),
        currency: p.currency || 'XOF',
        stock: p.stock || 10,
        images: p.images || [],
        categoryId: catId,
        sellerId: p.sellerId || 'seller-westzone-official',
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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/Product?on_conflict=id`, {
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
      console.error(`❌ Erreur sur le lot ${i} - ${i + chunk.length}:`, res.status, err);
    } else {
      totalInserted += payload.length;
      console.log(`✅ [${Math.round((totalInserted / products.length) * 100)}%] ${totalInserted} / ${products.length} produits insérés avec succès...`);
    }
  }

  console.log(`\n🎉 SUCCÈS TOTAL : ${totalInserted} produits importés et actifs dans Supabase !`);
}

main().catch(console.error);

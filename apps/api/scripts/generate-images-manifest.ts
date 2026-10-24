import fs from 'fs';
import path from 'path';

const PRODUCTS_PATH = path.resolve(__dirname, '../prisma/data/products-test-25.json');
const OUT_CSV = path.resolve(__dirname, '../prisma/data/images-manifest.csv');
const OUT_JSON = path.resolve(__dirname, '../prisma/data/images-manifest.json');

function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));

  const rows = products.map((p: any, idx: number) => {
    const id = String(idx + 1).padStart(3, '0');
    return {
      manifestId: `IMG-${id}`,
      platform: p.sourcePlatform,
      productName: p.name,
      categorySlug: p.categorySlug,
      sourceUrl: p.sourceUrl,
      suggestedFilename: p.suggestedFilename,
      destinationPath: `apps/api/uploads/products/${p.suggestedFilename}`,
      uploadTarget: 'supabase-bucket-product-images-or-local',
      notes: 'Download this image manually from the source page (right click/save) or from network tab. Do not auto-scrape. Upload to bucket "product-images" as public or place in uploads/products and update product images array.'
    };
  });

  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), { encoding: 'utf-8' });

  const headers = ['manifestId','platform','productName','categorySlug','sourceUrl','suggestedFilename','destinationPath','uploadTarget','notes'];
  const csv = [
    headers.join(','),
    ...rows.map((r: any) => headers.map(h => {
      const val = String(r[h] ?? '').replace(/"/g, '""');
      if (val.includes(',') || val.includes('\n') || val.includes('"')) return `"${val}"`;
      return val;
    }).join(','))
  ].join('\n');
  fs.writeFileSync(OUT_CSV, '\ufeff' + csv, { encoding: 'utf-8' });

  console.log(`Generated ${rows.length} entries`);
  console.log('CSV:', OUT_CSV);
  console.log('JSON:', OUT_JSON);
}

main();

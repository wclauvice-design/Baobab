"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const PRODUCTS_PATH = path_1.default.resolve(__dirname, '../prisma/data/products-test-25.json');
const OUT_CSV = path_1.default.resolve(__dirname, '../prisma/data/images-manifest.csv');
const OUT_JSON = path_1.default.resolve(__dirname, '../prisma/data/images-manifest.json');
function main() {
    const products = JSON.parse(fs_1.default.readFileSync(PRODUCTS_PATH, 'utf-8'));
    const rows = products.map((p, idx) => {
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
    fs_1.default.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2));
    const headers = ['manifestId', 'platform', 'productName', 'categorySlug', 'sourceUrl', 'suggestedFilename', 'destinationPath', 'uploadTarget', 'notes'];
    const csv = [
        headers.join(','),
        ...rows.map((r) => headers.map(h => {
            const val = String(r[h] ?? '').replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n') || val.includes('"'))
                return `"${val}"`;
            return val;
        }).join(','))
    ].join('\n');
    fs_1.default.writeFileSync(OUT_CSV, csv);
    console.log(`Generated ${rows.length} entries`);
    console.log('CSV:', OUT_CSV);
    console.log('JSON:', OUT_JSON);
}
main();
//# sourceMappingURL=generate-images-manifest.js.map
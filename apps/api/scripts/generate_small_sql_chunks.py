import json
import re
import os
import shutil

def escape_sql(val):
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, dict):
        s = json.dumps(val).replace("'", "''")
        return f"'{s}'::jsonb"
    if isinstance(val, list):
        items = ['"' + str(x).replace('"', '\\"') + '"' for x in val]
        arr_str = '{' + ','.join(items) + '}'
        return f"'{arr_str}'::text[]"
    s = str(val).replace("'", "''")
    return f"'{s}'"

def slugify(s):
    s = s.lower()
    s = re.sub(r'[àáâãäå]', 'a', s)
    s = re.sub(r'[èéêë]', 'e', s)
    s = re.sub(r'[ìíîï]', 'i', s)
    s = re.sub(r'[òóôõö]', 'o', s)
    s = re.sub(r'[ùúûü]', 'u', s)
    s = re.sub(r'[ç]', 'c', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

with open('apps/api/prisma/data/catalog-massive.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

categories = {}
for p in products:
    cat = p.get('category')
    if cat and cat not in categories:
        categories[cat] = {
            'id': 'cat-' + slugify(cat),
            'name': cat,
            'slug': slugify(cat),
            'universe': p.get('universe', 'classifieds')
        }

cat_sql = ['-- 1. Synchronisation des Catégories\n']
for c in categories.values():
    c_name = c['name'].replace("'", "''")
    c_id = c['id']
    c_slug = c['slug']
    c_univ = c['universe']
    cat_sql.append(
        f'INSERT INTO "Category" ("id", "name", "slug", "universe") '
        f"VALUES ('{c_id}', '{c_name}', '{c_slug}', '{c_univ}') "
        f'ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "universe" = EXCLUDED."universe";'
    )
cat_sql_str = '\n'.join(cat_sql) + '\n\n'

# Partition into 8 chunks strictly under 450 KB
out_dir = 'apps/api/prisma/data/sql_chunks'
os.makedirs(out_dir, exist_ok=True)

CHUNK_SIZE = 650
total_parts = (len(products) + CHUNK_SIZE - 1) // CHUNK_SIZE

titles = [
    "01_Categories_et_Vehicules_Toyota_Jetour",
    "02_Vehicules_4x4_Pickups_et_Camions",
    "03_Vehicules_SUV_et_Utilitaires",
    "04_Motos_Tricycles_et_Pieces_Detachees",
    "05_Telephones_Samsung_Infinix_Tecno",
    "06_Solaire_Batteries_et_Climatiseurs",
    "07_Informatique_PC_Portables_et_SmartTV",
    "08_Outillage_Chantier_Groupes_et_Mobilier"
]

for idx in range(total_parts):
    start = idx * CHUNK_SIZE
    chunk = products[start:start+CHUNK_SIZE]
    name_suffix = titles[idx] if idx < len(titles) else f"{idx+1:02d}_Produits"
    file_name = os.path.join(out_dir, f"part_{name_suffix}.sql")
    
    lines = []
    if idx == 0:
        lines.append(cat_sql_str)
    
    lines.append(f"-- Lot {idx+1}/{total_parts} : {len(chunk)} produits\n")
    
    SUB = 50
    for s in range(0, len(chunk), SUB):
        sub_chunk = chunk[s:s+SUB]
        rows = []
        for p in sub_chunk:
            cat_info = categories.get(p.get('category', ''))
            c_slug = cat_info['slug'] if cat_info else 'autres'
            
            row = (
                f"("
                f"{escape_sql(p['id'])}, "
                f"{escape_sql(p['name'])}, "
                f"{escape_sql(p['description'])}, "
                f"{p['price']}, "
                f"{p.get('supplierPrice', round(p['price']/1.15))}, "
                f"{escape_sql(p.get('currency', 'XOF'))}, "
                f"{p.get('stock', 10)}, "
                f"{escape_sql(p.get('images', []))}, "
                f'(SELECT "id" FROM "Category" WHERE "slug" = \'{c_slug}\' LIMIT 1), '
                f"{escape_sql(p.get('moderation', 'PUBLISHED'))}, "
                f"{escape_sql(p.get('subcategory', 'Autres'))}, "
                f"{escape_sql(p.get('condition', 'NEW'))}, "
                f"{escape_sql(p.get('location', 'Dubaï'))}, "
                f"{p.get('minimumOrder', 1)}, "
                f"{p.get('packSize', 1)}, "
                f"{escape_sql(p.get('unit', 'pièce'))}, "
                f"{escape_sql(p.get('shippingIncluded', False))}, "
                f"{escape_sql(p.get('shippingDestination'))}, "
                f"{escape_sql(p.get('weightKg'))}, "
                f"{escape_sql(p.get('dimensions'))}, "
                f"{escape_sql(p.get('attributes', {}))}, "
                f"NOW()"
                f")"
            )
            rows.append(row)
        
        query = (
            'INSERT INTO "Product" ("id", "name", "description", "price", "supplierPrice", "currency", "stock", "images", "categoryId", "moderation", "subcategory", "condition", "location", "minimumOrder", "packSize", "unit", "shippingIncluded", "shippingDestination", "weightKg", "dimensions", "attributes", "createdAt")\n'
            'VALUES\n' + ',\n'.join(rows) + '\n'
            'ON CONFLICT ("id") DO UPDATE SET "price" = EXCLUDED."price", "supplierPrice" = EXCLUDED."supplierPrice", "stock" = EXCLUDED."stock";\n'
        )
        lines.append(query)
    
    with open(file_name, 'w', encoding='utf-8') as out:
        out.write('\n'.join(lines))
    
    size_kb = os.path.getsize(file_name) / 1024
    print(f"Generated {file_name} ({len(chunk)} products, {size_kb:.1f} KB)")

# Also copy to root Baobab/sql_chunks
baobab_chunks = 'C:/Users/Tresor/Documents/ecommerce/Baobab/sql_chunks'
os.makedirs(baobab_chunks, exist_ok=True)
for f in os.listdir(out_dir):
    shutil.copy2(os.path.join(out_dir, f), os.path.join(baobab_chunks, f))
print('Copied all chunks to Baobab/sql_chunks')

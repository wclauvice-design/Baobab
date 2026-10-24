import json
import re

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

# Collect unique categories
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

# Generate Category Inserts
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

# Partition products
part1 = []
part2 = []
part3 = []

for p in products:
    cat = p.get('category', '')
    univ = p.get('universe', '')
    if univ == 'motors' or cat in ['Voitures & SUV', 'Utilitaires & Pick-up', 'Motos & Tricycles', 'Accessoires Auto', 'Pièces & Pneus']:
        part1.append(p)
    elif cat in ['Téléphones & Tablettes', 'Électroménager', 'Énergie Solaire & Batteries', 'Informatique & PC', 'Téléviseurs & Son']:
        part2.append(p)
    else:
        part3.append(p)

print(f'Part 1 (Motors): {len(part1)} products')
print(f'Part 2 (Tech & Solaire): {len(part2)} products')
print(f'Part 3 (Outillage & Habitat): {len(part3)} products')

def make_product_insert(plist, file_name, prefix_sql=''):
    lines = []
    if prefix_sql:
        lines.append(prefix_sql)
    lines.append('-- Insertion des produits par lots\n')
    
    CHUNK = 50
    for i in range(0, len(plist), CHUNK):
        chunk = plist[i:i+CHUNK]
        rows = []
        for p in chunk:
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
    print(f'Wrote {file_name}')

make_product_insert(part1, 'apps/api/prisma/data/import_part1_categories_and_motors.sql', cat_sql_str)
make_product_insert(part2, 'apps/api/prisma/data/import_part2_tech_solar.sql')
make_product_insert(part3, 'apps/api/prisma/data/import_part3_tools_home.sql')

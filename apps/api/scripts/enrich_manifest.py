import csv
import json
import urllib.parse
import os

data_json = 'apps/api/prisma/data/catalog-massive.json'
manifest_csv = 'apps/api/prisma/data/catalog-images-manifest.csv'
manifest_root = 'C:/Users/Tresor/Documents/ecommerce/Baobab/catalog-images-manifest.csv'

with open(data_json, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Enriching manifest for {len(products)} products...")

rows = []
for p in products:
    p_id = p.get('id', '')
    univ = p.get('universe', '')
    cat = p.get('category', '')
    sub = p.get('subcategory', '')
    brand = p.get('brand', '')
    name = p.get('name', '')
    s_price = p.get('supplierPrice', '')
    price = p.get('price', '')
    unit = p.get('unit', 'pièce')
    pack = p.get('packSize', 1)
    moq = p.get('minimumOrder', 1)
    weight = p.get('weightKg', '')
    cond = p.get('condition', 'NEW')
    loc = p.get('location', 'Dubaï')
    raw_query = p.get('imageSearchQuery', f"{brand} {name}")
    
    # Clean query for search engines
    clean_query = raw_query.replace('(', '').replace(')', '').replace('[', '').replace(']', '').replace('Spécification Golfe / Dubaï', '').replace('Édition Dubaï Export', '').strip()
    encoded = urllib.parse.quote_plus(clean_query)
    
    # Determine best search platform and generate direct clickable URL
    if univ == 'motors' or any(k in cat.lower() for k in ['voiture', 'utilitaire', 'moto', 'pneu', 'auto']):
        platform = "Dubizzle Motors Dubaï"
        direct_url = f"https://dubai.dubizzle.com/motors/used-cars/?keywords={urllib.parse.quote_plus(f'{brand} {name[:35]}')}"
        alt_url = f"https://www.google.com/search?tbm=isch&q={urllib.parse.quote_plus(f'{brand} {name} dubai')}"
    elif any(k in cat.lower() for k in ['solaire', 'batterie', 'groupe', 'motopompe', 'climati', 'soudure']):
        platform = "Dubizzle UAE / Google Images"
        direct_url = f"https://www.google.com/search?tbm=isch&q={urllib.parse.quote_plus(f'{clean_query} dubai export')}"
        alt_url = f"https://dubai.dubizzle.com/classified/?keywords={urllib.parse.quote_plus(clean_query[:35])}"
    else:
        platform = "Temu / Google Images"
        direct_url = f"https://www.temu.com/search_result.html?search_key={urllib.parse.quote_plus(clean_query[:40])}"
        alt_url = f"https://www.google.com/search?tbm=isch&q={urllib.parse.quote_plus(clean_query)}"

    rows.append({
        'Reference_SKU': p_id,
        'Titre_Produit': name,
        'Rayon_Univers': univ,
        'Categorie': cat,
        'Sous_Categorie': sub,
        'Marque': brand,
        'Prix_Fournisseur_FCFA': s_price,
        'Prix_Vente_FCFA_Marge15': price,
        'Commande_Minimale_MOQ': moq,
        'Unite': unit,
        'Condition': cond,
        'Origine_Expedition': loc,
        'Plateforme_Recommandee': platform,
        'Mots_Cles_Recherche': clean_query,
        'Lien_Recherche_Direct_1': direct_url,
        'Lien_Recherche_Secours_Google': alt_url
    })

fieldnames = [
    'Reference_SKU',
    'Titre_Produit',
    'Plateforme_Recommandee',
    'Lien_Recherche_Direct_1',
    'Lien_Recherche_Secours_Google',
    'Mots_Cles_Recherche',
    'Rayon_Univers',
    'Categorie',
    'Sous_Categorie',
    'Marque',
    'Prix_Fournisseur_FCFA',
    'Prix_Vente_FCFA_Marge15',
    'Commande_Minimale_MOQ',
    'Unite',
    'Condition',
    'Origine_Expedition'
]

with open(manifest_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
    writer.writeheader()
    writer.writerows(rows)

import shutil
shutil.copy2(manifest_csv, manifest_root)

print(f"Manifest written successfully with {len(rows)} enriched rows (UTF-8 with BOM for Excel) at {manifest_csv} and {manifest_root}")

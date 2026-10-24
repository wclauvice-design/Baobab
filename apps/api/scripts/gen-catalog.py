import json, csv, random

random.seed(42)

categories = [
  ("Mode & Accessoires", ["Boubou", "Sac a main", "Chaussures", "Montre", "Lunettes", "Ceinture", "Echarpe", "Bijou", "T-shirt", "Jean"]),
  ("Maison & Cuisine", ["Bouilloire", "Mixeur", "Casserole", "Lampe solaire", "Ventilateur", "Draps", "Rideaux", "Tapis", "Assiette", "Verre"]),
  ("Electronique", ["Smartphone", "Ecouteurs TWS", "Power bank", "Tablette", "Enceinte BT", "Chargeur", "Cable USB", "Montre connectee", "Webcam", "Clavier"]),
  ("Beaute & Bien-etre", ["Parfum", "Creme hydratante", "Beurre de karite", "Huile de coco", "Seche-cheveux", "Rasoir", "Maquillage", "Shampoing", "Savon", "Lotion"]),
  ("Electromenager", ["Refrigerateur", "Machine a laver", "Four micro-ondes", "Climatiseur", "Aspirateur", "Fer a repasser", "Grille-pain", "Blender", "Friteuse", "Hotte"]),
  ("Auto & Moto", ["Pneu", "Batterie auto", "Huile moteur", "Ampoule LED", "Tapis de sol", "Couvre-volant", "GPS", "Camera de recul", "Compresseur", "Chaine"]),
  ("Sport & Fitness", ["Tapis de yoga", "Haltere", "Ballon", "Corde a sauter", "Velo", "Tente", "Sac de couchage", "Lampe frontale", "Gourde", "Chaussures running"]),
  ("Bebes & Enfants", ["Poussette", "Siege auto", "Biberon", "Jouet educatif", "Couche", "Vetement bebe", "Trotteur", "Parc bebe", "Mobile musical", "Tapis d'eveil"]),
  ("Bijoux & Montres", ["Collier", "Bracelet", "Bague", "Boucles d'oreilles", "Montre homme", "Montre femme", "Pendentif", "Chevillere", "Broche", "Pin's"]),
  ("Bureau & Fournitures", ["Stylo", "Cahier", "Classeur", "Agrafeuse", "Calculatrice", "Lampe bureau", "Chaise bureau", "Bureau", "Imprimante", "Papier"]),
]

sources = ["Temu", "Dubizzle", "AliExpress", "Amazon", "Jumia"]

products = []
idx = 1
target = 520
while len(products) < target:
    cat, items = random.choice(categories)
    item = random.choice(items)
    variant = random.choice(["Pro", "Premium", "Lite", "Max", "Plus", "Ultra", "Standard", "Deluxe"])
    name = f"{item} {variant}"
    src = random.choice(sources)
    base_usd = random.choice([5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150])
    rate = 600 if src in ("Temu", "Amazon", "AliExpress") else 165
    price_xof = round(base_usd * rate * 1.15)
    products.append({
        "id": f"P{idx:04d}",
        "name": name,
        "description": f"{name} - article importe, haute qualite, adapte au marche africain.",
        "price": price_xof,
        "currency": "XOF",
        "category": cat,
        "source": src,
        "stock": random.choice([10, 15, 20, 25, 30, 50]),
        "images": []
    })
    idx += 1

with open("apps/api/prisma/data/catalog-massive.json", "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

with open("apps/api/prisma/data/catalog-massive-manifest.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id", "name", "category", "source", "price_XOF", "image_filename"])
    for p in products:
        w.writerow([p["id"], p["name"], p["category"], p["source"], p["price"], f"{p['id']}.jpg"])

print("generated", len(products))

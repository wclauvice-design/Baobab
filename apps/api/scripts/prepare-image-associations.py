"""Build a resumable, SKU-keyed image sourcing queue without changing products.

Usage: python apps/api/scripts/prepare-image-associations.py
Optional: --selections path.json supplies visually verified image selections.
No network access and no database writes. Existing product images are preserved.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path
from urllib.parse import urlencode, urlparse

DATA = Path(__file__).resolve().parents[1] / "prisma" / "data"
ROLES = {"principal": 0, "avant": 1, "profil": 2, "arriere": 3,
         "interieur": 4, "detail": 5, "accessoires": 6, "dimensions": 7}


def prepare(products, manifest, selections):
    by_id = {p["id"]: p for p in products}
    if len(by_id) != len(products):
        raise ValueError("Duplicate product IDs")
    sources = {r["Reference_SKU"]: r for r in manifest}
    if len(sources) != len(manifest) or set(sources) != set(by_id):
        raise ValueError("Manifest and catalogue SKUs do not match exactly")
    chosen = {}
    for selection in selections:
        sku = selection["sku"]
        if sku not in by_id or sku in chosen:
            raise ValueError(f"Unknown or repeated SKU: {sku}")
        product = by_id[sku]
        if selection.get("productName") != product["name"]:
            raise ValueError(f"Product changed or incorrect match: {sku}")
        images = selection.get("images", [])
        if not images:
            raise ValueError(f"Empty selection: {sku}")
        seen = set()
        for item in images:
            url = item["url"]
            parsed = urlparse(url)
            if parsed.scheme != "https" or not parsed.netloc or parsed.username:
                raise ValueError(f"Invalid image URL: {sku}")
            if item.get("role") not in ROLES:
                raise ValueError(f"Unknown gallery role: {sku}")
            if item.get("visuallyVerified") is not True or item.get("exactVariant") is not True:
                raise ValueError(f"Image/model/colour not verified: {sku}")
            if not item.get("sourcePage", "").startswith("https://"):
                raise ValueError(f"Missing image provenance: {sku}")
            if url in seen:
                raise ValueError(f"Duplicate image: {sku}")
            seen.add(url)
        if sum(i["role"] == "principal" for i in images) != 1:
            raise ValueError(f"Exactly one principal image required: {sku}")
        chosen[sku] = sorted(images, key=lambda i: ROLES[i["role"]])

    queue, patches = [], []
    for product in products:
        sku = product["id"]
        source = sources[sku]
        images = chosen.get(sku, [])
        # Never infer image count from stock, MOQ or package quantity.
        existing = product.get("images", [])
        queue.append({
            "sku": sku, "productName": product["name"],
            "category": product.get("category"), "brand": product.get("brand"),
            "variant": product.get("attributes", {}),
            "searchUrl": "https://www.google.com/search?" + urlencode({"tbm": "isch", "q": product["name"]}),
            "originalSourceSearch": source["Lien_Recherche_Direct_1"],
            "status": "verified" if images else "existing_images" if existing else "awaiting_source_images",
            "verifiedImageCount": len(images), "existingImageCount": len(existing),
            "gallery": [{**image, "position": n, "filenameStem": f"{sku}-{n:02d}"}
                        for n, image in enumerate(images, 1)],
        })
        if images:
            # Plan only: replacement is explicit, and the old array is retained
            # for a compare-before-write check and a recoverable rollback.
            patches.append({"id": sku, "expectedName": product["name"],
                            "expectedImages": existing,
                            "images": [i["url"] for i in images]})
    return queue, patches


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--selections", type=Path)
    parser.add_argument("--output", type=Path, default=DATA / "image-associations")
    args = parser.parse_args()
    catalog_path = DATA / "catalog-massive.json"
    products = json.loads(catalog_path.read_text(encoding="utf-8-sig"))
    with (DATA / "catalog-images-manifest.csv").open(encoding="utf-8-sig", newline="") as stream:
        manifest = list(csv.DictReader(stream, delimiter=";"))
    selections = json.loads(args.selections.read_text(encoding="utf-8")) if args.selections else []
    queue, patches = prepare(products, manifest, selections)
    args.output.mkdir(parents=True, exist_ok=True)
    report = {"catalogueSha256": hashlib.sha256(catalog_path.read_bytes()).hexdigest(),
              "products": len(queue), "verifiedProducts": len(patches),
              "verifiedImages": sum(x["verifiedImageCount"] for x in queue),
              "pendingProducts": sum(x["status"] == "awaiting_source_images" for x in queue),
              "galleryOrder": list(ROLES), "productionModified": False}
    for name, payload in [("queue.json", queue), ("image-patches.json", patches), ("report.json", report)]:
        (args.output / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()

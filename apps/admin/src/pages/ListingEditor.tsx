import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Alert, money } from "./Operations";
export function ListingEditor() {
  const { user } = useAuth(),
    admin = user?.role === "ADMIN";
  const [products, setProducts] = useState<any[]>([]),
    [categories, setCategories] = useState<any[]>([]),
    [config, setConfig] = useState<any>(null),
    [editing, setEditing] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("");
  async function load() {
    try {
      const [p, c, s] = await Promise.all([
        api.get<any[]>("/products/mine"),
        api.get<any[]>("/categories"),
        api.get("/concierge/config"),
      ]);
      setProducts(p);
      setCategories(c);
      setConfig(s);
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const body: any = {};
      for (const name of [
        "name",
        "description",
        "categoryId",
        "subcategory",
        "condition",
        "location",
        "unit",
        "shippingDestination",
        "dimensions",
      ])
        body[name] = fd.get(name) || "";
      for (const name of [
        "price",
        "supplierPrice",
        "stock",
        "minimumOrder",
        "packSize",
      ])
        body[name] = Number(fd.get(name) || (name === "minimumOrder" || name === "packSize" ? 1 : 0));
      if (!admin) body.price = body.supplierPrice;
      body.shippingIncluded = fd.get("shippingIncluded") === "on";
      body.images = String(fd.get("images") || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (fd.get("weightKg")) body.weightKg = Number(fd.get("weightKg"));
      body.attributes = Object.fromEntries(
        String(fd.get("attributes") || "")
          .split("\n")
          .filter((s) => s.trim())
          .map((s) => {
            const i = s.indexOf(":");
            if (i < 1)
              throw new Error(
                "Caractéristiques : une ligne « Nom : valeur » par caractéristique.",
              );
            return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
          }),
      );
      const saved = editing?.id
        ? await api.patch<any>(`/products/${editing.id}`, body)
        : await api.post<any>("/products", body);
      const files = fd
        .getAll("photos")
        .filter((f): f is File => f instanceof File && f.size > 0);
      for (const file of files)
        await api.upload(`/products/${saved.id}/images`, file);
      setEditing(null);
      setError(
        "Annonce enregistrée" +
          (!admin ? " et transmise à Baobab pour validation." : "."),
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function moderate(e: FormEvent<HTMLFormElement>, p: any) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api.patch(`/products/${p.id}/moderation`, Object.fromEntries(fd));
      await load();
      setError("Modération enregistrée.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ops">
      <header>
        <div>
          <p className="op-kicker">ANNONCES & STOCK</p>
          <h1>{admin ? "Catalogue & modération" : "Mes annonces"}</h1>
        </div>
        <button className="op-button" onClick={() => setEditing({})}>
          Ajouter une annonce
        </button>
      </header>
      <p>
        {admin
          ? "Fixez le prix public et validez les annonces des commerçants."
          : "Indiquez votre prix net fournisseur. Baobab valide l’annonce, fixe son prix public et gère les échanges avec les clients."}
      </p>
      <Alert>{error}</Alert>
      {editing && (
        <section className="op-card">
          <header>
            <h2>{editing.id ? "Modifier l’annonce" : "Nouvelle annonce"}</h2>
            <button onClick={() => setEditing(null)}>Fermer</button>
          </header>
          <form key={editing.id || "new"} className="op-form" onSubmit={submit}>
            <label className="op-span">
              Titre
              <input
                name="name"
                required
                minLength={2}
                defaultValue={editing.name}
              />
            </label>
            <label>
              Univers
              <select
                name="categoryId"
                required
                defaultValue={editing.categoryId || ""}
              >
                <option value="">Choisir un univers…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sous-catégorie
              <select
                name="subcategory"
                defaultValue={editing.subcategory || "Autres"}
              >
                <option>Autres</option>
                {config?.universes
                  .flatMap((u: any) => u.categories)
                  .map((c: string) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
            </label>
            <label>
              État
              <select
                name="condition"
                defaultValue={editing.condition || "NEW"}
              >
                <option value="NEW">Neuf</option>
                <option value="USED">Occasion</option>
                <option value="REFURBISHED">Reconditionné</option>
              </select>
            </label>
            <label>
              Localisation
              <input
                name="location"
                defaultValue={editing.location || "Dubaï"}
                required
              />
            </label>
            <label>
              Prix net fournisseur par unité (FCFA)
              <input
                name="supplierPrice"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={editing.supplierPrice ?? editing.price ?? 0}
              />
            </label>
            {admin && (
              <label>
                Prix public par unité (FCFA)
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={editing.price ?? 0}
                />
              </label>
            )}
            <label>
              Stock en unités
              <input
                name="stock"
                type="number"
                min="0"
                required
                defaultValue={editing.stock ?? 0}
              />
            </label>
            <label>
              Unité de vente
              <input
                name="unit"
                required
                defaultValue={editing.unit || "pièce"}
              />
            </label>
            <label>
              Minimum de commande (facultatif)
              <input
                name="minimumOrder"
                type="number"
                min="1"
                placeholder="Aucun minimum supplémentaire"
                defaultValue={editing.minimumOrder > 1 ? editing.minimumOrder : ""}
              />
            </label>
            <label>
              Multiple de conditionnement (ex. 100 pièces par carton)
              <input
                name="packSize"
                type="number"
                min="1"
                required
                defaultValue={editing.packSize || 1}
              />
            </label>
            <label>
              Poids par unité (kg, facultatif)
              <input
                name="weightKg"
                type="number"
                step="0.001"
                min="0"
                defaultValue={editing.weightKg || ""}
              />
            </label>
            <label>
              Dimensions (facultatif)
              <input
                name="dimensions"
                defaultValue={editing.dimensions || ""}
              />
            </label>
            <label className="op-check">
              <input
                type="checkbox"
                name="shippingIncluded"
                defaultChecked={editing.shippingIncluded}
              />
              Livraison incluse pour la destination indiquée
            </label>
            <label>
              Destination couverte (si incluse)
              <input
                name="shippingDestination"
                defaultValue={editing.shippingDestination || ""}
              />
            </label>
            <label className="op-span">
              Description
              <textarea
                name="description"
                required
                rows={4}
                defaultValue={editing.description}
              />
            </label>
            <label>
              Caractéristiques (une par ligne, « Marque : Samsung »)
              <textarea
                name="attributes"
                rows={4}
                defaultValue={Object.entries(editing.attributes || {})
                  .map(([k, v]) => `${k} : ${v}`)
                  .join("\n")}
              />
            </label>
            <label>
              URLs de photos HTTPS (une par ligne)
              <textarea
                name="images"
                rows={4}
                defaultValue={editing.images?.join("\n")}
              />
            </label>
            <label>
              Ajouter des photos (5 Mo maximum par image)
              <input
                type="file"
                name="photos"
                accept="image/jpeg,image/png,image/webp"
                multiple
              />
            </label>
            <button className="op-button" disabled={busy}>
              {busy
                ? "Enregistrement…"
                : admin
                  ? "Enregistrer"
                  : "Soumettre à Baobab"}
            </button>
          </form>
        </section>
      )}
      <div className="op-row">
        <label>
          Filtrer
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Toutes les annonces</option>
            {[
              ["PENDING", "À modérer"],
              ["PUBLISHED", "Publiées"],
              ["REJECTED", "À corriger"],
              ["ARCHIVED", "Archivées"],
              ["SOLD", "Vendues"],
            ].map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <p>
          {products.filter((p) => !filter || p.moderation === filter).length}{" "}
          annonces
        </p>
      </div>
      <div className="op-listings">
        {products
          .filter((p) => !filter || p.moderation === filter)
          .map((p) => (
            <article className="op-card" key={p.id}>
              <div className="op-listing-title">
                {p.images?.[0] && <img src={p.images[0]} alt="" />}
                <div>
                  <h2>{p.name}</h2>
                  <p>
                    {p.seller?.shopName || "Baobab"} · {p.category?.name}
                  </p>
                  <span className="op-pill">
                    {(
                      {
                        PENDING: "À modérer",
                        PUBLISHED: "Publiée",
                        REJECTED: "À corriger",
                        ARCHIVED: "Archivée",
                        SOLD: "Vendue",
                      } as any
                    )[p.moderation] || p.moderation}
                  </span>
                </div>
              </div>
              <p>
                Net fournisseur : <b>{money(p.supplierPrice ?? p.price)}</b> /{" "}
                {p.unit}
                <br />
                Prix public : {money(p.price)}
                <br />
                Minimum : {p.minimumOrder} · Multiple : {p.packSize} · Stock :{" "}
                {p.stock}
              </p>
              {p.moderationNote && <Alert>{p.moderationNote}</Alert>}
              <button
                className="op-button secondary"
                onClick={() => {
                  setEditing(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Modifier
              </button>
              {admin && (
                <details>
                  <summary>Modérer et fixer le prix</summary>
                  <form className="op-stack" onSubmit={(e) => moderate(e, p)}>
                    <label>
                      Décision
                      <select name="moderation" defaultValue={p.moderation}>
                        {[
                          ["PUBLISHED", "Publier"],
                          ["PENDING", "En attente"],
                          ["REJECTED", "Demander une correction"],
                          ["ARCHIVED", "Archiver"],
                          ["SOLD", "Vendu"],
                          ["DRAFT", "Brouillon"],
                        ].map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Prix public FCFA
                      <input
                        type="number"
                        min={p.supplierPrice ?? p.price}
                        step="0.01"
                        name="publicPrice"
                        defaultValue={p.price}
                        required
                      />
                    </label>
                    <label>
                      Note pour le commerçant
                      <textarea
                        name="note"
                        defaultValue={p.moderationNote || ""}
                      />
                    </label>
                    <button className="op-button" disabled={busy}>
                      Appliquer
                    </button>
                  </form>
                </details>
              )}
            </article>
          ))}
      </div>
    </div>
  );
}

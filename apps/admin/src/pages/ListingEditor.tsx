import { FormEvent, useEffect, useState } from "react";
import { api, replaceProductImage, addProductImages, removeProductImage, setProductMainImage } from "../lib/api";
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
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [busyMessage, setBusyMessage] = useState<string>("");

  async function handleRowReplace(productId: string, oldUrl: string, file: File) {
    if (!file) return;
    setBusyProductId(productId);
    setBusyMessage("Remplacement...");
    try {
      const newImages = await replaceProductImage(productId, oldUrl, file);
      if (editing && editing.id === productId) {
        setEditing({ ...editing, images: newImages });
      }
      await load();
    } catch (e: any) {
      alert("Erreur remplacement photo : " + (e?.message || e));
    } finally {
      setBusyProductId(null);
      setBusyMessage("");
    }
  }

  async function handleRowAddMultiple(productId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusyProductId(productId);
    setBusyMessage(`Ajout de ${files.length} photo(s)...`);
    try {
      const newImages = await addProductImages(productId, Array.from(files));
      if (editing && editing.id === productId) {
        setEditing({ ...editing, images: newImages });
      }
      await load();
    } catch (e: any) {
      alert("Erreur ajout photos : " + (e?.message || e));
    } finally {
      setBusyProductId(null);
      setBusyMessage("");
    }
  }

  async function handleRowAddByUrl(productId: string) {
    const url = window.prompt("Collez l'URL de l'image (Temu, Dubizzle, WhatsApp ou web) :");
    if (!url || !url.trim()) return;
    setBusyProductId(productId);
    setBusyMessage("Ajout par URL...");
    try {
      const newImages = await addProductImages(productId, [url.trim()]);
      if (editing && editing.id === productId) {
        setEditing({ ...editing, images: newImages });
      }
      await load();
    } catch (e: any) {
      alert("Erreur ajout URL : " + (e?.message || e));
    } finally {
      setBusyProductId(null);
      setBusyMessage("");
    }
  }

  async function handleRowSetMain(productId: string, url: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    try {
      const newImages = await setProductMainImage(productId, url);
      if (editing && editing.id === productId) {
        setEditing({ ...editing, images: newImages });
      }
      await load();
    } catch (e: any) {
      alert("Erreur photo principale : " + (e?.message || e));
    }
  }

  async function handleRowDeletePhoto(productId: string, url: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!confirm("Voulez-vous supprimer cette photo ?")) return;
    try {
      const newImages = await removeProductImage(productId, url);
      if (editing && editing.id === productId) {
        setEditing({ ...editing, images: newImages });
      }
      await load();
    } catch (e: any) {
      alert("Erreur suppression photo : " + (e?.message || e));
    }
  }
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
      {!admin ? (
        <div style={{
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          borderRadius: "10px",
          padding: "10px 14px",
          margin: "12px 0 16px 0",
          fontSize: "12.5px",
          color: "#fde68a",
          lineHeight: 1.4
        }}>
          💡 <strong>Publication simplifiée :</strong> Renseignez simplement le titre, l'univers, le prix et les photos. Le poids, les dimensions et les réglages de transport sont <em>facultatifs</em> : l'administrateur Baobab les complètera pour vous lors de la vérification !
        </div>
      ) : (
        <div style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: "10px",
          padding: "10px 14px",
          margin: "12px 0 16px 0",
          fontSize: "12.5px",
          color: "#6ee7b7",
          lineHeight: 1.4
        }}>
          ⚡ <strong>Mode Administrateur :</strong> Vos annonces sont publiées immédiatement sous la boutique <strong>« Baobab Dubaï Officiel »</strong>. Pour les annonces des commerçants, vous pouvez renseigner le poids (kg) et le cubage avant approbation.
        </div>
      )}
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
              Poids par unité (kg, facultatif — complété par l'admin si omis)
              <input
                name="weightKg"
                type="number"
                step="0.001"
                min="0"
                placeholder="Ex: 0.25 (smartphone), 15 (solaire), 2200 (véhicule)"
                defaultValue={editing.weightKg || ""}
              />
            </label>
            <label>
              Dimensions L x l x h en cm (facultatif — pour cubage maritime)
              <input
                name="dimensions"
                placeholder="Ex: 30x20x10"
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
            {editing.id && (
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                padding: "14px",
                margin: "10px 0 16px 0",
                gridColumn: "1 / -1",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Galerie photos ({editing.images?.length || 0} photo{editing.images?.length > 1 ? "s" : ""})
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--admin-muted, #94a3b8)" }}>
                    Survolez une photo pour la <strong>Remplacer (🔄)</strong>, la <strong>Supprimer (✕)</strong> ou la mettre en <strong>1ère (★)</strong>
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                  {editing.images && editing.images.map((imgUrl: string, idx: number) => (
                    <div
                      key={idx}
                      className="group"
                      style={{
                        position: "relative",
                        width: "72px",
                        height: "72px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.2)",
                        backgroundColor: "rgba(0,0,0,0.3)",
                      }}
                    >
                      <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {idx === 0 && (
                        <span style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "rgba(0,0,0,0.85)",
                          color: "#f59e0b",
                          fontSize: "8px",
                          fontWeight: 800,
                          textAlign: "center",
                          padding: "1px 0"
                        }}>
                          ★ 1ère
                        </span>
                      )}

                      <div
                        className="hover-overlay"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0,0,0,0.7)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "3px",
                          opacity: 0,
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <label
                            title="Remplacer cette photo"
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              background: "#2563eb",
                              color: "#fff",
                              fontSize: "11px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            🔄
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleRowReplace(editing.id, imgUrl, f);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={(e) => handleRowDeletePhoto(editing.id, imgUrl, e)}
                            title="Supprimer cette photo"
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              background: "#dc2626",
                              color: "#fff",
                              fontSize: "11px",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleRowSetMain(editing.id, imgUrl, e)}
                            title="Définir comme photo principale"
                            style={{
                              width: "100%",
                              borderRadius: "4px",
                              background: "#f59e0b",
                              color: "#000",
                              fontWeight: 800,
                              fontSize: "8px",
                              border: "none",
                              padding: "2px 0",
                              cursor: "pointer",
                            }}
                          >
                            ★ Mettre en 1ère
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <label
                    style={{
                      height: "72px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px dashed rgba(16, 185, 129, 0.5)",
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      color: "#34d399",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      gap: "2px",
                    }}
                  >
                    <span>+ Ajouter</span>
                    <span style={{ fontSize: "9px", fontWeight: 400, opacity: 0.8 }}>fichiers</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        handleRowAddMultiple(editing.id, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRowAddByUrl(editing.id)}
                    style={{
                      height: "72px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px dashed rgba(255,255,255,0.25)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: "var(--admin-text, #e2e8f0)",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      gap: "2px",
                    }}
                  >
                    <span>🔗 Par lien</span>
                    <span style={{ fontSize: "9px", fontWeight: 400, opacity: 0.7 }}>Temu/Dubizzle</span>
                  </button>
                </div>
              </div>
            )}
            <label>
              URLs de photos HTTPS (une par ligne)
              <textarea
                name="images"
                rows={4}
                defaultValue={editing.images?.join("\n")}
              />
            </label>
            <label>
              Ajouter des photos (2 à 20 photos par produit, 5 Mo max par image)
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
                {p.images?.[0] && (
                  <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0, borderRadius: "10px", overflow: "hidden" }}>
                    <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", bottom: 0, insetInline: 0, background: "rgba(0,0,0,0.85)", color: "#f59e0b", fontSize: "7px", fontWeight: 800, textAlign: "center", padding: "1px 0" }}>
                      ★ Couverture
                    </span>
                  </div>
                )}
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

              {/* Photo Gallery & Quick Controls per product */}
              <div style={{ margin: "12px 0 8px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--admin-muted, #94a3b8)" }}>
                    Photos ({p.images?.length || 0})
                  </span>
                  {busyProductId === p.id && (
                    <span style={{ fontSize: "10.5px", fontWeight: 600, color: "#10b981" }}>
                      {busyMessage || "Envoi..."}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                  {p.images && p.images.length > 0 ? (
                    p.images.map((imgUrl: string, idx: number) => (
                      <div
                        key={idx}
                        className="group"
                        style={{
                          position: "relative",
                          width: "52px",
                          height: "52px",
                          borderRadius: "7px",
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.15)",
                          backgroundColor: "rgba(0,0,0,0.2)",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />

                        {idx === 0 && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: "rgba(0,0,0,0.85)",
                              color: "#f59e0b",
                              fontSize: "7px",
                              fontWeight: 800,
                              textAlign: "center",
                              padding: "1px 0",
                            }}
                          >
                            ★ 1ère
                          </span>
                        )}

                        <div
                          className="hover-overlay"
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "rgba(0,0,0,0.65)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "2px",
                            opacity: 0,
                            transition: "opacity 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label
                              title="Remplacer cette photo"
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                background: "#2563eb",
                                color: "#fff",
                                fontSize: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              🔄
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                style={{ display: "none" }}
                                disabled={busyProductId === p.id}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleRowReplace(p.id, imgUrl, f);
                                  e.target.value = "";
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={(e) => handleRowDeletePhoto(p.id, imgUrl, e)}
                              title="Supprimer cette photo"
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                background: "#dc2626",
                                color: "#fff",
                                fontSize: "10px",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              ✕
                            </button>
                          </div>

                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleRowSetMain(p.id, imgUrl, e)}
                              title="Mettre en photo principale (1ère)"
                              style={{
                                width: "100%",
                                borderRadius: "3px",
                                background: "#f59e0b",
                                color: "#000",
                                fontWeight: 800,
                                fontSize: "7px",
                                border: "none",
                                padding: "1px 0",
                                cursor: "pointer",
                              }}
                            >
                              ★ 1ère
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        height: "52px",
                        width: "52px",
                        borderRadius: "7px",
                        border: "1px dashed rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        color: "var(--admin-muted, #94a3b8)",
                        textAlign: "center",
                        padding: "2px",
                      }}
                    >
                      Sans photo
                    </div>
                  )}

                  {/* Add buttons */}
                  <label
                    title="Ajouter une ou plusieurs photos"
                    style={{
                      height: "52px",
                      padding: "0 8px",
                      borderRadius: "7px",
                      border: "1px dashed rgba(16, 185, 129, 0.5)",
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      color: "#34d399",
                      fontSize: "10px",
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      gap: "2px",
                    }}
                  >
                    <span>+ Photos</span>
                    <span style={{ fontSize: "8px", fontWeight: 400, opacity: 0.8 }}>local</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      disabled={busyProductId === p.id}
                      onChange={(e) => {
                        handleRowAddMultiple(p.id, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRowAddByUrl(p.id)}
                    title="Ajouter une photo par lien URL (Temu, Dubizzle, WhatsApp)"
                    style={{
                      height: "52px",
                      padding: "0 8px",
                      borderRadius: "7px",
                      border: "1px dashed rgba(255,255,255,0.25)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: "var(--admin-text, #e2e8f0)",
                      fontSize: "10px",
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      gap: "2px",
                    }}
                  >
                    <span>🔗 Lien</span>
                    <span style={{ fontSize: "8px", fontWeight: 400, opacity: 0.7 }}>URL web</span>
                  </button>
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

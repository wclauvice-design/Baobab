import { FormEvent, useEffect, useState } from "react";
import { isVehicleProduct } from "../lib/vehicles";
import { api, replaceProductImage, addProductImages, removeProductImage, setProductMainImage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toXof, fromXof, formatXof, MERCHANT_DEFAULT_CURRENCY, PRICING_CURRENCIES } from "../lib/format";
import { MediaDropzone } from "../components/MediaDropzone";
import { CategoryMultiSelect } from "../components/CategoryMultiSelect";
import {
  canonicalCategoryIds,
  canonicalSubcategoryLabels,
  isVehicleSelection,
  subcategoryOptionsForCategory,
  taxonomyCategoryOptions,
  taxonomySubcategoryOptions,
  withLegacyCategoryOptions,
} from "../lib/taxonomy";
import { MEDIA_ACCEPT, isVideoUrl } from "../lib/media";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [priceCurrency, setPriceCurrency] = useState<string>(admin ? "XOF" : MERCHANT_DEFAULT_CURRENCY);
  const [supplierAmount, setSupplierAmount] = useState<string>("");
  const [publicAmount, setPublicAmount] = useState<string>("");
  const [formFiles, setFormFiles] = useState<File[]>([]);

  async function deleteListing(product: any) {
    if (!admin || deletingId) return;
    if (!window.confirm(`Supprimer définitivement « ${product.name} » ?\n\nL’annonce et ses avis seront supprimés. Cette action est irréversible. Les annonces liées à une commande ne peuvent pas être supprimées.`)) return;
    setDeletingId(product.id);
    setError("");
    try {
      await api.delete(`/products/${product.id}`);
      setProducts((items) => items.filter((item) => item.id !== product.id));
      if (editing?.id === product.id) setEditing(null);
    } catch (e: any) {
      setError(e.message || "La suppression a échoué.");
    } finally {
      setDeletingId(null);
    }
  }

  // Smart Automotive Form State
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formSubcategories, setFormSubcategories] = useState<string[]>([]);
  const [formCondition, setFormCondition] = useState<string>("NEW");

  const [vehBrand, setVehBrand] = useState("");
  const [vehModel, setVehModel] = useState("");
  const [vehTrim, setVehTrim] = useState("");
  const [vehYear, setVehYear] = useState("2024");
  const [vehMileage, setVehMileage] = useState("0 km");
  const [vehFuel, setVehFuel] = useState("Essence (Petrol)");
  const [vehTransmission, setVehTransmission] = useState("Automatique");
  const [vehDrivetrain, setVehDrivetrain] = useState("4x4 Tout-Terrain");
  const [vehEngine, setVehEngine] = useState("");
  const [vehSeats, setVehSeats] = useState("7 Places");
  const [vehExtColor, setVehExtColor] = useState("");
  const [vehIntColor, setVehIntColor] = useState("Cuir Beige");
  const [vehRegionalSpecs, setVehRegionalSpecs] = useState("GCC Specs (Dubaï)");
  const [vehSteering, setVehSteering] = useState("Volant à gauche (LHD)");
  const [vehEquipments, setVehEquipments] = useState<string[]>([]);

  // Update vehicle states when editing changes
  useEffect(() => {
    setFormFiles([]);
    if (!editing) {
      setPriceCurrency(admin ? "XOF" : MERCHANT_DEFAULT_CURRENCY);
      setSupplierAmount("");
      setPublicAmount("");
      setFormCategoryIds([]);
      setFormSubcategories([]);
      return;
    }
    const initialCategoryIds =
      Array.isArray(editing.categoryIds) && editing.categoryIds.length
        ? editing.categoryIds
        : [editing.categoryId].filter(Boolean);
    const initialSubcategories =
      Array.isArray(editing.subcategories) && editing.subcategories.length
        ? editing.subcategories
        : [editing.subcategory].filter(Boolean);
    setFormCategoryIds(canonicalCategoryIds(config?.taxonomy, initialCategoryIds));
    setFormSubcategories(
      canonicalSubcategoryLabels(config?.taxonomy, initialSubcategories),
    );
    setFormCondition(editing.condition || "NEW");

    const attrs = editing.attributes || {};
    setVehBrand(attrs["Marque"] || (/toyota/i.test(editing.name) ? "Toyota" : /jetour/i.test(editing.name) ? "Jetour" : ""));
    setVehModel(attrs["Modèle"] || "");
    setVehTrim(attrs["Trim"] || attrs["Finition"] || "");
    setVehYear(attrs["Année"] ? String(attrs["Année"]).match(/\b(201\d|202\d)\b/)?.[1] || attrs["Année"] : "2024");
    setVehMileage(attrs["Kilométrage"] || (editing.condition === "USED" ? "25 000 km" : "0 km"));
    setVehFuel(attrs["Carburant"] || (editing.name?.includes("Diesel") ? "Diesel" : "Essence (Petrol)"));
    setVehTransmission(attrs["Boîte"] || (editing.name?.includes("Manuelle") ? "Manuelle" : "Automatique"));
    setVehDrivetrain(attrs["Motricité"] || "4x4 Tout-Terrain");
    setVehEngine(attrs["Moteur"] || "");
    setVehSeats(attrs["Places"] || (editing.name?.includes("7 Places") ? "7 Places" : "5 Places"));
    setVehExtColor(attrs["Couleur extérieure"] || "");
    setVehIntColor(attrs["Couleur intérieure"] || "Cuir Beige");
    setVehRegionalSpecs(attrs["Spécifications"] || "GCC Specs (Dubaï)");
    setVehSteering(attrs["Direction"] || "Volant à gauche (LHD)");
    setVehEquipments(
      attrs["Équipements"]
        ? String(attrs["Équipements"]).split(",").map((s: string) => s.trim())
        : ["Climatisation Tropicalisée", "Écran Tactile & Apple CarPlay", "Caméra de recul", "4x4 Sélecteur de terrain"]
    );

    const storedCurrency = attrs["sourceCurrency"] || (admin ? "XOF" : MERCHANT_DEFAULT_CURRENCY);
    setPriceCurrency(storedCurrency);
    setSupplierAmount(
      attrs["sourcePrice"]
        ? String(attrs["sourcePrice"])
        : String(fromXof(Number(editing.supplierPrice ?? editing.price ?? 0), storedCurrency))
    );
    setPublicAmount(String(fromXof(Number(editing.price ?? 0), storedCurrency)));
  }, [editing]);

  const isVehCategory =
    isVehicleSelection(config?.taxonomy, formCategoryIds, formSubcategories) &&
    !formSubcategories.some((sub) => /pièce|piece|accessoire/i.test(sub));

  const categoryOptions = (() => {
    const canonical = taxonomyCategoryOptions(config?.taxonomy);
    if (canonical.length) return canonical;
    return categories.map((c) => ({
      value: c.id,
      label: c.name,
    }));
  })();

  const allSubcategoryOptions = taxonomySubcategoryOptions(config?.taxonomy);

  const subcategoryOptions = (() => {
    if (config?.taxonomy) {
      const scoped = formCategoryIds.length
        ? subcategoryOptionsForCategory(config.taxonomy, formCategoryIds)
        : [];
      if (scoped.length) return scoped;
      if (allSubcategoryOptions.length) return allSubcategoryOptions;
    }
    const map = new Map<string, { value: string; label: string; group?: string }>();
    for (const universe of config?.universes || []) {
      for (const name of universe.categories || []) {
        if (!map.has(name)) {
          map.set(name, { value: name, label: name, group: universe.name });
        }
      }
    }
    return Array.from(map.values());
  })();

  function handleAutoFillVehicleDetails() {
    const brand = vehBrand || "Toyota";
    const model = vehModel || "Land Cruiser Prado";
    const trim = vehTrim ? ` ${vehTrim}` : "";
    const year = vehYear || "2024";
    const engine = vehEngine || "V6 4.0L";
    const fuel = vehFuel || "Essence";
    const seats = vehSeats || "7 Places";

    const autoTitle = `${brand} ${model}${trim} ${year} — ${engine} ${fuel} ${seats} (${vehRegionalSpecs})`;
    const autoDesc = `Véhicule d'exception importé directement de Dubaï. Spécifications GCC tropicalisées avec système de refroidissement renforcé pour les fortes chaleurs d'Afrique de l'Ouest.\n\nCaractéristiques principales :\n- Marque : ${brand}\n- Modèle : ${model}${trim}\n- Année : ${year}\n- Kilométrage : ${vehMileage}\n- Boîte de vitesses : ${vehTransmission}\n- Carburant : ${fuel}\n- Motricité : ${vehDrivetrain}\n- Nombre de places : ${seats}\n- Conduite : ${vehSteering}\n- Équipements inclus : ${vehEquipments.join(", ")}.\n\nExpédition sécurisée par Baobab : fret maritime Dubaï Port Jebel Ali vers Cotonou/Lomé/Abidjan puis convoyage sous douane vers Ouagadougou. Assistance dédouanement et immatriculation incluse.`;

    // Update form elements
    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
    if (nameInput) nameInput.value = autoTitle;

    const descTextarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
    if (descTextarea) descTextarea.value = autoDesc;
  }

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

  async function handleRowAddByUrl(productId: string, providedUrl?: string) {
    const url =
      providedUrl ??
      window.prompt("Collez l'URL de l'image ou de la vidéo (Temu, Dubizzle, WhatsApp ou web) :");
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
        "condition",
        "location",
        "unit",
        "shippingDestination",
        "dimensions",
      ])
        body[name] = fd.get(name) || "";
      if (!formCategoryIds.length) {
        throw new Error("Sélectionnez au moins une catégorie.");
      }
      body.categoryId = formCategoryIds[0];
      body.categoryIds = formCategoryIds;
      body.subcategory = formSubcategories[0] || "Autres";
      body.subcategories = formSubcategories.length
        ? formSubcategories
        : ["Autres"];
      for (const name of ["stock", "minimumOrder", "packSize"])
        body[name] = Number(fd.get(name) || (name === "minimumOrder" || name === "packSize" ? 1 : 0));
      // Prix saisis dans la devise du commerçant (AED par défaut), convertis en XOF côté serveur
      const supplierInput = Number(fd.get("supplierPrice") || 0);
      const publicInput = Number(fd.get("price") || 0);
      body.supplierPrice = toXof(supplierInput, priceCurrency);
      body.price = admin ? toXof(publicInput, priceCurrency) : body.supplierPrice;
      body.sourcePrice = supplierInput;
      body.sourceCurrency = priceCurrency;
      if (admin) body.sourcePublicPrice = publicInput;
      body.shippingIncluded = fd.get("shippingIncluded") === "on";

      // If category is a vehicle, enrich with smart automotive specs
      if (isVehCategory) {
        body.condition = formCondition;
        body.unit = "véhicule";
        if (!body.weightKg) {
          body.weightKg = vehModel.toLowerCase().includes("prado") || vehModel.toLowerCase().includes("cruiser") ? 2200 : 1850;
        }
        body.attributes = {
          "Marque": vehBrand || "Toyota",
          "Modèle": vehModel || "Véhicule",
          "Trim": vehTrim || "Standard",
          "Année": vehYear,
          "Kilométrage": vehMileage,
          "Carburant": vehFuel,
          "Boîte": vehTransmission,
          "Motricité": vehDrivetrain,
          "Moteur": vehEngine || "Moteur Tropicalisé",
          "Places": vehSeats,
          "Couleur extérieure": vehExtColor || "Origine",
          "Couleur intérieure": vehIntColor || "Cuir Beige",
          "Spécifications": vehRegionalSpecs,
          "Direction": vehSteering,
          "Garantie": "1 an constructeur / Assistance Baobab",
          "Équipements": vehEquipments.join(", "),
          "Marge Baobab": "+15% appliquée",
          "Source": "Temu / Dubizzle Export",
          "Expédition": "Fret maritime (25-35j) vers Cotonou/Lomé/Abidjan + convoi Ouagadougou",
          ...(body.attributes || {}),
        };
      }
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
      if (saved?.id && formFiles.length > 0) {
        await addProductImages(saved.id, formFiles);
      }
      setFormFiles([]);
      setEditing(null);
      setError(
        "Annonce enregistrée" +
          (!admin ? " et transmise à Baobab pour validation." : "."),
      );
      await load();
      window.dispatchEvent(new Event("baobab:refresh-counts"));
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
      window.dispatchEvent(new Event("baobab:refresh-counts"));
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
            <div className="op-span">
              <CategoryMultiSelect
                dark
                label="Catégories (une ou plusieurs)"
                placeholder="Rechercher une catégorie…"
                options={withLegacyCategoryOptions(
                  categoryOptions,
                  categories,
                  formCategoryIds,
                )}
                values={formCategoryIds}
                onChange={setFormCategoryIds}
                max={12}
                hint="Tapez quelques lettres (ex. « vehic », « tele ») : la liste se filtre instantanément. Un article peut apparaître dans plusieurs catégories."
              />
            </div>
            <div className="op-span">
              <CategoryMultiSelect
                dark
                label="Sous-catégories (une ou plusieurs)"
                placeholder="Rechercher une sous-catégorie…"
                options={subcategoryOptions}
                values={formSubcategories}
                onChange={setFormSubcategories}
                max={20}
                hint="Recherche insensible aux accents et à la casse. Sélectionnez plusieurs sous-catégories si l'article en couvre plusieurs."
              />
            </div>

            {/* Sélecteur d'État Visuel (Neuf, Occasion, Reconditionné) */}
            <div className="op-span" style={{ margin: "4px 0 10px 0" }}>
              <span style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                État de l'article (Condition)
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormCondition("NEW");
                    if (isVehCategory) setVehMileage("0 km");
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: formCondition === "NEW" ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.15)",
                    background: formCondition === "NEW" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.03)",
                    color: formCondition === "NEW" ? "#34d399" : "var(--admin-text, #cbd5e1)",
                    fontWeight: formCondition === "NEW" ? 800 : 600,
                    cursor: "pointer",
                    fontSize: "12.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🟢</span>
                  <span>{isVehCategory ? "Neuf (Brand New / 0 km)" : "Neuf (Brand New)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormCondition("USED");
                    if (isVehCategory && vehMileage === "0 km") setVehMileage("35 000 km");
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: formCondition === "USED" ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.15)",
                    background: formCondition === "USED" ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.03)",
                    color: formCondition === "USED" ? "#38bdf8" : "var(--admin-text, #cbd5e1)",
                    fontWeight: formCondition === "USED" ? 800 : 600,
                    cursor: "pointer",
                    fontSize: "12.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🔵</span>
                  <span>Occasion certifiée (Used)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormCondition("REFURBISHED");
                    if (isVehCategory && vehMileage === "0 km") setVehMileage("15 000 km");
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: formCondition === "REFURBISHED" ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.15)",
                    background: formCondition === "REFURBISHED" ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.03)",
                    color: formCondition === "REFURBISHED" ? "#fbbf24" : "var(--admin-text, #cbd5e1)",
                    fontWeight: formCondition === "REFURBISHED" ? 800 : 600,
                    cursor: "pointer",
                    fontSize: "12.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🟠</span>
                  <span>Reconditionné (Renewed)</span>
                </button>
              </div>
              <input type="hidden" name="condition" value={formCondition} />
            </div>

            {/* FORMULAIRE INTELLIGENT AUTOMOBILE (Si catégorie Véhicule) */}
            {isVehCategory && (
              <div
                className="op-span"
                style={{
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)",
                  border: "1.5px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "14px",
                  padding: "18px",
                  margin: "12px 0 20px 0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid rgba(245,158,11,0.2)", paddingBottom: "10px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#fbbf24", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🏎️</span> Formulaire Intelligent Véhicule (Spécifications Dubizzle Motors UAE)
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "#94a3b8" }}>
                      Remplissez rapidement les caractéristiques clés du véhicule pour générer l'affichage Dubizzle professionnel.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillVehicleDetails}
                    style={{
                      background: "#f59e0b",
                      color: "#0f172a",
                      fontWeight: 800,
                      fontSize: "11.5px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
                    }}
                  >
                    <span>⚡</span>
                    <span>Remplir Titre & Description</span>
                  </button>
                </div>

                {/* Marques rapides */}
                <div style={{ marginBottom: "14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase" }}>
                    Marque (Sélection rapide) :
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {["Toyota", "Jetour", "Lexus", "Mercedes-Benz", "Hyundai", "Nissan", "Mitsubishi", "Kia", "Land Rover", "Suzuki"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setVehBrand(m)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: vehBrand === m ? "1.5px solid #f59e0b" : "1px solid rgba(255,255,255,0.12)",
                          background: vehBrand === m ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.03)",
                          color: vehBrand === m ? "#fbbf24" : "#cbd5e1",
                          fontSize: "11.5px",
                          fontWeight: vehBrand === m ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grille de champs automobiles */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Modèle</span>
                    <input
                      type="text"
                      placeholder="Ex: Land Cruiser Prado, T2, Hilux"
                      value={vehModel}
                      onChange={(e) => setVehModel(e.target.value)}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Finition / Trim</span>
                    <input
                      type="text"
                      placeholder="Ex: TX-L, GXR, Traveller 4x4, Flagship"
                      value={vehTrim}
                      onChange={(e) => setVehTrim(e.target.value)}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Année du modèle</span>
                    <select value={vehYear} onChange={(e) => setVehYear(e.target.value)}>
                      {["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2015-2017", "Avant 2015"].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Kilométrage</span>
                    <input
                      type="text"
                      placeholder="Ex: 0 km, 25 000 km"
                      value={vehMileage}
                      onChange={(e) => setVehMileage(e.target.value)}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Carburant</span>
                    <select value={vehFuel} onChange={(e) => setVehFuel(e.target.value)}>
                      <option value="Essence (Petrol)">Essence (Petrol)</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybride">Hybride</option>
                      <option value="100% Électrique">100% Électrique</option>
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Boîte de vitesses</span>
                    <select value={vehTransmission} onChange={(e) => setVehTransmission(e.target.value)}>
                      <option value="Automatique">Automatique</option>
                      <option value="Manuelle">Manuelle</option>
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Motricité</span>
                    <select value={vehDrivetrain} onChange={(e) => setVehDrivetrain(e.target.value)}>
                      <option value="4x4 Tout-Terrain">4x4 Tout-Terrain Sélectif</option>
                      <option value="Traction Intégrale (AWD)">Traction Intégrale (AWD)</option>
                      <option value="Propulsion (RWD)">Propulsion (RWD)</option>
                      <option value="Traction (FWD)">Traction (FWD)</option>
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Moteur & Cylindrée</span>
                    <input
                      type="text"
                      placeholder="Ex: 4.0L V6 (271 ch), 2.0T (254 ch)"
                      value={vehEngine}
                      onChange={(e) => setVehEngine(e.target.value)}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Nombre de places</span>
                    <select value={vehSeats} onChange={(e) => setVehSeats(e.target.value)}>
                      <option value="7 Places">7 Places (5 portes)</option>
                      <option value="5 Places">5 Places (5 portes)</option>
                      <option value="8 Places">8 Places (Grand SUV)</option>
                      <option value="2-3 Places">2-3 Places (Pick-up simple cabine)</option>
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Couleur extérieure</span>
                    <input
                      type="text"
                      placeholder="Ex: Sable Sahara, Blanc Arctique, Noir"
                      value={vehExtColor}
                      onChange={(e) => setVehExtColor(e.target.value)}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Couleur intérieure</span>
                    <input
                      type="text"
                      placeholder="Ex: Cuir Beige, Cuir Brun Cognac, Noir"
                      value={vehIntColor}
                      onChange={(e) => setVehIntColor(e.target.value)}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Spécifications régionales</span>
                    <select value={vehRegionalSpecs} onChange={(e) => setVehRegionalSpecs(e.target.value)}>
                      <option value="GCC Specs (Dubaï - Climat chaud)">GCC Specs (Dubaï / Émirats)</option>
                      <option value="Tropicalisé Sahel / Afrique">Tropicalisé Sahel / Afrique</option>
                      <option value="Euro Specs">Euro Specs</option>
                    </select>
                  </label>
                </div>

                {/* Options rapides (Checklist en 1 clic) */}
                <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#cbd5e1" }}>
                    Options & Équipements inclus (Dubizzle Features) :
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", marginTop: "8px" }}>
                    {[
                      "Climatisation Tropicalisée",
                      "Écran Tactile & Apple CarPlay",
                      "Caméra 360° / Recul",
                      "Toit Panoramique / Ouvrant",
                      "Sièges Cuir Ergonomiques",
                      "Démarrage Sans Clé (Push Start)",
                      "4x4 Sélecteur de terrain",
                      "Double Réservoir Carburant",
                      "Phares Full LED & Feux Diurnes",
                      "Snorkel & Treuil Tout-Terrain"
                    ].map((opt) => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", cursor: "pointer", color: "#e2e8f0" }}>
                        <input
                          type="checkbox"
                          checked={vehEquipments.includes(opt)}
                          onChange={(e) => {
                            if (e.target.checked) setVehEquipments([...vehEquipments, opt]);
                            else setVehEquipments(vehEquipments.filter((x) => x !== opt));
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <label>
              Localisation
              <input
                name="location"
                defaultValue={editing.location || "Dubaï"}
                required
              />
            </label>
            <label>
              Devise de saisie du prix
              <select
                value={priceCurrency}
                onChange={(e) => setPriceCurrency(e.target.value)}
                aria-label="Devise de saisie du prix"
              >
                {PRICING_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prix net fournisseur par unité ({priceCurrency})
              <input
                name="supplierPrice"
                type="number"
                min="0"
                step="0.01"
                required
                value={supplierAmount}
                onChange={(e) => setSupplierAmount(e.target.value)}
              />
              <small style={{ display: "block", fontSize: "11px", opacity: 0.75, marginTop: 2 }}>
                Soit {formatXof(toXof(Number(supplierAmount || 0), priceCurrency))} en FCFA
                {priceCurrency !== "XOF" && ` · 1 ${priceCurrency} = ${formatXof(toXof(1, priceCurrency))}`}
              </small>
            </label>
            {admin && (
              <label>
                Prix public par unité ({priceCurrency})
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={publicAmount}
                  onChange={(e) => setPublicAmount(e.target.value)}
                />
                <small style={{ display: "block", fontSize: "11px", opacity: 0.75, marginTop: 2 }}>
                  Soit {formatXof(toXof(Number(publicAmount || 0), priceCurrency))} en FCFA
                </small>
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
                    Galerie photos & vidéos ({editing.images?.length || 0})
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
                      {isVideoUrl(imgUrl) ? (
                        <video
                          src={imgUrl}
                          muted
                          playsInline
                          loop
                          autoPlay
                          preload="metadata"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
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
                              accept={MEDIA_ACCEPT}
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
                      accept={MEDIA_ACCEPT}
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
              URLs de photos ou vidéos HTTPS (une par ligne)
              <textarea
                name="images"
                rows={4}
                defaultValue={editing.images?.join("\n")}
              />
            </label>
            <div>
              <MediaDropzone
                dark
                files={formFiles}
                onChangeFiles={setFormFiles}
                onAddUrl={async (url) => {
                  if (editing?.id) {
                    await handleRowAddByUrl(editing.id, url);
                  } else {
                    const textarea = document.querySelector('textarea[name="images"]') as HTMLTextAreaElement | null;
                    if (textarea) {
                      textarea.value = [textarea.value, url].filter(Boolean).join("\n");
                    }
                  }
                }}
                label="Ajouter des photos ou vidéos"
                hint="Cliquez, glissez-déposez ou collez (Ctrl+V) : les images et vidéos remplissent automatiquement toute la zone."
              />
            </div>
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
                    Photos & vidéos ({p.images?.length || 0})
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
                        {isVideoUrl(imgUrl) ? (
                          <video
                            src={imgUrl}
                            muted
                            playsInline
                            loop
                            autoPlay
                            preload="metadata"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <img
                            src={imgUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}

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
                                accept={MEDIA_ACCEPT}
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
                      accept={MEDIA_ACCEPT}
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
              {admin && <button type="button" className="op-button secondary"
                style={{ color: "#fca5a5", borderColor: "#ef444466" }}
                disabled={deletingId !== null || busyProductId === p.id}
                onClick={() => deleteListing(p)}>
                {deletingId === p.id ? "Suppression…" : "Supprimer l’annonce"}
              </button>}
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

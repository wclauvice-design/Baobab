import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, replaceProductImage, addProductImages, removeProductImage, setProductMainImage } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  SUSPENDED: "bg-red-100 text-red-700 border-red-300",
};

export function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const [data, setData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"adds" | "inquiries" | "commandes" | "ventes">("adds");
  const [copyToast, setCopyToast] = useState("");

  // Per-row quick image upload state
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);

  // Quick moderation & product completion modal
  const [modifyingProduct, setModifyingProduct] = useState<any>(null);
  const [modalName, setModalName] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalCategoryId, setModalCategoryId] = useState("");
  const [modalSubcategory, setModalSubcategory] = useState("");
  const [modalWeight, setModalWeight] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalPublicPrice, setModalPublicPrice] = useState("");
  const [modalStock, setModalStock] = useState("");
  const [modalCondition, setModalCondition] = useState("NEW");
  const [modalLocation, setModalLocation] = useState("Dubaï");
  const [modalDimensions, setModalDimensions] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modifyingBusy, setModifyingBusy] = useState(false);
  const [modalUploadingPhotos, setModalUploadingPhotos] = useState(false);

  // New product modal
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategoryId, setNewProdCategoryId] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdSupplierPrice, setNewProdSupplierPrice] = useState("");
  const [newProdWeight, setNewProdWeight] = useState("");
  const [newProdStock, setNewProdStock] = useState("10");
  const [newProdCondition, setNewProdCondition] = useState("NEW");
  const [newProdLocation, setNewProdLocation] = useState("Dubaï");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdFiles, setNewProdFiles] = useState<File[]>([]);
  const [creatingBusy, setCreatingBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError("");

    // Load categories if not loaded
    if (categories.length === 0) {
      api.get<any[]>("/categories").then(setCategories).catch(() => {});
    }

    // 1. First attempt: Dedicated admin seller endpoint
    try {
      const res = await api.get<any>(`/admin/sellers/${id}`);
      if (res && res.seller) {
        setData(res);
        setError("");
        setLoading(false);
        return;
      }
    } catch (e: any) {
      console.warn("Direct /admin/sellers/:id not ready, using real-time aggregation fallback:", e);
    }

    // 2. Resilient fallback: aggregate from live endpoints
    try {
      const sellers = await api.get<any[]>("/admin/sellers");
      const seller = sellers.find((s) => s.id === id);

      if (!seller) {
        setError("Commerçant introuvable dans la base de données.");
        setLoading(false);
        return;
      }

      const [allProducts, allConversations, allOrders] = await Promise.all([
        api.get<any[]>("/products").catch(() => []),
        api.get<any[]>("/admin/concierge/conversations").catch(() => []),
        api.get<any[]>("/admin/orders").catch(() => []),
      ]);

      const sellerProducts = allProducts.filter(
        (p: any) => p.sellerId === id || p.seller?.id === id
      );
      const productIds = new Set(sellerProducts.map((p: any) => p.id));

      const inquiries = allConversations.filter(
        (c: any) =>
          (c.productId && productIds.has(c.productId)) ||
          c.sellerId === id ||
          (c.customer && c.customer.phone === seller.user?.phone)
      );

      const sellerOrders = allOrders.filter(
        (o: any) =>
          o.sellerId === id ||
          o.items?.some((it: any) => productIds.has(it.productId))
      );

      const commandes = sellerOrders.filter(
        (o: any) =>
          o.status === "DRAFT" ||
          o.status === "QUOTED" ||
          o.status === "PENDING"
      );

      const ventes = sellerOrders.filter(
        (o: any) =>
          o.status !== "DRAFT" &&
          o.status !== "QUOTED" &&
          o.status !== "PENDING" &&
          o.status !== "CANCELLED"
      );

      const totalInquiries = inquiries.length;
      const totalCommands = commandes.length;
      const totalSales = ventes.length;

      const conversionInquiryToCommand =
        totalInquiries > 0
          ? Math.round((totalCommands / totalInquiries) * 100)
          : 0;
      const conversionCommandToSale =
        totalCommands > 0 ? Math.round((totalSales / totalCommands) * 100) : 0;

      let totalSalesVolume = 0;
      let totalSupplierRevenue = 0;
      let totalBaobabCommission = 0;

      for (const v of ventes) {
        const quote =
          v.quotes?.find((q: any) => q.revision === v.acceptedRevision) ||
          v.quotes?.[0];
        const vol = Number(quote?.total || v.totalAmount || 0);
        const sup = Number(quote?.supplierTotal || v.sellerAmount || vol * 0.9);
        const comm = Number(quote?.marginBaobab || vol - sup);
        totalSalesVolume += vol;
        totalSupplierRevenue += sup;
        totalBaobabCommission += comm;
      }

      const totalPaidToSeller = 0;
      const dueToSeller = Math.max(0, totalSupplierRevenue - totalPaidToSeller);

      setData({
        seller,
        metrics: {
          totalInquiries,
          totalCommands,
          totalSales,
          conversionInquiryToCommand,
          conversionCommandToSale,
          totalSalesVolume,
          totalSupplierRevenue,
          totalBaobabCommission,
          totalPaidToSeller,
          dueToSeller,
        },
        products: sellerProducts,
        inquiries,
        commandes,
        ventes,
      });
      setError("");
    } catch (fallbackErr: any) {
      setError(
        fallbackErr?.message ||
          "Impossible de charger les données de ce commerçant pour l'instant."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status: string) {
    if (!id) return;
    setBusy(true);
    try {
      await api.patch(`/admin/sellers/${id}/status`, { status });
      await load();
      window.dispatchEvent(new Event('baobab:refresh-counts'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLoginAsMerchant() {
    if (!data?.seller?.user?.phone) return;
    if (
      !confirm(
        `Voulez-vous basculer dans la boutique de "${data.seller.shopName}" (${data.seller.user.phone}) ?\n\nVous pourrez créer/éditer des annonces pour son compte et revenir à tout moment à votre session Admin via le bandeau supérieur.`
      )
    ) {
      return;
    }
    try {
      await impersonate(data.seller.user.phone, data.seller.shopName);
      navigate("/");
    } catch (e: any) {
      alert("Erreur de connexion commerçant : " + (e?.message || e));
    }
  }

  // Quick single image upload on product row
  async function handleRowUpload(productId: string, file: File) {
    if (!file) return;
    setUploadingProductId(productId);
    try {
      await api.upload(`/products/${productId}/images`, file);
      await load();
    } catch (e: any) {
      alert("Erreur lors de l'envoi de la photo : " + (e?.message || e));
    } finally {
      setUploadingProductId(null);
    }
  }

  // Quick single image delete
  async function handleDeleteImage(productId: string, url: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Voulez-vous supprimer cette photo ?")) return;
    try {
      await api.delete(`/products/${productId}/images`, { url });
      if (modifyingProduct && modifyingProduct.id === productId) {
        setModalImages((prev) => prev.filter((u) => u !== url));
      }
      await load();
    } catch (err: any) {
      alert("Erreur suppression photo : " + (err?.message || err));
    }
  }

    // Quick row replace
  async function handleRowReplace(productId: string, oldUrl: string, file: File) {
    if (!file) return;
    setUploadingProductId(productId);
    try {
      await replaceProductImage(productId, oldUrl, file);
      await load();
    } catch (e: any) {
      alert("Erreur remplacement photo : " + (e?.message || e));
    } finally {
      setUploadingProductId(null);
    }
  }

  // Quick row add multiple
  async function handleRowAddMultiple(productId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingProductId(productId);
    try {
      await addProductImages(productId, Array.from(files));
      await load();
    } catch (e: any) {
      alert("Erreur ajout photos : " + (e?.message || e));
    } finally {
      setUploadingProductId(null);
    }
  }

  // Quick row add by URL
  async function handleRowAddByUrl(productId: string) {
    const url = window.prompt("Collez l'URL de l'image (Temu, Dubizzle, WhatsApp ou web) :");
    if (!url || !url.trim()) return;
    setUploadingProductId(productId);
    try {
      await addProductImages(productId, [url.trim()]);
      await load();
    } catch (e: any) {
      alert("Erreur ajout URL : " + (e?.message || e));
    } finally {
      setUploadingProductId(null);
    }
  }

  // Set main photo on row
  async function handleSetMainPhoto(productId: string, url: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await setProductMainImage(productId, url);
      await load();
    } catch (e: any) {
      alert("Erreur photo principale : " + (e?.message || e));
    }
  }

  // Modal photo replace
  async function handleModalReplace(oldUrl: string, file: File) {
    if (!file || !modifyingProduct) return;
    setModalUploadingPhotos(true);
    try {
      const newImages = await replaceProductImage(modifyingProduct.id, oldUrl, file);
      setModalImages(newImages);
      await load();
    } catch (e: any) {
      alert("Erreur remplacement photo : " + (e?.message || e));
    } finally {
      setModalUploadingPhotos(false);
    }
  }

  // Modal add photo by URL
  async function handleModalAddByUrl() {
    if (!modifyingProduct) return;
    const url = window.prompt("Collez l'URL de l'image (Temu, Dubizzle, WhatsApp ou web) :");
    if (!url || !url.trim()) return;
    setModalUploadingPhotos(true);
    try {
      const newImages = await addProductImages(modifyingProduct.id, [url.trim()]);
      setModalImages(newImages);
      await load();
    } catch (e: any) {
      alert("Erreur ajout URL : " + (e?.message || e));
    } finally {
      setModalUploadingPhotos(false);
    }
  }

  // Modal set main photo
  async function handleModalSetMain(url: string) {
    if (!modifyingProduct) return;
    try {
      const newImages = await setProductMainImage(modifyingProduct.id, url);
      setModalImages(newImages);
      await load();
    } catch (e: any) {
      alert("Erreur photo principale : " + (e?.message || e));
    }
  }

  function openModifier(product: any) {
    setModifyingProduct(product);
    setModalName(product.name || "");
    setModalDescription(product.description || "");
    setModalCategoryId(product.categoryId || "");
    setModalSubcategory(product.subcategory || "");
    setModalWeight(product.weightKg ? String(product.weightKg) : "");
    setModalPrice(
      product.sellerPrice
        ? String(product.sellerPrice)
        : product.supplierPrice
        ? String(product.supplierPrice)
        : ""
    );
    setModalPublicPrice(product.price ? String(product.price) : "");
    setModalStock(product.stock !== undefined ? String(product.stock) : "1");
    setModalCondition(product.condition || "NEW");
    setModalLocation(product.location || "Dubaï");
    setModalDimensions(product.dimensions || "");
    setModalNote(product.moderationNote || "");
    setModalImages(product.images || []);
  }

  async function handleModalUploadPhotos(files: FileList | null) {
    if (!files || files.length === 0 || !modifyingProduct) return;
    setModalUploadingPhotos(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const updated = await api.upload<any>(`/products/${modifyingProduct.id}/images`, file);
        if (updated?.images) {
          setModalImages(updated.images);
        }
      }
      await load();
    } catch (e: any) {
      alert("Erreur téléversement photos : " + (e?.message || e));
    } finally {
      setModalUploadingPhotos(false);
    }
  }

  async function handleSaveAndPublish(moderation: "PUBLISHED" | "PENDING" | "REJECTED") {
    if (!modifyingProduct) return;
    setModifyingBusy(true);
    try {
      // 1. Update full product details
      const updatePayload: any = {
        name: modalName,
        description: modalDescription,
        categoryId: modalCategoryId || undefined,
        subcategory: modalSubcategory || undefined,
        condition: modalCondition,
        location: modalLocation,
        stock: modalStock ? Number(modalStock) : undefined,
        dimensions: modalDimensions || undefined,
      };
      if (modalWeight) updatePayload.weightKg = Number(modalWeight);
      if (modalPublicPrice) updatePayload.price = Number(modalPublicPrice);
      if (modalPrice) updatePayload.supplierPrice = Number(modalPrice);

      await api.patch(`/products/${modifyingProduct.id}`, updatePayload).catch(() => {});

      // 2. Apply moderation status
      await api.patch(`/products/${modifyingProduct.id}/moderation`, {
        moderation,
        note: modalNote || undefined,
        publicPrice: modalPublicPrice ? String(modalPublicPrice) : undefined,
      });

      setModifyingProduct(null);
      await load();
      window.dispatchEvent(new Event('baobab:refresh-counts'));
    } catch (e: any) {
      alert("Erreur lors de la mise à jour : " + (e?.message || e));
    } finally {
      setModifyingBusy(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProdName || !newProdCategoryId || !newProdPrice) {
      alert("Veuillez renseigner au minimum le nom, la catégorie et le prix public.");
      return;
    }
    setCreatingBusy(true);
    try {
      const pubPrice = Number(newProdPrice);
      const supPrice = newProdSupplierPrice ? Number(newProdSupplierPrice) : pubPrice;

      const created = await api.post<any>("/products", {
        name: newProdName,
        description: newProdDesc || newProdName,
        price: pubPrice,
        supplierPrice: supPrice,
        categoryId: newProdCategoryId,
        stock: newProdStock ? Number(newProdStock) : 1,
        weightKg: newProdWeight ? Number(newProdWeight) : undefined,
        condition: newProdCondition,
        location: newProdLocation,
        sellerId: id,
      });

      // Upload selected photos for the newly created product
      if (created?.id && newProdFiles.length > 0) {
        for (const file of newProdFiles) {
          await api.upload(`/products/${created.id}/images`, file).catch(() => {});
        }
      }

      setCreatingProduct(false);
      setNewProdName("");
      setNewProdPrice("");
      setNewProdSupplierPrice("");
      setNewProdWeight("");
      setNewProdDesc("");
      setNewProdFiles([]);
      await load();
    } catch (err: any) {
      alert("Erreur création article : " + (err?.message || err));
    } finally {
      setCreatingBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3 p-8 text-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
        <p className="font-semibold text-slate-700">Chargement du dossier commerçant…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          {error || "Commerçant introuvable"}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={load}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
          >
            Réessayer
          </button>
          <Link
            to="/sellers"
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Retour à la liste des commerçants
          </Link>
        </div>
      </div>
    );
  }

  const { seller, metrics, products = [], inquiries = [], commandes = [], ventes = [] } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            to="/sellers"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800"
          >
            ← Commerçants partenaires
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{seller.shopName}</h1>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                STATUS_STYLES[seller.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {seller.status === "APPROVED"
                ? "Boutique Approuvée"
                : seller.status === "PENDING"
                ? "En attente d'approbation"
                : "Boutique Suspendue"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Propriétaire : <strong className="text-slate-900">{seller.user?.phone}</strong> · Ville :{" "}
            {seller.city} · Pays : {seller.user?.country || "Non spécifié"} · Inscrit le :{" "}
            {new Date(seller.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BOUTON LIEN PUBLICITAIRE BOUTIQUE (TIKTOK / FB) */}
          <button
            onClick={() => {
              const url = `https://baobab-kohl.vercel.app/shop/${seller.id}`;
              navigator.clipboard.writeText(url);
              setCopyToast("Lien public de la boutique copié ! Prêt pour Facebook Ads / TikTok.");
              setTimeout(() => setCopyToast(""), 3500);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-sm hover:bg-amber-100 transition-all active:scale-95"
            title="Copier le lien direct de la boutique pour les campagnes Facebook Ads, TikTok Ads ou WhatsApp"
          >
            <span>📱</span>
            <span>Lien Pub Boutique (TikTok / FB)</span>
          </button>

          {/* BOUTON PRO : Se connecter à la boutique du commerçant (Impersonation) */}
          <button
            onClick={handleLoginAsMerchant}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-amber-700 hover:to-amber-800 transition-all active:scale-95"
            title="Prendre la main sur la boutique pour créer/modifier des articles et voir ses commandes comme le vendeur"
          >
            <span>👤</span>
            <span>Se connecter à sa boutique</span>
          </button>

          {/* Bouton Ajouter un article direct */}
          <button
            onClick={() => setCreatingProduct(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-black transition-all active:scale-95"
          >
            <span>+</span>
            <span>Ajouter une annonce</span>
          </button>

          {seller.status !== "APPROVED" && (
            <button
              disabled={busy}
              onClick={() => updateStatus("APPROVED")}
              className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
            >
              ✓ Approuver boutique
            </button>
          )}
          {seller.status !== "SUSPENDED" && (
            <button
              disabled={busy}
              onClick={() => updateStatus("SUSPENDED")}
              className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              ✕ Suspendre
            </button>
          )}
        </div>
      </div>

      {/* 2. Pipeline de Vente & KPIs Intelligents */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1 : Renseignements */}
        <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">1. Renseignements</span>
            <span className="text-lg">💬</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalInquiries}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Demandes & questions clients reçues
          </p>
        </div>

        {/* KPI 2 : Commandes */}
        <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">2. Commandes</span>
            <span className="text-lg">📋</span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-900">
            {metrics.totalCommands}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Devis préparés ({metrics.conversionInquiryToCommand}% des leads)
          </p>
        </div>

        {/* KPI 3 : Ventes Confirmées */}
        <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">3. Ventes Concrétisées</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {metrics.totalSales}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Commandes confirmées ({metrics.conversionCommandToSale}% conversion)
          </p>
        </div>

        {/* KPI 4 : Chiffre d'Affaires */}
        <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Chiffre d’Affaires</span>
            <span className="text-lg">💵</span>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {Number(metrics.totalSalesVolume || 0).toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-semibold">FCFA</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Commissions Baobab : {Number(metrics.totalBaobabCommission || 0).toLocaleString("fr-FR")} F
          </p>
        </div>

        {/* KPI 5 : Part Vendeur Due */}
        <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dû au Commerçant</span>
            <span className="text-lg">🪙</span>
          </div>
          <div className="mt-2 text-xl font-black text-amber-600">
            {Number(metrics.dueToSeller || 0).toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-semibold">FCFA</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Déjà reversé : {Number(metrics.totalPaidToSeller || 0).toLocaleString("fr-FR")} F
          </p>
        </div>
      </div>

      {/* 3. Onglets de Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-sm font-semibold">
          <button
            onClick={() => setTab("adds")}
            className={`border-b-2 pb-3 transition-colors ${
              tab === "adds"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📦 Annonces & Articles ({products.length})
          </button>
          <button
            onClick={() => setTab("inquiries")}
            className={`border-b-2 pb-3 transition-colors ${
              tab === "inquiries"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            💬 Renseignements & Questions ({inquiries.length})
          </button>
          <button
            onClick={() => setTab("commandes")}
            className={`border-b-2 pb-3 transition-colors ${
              tab === "commandes"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📋 Commandes en préparation ({commandes.length})
          </button>
          <button
            onClick={() => setTab("ventes")}
            className={`border-b-2 pb-3 transition-colors ${
              tab === "ventes"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            💰 Ventes Confirmées ({ventes.length})
          </button>
        </nav>
      </div>

      {/* 4. Contenu des Onglets */}

      {/* ONGLET 1 : ANNONCES */}
      {tab === "adds" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Photos</th>
                <th className="px-4 py-3">Article & Référence</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Prix Public</th>
                <th className="px-4 py-3">Prix Commerçant</th>
                <th className="px-4 py-3">Poids (kg)</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <p className="text-base font-semibold">Aucune annonce enregistrée pour ce commerçant.</p>
                    <button
                      onClick={() => setCreatingProduct(true)}
                      className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                    >
                      + Ajouter la première annonce
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Photos Column with Instant Upload, Replace & Gallery */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.images && p.images.length > 0 ? (
                          p.images.map((imgUrl: string, idx: number) => (
                            <div key={idx} className="group relative h-11 w-11 shrink-0 rounded-md overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
                              <img
                                src={imgUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />

                              {idx === 0 && (
                                <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[7px] text-amber-300 font-bold text-center py-0.2">
                                  ★ 1ère
                                </span>
                              )}

                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-0.5">
                                <div className="flex justify-between items-center">
                                  <label
                                    title="Remplacer cette photo"
                                    className="h-4 w-4 rounded bg-blue-600 text-white text-[9px] flex items-center justify-center hover:bg-blue-700 cursor-pointer shadow"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    🔄
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      className="hidden"
                                      disabled={uploadingProductId === p.id}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleRowReplace(p.id, imgUrl, f);
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteImage(p.id, imgUrl, e)}
                                    title="Supprimer cette photo"
                                    className="h-4 w-4 rounded bg-red-600 text-white text-[9px] flex items-center justify-center hover:bg-red-700 shadow"
                                  >
                                    ✕
                                  </button>
                                </div>

                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleSetMainPhoto(p.id, imgUrl, e)}
                                    title="Définir comme photo principale"
                                    className="w-full rounded bg-amber-500 text-slate-950 font-black text-[7px] py-0.5 hover:bg-amber-400 shadow"
                                  >
                                    ★ 1ère
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-400">
                            Sans photo
                          </div>
                        )}

                        {/* Action buttons: Multi upload & Add by URL */}
                        <div className="flex flex-col gap-1">
                          <label
                            className="flex h-5 items-center justify-center gap-1 px-1.5 rounded border border-dashed border-emerald-400 bg-emerald-50 text-[9px] font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors shadow-xs"
                            title="Ajouter une ou plusieurs photos à cet article"
                          >
                            <span>+ Photos</span>
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              disabled={uploadingProductId === p.id}
                              onChange={(e) => {
                                handleRowAddMultiple(p.id, e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRowAddByUrl(p.id)}
                            className="flex h-5 items-center justify-center gap-1 px-1.5 rounded border border-slate-300 bg-white text-[9px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                            title="Ajouter une photo par lien URL (Temu, Dubizzle, WhatsApp)"
                          >
                            🔗 Lien
                          </button>
                        </div>

                        {uploadingProductId === p.id && (
                          <span className="text-[10px] font-semibold text-emerald-600 animate-pulse">
                            Envoi...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Article & Details */}
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-sm">
                      <div className="font-semibold line-clamp-2">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 font-mono">Réf : {p.id}</span>
                        {p.stock === 0 ? (
                          <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            ⚠️ Rupture
                          </span>
                        ) : p.stock !== undefined && p.stock !== null && p.stock <= 5 ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            ⚡ Stock bas ({p.stock})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Stock : {p.stock ?? "—"}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{p.category?.name || "—"}</td>

                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {Number(p.price || 0).toLocaleString("fr-FR")} FCFA
                    </td>

                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {p.sellerPrice
                        ? `${Number(p.sellerPrice).toLocaleString("fr-FR")} FCFA`
                        : p.supplierPrice
                        ? `${Number(p.supplierPrice).toLocaleString("fr-FR")} FCFA`
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {p.weightKg ? (
                        <span className="font-bold text-slate-800">{p.weightKg} kg</span>
                      ) : (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Non renseigné
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.moderation === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.moderation === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.moderation === "PUBLISHED"
                          ? "Publié"
                          : p.moderation === "PENDING"
                          ? "En attente modération"
                          : "Rejeté"}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModifier(p)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition-all"
                        >
                          Compléter & modérer →
                        </button>
                        <button
                          onClick={() => {
                            const url = `https://baobab-kohl.vercel.app/products/${p.id}`;
                            navigator.clipboard.writeText(url);
                            setCopyToast(`Lien pub copié pour "${p.name.slice(0, 22)}..." !`);
                            setTimeout(() => setCopyToast(""), 3500);
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                          title="Copier le lien direct de cet article pour sponsoriser sur Facebook / TikTok"
                        >
                          🔗 Lien Pub
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ONGLET 2 : RENSEIGNEMENTS (LEADS) */}
      {tab === "inquiries" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Objet / Produit</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Dernier message</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Aucun renseignement enregistré sur les articles de ce commerçant.
                  </td>
                </tr>
              ) : (
                inquiries.map((inq: any) => (
                  <tr key={inq.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {inq.subject}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {inq.customer
                        ? `${inq.customer.firstName || ""} ${inq.customer.lastName || ""} (${inq.customer.phone})`
                        : "Client invité"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                      {inq.messages?.[0]?.body || inq.messages?.[inq.messages.length - 1]?.body || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(inq.updatedAt || inq.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      {inq.tradeOrders?.length > 0 ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          Transformé en commande
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Renseignement en cours
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/messages/${inq.id}`}
                        className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        Discuter →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ONGLET 3 : COMMANDES (EN COURS DE NÉGOCIATION / DEVIS) */}
      {tab === "commandes" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Réf. Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date création</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Montant devis</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commandes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Aucune commande en cours de devis pour ce commerçant.
                  </td>
                </tr>
              ) : (
                commandes.map((cmd: any) => (
                  <tr key={cmd.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {cmd.reference || cmd.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {cmd.customer
                        ? `${cmd.customer.firstName} ${cmd.customer.lastName} (${cmd.customer.city || cmd.customer.phone})`
                        : cmd.buyer?.phone || "Client"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(cmd.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                        {cmd.status === "DRAFT" ? "Devis en préparation" : "Devis transmis au client"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {cmd.quotes?.[0]?.total
                        ? `${Number(cmd.quotes[0].total).toLocaleString("fr-FR")} FCFA`
                        : cmd.totalAmount
                        ? `${Number(cmd.totalAmount).toLocaleString("fr-FR")} FCFA`
                        : "En calcul"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${cmd.id}`}
                        className="font-bold text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        Gérer commande →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ONGLET 4 : VENTES CONFIRMÉES */}
      {tab === "ventes" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Réf. Vente</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Total Vente</th>
                <th className="px-4 py-3">Part Fournisseur</th>
                <th className="px-4 py-3">Statut Logistique</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Aucune vente confirmée enregistrée pour ce commerçant à ce jour.
                  </td>
                </tr>
              ) : (
                ventes.map((v: any) => {
                  const quote =
                    v.quotes?.find((q: any) => q.revision === v.acceptedRevision) ||
                    v.quotes?.[0];
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                        {v.reference || v.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {v.customer
                          ? `${v.customer.firstName} ${v.customer.lastName} (${v.customer.city || v.customer.phone})`
                          : v.buyer?.phone || "Client"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {quote?.total
                          ? `${Number(quote.total).toLocaleString("fr-FR")} FCFA`
                          : v.totalAmount
                          ? `${Number(v.totalAmount).toLocaleString("fr-FR")} FCFA`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-700">
                        {quote?.supplierTotal
                          ? `${Number(quote.supplierTotal).toLocaleString("fr-FR")} FCFA`
                          : v.sellerAmount
                          ? `${Number(v.sellerAmount).toLocaleString("fr-FR")} FCFA`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/orders/${v.id}`}
                          className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          Suivi & règlement →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ADMIN 1 : Compléter le poids, photos, prix et modérer l'annonce */}
      {modifyingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Compléter, Enrichir & Modérer</h3>
                <p className="text-xs text-slate-500 font-mono">ID : {modifyingProduct.id}</p>
              </div>
              <button
                onClick={() => setModifyingProduct(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* SECTION PHOTOS DU PRODUIT */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Photos réelles du produit ({modalImages.length} photo{modalImages.length > 1 ? "s" : ""})
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Survolez une photo pour la <strong>Remplacer</strong>, la <strong>Supprimer</strong> ou la mettre en <strong>1ère</strong>.
                  </span>
                </div>

                {/* Existing Photos Grid */}
                <div className="flex flex-wrap gap-2.5 mb-3">
                  {modalImages.map((imgUrl, idx) => (
                    <div key={idx} className="group relative h-20 w-20 rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-slate-100">
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/85 text-[8px] text-amber-300 font-bold text-center py-0.5">
                          ★ 1ère Photo
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                        <div className="flex justify-between items-center">
                          <label
                            title="Remplacer cette photo par une nouvelle"
                            className="h-5 w-5 rounded bg-blue-600 text-white text-[10px] flex items-center justify-center hover:bg-blue-700 cursor-pointer shadow"
                          >
                            🔄
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              disabled={modalUploadingPhotos}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleModalReplace(imgUrl, f);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteImage(modifyingProduct.id, imgUrl, e)}
                            className="h-5 w-5 rounded bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-700 shadow"
                            title="Supprimer cette photo"
                          >
                            ✕
                          </button>
                        </div>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleModalSetMain(imgUrl)}
                            title="Définir comme photo principale"
                            className="w-full rounded bg-amber-500 text-slate-950 font-bold text-[8px] py-0.5 hover:bg-amber-400 shadow"
                          >
                            ★ Mettre en 1ère
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Multi-upload dropzone / trigger */}
                  <label
                    className={`flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-50 text-center text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors ${
                      modalUploadingPhotos ? "animate-pulse" : ""
                    }`}
                  >
                    <span>{modalUploadingPhotos ? "Envoi…" : "+ Ajouter"}</span>
                    <span className="text-[10px] font-normal text-emerald-600">Plusieurs photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={modalUploadingPhotos}
                      onChange={(e) => handleModalUploadPhotos(e.target.files)}
                    />
                  </label>

                  {/* Add by URL button */}
                  <button
                    type="button"
                    onClick={handleModalAddByUrl}
                    disabled={modalUploadingPhotos}
                    className="flex h-20 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                    title="Ajouter une photo par lien URL web"
                  >
                    <span className="text-base">🔗</span>
                    <span>Par lien</span>
                    <span className="text-[9px] font-normal text-slate-400">Temu/Dubizzle</span>
                  </button>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Titre de l'article
                  </label>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Catégorie
                  </label>
                  <select
                    value={modalCategoryId}
                    onChange={(e) => setModalCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">Sélectionner une catégorie...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Sous-catégorie
                  </label>
                  <input
                    type="text"
                    value={modalSubcategory}
                    onChange={(e) => setModalSubcategory(e.target.value)}
                    placeholder="Ex : Smartphones, SUV..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Poids et Prix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Poids (en kg) <span className="text-emerald-700 font-bold">*Fret</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={modalWeight}
                    onChange={(e) => setModalWeight(e.target.value)}
                    placeholder="Ex : 2.5"
                    className="mt-1 w-full rounded-lg border border-emerald-400 bg-emerald-50/30 px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Prix Vente Public (FCFA)
                  </label>
                  <input
                    type="number"
                    value={modalPublicPrice}
                    onChange={(e) => setModalPublicPrice(e.target.value)}
                    placeholder="Ex : 25000"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Prix Commerçant (FCFA)
                  </label>
                  <input
                    type="number"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                    placeholder="Ex : 20000"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* État, Stock, Lieu */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Condition
                  </label>
                  <select
                    value={modalCondition}
                    onChange={(e) => setModalCondition(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="NEW">Neuf Scellé</option>
                    <option value="REFURBISHED">Reconditionné A+</option>
                    <option value="USED">Occasion Bon État</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={modalStock}
                    onChange={(e) => setModalStock(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Lieu de provenance
                  </label>
                  <input
                    type="text"
                    value={modalLocation}
                    onChange={(e) => setModalLocation(e.target.value)}
                    placeholder="Dubaï, Ouagadougou..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Description de l'article
                </label>
                <textarea
                  rows={3}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Note interne */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Remarque / Note pour le commerçant
                </label>
                <input
                  type="text"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Remarque éventuelle sur la fiche..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-between gap-2 pt-3 border-t">
                <button
                  type="button"
                  disabled={modifyingBusy}
                  onClick={() => handleSaveAndPublish("REJECTED")}
                  className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  ✕ Rejeter l'annonce
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={modifyingBusy}
                    onClick={() => handleSaveAndPublish("PENDING")}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    ⏳ Garder en attente
                  </button>
                  <button
                    type="button"
                    disabled={modifyingBusy}
                    onClick={() => handleSaveAndPublish("PUBLISHED")}
                    className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {modifyingBusy ? "Enregistrement…" : "✓ Valider & Publier sur Marketplace"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN 2 : Créer un nouvel article directement pour ce commerçant */}
      {creatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">+ Nouvel Article pour ce Commerçant</h3>
                <p className="text-xs text-slate-500">Boutique affiliée : <strong>{seller.shopName}</strong></p>
              </div>
              <button
                onClick={() => setCreatingProduct(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nom de l'article *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ex : iPhone 15 Pro Max 256GB Titane"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Catégorie *
                  </label>
                  <select
                    required
                    value={newProdCategoryId}
                    onChange={(e) => setNewProdCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">Sélectionner une catégorie...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Poids (kg) <span className="text-emerald-700 font-semibold">*Fret</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdWeight}
                    onChange={(e) => setNewProdWeight(e.target.value)}
                    placeholder="Ex : 0.45"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Prix Vente Public (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="Ex : 450000"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Prix Commerçant Fournisseur (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newProdSupplierPrice}
                    onChange={(e) => setNewProdSupplierPrice(e.target.value)}
                    placeholder="Ex : 400000"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Condition
                  </label>
                  <select
                    value={newProdCondition}
                    onChange={(e) => setNewProdCondition(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="NEW">Neuf Scellé</option>
                    <option value="REFURBISHED">Reconditionné A+</option>
                    <option value="USED">Occasion Bon État</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={newProdLocation}
                    onChange={(e) => setNewProdLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Photos réelles (Sélectionner 1 ou plusieurs images)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files) {
                      setNewProdFiles(Array.from(e.target.files));
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
                {newProdFiles.length > 0 && (
                  <p className="mt-1 text-xs text-emerald-700 font-semibold">
                    ✓ {newProdFiles.length} photo{newProdFiles.length > 1 ? "s" : ""} sélectionnée{newProdFiles.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Détails, spécifications techniques, garantie..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreatingProduct(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingBusy}
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
                >
                  {creatingBusy ? "Création en cours…" : "✓ Créer & Publier l'article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating Toast Alert */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl border border-emerald-500/40 animate-bounce">
          <span className="text-emerald-400">✓</span>
          <span>{copyToast}</span>
        </div>
      )}
    </div>
  );
}

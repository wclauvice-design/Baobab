import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  SUSPENDED: "bg-red-100 text-red-700 border-red-300",
};

export function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"adds" | "inquiries" | "commandes" | "ventes">("adds");

  function load() {
    if (!id) return;
    setLoading(true);
    api
      .get<any>(`/admin/sellers/${id}`)
      .then((res) => {
        setData(res);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function updateStatus(status: string) {
    if (!id) return;
    setBusy(true);
    try {
      await api.patch(`/admin/sellers/${id}/status`, { status });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Chargement des détails du commerçant…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || "Commerçant introuvable"}
        </div>
        <Link
          to="/sellers"
          className="mt-4 inline-block font-semibold text-emerald-800 hover:underline"
        >
          ← Retour à la liste des commerçants
        </Link>
      </div>
    );
  }

  const { seller, metrics, products, inquiries, commandes, ventes } = data;

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

        <div className="flex items-center gap-2">
          {seller.status !== "APPROVED" && (
            <button
              disabled={busy}
              onClick={() => updateStatus("APPROVED")}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
            >
              ✓ Approuver la boutique
            </button>
          )}
          {seller.status !== "SUSPENDED" && (
            <button
              disabled={busy}
              onClick={() => updateStatus("SUSPENDED")}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
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
            {Number(metrics.totalSalesVolume || 0).toLocaleString("fr-FR")} <span className="text-xs font-semibold">FCFA</span>
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
            {Number(metrics.dueToSeller || 0).toLocaleString("fr-FR")} <span className="text-xs font-semibold">FCFA</span>
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Prix Vente</th>
                <th className="px-4 py-3">Prix Commerçant</th>
                <th className="px-4 py-3">Poids</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Aucune annonce publiée par ce commerçant pour le moment.
                  </td>
                </tr>
              ) : (
                products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                            Sans photo
                          </div>
                        )}
                        <div>
                          <div>{p.name}</div>
                          <div className="text-xs text-slate-400">Réf : {p.id.slice(0, 10)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.category?.name || "—"}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {Number(p.price || 0).toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.sellerPrice
                        ? `${Number(p.sellerPrice).toLocaleString("fr-FR")} FCFA`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.weightKg ? `${p.weightKg} kg` : <span className="text-amber-600">Non renseigné</span>}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      <Link
                        to="/catalog"
                        className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        Éditer →
                      </Link>
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900">
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
                    Aucun renseignement ou question client enregistré sur les articles de ce commerçant.
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
                        ? `${inq.customer.firstName} ${inq.customer.lastName} (${inq.customer.phone})`
                        : "Client invité"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                      {inq.messages?.[0]?.body || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(inq.updatedAt).toLocaleDateString("fr-FR")}
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
                        Ouvrir discussion →
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900">
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
                    Aucune commande en préparation pour ce commerçant.
                  </td>
                </tr>
              ) : (
                commandes.map((cmd: any) => (
                  <tr key={cmd.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {cmd.reference}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {cmd.customer?.firstName} {cmd.customer?.lastName} ({cmd.customer?.city})
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900">
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
                  const quote = v.quotes.find((q: any) => q.revision === v.acceptedRevision) || v.quotes[0];
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                        {v.reference}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {v.customer?.firstName} {v.customer?.lastName} ({v.customer?.city})
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {quote?.total ? `${Number(quote.total).toLocaleString("fr-FR")} FCFA` : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-700">
                        {quote?.supplierTotal
                          ? `${Number(quote.supplierTotal).toLocaleString("fr-FR")} FCFA`
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
    </div>
  );
}

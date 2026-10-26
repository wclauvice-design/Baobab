import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface SellerRow {
  id: string;
  shopName: string;
  city: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  createdAt: string;
  user: { phone: string; country?: string | null; language?: string; createdAt?: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export function Sellers() {
  const [sellers, setSellers] = useState<SellerRow[]>([]);

  function load() {
    api.get<SellerRow[]>('/admin/sellers').then(setSellers);
  }

  useEffect(load, []);

  async function setStatus(id: string, status: string) {
    await api.patch(`/admin/sellers/${id}/status`, { status });
    load();
    window.dispatchEvent(new Event('baobab:refresh-counts'));
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Vendeurs partenaires</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Pays</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Langue</th>
              <th className="px-4 py-3">Demande</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-bold text-slate-900"><Link to={`/sellers/${s.id}`} className="text-emerald-800 hover:underline">{s.shopName}</Link></td>
                <td className="px-4 py-3 text-slate-700">{s.city}</td>
                <td className="px-4 py-3 text-slate-700">{s.user.country || "-"}</td>
                <td className="px-4 py-3 text-slate-700">{s.user.phone}</td>
                <td className="px-4 py-3 text-slate-700">{s.user.language || "-"}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(s.createdAt).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/sellers/${s.id}`}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-sm"
                    >
                      Détails & ventes →
                    </Link>
                    {s.status !== 'APPROVED' && (
                      <button
                        onClick={() => setStatus(s.id, 'APPROVED')}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Approuver
                      </button>
                    )}
                    {s.status !== 'SUSPENDED' && (
                      <button
                        onClick={() => setStatus(s.id, 'SUSPENDED')}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Suspendre
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

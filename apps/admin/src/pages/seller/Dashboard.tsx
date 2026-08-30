import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatXof } from '../../lib/format';

interface DashboardData {
  activeProducts: number;
  pendingOrders: number;
  revenue: number;
  seller: { shopName: string; status: string };
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>('/sellers/me/dashboard').then(setData);
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Chargement…</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{data.seller.shopName}</h1>
      <p className="mb-6 text-sm text-slate-500">Statut : {data.seller.status}</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Produits actifs</p>
          <p className="mt-2 text-2xl font-bold">{data.activeProducts}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Commandes en attente</p>
          <p className="mt-2 text-2xl font-bold">{data.pendingOrders}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Revenus (livrées)</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatXof(data.revenue)}</p>
        </div>
      </div>
    </div>
  );
}

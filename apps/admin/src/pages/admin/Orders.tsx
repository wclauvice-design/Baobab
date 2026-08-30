import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatXof } from '../../lib/format';

interface OrderRow {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  buyer: { phone: string };
  payment: { status: string } | null;
}

export function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    api.get<OrderRow[]>('/admin/orders').then(setOrders);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Vue d'ensemble des commandes</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono">{o.id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3">{o.buyer.phone}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3">{o.payment?.status ?? '—'}</td>
                <td className="px-4 py-3">{formatXof(Number(o.totalAmount))}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

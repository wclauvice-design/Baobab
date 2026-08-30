import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { formatXof } from '../../lib/format';

interface QueueItem {
  id: string;
  reference: string;
  amount: number;
  createdAt: string;
  order: { id: string; deliveryAddress: string; buyer: { phone: string } };
}

export function PaymentQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<QueueItem[]>('/admin/payments/queue')
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, action: 'validate' | 'reject') {
    setError(null);
    try {
      await api.post(`/admin/payments/${id}/${action}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">File des paiements à valider</h1>
      <p className="mb-6 text-sm text-slate-500">
        Rapprochez chaque référence avec le relevé du compte marchand Orange Money avant de valider.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun paiement en attente.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Horodatage</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-medium">{item.reference}</td>
                  <td className="px-4 py-3">{formatXof(Number(item.amount))}</td>
                  <td className="px-4 py-3">{item.order.buyer.phone}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(item.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(item.id, 'validate')}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => act(item.id, 'reject')}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                      >
                        Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatXof } from '../lib/format';
import { PageLoader } from '../components/PageLoader';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée',
};

const STATUS_TINT: Record<string, string> = {
  PENDING_PAYMENT: 'text-amber-400',
  CONFIRMED: 'text-sky-400',
  PREPARING: 'text-sky-400',
  SHIPPED: 'text-violet-400',
  DELIVERED: 'text-emerald-400',
  CANCELLED: 'text-red-400',
  EXPIRED: 'text-red-400',
};

interface OrderSummary {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<OrderSummary[]>('/orders').then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="mb-4 text-xl font-bold">Mes commandes</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune commande pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/orders/${o.id}`}
                className="card-interactive flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-sm font-medium">Commande {o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-amber-400">
                    {formatXof(Number(o.totalAmount))}
                  </p>
                  <p className={`text-xs font-medium ${STATUS_TINT[o.status] ?? 'text-slate-400'}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

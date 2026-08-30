import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatXof } from '../../lib/format';

interface OrderRow {
  id: string;
  status: string;
  totalAmount: number;
  buyer: { phone: string };
  items: { product: { name: string }; quantity: number }[];
}

const NEXT_STATUS: Record<string, string> = {
  CONFIRMED: 'PREPARING',
  PREPARING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

const ACTION_LABEL: Record<string, string> = {
  PREPARING: 'Marquer en préparation',
  SHIPPED: 'Marquer expédiée',
  DELIVERED: 'Marquer livrée',
};

export function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  function load() {
    api.get<OrderRow[]>('/sellers/me/orders').then(setOrders);
  }

  useEffect(load, []);

  async function advance(id: string, status: string) {
    await api.patch(`/sellers/me/orders/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Mes commandes</h1>
      <div className="flex flex-col gap-3">
        {orders.map((o) => {
          const next = NEXT_STATUS[o.status];
          return (
            <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm">{o.id.slice(-8).toUpperCase()}</span>
                <span className="text-xs text-slate-500">{o.buyer.phone}</span>
              </div>
              <ul className="mb-2 text-sm text-slate-600">
                {o.items.map((item, i) => (
                  <li key={i}>{item.product.name} × {item.quantity}</li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-600">
                  {formatXof(Number(o.totalAmount))}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{o.status}</span>
                  {next && (
                    <button
                      onClick={() => advance(o.id, next)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {ACTION_LABEL[next]}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

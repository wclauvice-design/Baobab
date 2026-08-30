import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { formatXof } from '../lib/format';

const PIPELINE = ['PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const;

const STATUS_META: Record<string, { icon: string; label: string; description: string }> = {
  PENDING_PAYMENT: { icon: '🕐', label: 'Commande créée', description: 'En attente de paiement' },
  CONFIRMED: { icon: '✅', label: 'Paiement confirmé', description: 'Votre commande est confirmée' },
  PREPARING: { icon: '📦', label: 'En préparation', description: 'Le vendeur prépare votre colis' },
  SHIPPED: { icon: '🚚', label: 'Expédiée', description: 'Votre colis est en route' },
  DELIVERED: { icon: '🏠', label: 'Livrée', description: 'Colis livré' },
  CANCELLED: { icon: '❌', label: 'Annulée', description: 'La commande a été annulée' },
  EXPIRED: { icon: '⌛', label: 'Expirée', description: 'Le délai de paiement a été dépassé' },
};

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_META).map(([status, meta]) => [status, meta.label]),
);

interface DeliveryEventData {
  id: string;
  status: string;
  createdAt: string;
}

interface OrderData {
  id: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  deliveryMode: string;
  deliveryEvents: DeliveryEventData[];
  items: { id: string; productId: string; quantity: number; unitPrice: number; product: { name: string } }[];
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Timeline({ order }: { order: OrderData }) {
  const isTerminalIssue = order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const eventTime = (status: string) => order.deliveryEvents.find((e) => e.status === status)?.createdAt;

  if (isTerminalIssue) {
    return (
      <ul className="flex flex-col gap-4">
        {order.deliveryEvents.map((event) => {
          const meta = STATUS_META[event.status];
          const isFinal = event.status === order.status;
          return (
            <li key={event.id} className="flex gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                  isFinal ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {meta?.icon ?? '•'}
              </span>
              <div>
                <p className={`text-sm font-medium ${isFinal ? 'text-red-400' : 'text-slate-200'}`}>
                  {meta?.label ?? event.status}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  const currentIndex = PIPELINE.indexOf(order.status as (typeof PIPELINE)[number]);

  return (
    <ul className="flex flex-col">
      {PIPELINE.map((status, i) => {
        const meta = STATUS_META[status];
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const time = eventTime(status);
        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                  done ? 'bg-emerald-500/20 text-emerald-400 shadow-glow-emerald' : 'bg-base-700 text-slate-500'
                }`}
              >
                {meta.icon}
              </span>
              {i < PIPELINE.length - 1 && (
                <span className={`w-0.5 flex-1 ${i < currentIndex ? 'bg-emerald-400' : 'bg-base-700'}`} />
              )}
            </div>
            <div className={i < PIPELINE.length - 1 ? 'pb-6' : ''}>
              <p className={`text-sm font-medium ${isCurrent ? 'text-emerald-400' : done ? 'text-slate-200' : 'text-slate-500'}`}>
                {meta.label}
              </p>
              <p className="text-xs text-slate-500">{time ? formatDateTime(time) : meta.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [reviewSent, setReviewSent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) api.get<OrderData>(`/orders/${id}`).then(setOrder);
  }, [id]);

  async function submitReview(e: FormEvent<HTMLFormElement>, productId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api.post('/reviews', {
        productId,
        rating: Number(form.get('rating')),
        comment: form.get('comment') || undefined,
      });
      setReviewSent((prev) => ({ ...prev, [productId]: true }));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  if (!order) return <div className="p-6 text-sm text-slate-500">Chargement…</div>;

  const itemsTotal = Number(order.totalAmount) - Number(order.deliveryFee ?? 0);

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="mb-1 text-xl font-bold">Commande {order.id.slice(-6).toUpperCase()}</h1>
      <p className="mb-6 text-sm text-slate-400">{STATUS_LABELS[order.status] ?? order.status}</p>

      <div className="mb-6 rounded-xl2 bg-base-800 p-4">
        <Timeline order={order} />
      </div>

      <div className="rounded-xl2 bg-base-800 p-4">
        <p className="mb-2 text-sm text-slate-300">Livraison ({order.deliveryMode === 'EXPRESS' ? 'Express' : 'Standard'})</p>
        <p className="text-sm text-slate-400">{order.deliveryAddress}</p>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {order.items.map((item) => (
          <li key={item.id} className="rounded-xl2 bg-base-800 p-4">
            <div className="flex items-center justify-between text-sm">
              <span>{item.product.name} × {item.quantity}</span>
              <span className="text-amber-400">{formatXof(Number(item.unitPrice) * item.quantity)}</span>
            </div>

            {order.status === 'DELIVERED' && !reviewSent[item.productId] && (
              <form
                onSubmit={(e) => submitReview(e, item.productId)}
                className="mt-3 flex flex-col gap-2 border-t border-base-700 pt-3"
              >
                <select name="rating" defaultValue="5" className="rounded-lg bg-base-700 px-2 py-1 text-sm">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</option>
                  ))}
                </select>
                <textarea
                  name="comment"
                  placeholder="Votre avis (optionnel)"
                  rows={2}
                  className="rounded-lg bg-base-700 px-2 py-1 text-sm placeholder:text-slate-500"
                />
                <button className="self-start rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-base-950">
                  Envoyer l'avis
                </button>
              </form>
            )}
            {reviewSent[item.productId] && (
              <p className="mt-2 text-xs text-emerald-400">Merci pour votre avis !</p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col gap-1 rounded-xl2 bg-base-800 p-4 text-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span>Sous-total</span>
          <span>{formatXof(itemsTotal)}</span>
        </div>
        {Number(order.deliveryFee) > 0 && (
          <div className="flex items-center justify-between text-slate-400">
            <span>Frais de livraison</span>
            <span>{formatXof(Number(order.deliveryFee))}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-400">Total</span>
          <span className="font-heading text-lg font-semibold text-amber-400">
            {formatXof(Number(order.totalAmount))}
          </span>
        </div>
      </div>
    </div>
  );
}

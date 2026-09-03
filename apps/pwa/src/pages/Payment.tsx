import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

interface PaymentStatusResponse {
  orderStatus: string;
  payment: { status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED'; reference: string } | null;
}

export function Payment() {
  const { id } = useParams();
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const initiation = id
    ? JSON.parse(sessionStorage.getItem(`baobab_payment_${id}`) || 'null')
    : null;

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function poll() {
      const res = await api.get<PaymentStatusResponse>(`/orders/${id}/payment/status`);
      if (active) setStatus(res);
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  const paymentStatus = status?.payment?.status;

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-10 text-center">
      {paymentStatus === 'CONFIRMED' ? (
        <>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-4xl shadow-glow-emerald">
            ✅
          </span>
          <h1 className="mt-4 text-xl font-bold text-emerald-400">Paiement confirmé</h1>
          <p className="mt-2 text-sm text-slate-400">Votre commande est en préparation.</p>
        </>
      ) : paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED' ? (
        <>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-4xl">
            ⚠️
          </span>
          <h1 className="mt-4 text-xl font-bold text-red-400">Paiement non confirmé</h1>
          <p className="mt-2 text-sm text-slate-400">
            Contactez le support si vous pensez avoir déjà payé.
          </p>
        </>
      ) : (
        <>
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-base-700 border-t-amber-400" />
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="mt-4 text-xl font-bold">Paiement en cours de vérification</h1>
          <p className="mt-2 text-sm text-slate-400">Confirmation sous 5 à 15 minutes.</p>

          {initiation && (
            <div className="card mt-6 p-4 text-left text-sm">
              <p className="text-slate-300">{initiation.instructions}</p>
              {status?.payment?.reference && (
                <p className="mt-3 font-heading text-lg font-semibold tabular-nums text-amber-400">
                  Référence : {status.payment.reference}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <Link to={`/orders/${id}`} className="btn-ghost mt-8 inline-flex">
        Suivre ma commande
      </Link>
    </div>
  );
}

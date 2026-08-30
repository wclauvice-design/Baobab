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
          <p className="text-5xl">✅</p>
          <h1 className="mt-4 text-xl font-bold text-emerald-400">Paiement confirmé</h1>
          <p className="mt-2 text-sm text-slate-400">Votre commande est en préparation.</p>
        </>
      ) : paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED' ? (
        <>
          <p className="text-5xl">⚠️</p>
          <h1 className="mt-4 text-xl font-bold text-red-400">Paiement non confirmé</h1>
          <p className="mt-2 text-sm text-slate-400">
            Contactez le support si vous pensez avoir déjà payé.
          </p>
        </>
      ) : (
        <>
          <p className="text-5xl animate-pulse">⏳</p>
          <h1 className="mt-4 text-xl font-bold">Paiement en cours de vérification</h1>
          <p className="mt-2 text-sm text-slate-400">Confirmation sous 5 à 15 minutes.</p>

          {initiation && (
            <div className="mt-6 rounded-xl2 bg-base-800 p-4 text-left text-sm">
              <p className="text-slate-300">{initiation.instructions}</p>
              {status?.payment?.reference && (
                <p className="mt-3 font-heading text-lg font-semibold text-amber-400">
                  Référence : {status.payment.reference}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <Link
        to={`/orders/${id}`}
        className="mt-8 inline-block text-sm text-amber-400 underline"
      >
        Suivre ma commande
      </Link>
    </div>
  );
}

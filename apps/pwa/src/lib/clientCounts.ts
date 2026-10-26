import { useEffect, useState } from 'react';
import { api, getToken } from './api';

/**
 * Compteurs rouges côté client (PWA).
 * - `toPay`  : commandes en attente de paiement
 * - `quotes` : devis reçus qui attendent la confirmation du client
 *
 * Les valeurs retombent à 0 automatiquement après traitement, sans cache.
 */
export interface PendingClientCounts {
  toPay: number;
  quotes: number;
  total: number;
}

const EMPTY: PendingClientCounts = { toPay: 0, quotes: 0, total: 0 };

export function usePendingClientCounts(): PendingClientCounts {
  const [counts, setCounts] = useState<PendingClientCounts>(EMPTY);

  useEffect(() => {
    if (!getToken()) return;

    let active = true;
    const load = async () => {
      try {
        const [orders, trade] = await Promise.all([
          api.get<any[]>('/orders').catch(() => []),
          api.get<any>('/concierge/mine').catch(() => null),
        ]);
        if (!active) return;

        const toPay = (Array.isArray(orders) ? orders : []).filter(
          (o: any) => o.status === 'PENDING_PAYMENT' && o.payment?.status !== 'CONFIRMED',
        ).length;

        const quotes = (trade?.orders || []).filter(
          (o: any) => o.status === 'QUOTED',
        ).length;

        setCounts({ toPay, quotes, total: toPay + quotes });
      } catch {
        // silencieux : le badge ne doit jamais casser la navigation
      }
    };

    load();
    const timer = setInterval(load, 30000);
    const onRefresh = () => load();
    window.addEventListener('baobab:refresh-client-counts', onRefresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('baobab:refresh-client-counts', onRefresh);
    };
  }, []);

  return counts;
}

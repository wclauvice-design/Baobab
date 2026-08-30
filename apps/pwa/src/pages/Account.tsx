import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, ApiError } from '../lib/api';
import { formatXof } from '../lib/format';

const SUPPORT_WHATSAPP_NUMBER = '2250700000000';

interface Coupon {
  id: string;
}

const MENU_ITEMS = [
  { to: '/orders', icon: '📦', label: 'Mes commandes' },
  { to: '/account/messages', icon: '💬', label: 'Messages' },
  { to: '/account/reviews', icon: '⭐', label: 'Mes avis' },
  { to: '/account/history', icon: '🕘', label: 'Historique' },
  { to: '/account/addresses', icon: '📍', label: 'Adresses' },
  { to: '/account/following', icon: '❤️', label: 'Abonnements' },
];

export function Account() {
  const { user } = useAuth();
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [couponCount, setCouponCount] = useState(0);

  useEffect(() => {
    api
      .get<Coupon[]>('/coupons')
      .then((coupons) => setCouponCount(coupons.length))
      .catch(() => {});
  }, []);

  async function registerSeller(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api.post('/sellers/register', {
        shopName: form.get('shopName'),
        city: form.get('city'),
      });
      setMessage('Demande envoyée ! Un admin va vérifier votre boutique.');
      setShowSellerForm(false);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Mon compte</h1>
          <p className="text-sm text-slate-400">{user?.phone}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            title="Contacter le support"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-base-800 text-lg"
          >
            💬
          </a>
          <Link
            to="/account/settings"
            title="Paramètres"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-base-800 text-lg"
          >
            ⚙️
          </Link>
        </div>
      </div>

      <div className="rounded-xl2 bg-base-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Solde crédit</p>
            <p className="font-heading text-lg font-semibold text-amber-400">
              {formatXof(Number(user?.creditBalance ?? 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Coupons &amp; offres</p>
            <p className="font-heading text-lg font-semibold text-emerald-400">{couponCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1.5 rounded-xl2 bg-base-800 py-4 text-center"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[11px] text-slate-300">{item.label}</span>
          </Link>
        ))}
      </div>

      {user?.role === 'BUYER' && (
        <div className="mt-4 rounded-xl2 bg-base-800 p-4">
          <p className="mb-2 text-sm text-slate-300">Vous vendez des produits ?</p>
          {showSellerForm ? (
            <form onSubmit={registerSeller} className="flex flex-col gap-2">
              <input
                name="shopName"
                required
                placeholder="Nom de la boutique"
                className="rounded-lg bg-base-700 px-3 py-2 text-sm placeholder:text-slate-500"
              />
              <input
                name="city"
                required
                placeholder="Ville"
                className="rounded-lg bg-base-700 px-3 py-2 text-sm placeholder:text-slate-500"
              />
              <button className="mt-1 self-start rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-base-950">
                Devenir vendeur partenaire
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowSellerForm(true)}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-base-950"
            >
              Devenir vendeur partenaire
            </button>
          )}
        </div>
      )}

      {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
    </div>
  );
}

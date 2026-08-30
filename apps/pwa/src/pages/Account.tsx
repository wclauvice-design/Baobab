import { FormEvent, useState } from 'react';
import { useAuth } from '../lib/auth';
import { api, ApiError } from '../lib/api';

export function Account() {
  const { user, logout } = useAuth();
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      <h1 className="mb-4 text-xl font-bold">Mon compte</h1>

      <div className="rounded-xl2 bg-base-800 p-4">
        <p className="text-sm text-slate-400">Téléphone</p>
        <p className="font-medium">{user?.phone}</p>
        <p className="mt-2 text-sm text-slate-400">Rôle</p>
        <p className="font-medium">{user?.role}</p>
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

      <button onClick={logout} className="mt-6 text-sm text-slate-500 underline">
        Se déconnecter
      </button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface FollowEntry {
  id: string;
  sellerId: string;
  seller: { id: string; shopName: string; city: string };
}

export function Following() {
  const [follows, setFollows] = useState<FollowEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get<FollowEntry[]>('/sellers/following')
      .then(setFollows)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function unfollow(sellerId: string) {
    await api.delete(`/sellers/${sellerId}/follow`);
    load();
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/account" className="text-slate-400">←</Link>
        <h1 className="text-xl font-bold">Boutiques suivies</h1>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : follows.length === 0 ? (
        <p className="text-sm text-slate-500">
          Vous ne suivez aucune boutique. Suivez un vendeur depuis une fiche produit.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {follows.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-xl2 bg-base-800 p-4">
              <div>
                <p className="text-sm font-medium">{f.seller.shopName}</p>
                <p className="text-xs text-slate-400">{f.seller.city}</p>
              </div>
              <button onClick={() => unfollow(f.sellerId)} className="text-xs text-slate-400 underline">
                Ne plus suivre
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

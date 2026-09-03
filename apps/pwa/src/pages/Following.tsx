import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';

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
        <PageLoader />
      ) : follows.length === 0 ? (
        <p className="text-sm text-slate-500">
          Vous ne suivez aucune boutique. Suivez un vendeur depuis une fiche produit.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {follows.map((f) => (
            <li key={f.id} className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl2 bg-gradient-to-br from-rose-500/20 to-rose-600/5 text-rose-400">
                  🏪
                </span>
                <div>
                  <p className="text-sm font-medium">{f.seller.shopName}</p>
                  <p className="text-xs text-slate-400">{f.seller.city}</p>
                </div>
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

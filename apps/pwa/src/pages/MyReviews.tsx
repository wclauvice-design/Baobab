import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';

interface MyReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  product: { id: string; name: string };
}

export function MyReviews() {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<MyReview[]>('/reviews/mine')
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/account" className="text-slate-400">←</Link>
        <h1 className="text-xl font-bold">Mes avis</h1>
      </div>

      {loading ? (
        <PageLoader />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500">
          Vous n'avez pas encore laissé d'avis. Ils apparaissent ici après la livraison d'une commande.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="card p-4">
              <Link to={`/products/${r.product.id}`} className="text-sm font-medium hover:underline">
                {r.product.name}
              </Link>
              <div className="mt-1 text-amber-400">
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </div>
              {r.comment && <p className="mt-1 text-sm text-slate-300">{r.comment}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {new Date(r.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

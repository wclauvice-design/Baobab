import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { clearHistory, getHistory } from '../lib/history';
import { Product, ProductCard } from '../components/ProductCard';

export function BrowsingHistory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getHistory();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id) => api.get<Product>(`/products/${id}`).catch(() => null)))
      .then((results) => setProducts(results.filter((p): p is Product => p !== null)))
      .finally(() => setLoading(false));
  }, []);

  function handleClear() {
    clearHistory();
    setProducts([]);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/account" className="text-slate-400">←</Link>
          <h1 className="text-xl font-bold">Historique</h1>
        </div>
        {products.length > 0 && (
          <button onClick={handleClear} className="text-xs text-slate-400 underline">
            Effacer
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun produit consulté récemment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Product, ProductCard } from '../components/ProductCard';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Catalog({ autoFocusSearch = false }: { autoFocusSearch?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    api
      .get<Product[]>(`/products?${params.toString()}`)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [search, categoryId]);

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold">Baobab</h1>

      <input
        autoFocus={autoFocusSearch}
        type="search"
        placeholder="Rechercher un produit..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-xl2 border border-base-700 bg-base-800 px-4 py-3 text-sm placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryId(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${
            categoryId === null ? 'bg-amber-500 text-base-950' : 'bg-base-800 text-slate-300'
          }`}
        >
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${
              categoryId === c.id ? 'bg-amber-500 text-base-950' : 'bg-base-800 text-slate-300'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun produit trouvé.</p>
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

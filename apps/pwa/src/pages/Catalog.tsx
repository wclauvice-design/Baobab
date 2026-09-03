import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Product, ProductCard, ProductCardSkeleton } from '../components/ProductCard';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'mode-accessoires': '👗',
  'maison-cuisine': '🍽️',
  electronique: '🔌',
  'beaute-bien-etre': '💄',
};

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

  const deals = products.filter((p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price));

  return (
    <div className="mx-auto max-w-md pb-24 pt-6">
      <div className="px-4">
        <h1 className="mb-4 bg-flame bg-clip-text text-2xl font-bold text-transparent">Baobab</h1>

        <input
          autoFocus={autoFocusSearch}
          type="search"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mb-4 text-sm"
        />

        <div className="relative mb-5 overflow-hidden rounded-xl2 border border-white/[0.06] bg-aurora px-4 py-3 text-xs text-slate-300 shadow-card">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>🚚 Livraison standard ou express</span>
            <span className="text-slate-600">·</span>
            <span>💵 Paiement à la livraison disponible</span>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-4 overflow-x-auto px-4 pb-1">
        <button onClick={() => setCategoryId(null)} className="flex shrink-0 flex-col items-center gap-1.5">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all duration-200 ${
              categoryId === null
                ? 'bg-flame text-base-950 shadow-glow'
                : 'bg-base-800 hover:-translate-y-0.5'
            }`}
          >
            🛍️
          </span>
          <span className={`text-[11px] ${categoryId === null ? 'text-amber-400' : 'text-slate-300'}`}>Tout</span>
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCategoryId(c.id)} className="flex shrink-0 flex-col items-center gap-1.5">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all duration-200 ${
                categoryId === c.id
                  ? 'bg-flame text-base-950 shadow-glow'
                  : 'bg-base-800 hover:-translate-y-0.5'
              }`}
            >
              {CATEGORY_ICONS[c.slug] ?? '🛍️'}
            </span>
            <span className={`w-16 truncate text-center text-[11px] ${categoryId === c.id ? 'text-amber-400' : 'text-slate-300'}`}>
              {c.name}
            </span>
          </button>
        ))}
      </div>

      {!loading && deals.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-1.5 px-4">
            <span className="inline-block animate-float text-base">🔥</span>
            <h2 className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-sm font-bold text-transparent">
              Offres du moment
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1">
            {deals.map((p) => (
              <div key={p.id} className="w-36 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun produit trouvé.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

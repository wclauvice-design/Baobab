import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Product, ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import {
  BaobabWordmark,
  IconBeauty,
  IconCash,
  IconElectronics,
  IconFashion,
  IconFire,
  IconGrid,
  IconHomeGoods,
  IconTruck,
} from '../components/icons';
import { ComponentType } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  'mode-accessoires': IconFashion,
  'maison-cuisine': IconHomeGoods,
  electronique: IconElectronics,
  'beaute-bien-etre': IconBeauty,
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
        <BaobabWordmark className="mb-4" textClassName="text-2xl" />

        <input
          autoFocus={autoFocusSearch}
          type="search"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mb-4 text-sm"
        />

        <div className="relative mb-5 overflow-hidden rounded-xl2 border border-white/[0.06] bg-aurora px-4 py-3 text-xs text-slate-300 shadow-card">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="flex items-center gap-1.5">
              <IconTruck className="h-4 w-4 text-amber-400" /> Livraison standard ou express
            </span>
            <span className="flex items-center gap-1.5">
              <IconCash className="h-4 w-4 text-emerald-400" /> Paiement à la livraison disponible
            </span>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-4 overflow-x-auto px-4 pb-1">
        <button onClick={() => setCategoryId(null)} className="flex shrink-0 flex-col items-center gap-1.5">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
              categoryId === null
                ? 'bg-flame text-base-950 shadow-glow'
                : 'bg-base-800 text-slate-300 hover:-translate-y-0.5'
            }`}
          >
            <IconGrid className="h-5 w-5" />
          </span>
          <span className={`text-[11px] ${categoryId === null ? 'text-amber-400' : 'text-slate-300'}`}>Tout</span>
        </button>
        {categories.map((c) => {
          const CategoryIcon = CATEGORY_ICONS[c.slug] ?? IconGrid;
          return (
            <button key={c.id} onClick={() => setCategoryId(c.id)} className="flex shrink-0 flex-col items-center gap-1.5">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  categoryId === c.id
                    ? 'bg-flame text-base-950 shadow-glow'
                    : 'bg-base-800 text-slate-300 hover:-translate-y-0.5'
                }`}
              >
                <CategoryIcon className="h-5 w-5" />
              </span>
              <span className={`w-16 truncate text-center text-[11px] ${categoryId === c.id ? 'text-amber-400' : 'text-slate-300'}`}>
                {c.name}
              </span>
            </button>
          );
        })}
      </div>

      {!loading && deals.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-1.5 px-4">
            <IconFire className="h-4 w-4 animate-float" />
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

import { Link } from 'react-router-dom';
import { formatXof } from '../lib/format';

export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  category?: { name: string };
  avgRating?: number | null;
  reviewCount?: number;
  soldCount?: number;
}

function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(Number(product.price), product.compareAtPrice ? Number(product.compareAtPrice) : null);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl2 bg-base-800 shadow-sm transition-shadow hover:shadow-glow"
    >
      <div className="relative flex aspect-square items-center justify-center bg-base-700 text-3xl">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span>🧺</span>
        )}
        {discount && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.category && (
          <span className="text-[11px] uppercase tracking-wide text-emerald-400">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-slate-100">{product.name}</h3>

        {(product.avgRating || product.soldCount) ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {product.avgRating && (
              <span className="flex items-center gap-0.5 text-amber-400">
                ★ {Number(product.avgRating).toFixed(1)}
              </span>
            )}
            {!!product.soldCount && <span>{product.soldCount} vendu{product.soldCount > 1 ? 's' : ''}</span>}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-1 pt-1">
          <div className="flex flex-col">
            <span className="font-heading text-sm font-semibold text-amber-400">
              {formatXof(Number(product.price))}
            </span>
            {discount && (
              <span className="text-[11px] text-slate-500 line-through">
                {formatXof(Number(product.compareAtPrice))}
              </span>
            )}
          </div>
          {product.stock === 0 && (
            <span className="text-[10px] text-slate-500">Rupture</span>
          )}
        </div>
      </div>
    </Link>
  );
}

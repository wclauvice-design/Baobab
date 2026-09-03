import { Link } from 'react-router-dom';
import { formatXof } from '../lib/format';
import { BaobabMark, IconStar } from './icons';

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
      className="card-interactive group flex flex-col overflow-hidden"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-base-700 to-base-800">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <BaobabMark className="h-10 w-10 opacity-30" />
        )}
        {discount && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-flame px-1.5 py-0.5 text-[10px] font-bold text-base-950 shadow-glow">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-950/70 backdrop-blur-[1px]">
            <span className="rounded-full border border-white/10 bg-base-900/80 px-2.5 py-1 text-[10px] font-medium text-slate-300">
              Rupture de stock
            </span>
          </div>
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
              <span className="flex items-center gap-1 text-amber-400">
                <IconStar className="h-3 w-3" /> {Number(product.avgRating).toFixed(1)}
              </span>
            )}
            {!!product.soldCount && <span>{product.soldCount} vendu{product.soldCount > 1 ? 's' : ''}</span>}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-1 pt-1">
          <div className="flex flex-col">
            <span className="font-heading text-sm font-semibold tabular-nums text-amber-400">
              {formatXof(Number(product.price))}
            </span>
            {discount && (
              <span className="text-[11px] tabular-nums text-slate-500 line-through">
                {formatXof(Number(product.compareAtPrice))}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="skeleton aspect-square" />
      <div className="flex flex-col gap-2 p-3">
        <div className="skeleton h-2.5 w-1/3" />
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-2/3" />
        <div className="skeleton mt-1 h-4 w-1/2" />
      </div>
    </div>
  );
}

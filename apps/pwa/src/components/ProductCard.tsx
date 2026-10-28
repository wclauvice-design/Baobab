import { Link } from 'react-router-dom';
import { useCurrency } from '../lib/currency';
import { WestzoneMark, IconStar } from './icons';
import { isVehicleProduct } from '../lib/vehicles';
import { isVideoUrl } from '../lib/media';
import { VehicleCard } from './VehicleCard';

export interface Product {
  id: string;
  name: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  stock: number;
  images: string[];
  category?: { name: string; slug?: string; universe?: string };
  subcategory?: string;
  condition?: string;
  location?: string;
  attributes?: Record<string, any>;
  seller?: { shopName: string; id?: string };
  avgRating?: number | null;
  reviewCount?: number;
  soldCount?: number;
}

function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function ProductCard({ product }: { product: Product }) {
  const { format } = useCurrency();
  // If product is an actual vehicle, render dedicated Dubizzle Motors vehicle card
  if (isVehicleProduct(product)) {
    return <VehicleCard product={product} />;
  }

  const discount = discountPercent(Number(product.price), product.compareAtPrice ? Number(product.compareAtPrice) : null);

  return (
    <Link
      to={`/products/${product.id}`}
      state={{ product }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgba(23,62,50,0.04)] hover:border-[#0B1E17]/30 hover:shadow-[0_10px_24px_-18px_rgba(23,62,50,0.45)] transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-50">
        {product.images[0] ? (
          isVideoUrl(product.images[0]) ? (
            <video
              src={product.images[0]}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              aria-label={product.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )
        ) : (
          <WestzoneMark className="h-10 w-10 text-slate-500 opacity-30" />
        )}
        {discount && (
          <span className="absolute left-2 top-2 rounded-md bg-[#B85732] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
            -{discount}%
          </span>
        )}
        {product.condition && (
          <span className="absolute right-2 top-2 rounded-md bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-[#0B1E17] border border-[#E2E8F0] shadow-sm">
            {product.condition === 'NEW' ? 'Neuf' : product.condition === 'REFURBISHED' ? 'Reconditionné' : 'Occasion'}
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-black/75 px-3 py-1 text-[11px] font-bold text-white border border-white/20">
              Rupture de stock
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {product.category && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-xs sm:text-sm font-medium text-[#0B1E17] leading-snug">
          {product.name}
        </h3>

        {(product.avgRating || product.soldCount) ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
            {product.avgRating && (
              <span className="flex items-center gap-1 text-amber-800 font-semibold">
                <IconStar className="h-3 w-3 fill-current text-[#E8A33D]" /> {Number(product.avgRating).toFixed(1)}
              </span>
            )}
            {!!product.soldCount && <span>{product.soldCount} vendu{product.soldCount > 1 ? 's' : ''}</span>}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-1 pt-2">
          <div className="flex flex-col">
            <span className="font-heading text-sm sm:text-base font-bold tabular-nums text-[#0B1E17]">
              {format(Number(product.price))}
            </span>
            {discount && (
              <span className="text-[11px] tabular-nums text-slate-500 line-through">
                {format(Number(product.compareAtPrice))}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-emerald-700">
            ✓ Dubaï
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] animate-pulse">
      <div className="aspect-square bg-slate-50" />
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="h-3 w-16 rounded bg-[#E6E1D4]" />
        <div className="h-4 w-full rounded bg-[#E6E1D4]" />
        <div className="mt-auto h-4 w-20 rounded bg-[#E6E1D4]" />
      </div>
    </div>
  );
}

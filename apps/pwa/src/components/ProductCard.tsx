import { Link } from 'react-router-dom';
import { formatXof } from '../lib/format';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  category?: { name: string };
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl2 bg-base-800 shadow-sm transition-shadow hover:shadow-glow"
    >
      <div className="flex aspect-square items-center justify-center bg-base-700 text-3xl">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span>🧺</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.category && (
          <span className="text-[11px] uppercase tracking-wide text-emerald-400">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-slate-100">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-heading text-sm font-semibold text-amber-400">
            {formatXof(product.price)}
          </span>
          {product.stock === 0 && (
            <span className="text-[10px] text-slate-500">Rupture</span>
          )}
        </div>
      </div>
    </Link>
  );
}

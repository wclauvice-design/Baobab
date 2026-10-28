import { ProductVideo } from './ProductVideo';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../lib/currency';
import { parseVehicleData } from '../lib/vehicles';
import { isVideoUrl, videoPoster } from '../lib/media';
import { IconHeart } from './icons';

export interface VehicleProduct {
  id: string;
  name: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  stock?: number;
  images: string[];
  category?: { name: string; slug?: string; universe?: string };
  subcategory?: string;
  condition?: string;
  location?: string;
  attributes?: Record<string, any>;
  seller?: { shopName: string; id?: string };
}

export function VehicleCard({
  product,
  isFavorite = false,
  onToggleFavorite,
}: {
  product: VehicleProduct;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const { format } = useCurrency();
  const specs = parseVehicleData(product);
  const image = product.images?.find((url) => !/https:\/\/(?:images\.)?unsplash\.com\//i.test(url));

  return (
    <article className="visual-product-card group">
      <Link
        to={`/products/${product.id}`}
        state={{ product }}
        className="visual-product-photo"
        aria-label={product.name}
      >
        {image && !failed ? (
          isVideoUrl(image) ? (
            <ProductVideo
              src={image}
              label={product.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              poster={videoPoster(product.images)} preview
            />
          ) : (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )
        ) : (
          <span className="visual-photo-missing">Photo à venir</span>
        )}
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          className="visual-product-favorite"
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(product.id)}
        >
          <IconHeart className={`h-4 w-4 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
        </button>
      )}

      {/* Badges d'état Dubizzle Motors */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
        <span
          className={`picture-tag condition-tag condition-${String(
            product.condition || 'USED'
          ).toLowerCase()}`}
        >
          {product.condition === 'NEW'
            ? 'Neuf · 0 km'
            : product.condition === 'REFURBISHED'
            ? 'Reconditionné'
            : 'Occasion'}
        </span>
      </div>

      <Link
        to={`/products/${product.id}`}
        state={{ product }}
        className="visual-product-caption"
      >
        <h3 title={product.name}>{product.name}</h3>

        {/* Ligne de spécifications automobiles immédiates (Dubizzle Motors) */}
        <div className="vehicle-specs-row flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-medium">
          <span>{specs.year || '2024'}</span>
          <span>·</span>
          <span>{specs.mileage || '0 km'}</span>
          <span>·</span>
          <span>{specs.fuelType || 'Essence'}</span>
        </div>

        <strong className="mt-1.5">{format(Number(product.price || 0))}</strong>

        <div className="listing-meta mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>{product.location || 'Dubaï'} · GCC Specs</span>
          <span className="text-emerald-700 font-semibold">✓ Sérénité</span>
        </div>
      </Link>
    </article>
  );
}

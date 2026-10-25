import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatXof } from '../lib/format';
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

export function VehicleCard({ product, isFavorite = false, onToggleFavorite }: {
  product: VehicleProduct;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const image = product.images?.find(url => !/https:\/\/(?:images\.)?unsplash\.com\//i.test(url));
  return (
    <article className="visual-product-card">
      <Link to={`/products/${product.id}`} className="visual-product-photo" aria-label={product.name}>
        {image && !failed ? (
          <img src={image} alt={product.name} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        ) : <span className="visual-photo-missing">Photo à venir</span>}
      </Link>
      {onToggleFavorite && <button type="button" className="visual-product-favorite"
        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={isFavorite}
        onClick={() => onToggleFavorite(product.id)}>
        <IconHeart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>}
      <Link to={`/products/${product.id}`} className="visual-product-caption">
        <h3 title={product.name}>{product.name}</h3>
        <strong>{formatXof(Number(product.price || 0))}</strong>
      </Link>
    </article>
  );
}

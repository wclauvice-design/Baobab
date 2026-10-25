import { Link } from 'react-router-dom';
import { formatXof } from '../lib/format';
import { parseVehicleData } from '../lib/vehicles';
import { BaobabMark, IconHeart, IconLocation } from './icons';

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
  const specs = parseVehicleData(product);
  const numPhotos = product.images?.length || 1;
  const mainImage = product.images?.[0];
  const price = Number(product.price || 0);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 to-slate-950 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10">
      {/* Photo Container - Automotive Aspect Ratio (16:10) */}
      <Link to={`/products/${product.id}`} className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-950">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
            <BaobabMark className="h-12 w-12 opacity-30" />
          </div>
        )}

        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges: Condition & Origin */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
          <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold shadow-md backdrop-blur-xs ${specs.conditionBadgeClass}`}>
            {specs.conditionLabel}
          </span>
          <span className="rounded-md border border-slate-600/80 bg-slate-900/85 px-2 py-0.5 text-[10.5px] font-semibold text-slate-200 shadow-md backdrop-blur-xs">
            🇦🇪 Dubaï Export
          </span>
          {discount && (
            <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10.5px] font-bold text-white shadow-md">
              -{discount}%
            </span>
          )}
        </div>

        {/* Top Right: Favorite Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-95 ${
              isFavorite
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <IconHeart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Bottom Photo Badges: Photo Counter (Dubizzle style 📷 15) */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-bold text-slate-200 backdrop-blur-xs shadow-xs">
          <span>📷</span>
          <span>{numPhotos} photo{numPhotos > 1 ? 's' : ''}</span>
        </div>

        {/* Regional Specs tag (bottom left) */}
        <div className="absolute bottom-2.5 left-3">
          <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-amber-300 backdrop-blur-xs border border-amber-500/30">
            {specs.regionalSpecs}
          </span>
        </div>
      </Link>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Price Header (Large, Dubizzle style) */}
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div>
              <div className="font-heading text-xl font-black text-amber-400 tracking-tight">
                {formatXof(price)}
              </div>
              {compareAt && compareAt > price && (
                <div className="text-xs text-slate-500 line-through">
                  {formatXof(compareAt)}
                </div>
              )}
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
              +15% Marge Incluse
            </span>
          </div>

          {/* Car Title */}
          <Link to={`/products/${product.id}`}>
            <h3 className="line-clamp-2 text-base font-bold text-slate-100 transition-colors group-hover:text-amber-300">
              {product.name}
            </h3>
          </Link>

          {/* Dubizzle Key Specs Bar (Icons + Badges) */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-800/60 p-2 text-xs border border-slate-700/40">
            <div className="flex items-center gap-1 font-semibold text-slate-200" title="Année du modèle">
              <span className="text-amber-400">📅</span>
              <span>{specs.year}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 font-semibold text-slate-200" title="Kilométrage">
              <span className="text-amber-400">⏱</span>
              <span>{specs.mileage}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-slate-300" title="Type de carburant">
              <span>⛽</span>
              <span>{specs.fuelType}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-slate-300" title="Boîte de vitesses">
              <span>🕹</span>
              <span>{specs.transmission}</span>
            </div>
            {specs.seatingCapacity && (
              <>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-1 text-slate-300" title="Nombre de places">
                  <span>💺</span>
                  <span>{specs.seatingCapacity}</span>
                </div>
              </>
            )}
          </div>

          {/* Origin & Transit note */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <IconLocation className="h-3 w-3 text-amber-500" />
              <span>{product.location || 'Dubaï (Entrepôt Export)'}</span>
            </span>
            <span className="text-emerald-400 font-medium">
              🚢 Transit vers Sahel
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800/80">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-center text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 shadow-md shadow-amber-500/20"
          >
            Voir la fiche technique →
          </Link>
          <a
            href={`https://wa.me/22676950089?text=${encodeURIComponent(
              `Bonjour Baobab, je suis intéressé par le véhicule : ${product.name} (${formatXof(price)}). Pouvez-vous me donner les détails d'expédition et formalités ?`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-500"
            title="Poser une question sur WhatsApp"
          >
            💬
          </a>
        </div>
      </div>
    </div>
  );
}

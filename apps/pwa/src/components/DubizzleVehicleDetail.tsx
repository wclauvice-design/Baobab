import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatXof } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { parseVehicleData, VehicleSpecs } from '../lib/vehicles';
import { isVideoUrl } from '../lib/media';
import { IconHeart, IconLocation } from './icons';

interface DubizzleVehicleDetailProps {
  product: any;
  destination: any;
  onDiscuss: () => void;
  busy?: boolean;
}

export function DubizzleVehicleDetail({
  product,
  destination,
  onDiscuss,
  busy = false,
}: DubizzleVehicleDetailProps) {
  const navigate = useNavigate();
  const { format } = useCurrency();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    entertainment: false,
    comfort: false,
    exterior: false,
  });

  const specs = parseVehicleData(product);
  const photos: string[] = (product.images || []).filter((url: string) => !/https:\/\/(?:images\.)?unsplash\.com\//i.test(url));
  const images = photos.length ? photos : ['/photos/placeholder.svg'];
  const price = Number(product.price || 0);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour Baobab,\nJe suis très intéressé par le véhicule :\n*${product.name}*\nPrix : *${formatXof(price)}*\nAnnée : ${specs.year} | Kilométrage : ${specs.mileage} | Carburant : ${specs.fuelType}\nDestination souhaitée : ${destination?.name || 'Burkina Faso'}.\nPouvez-vous me transmettre la facture proforma et les modalités de transport ?`
  );

  const rawDescription = product.description || '';
  const isLongDesc = rawDescription.length > 240;
  const displayedDesc = isLongDesc && !showFullDesc ? `${rawDescription.slice(0, 240)}…` : rawDescription;

  return (
    <div className="product-detail-page mx-auto max-w-4xl pb-28 text-slate-100">
      {/* Top back navigation bar */}
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-slate-300 hover:text-amber-400 font-semibold transition-colors"
        >
          <span>←</span>
          <span>Retour aux annonces</span>
        </button>

        <span className="text-slate-400">
          Motors / {specs.brand} / {specs.model}
        </span>
      </div>

      {/* 1. VISUEL HERO SUPÉRIEUR (Image en partie supérieure de l'écran - Acheter par la vue) */}
      <div className="product-detail-hero relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl">
        {isVideoUrl(images[activePhotoIdx]) ? (
          <video
            key={images[activePhotoIdx]}
            src={images[activePhotoIdx]}
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
            aria-label={product.name}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
        ) : (
          <img
            src={images[activePhotoIdx]}
            alt={product.name}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
        )}

        {/* Compteur photo Dubizzle en haut à gauche : 📷 1 / 15 */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10 shadow-lg">
          <span>📷</span>
          <span>{photos.length ? `${activePhotoIdx + 1} / ${photos.length}` : 'Photo à venir'}</span>
        </div>

        {/* Actions Favoris & Partage en haut à droite */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-lg ${
              isFavorite
                ? 'bg-rose-500 text-white scale-105 shadow-rose-500/40'
                : 'bg-black/60 text-white hover:bg-black/80 hover:scale-105'
            }`}
            title="Favoris"
          >
            <IconHeart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Lien de l’annonce copié dans le presse-papier !');
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:scale-105 shadow-lg"
            title="Partager"
          >
            ↗
          </button>
        </div>

        {/* Flèches de défilement rapide sur la photo */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/90 shadow-lg"
              aria-label="Photo précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActivePhotoIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/90 shadow-lg"
              aria-label="Photo suivante"
            >
              ›
            </button>
          </>
        )}

        {/* Badges d'état et d'origine en bas à gauche de la photo */}
        <div className="absolute bottom-3.5 left-3.5 flex flex-wrap gap-2">
          <span className={`rounded-md border px-2.5 py-1 text-xs font-black shadow-lg backdrop-blur-md ${specs.conditionBadgeClass}`}>
            {specs.conditionLabel}
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur-md">
            🇦🇪 Dubaï Export
          </span>
          {discount && (
            <span className="rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* Galerie de miniatures immédiatement sous la photo principale */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActivePhotoIdx(i)}
              aria-label={`Afficher la photo ${i + 1}`}
              aria-pressed={activePhotoIdx === i}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                activePhotoIdx === i
                  ? 'border-amber-400 ring-2 ring-amber-400/30 scale-102'
                  : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              {isVideoUrl(img) ? (
                <video
                  src={img}
                  muted
                  playsInline
                  loop
                  autoPlay
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img src={img} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 2. NOM & PRIX (Immédiatement après les images) */}
      <div className="product-detail-summary mt-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm">
        {/* Prix mis en avant en grand */}
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                {format(price)}
              </span>
              {discount && (
                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                  Économie de {discount}%
                </span>
              )}
            </div>
            {compareAt && compareAt > price && (
              <p className="text-sm text-slate-500 line-through">
                Prix catalogue : {format(compareAt)}
              </p>
            )}
          </div>


        </div>

        {/* Nom du véhicule (Titre) */}
        <h1 className="mt-3 text-xl sm:text-2xl font-black text-slate-100 leading-snug">
          {product.name}
        </h1>

        <p className="product-detail-meta">{specs.year} · {specs.mileage} · {specs.fuelType}</p>
      </div>

      {/* 3. DESCRIPTION AVEC OPTION « VOIR PLUS... » (Ensuite, directement après nom et prix) */}
      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
        <h2 className="text-base sm:text-lg font-black text-slate-100 mb-2 flex items-center gap-2">
          À propos du véhicule
        </h2>

        <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {displayedDesc}
        </div>

        {/* Bouton interactif Voir plus... / Voir moins */}
        {isLongDesc && (
          <button
            type="button"
            onClick={() => setShowFullDesc(!showFullDesc)}
            aria-expanded={showFullDesc}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>{showFullDesc ? '▲ Voir moins' : '▼ Voir plus de détails...'}</span>
          </button>
        )}


      </div>

      <details className="product-detail-section">
        <summary>Caractéristiques du véhicule</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 text-sm">
          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Trim / Finition</span>
            <strong className="font-bold text-slate-100">{specs.trim}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">État du véhicule</span>
            <strong className="font-bold text-amber-400">{specs.conditionLabel}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Couleur Intérieure</span>
            <strong className="font-bold text-slate-100">{specs.interiorColor}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Couleur Extérieure</span>
            <strong className="font-bold text-slate-100">{specs.exteriorColor}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Côté Direction</span>
            <strong className="font-bold text-slate-100">{specs.steeringSide}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Puissance</span>
            <strong className="font-bold text-slate-100">{specs.horsepower}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Nombre de Portes</span>
            <strong className="font-bold text-slate-100">{specs.doors}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Type de Carrosserie</span>
            <strong className="font-bold text-slate-100">{specs.bodyType}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Nombre de Cylindres</span>
            <strong className="font-bold text-slate-100">{specs.cylinders}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Type de Carburant</span>
            <strong className="font-bold text-slate-100">{specs.fuelType}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Nombre de Places</span>
            <strong className="font-bold text-slate-100">{specs.seatingCapacity}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Boîte de Vitesses</span>
            <strong className="font-bold text-slate-100">{specs.transmission}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Moteur / Cylindrée</span>
            <strong className="font-bold text-slate-100">{specs.engine}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Transmission / Motricité</span>
            <strong className="font-bold text-slate-100">{specs.drivetrain}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Vendeur vérifié</span>
            <strong className="font-bold text-emerald-400">{product.seller?.shopName || 'Baobab Dubaï Officiel'}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
            <span className="text-slate-400">Garantie & Sérénité</span>
            <strong className="font-bold text-slate-100">{specs.warranty}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2 sm:col-span-2">
            <span className="text-slate-400">Marché cible</span>
            <strong className="font-bold text-amber-300">{specs.targetMarket}</strong>
          </div>
        </div>
      </details>

      {/* 5. FEATURES / ÉQUIPEMENTS & OPTIONS (Dubizzle Accordions) */}
      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
            Équipements
          </h2>

        </div>

        <div className="space-y-3">
          {/* Section 1: Multimédia & Technologie */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('entertainment')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-100 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span>Multimédia</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-amber-400 font-bold">
                  {specs.features.entertainment.length}
                </span>
                <span className="text-slate-400">{expandedSections.entertainment ? '▲' : '▼'}</span>
              </div>
            </button>

            {expandedSections.entertainment && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-800/60">
                {specs.features.entertainment.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Confort & Intérieur */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('comfort')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-100 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>🛋️</span>
                <span>Confort</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-amber-400 font-bold">
                  {specs.features.comfort.length}
                </span>
                <span className="text-slate-400">{expandedSections.comfort ? '▲' : '▼'}</span>
              </div>
            </button>

            {expandedSections.comfort && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-800/60">
                {specs.features.comfort.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Extérieur & Tout-Terrain */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('exterior')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-100 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>🛡️</span>
                <span>Sécurité et extérieur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-amber-400 font-bold">
                  {specs.features.exterior.length}
                </span>
                <span className="text-slate-400">{expandedSections.exterior ? '▲' : '▼'}</span>
              </div>
            </button>

            {expandedSections.exterior && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-800/60">
                {specs.features.exterior.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <details className="product-detail-section">
        <summary>Livraison vers {destination?.name || 'votre destination'}</summary>
        <p>Demandez un devis pour connaître le transport adapté, les frais et les formalités d’importation de ce véhicule.</p>
        <p>La disponibilité, l’état du véhicule et les délais sont à confirmer avant toute commande.</p>
      </details>

      {/* 7. Vendeur / Concessionnaire */}
      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-lg">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">{product.seller?.shopName || 'Baobab Dubaï Officiel'}</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">✓ Vendeur Agréé</span>
            </div>
            <p className="text-xs text-slate-400">Boutique officielle Dubaï Export · Spécialiste véhicules Sahel</p>
          </div>
        </div>

        <Link
          to={`/shop/${product.sellerId || product.seller?.id || 'seller-baobab-official'}`}
          className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          Visiter la vitrine →
        </Link>
      </div>

      {/* 8. BARRE FIXE EN BAS D'ÉCRAN (Call, WhatsApp, Devis) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800 p-3 backdrop-blur-lg shadow-2xl">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-2.5">
          <a
            href="tel:+22676950089"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-xs font-bold text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <span>📞</span>
            <span>Appeler</span>
          </a>

          <a
            href={`https://wa.me/22676950089?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all hover:scale-102"
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onDiscuss}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-3 text-xs font-black text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/30 transition-all hover:scale-102"
          >
            <span>📄</span>
            <span>{busy ? 'Envoi...' : 'Demander un devis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

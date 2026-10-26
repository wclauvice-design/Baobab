import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatXof } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { parseVehicleData } from '../lib/vehicles';
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
  const photos: string[] = (product.images || []).filter(
    (url: string) => !/https:\/\/(?:images\.)?unsplash\.com\//i.test(url)
  );
  const images = photos.length ? photos : ['/photos/placeholder.svg'];
  const price = Number(product.price || 0);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount =
    compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour Baobab Conciergerie,\nJe souhaite réserver le véhicule suivant :\n*${product.name}*\nPrix : *${formatXof(
      price
    )}*\nAnnée : ${specs.year} | Kilométrage : ${specs.mileage} | Carburant : ${
      specs.fuelType
    }\nDestination souhaitée : ${
      destination?.name || 'Afrique de l’Ouest'
    }.\nPouvez-vous m’envoyer le rapport d'inspection de Dubaï et la facture proforma ?`
  );

  const rawDescription = (product.description || '').trim();
  const isLongDesc = rawDescription.length > 240;
  const displayedDesc =
    isLongDesc && !showFullDesc ? `${rawDescription.slice(0, 240)}…` : rawDescription;

  return (
    <div className="product-detail-page mx-auto max-w-4xl pb-32">
      {/* 1. VISUEL HERO SUPÉRIEUR PLEIN ÉCRAN (Full-Bleed Edge-to-Edge sur Mobile) */}
      <div className="relative -mx-4 sm:mx-0 overflow-hidden sm:rounded-3xl shadow-2xl bg-[#0d1612]">
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full flex items-center justify-center">
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

          {/* Dégradé supérieur pour contraster les boutons flottants */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

          {/* Barre flottante supérieure avec Retour, Compteur & Actions (Glassmorphism) */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10">
            {/* Bouton Retour ← */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 shadow-lg hover:bg-black/70 hover:scale-105 active:scale-95 transition-all"
              aria-label="Retour aux annonces"
            >
              <span className="text-lg leading-none">←</span>
            </button>

            {/* Compteur photo Dubizzle discret au centre */}
            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-1 text-xs font-semibold text-white/95 backdrop-blur-md border border-white/15 shadow-md">
              <span className="opacity-80">📷</span>
              <span>{photos.length ? `${activePhotoIdx + 1} / ${photos.length}` : '1 / 1'}</span>
            </div>

            {/* Actions Partage & Favoris */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({ title: product.name, url: window.location.href })
                      .catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Lien de l’annonce copié dans le presse-papier !');
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 hover:bg-black/70 hover:scale-105 active:scale-95 shadow-lg transition-all"
                title="Partager"
              >
                <span className="text-base leading-none">↗</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all ${
                  isFavorite
                    ? 'bg-rose-500 text-white scale-105 shadow-rose-500/40'
                    : 'bg-black/45 text-white hover:bg-black/70 hover:scale-105 active:scale-95'
                }`}
                title="Favoris"
              >
                <IconHeart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Flèches de navigation rapide gauche / droite (Desktop / Tablette) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                }
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 hover:scale-105 shadow-lg transition-all"
                aria-label="Photo précédente"
              >
                <span className="text-xl font-light leading-none">‹</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setActivePhotoIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                }
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 hover:scale-105 shadow-lg transition-all"
                aria-label="Photo suivante"
              >
                <span className="text-xl font-light leading-none">›</span>
              </button>
            </>
          )}

          {/* Badges d'état et d'origine en bas de l'image */}
          <div className="absolute bottom-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-[#E8A33D]/60 bg-[#173E32]/90 px-3 py-1 text-xs font-bold text-[#FBF0D8] backdrop-blur-md shadow-md">
                {specs.conditionLabel || 'Occasion certifiée'}
              </span>
              <span className="rounded-lg border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md shadow-md">
                🇦🇪 Dubaï Export
              </span>
            </div>
            {discount && (
              <span className="rounded-lg bg-[#B85732] px-2.5 py-1 text-xs font-extrabold text-white shadow-lg">
                -{discount}%
              </span>
            )}
          </div>
        </div>

        {/* Galerie de miniatures immédiatement sous la photo */}
        {images.length > 1 && (
          <div className="bg-[#101915] p-2.5 flex gap-2 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhotoIdx(i)}
                aria-label={`Afficher la photo ${i + 1}`}
                aria-pressed={activePhotoIdx === i}
                className={`relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  activePhotoIdx === i
                    ? 'border-[#E8A33D] ring-2 ring-[#E8A33D]/40 scale-[1.02]'
                    : 'border-white/10 opacity-60 hover:opacity-100'
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
      </div>

      {/* 2. IDENTITÉ DU VÉHICULE & PRIX (Carte Haut de Gamme Blanc Pur) */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E6E1D4] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        {/* Fil d'Ariane & Univers */}
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8A5A00] mb-2">
          <span>Motors · Véhicules Dubaï</span>
          <span className="text-[#5E6B60] font-normal normal-case">
            Réf: {product.id}
          </span>
        </div>

        {/* Titre du véhicule */}
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#173E32] leading-tight tracking-tight">
          {product.name}
        </h1>

        {/* Bloc Prix */}
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#173E32] tracking-tight">
            {format(price)}
          </div>
          {compareAt && compareAt > price && (
            <span className="text-sm text-[#5E6B60] line-through">
              Prix local estimé : {format(compareAt)}
            </span>
          )}
        </div>

        {/* 4 CAPSULES SIGNATURE DUBIZZLE MOTORS (Specs clés immédiates) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-[#F3EFE4] px-3.5 py-2.5 border border-[#E6E1D4]/60">
            <span className="text-base">📅</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#5E6B60] tracking-wide">Année</div>
              <div className="text-xs font-bold text-[#173E32]">{specs.year || '2024'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#F3EFE4] px-3.5 py-2.5 border border-[#E6E1D4]/60">
            <span className="text-base">⏱</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#5E6B60] tracking-wide">Kilométrage</div>
              <div className="text-xs font-bold text-[#173E32]">{specs.mileage || '0 km'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#F3EFE4] px-3.5 py-2.5 border border-[#E6E1D4]/60">
            <span className="text-base">⛽</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#5E6B60] tracking-wide">Carburant</div>
              <div className="text-xs font-bold text-[#173E32]">{specs.fuelType || 'Essence'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#F3EFE4] px-3.5 py-2.5 border border-[#E6E1D4]/60">
            <span className="text-base">🕹</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#5E6B60] tracking-wide">Boîte</div>
              <div className="text-xs font-bold text-[#173E32]">{specs.transmission || 'Automatique'}</div>
            </div>
          </div>
        </div>

        {/* BANDEAU DE RÉASSURANCE & CONCIERGERIE VIP BAOBAB */}
        <div className="mt-5 rounded-2xl bg-[#FBF0D8]/60 border border-[#E8A33D]/30 p-4 sm:p-5 flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173E32] text-[#FFF8E6] font-bold text-lg shadow-sm">
            🛡️
          </div>
          <div className="text-xs leading-relaxed text-[#173E32]">
            <div className="font-bold text-sm text-[#173E32] mb-0.5">
              Pack Sérénité Conciergerie Dubaï inclus (+15%)
            </div>
            <p className="text-[#3F5749]">
              Inspection physique complète du véhicule chez le concessionnaire à Dubaï avant expédition.
              Rapport d'audit technique, sécurisation des fonds et coordination logistique jusqu'à{' '}
              <strong>{destination?.name || 'Afrique de l’Ouest'}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. DESCRIPTION AVEC OPTION « VOIR PLUS... » */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E6E1D4] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        <h2 className="text-lg font-bold font-heading text-[#173E32] mb-3 flex items-center gap-2">
          À propos du véhicule
        </h2>

        <div className="prose max-w-none text-sm text-[#3F5749] leading-relaxed whitespace-pre-line font-normal">
          {displayedDesc}
        </div>

        {isLongDesc && (
          <button
            type="button"
            onClick={() => setShowFullDesc(!showFullDesc)}
            aria-expanded={showFullDesc}
            className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#8A5A00] hover:text-[#173E32] transition-colors cursor-pointer"
          >
            <span>{showFullDesc ? '▲ Voir moins de description' : '▼ Voir toute la description…'}</span>
          </button>
        )}
      </div>

      {/* 4. CAR OVERVIEW / SPÉCIFICATIONS TECHNIQUES DU VÉHICULE (Table Dubizzle épurée) */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E6E1D4] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        <h2 className="text-lg font-bold font-heading text-[#173E32] mb-4">
          Fiche technique détaillée
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Marque</span>
            <strong className="font-semibold text-[#173E32]">{specs.brand}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Modèle</span>
            <strong className="font-semibold text-[#173E32]">{specs.model}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Finition / Trim</span>
            <strong className="font-semibold text-[#173E32]">{specs.trim}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Année</span>
            <strong className="font-semibold text-[#173E32]">{specs.year}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Kilométrage</span>
            <strong className="font-semibold text-[#173E32]">{specs.mileage}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">État</span>
            <strong className="font-bold text-[#8A5A00]">{specs.conditionLabel}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Type de Carburant</span>
            <strong className="font-semibold text-[#173E32]">{specs.fuelType}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Boîte de Vitesses</span>
            <strong className="font-semibold text-[#173E32]">{specs.transmission}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Moteur</span>
            <strong className="font-semibold text-[#173E32]">{specs.engine}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Transmission / Motricité</span>
            <strong className="font-semibold text-[#173E32]">{specs.drivetrain}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Nombre de Places</span>
            <strong className="font-semibold text-[#173E32]">{specs.seatingCapacity} places</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Nombre de Portes</span>
            <strong className="font-semibold text-[#173E32]">{specs.doors} portes</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Couleur Extérieure</span>
            <strong className="font-semibold text-[#173E32]">{specs.exteriorColor}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Couleur Intérieure</span>
            <strong className="font-semibold text-[#173E32]">{specs.interiorColor}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Spécifications Régionales</span>
            <strong className="font-semibold text-[#173E32]">GCC (Norme Golfe / Climat chaud)</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-[#5E6B60]">Côté Direction</span>
            <strong className="font-semibold text-[#173E32]">{specs.steeringSide}</strong>
          </div>
        </div>
      </div>

      {/* 5. ÉQUIPEMENTS & OPTIONS (ACCORDÉONS DUBIZZLE) */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E6E1D4] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        <h2 className="text-lg font-bold font-heading text-[#173E32] mb-4">
          Équipements & Options
        </h2>

        <div className="space-y-3">
          {/* Section 1: Multimédia */}
          <div className="rounded-xl border border-[#E6E1D4] bg-[#FAF7F0] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('entertainment')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-[#173E32] hover:bg-[#F3EFE4] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📱</span>
                <span className="text-sm">Multimédia & Technologie</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white border border-[#E6E1D4] px-2 py-0.5 text-xs text-[#8A5A00] font-bold">
                  {specs.features.entertainment.length} options
                </span>
                <span className="text-[#5E6B60] text-xs">
                  {expandedSections.entertainment ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedSections.entertainment && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-[#E6E1D4]/60 bg-white">
                {specs.features.entertainment.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#3F5749]">
                    <span className="text-[#1F7A5C] font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Confort */}
          <div className="rounded-xl border border-[#E6E1D4] bg-[#FAF7F0] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('comfort')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-[#173E32] hover:bg-[#F3EFE4] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🛋️</span>
                <span className="text-sm">Confort & Intérieur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white border border-[#E6E1D4] px-2 py-0.5 text-xs text-[#8A5A00] font-bold">
                  {specs.features.comfort.length} options
                </span>
                <span className="text-[#5E6B60] text-xs">
                  {expandedSections.comfort ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedSections.comfort && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-[#E6E1D4]/60 bg-white">
                {specs.features.comfort.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#3F5749]">
                    <span className="text-[#1F7A5C] font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Sécurité & Extérieur */}
          <div className="rounded-xl border border-[#E6E1D4] bg-[#FAF7F0] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('exterior')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-[#173E32] hover:bg-[#F3EFE4] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🛡️</span>
                <span className="text-sm">Sécurité & Extérieur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white border border-[#E6E1D4] px-2 py-0.5 text-xs text-[#8A5A00] font-bold">
                  {specs.features.exterior.length} options
                </span>
                <span className="text-[#5E6B60] text-xs">
                  {expandedSections.exterior ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedSections.exterior && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-[#E6E1D4]/60 bg-white">
                {specs.features.exterior.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#3F5749]">
                    <span className="text-[#1F7A5C] font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. CONCESSIONNAIRE & SOURCE DUBAÏ */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E6E1D4] bg-white p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173E32] text-[#FFF8E6] font-bold text-lg shadow-sm">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#173E32]">
                {product.seller?.shopName || 'Baobab Dubaï Motors'}
              </span>
              <span className="rounded-full bg-[#E4F1EB] px-2 py-0.5 text-[10px] font-bold text-[#1F7A5C]">
                ✓ Concessionnaire Vérifié
              </span>
            </div>
            <p className="text-xs text-[#5E6B60] mt-0.5">
              Spécialiste Export Dubaï → Sahel · Réponse garantie sous 2h
            </p>
          </div>
        </div>

        <Link
          to={`/shop/${product.sellerId || product.seller?.id || 'seller-baobab-official'}`}
          className="rounded-xl border border-[#E6E1D4] bg-[#FAF7F0] px-3.5 py-2 text-xs font-bold text-[#173E32] hover:bg-[#F3EFE4] transition-colors"
        >
          Vitrine →
        </Link>
      </div>

      {/* 7. BARRE FLOTTANTE EN BAS D'ÉCRAN (Glassmorphism Haut de Gamme) */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/90 border-t border-[#E6E1D4] p-3 sm:p-4 backdrop-blur-xl shadow-[0_-8px_30px_rgba(23,62,50,0.08)]">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          <div className="hidden sm:block min-w-0">
            <div className="text-xs text-[#5E6B60] font-medium">Prix total avec conciergerie :</div>
            <div className="font-heading text-xl font-extrabold text-[#173E32] leading-tight">
              {format(price)}
            </div>
          </div>

          <div className="flex-1 flex items-center gap-2 sm:justify-end">
            {/* WhatsApp Concierge VIP */}
            <a
              href={`https://wa.me/22676950089?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-[#20bd5a] shadow-md shadow-[#25D366]/20 active:scale-98 transition-all"
            >
              <span className="text-base leading-none">💬</span>
              <span>WhatsApp VIP</span>
            </a>

            {/* Demande de Devis / Réservation */}
            <button
              type="button"
              onClick={onDiscuss}
              disabled={busy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-[#173E32] px-4 sm:px-7 py-3.5 text-xs sm:text-sm font-bold text-[#FFF8E6] hover:bg-[#1f4d3e] shadow-lg shadow-[#173E32]/25 active:scale-98 transition-all disabled:opacity-50"
            >
              <span>📄</span>
              <span>{busy ? 'Transmission...' : 'Demander un devis proforma'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatXof } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { parseVehicleData } from '../lib/vehicles';
import { ImageSwipeGallery } from './ImageSwipeGallery';

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
  const { format } = useCurrency();
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
      {/* 1. VISUEL HERO SUPÉRIEUR : SWIPE TACTILE HORIZONTAL FLUIDE (Image propre sans encombrement) */}
      <ImageSwipeGallery
        images={images}
        title={product.name}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite(!isFavorite)}
        aspectRatioClass="aspect-[16/10] sm:aspect-[16/9]"
      />

      {/* 2. IDENTITÉ DU VÉHICULE & PRIX (Carte Haut de Gamme Blanc Pur) */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        {/* LIGNE MARKETING STATUTAIRE & RÉASSURANCE (Placée proprement sous l'image) */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="rounded-lg bg-[#0B1E17] text-white px-3 py-1 text-xs font-bold shadow-sm">
            {specs.conditionLabel || 'Occasion certifiée'}
          </span>
          <span className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold">
            ✓ Contrôlé au garage Dubaï
          </span>
          <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 text-xs font-semibold">
            🇦🇪 Normes GCC (Climat chaud)
          </span>
          {discount && (
            <span className="rounded-lg bg-[#B85732] px-2.5 py-1 text-xs font-extrabold text-white">
              -{discount}%
            </span>
          )}
        </div>

        {/* Fil d'Ariane & Univers */}
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2">
          <span>Motors · Véhicules Dubaï</span>
          <span className="text-slate-500 font-normal normal-case">
            Réf: {product.id}
          </span>
        </div>

        {/* Titre du véhicule */}
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#0B1E17] leading-tight tracking-tight">
          {product.name}
        </h1>

        {/* Bloc Prix */}
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B1E17] tracking-tight">
            {format(price)}
          </div>
          {compareAt && compareAt > price && (
            <span className="text-sm text-slate-500 line-through">
              Prix local estimé : {format(compareAt)}
            </span>
          )}
        </div>

        {/* 4 CAPSULES SIGNATURE DUBIZZLE MOTORS (Specs clés immédiates) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-200/80">
            <span className="text-base">📅</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Année</div>
              <div className="text-xs font-bold text-[#0B1E17]">{specs.year || '2024'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-200/80">
            <span className="text-base">⏱</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Kilométrage</div>
              <div className="text-xs font-bold text-[#0B1E17]">{specs.mileage || '0 km'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-200/80">
            <span className="text-base">⛽</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Carburant</div>
              <div className="text-xs font-bold text-[#0B1E17]">{specs.fuelType || 'Essence'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-200/80">
            <span className="text-base">🕹</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Boîte</div>
              <div className="text-xs font-bold text-[#0B1E17]">{specs.transmission || 'Automatique'}</div>
            </div>
          </div>
        </div>

        {/* BANDEAU DE RÉASSURANCE & CONCIERGERIE VIP BAOBAB */}
        <div className="mt-5 rounded-2xl bg-[#FBF0D8]/60 border border-[#E8A33D]/30 p-4 sm:p-5 flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1E17] text-white font-bold text-lg shadow-sm">
            🛡️
          </div>
          <div className="text-xs leading-relaxed text-[#0B1E17]">
            <div className="font-bold text-sm text-[#0B1E17] mb-0.5">
              Pack Sérénité Conciergerie Dubaï inclus (+15%)
            </div>
            <p className="text-slate-700">
              Inspection physique complète du véhicule chez le concessionnaire à Dubaï avant expédition.
              Rapport d'audit technique, sécurisation des fonds et coordination logistique jusqu'à{' '}
              <strong>{destination?.name || 'Afrique de l’Ouest'}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. DESCRIPTION AVEC OPTION « VOIR PLUS... » */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        <h2 className="text-lg font-bold font-heading text-[#0B1E17] mb-3 flex items-center gap-2">
          À propos du véhicule
        </h2>

        <div className="prose max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
          {displayedDesc}
        </div>

        {isLongDesc && (
          <button
            type="button"
            onClick={() => setShowFullDesc(!showFullDesc)}
            aria-expanded={showFullDesc}
            className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-[#0B1E17] transition-colors cursor-pointer"
          >
            <span>{showFullDesc ? '▲ Voir moins de description' : '▼ Voir toute la description…'}</span>
          </button>
        )}
      </div>

      {/* 4. CAR OVERVIEW / SPÉCIFICATIONS TECHNIQUES DU VÉHICULE (Table Dubizzle épurée) */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        <h2 className="text-lg font-bold font-heading text-[#0B1E17] mb-4">
          Fiche technique détaillée
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Marque</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.brand}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Modèle</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.model}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Finition / Trim</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.trim}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Année</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.year}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Kilométrage</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.mileage}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">État</span>
            <strong className="font-bold text-amber-800">{specs.conditionLabel}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Type de Carburant</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.fuelType}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Boîte de Vitesses</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.transmission}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Moteur</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.engine}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Transmission / Motricité</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.drivetrain}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Nombre de Places</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.seatingCapacity} places</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Nombre de Portes</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.doors} portes</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Couleur Extérieure</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.exteriorColor}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Couleur Intérieure</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.interiorColor}</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Spécifications Régionales</span>
            <strong className="font-semibold text-[#0B1E17]">GCC (Norme Golfe / Climat chaud)</strong>
          </div>

          <div className="flex justify-between items-baseline border-b border-[#F0ECE1] pb-2">
            <span className="text-slate-500">Côté Direction</span>
            <strong className="font-semibold text-[#0B1E17]">{specs.steeringSide}</strong>
          </div>
        </div>
      </div>

      {/* 5. ÉQUIPEMENTS & OPTIONS (ACCORDÉONS DUBIZZLE) */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
        <h2 className="text-lg font-bold font-heading text-[#0B1E17] mb-4">
          Équipements & Options
        </h2>

        <div className="space-y-3">
          {/* Section 1: Multimédia */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('entertainment')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-[#0B1E17] hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📱</span>
                <span className="text-sm">Multimédia & Technologie</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-xs text-amber-800 font-bold">
                  {specs.features.entertainment.length} options
                </span>
                <span className="text-slate-500 text-xs">
                  {expandedSections.entertainment ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedSections.entertainment && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-200/80 bg-white">
                {specs.features.entertainment.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="text-[#1F7A5C] font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Confort */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('comfort')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-[#0B1E17] hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🛋️</span>
                <span className="text-sm">Confort & Intérieur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-xs text-amber-800 font-bold">
                  {specs.features.comfort.length} options
                </span>
                <span className="text-slate-500 text-xs">
                  {expandedSections.comfort ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedSections.comfort && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-200/80 bg-white">
                {specs.features.comfort.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="text-[#1F7A5C] font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Sécurité & Extérieur */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('exterior')}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-[#0B1E17] hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🛡️</span>
                <span className="text-sm">Sécurité & Extérieur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-xs text-amber-800 font-bold">
                  {specs.features.exterior.length} options
                </span>
                <span className="text-slate-500 text-xs">
                  {expandedSections.exterior ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedSections.exterior && (
              <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-200/80 bg-white">
                {specs.features.exterior.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
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
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B1E17] text-white font-bold text-lg shadow-sm">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#0B1E17]">
                {product.seller?.shopName || 'Baobab Dubaï Motors'}
              </span>
              <span className="rounded-full bg-[#E4F1EB] px-2 py-0.5 text-[10px] font-bold text-[#1F7A5C]">
                ✓ Concessionnaire Vérifié
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Spécialiste Export Dubaï → Sahel · Réponse garantie sous 2h
            </p>
          </div>
        </div>

        <Link
          to={`/shop/${product.sellerId || product.seller?.id || 'seller-baobab-official'}`}
          className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#0B1E17] hover:bg-slate-50 transition-colors"
        >
          Vitrine →
        </Link>
      </div>

      {/* 7. BARRE FLOTTANTE EN BAS D'ÉCRAN (Glassmorphism Haut de Gamme) */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/90 border-t border-[#E2E8F0] p-3 sm:p-4 backdrop-blur-xl shadow-[0_-8px_30px_rgba(23,62,50,0.08)]">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          <div className="hidden sm:block min-w-0">
            <div className="text-xs text-slate-500 font-medium">Prix total avec conciergerie :</div>
            <div className="font-heading text-xl font-extrabold text-[#0B1E17] leading-tight">
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

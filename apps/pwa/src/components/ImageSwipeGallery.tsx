import { ProductVideo } from './ProductVideo';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isVideoUrl, videoPoster } from '../lib/media';
import { IconHeart } from './icons';

interface ImageSwipeGalleryProps {
  images: string[];
  title: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  aspectRatioClass?: string; // e.g. "aspect-[16/10]" or "aspect-square"
}

export function ImageSwipeGallery({
  images,
  title,
  isFavorite = false,
  onToggleFavorite,
  aspectRatioClass = "aspect-[16/10] sm:aspect-[16/9]",
}: ImageSwipeGalleryProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const validImages = images.length > 0 ? images : ['/photos/placeholder.svg'];

  // Handle touch/swipe scroll to update activeIdx
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    if (width > 0) {
      const newIdx = Math.round(scrollLeft / width);
      if (newIdx !== activeIdx && newIdx >= 0 && newIdx < validImages.length) {
        setActiveIdx(newIdx);
      }
    }
  }, [activeIdx, validImages.length]);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: idx * el.clientWidth,
      behavior: 'smooth',
    });
    setActiveIdx(idx);
  };

  // Keep track of window resize to adjust scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="relative -mx-4 sm:mx-0 overflow-hidden sm:rounded-3xl shadow-xl bg-[#09110e]">
      {/* 1. HORIZONTAL SWIPE CAROUSEL (Touch-friendly & Clean) */}
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full ${aspectRatioClass} select-none`}
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        {validImages.map((src, i) => (
          <div
            key={i}
            className="w-full shrink-0 snap-center relative flex items-center justify-center bg-[#09110e] overflow-hidden"
          >
            {isVideoUrl(src) ? (
              <ProductVideo
                src={src}
                label={`${title} vidéo ${i + 1}`}
                className="h-full w-full object-cover"
                poster={videoPoster(images)} active={activeIdx === i}
              />
            ) : (
              <img
                src={src}
                alt={`${title} - Photo ${i + 1}`}
                decoding="async"
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover pointer-events-none"
              />
            )}
          </div>
        ))}
      </div>

      {/* Dégradé supérieur pour contraster les boutons flottants */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none" />

      {/* 2. CONTRÔLES FLOTTANTS ÉPURÉS (Pas d'encombrement sur la photo) */}
      <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 pointer-events-auto">
        {/* Bouton Retour minimaliste */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 shadow-md hover:bg-black/70 hover:scale-105 active:scale-95 transition-all"
          aria-label="Retour"
        >
          <span className="text-lg leading-none font-light">←</span>
        </button>

        {/* Boutons Partager & Favoris */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Lien de l’annonce copié dans le presse-papier !');
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 hover:bg-black/70 hover:scale-105 active:scale-95 shadow-md transition-all"
            title="Partager l'annonce"
          >
            <span className="text-base leading-none">↗</span>
          </button>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border border-white/20 shadow-md transition-all ${
                isFavorite
                  ? 'bg-rose-500 text-white scale-105 shadow-rose-500/40'
                  : 'bg-black/45 text-white hover:bg-black/70 hover:scale-105 active:scale-95'
              }`}
              title="Ajouter aux favoris"
            >
              <IconHeart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 3. FLÈCHES DE DÉFILEMENT BUREAU (Cachées sur mobile au profit du geste tactile) */}
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollTo(activeIdx > 0 ? activeIdx - 1 : validImages.length - 1)}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 hover:bg-black/75 hover:scale-105 active:scale-95 shadow-lg transition-all z-10"
            aria-label="Photo précédente"
          >
            <span className="text-xl font-light leading-none">‹</span>
          </button>
          <button
            type="button"
            onClick={() => scrollTo(activeIdx < validImages.length - 1 ? activeIdx + 1 : 0)}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 hover:bg-black/75 hover:scale-105 active:scale-95 shadow-lg transition-all z-10"
            aria-label="Photo suivante"
          >
            <span className="text-xl font-light leading-none">›</span>
          </button>
        </>
      )}

      {/* 4. COMPTEUR DISCRET EN BAS À DROITE (Aucun badge marketing sur l'image) */}
      {validImages.length > 1 && (
        <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white/95 backdrop-blur-md border border-white/15 shadow-md pointer-events-none">
          <span className="opacity-80">📷</span>
          <span>{activeIdx + 1} / {validImages.length}</span>
        </div>
      )}

      {/* 5. VIGNETTES HORIZONTALES SOUS L'IMAGE (Scroll synchronisé) */}
      {validImages.length > 1 && (
        <div className="bg-[#0b1411] p-2 sm:p-2.5 flex gap-2 overflow-x-auto scrollbar-none">
          {validImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Aller à la photo ${i + 1}`}
              aria-pressed={activeIdx === i}
              className={`relative h-14 w-14 sm:h-16 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                activeIdx === i
                  ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 scale-[1.03] opacity-100'
                  : 'border-white/10 opacity-55 hover:opacity-90'
              }`}
            >
              {isVideoUrl(src) ? (
                <span className="relative block h-full w-full"><img src={videoPoster(images)} alt="" className="h-full w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center text-white bg-black/20" aria-hidden="true">▶</span></span>
              ) : (
                <img src={src} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

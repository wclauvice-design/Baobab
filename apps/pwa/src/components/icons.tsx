import { useId } from 'react';

/**
 * Système d'icônes Baobab — traits fins (1.75), angles arrondis, grille 24×24.
 * Aucune icône ne vient d'une bibliothèque tierce : chaque tracé est dessiné
 * pour ce produit. IconFire et BaobabMark sont les deux seules formes pleines
 * (dégradé "flame"), le reste reste en traits pour ne pas concurrencer le logo.
 */

interface IconProps {
  className?: string;
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function BaobabMark({ className = 'h-8 w-8' }: IconProps) {
  const uid = useId();
  const gradientId = `flame-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="6" y1="2" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffcf7d" />
          <stop offset="45%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#e2481c" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>
        <circle cx="24" cy="16.5" r="8" />
        <circle cx="15.5" cy="18.5" r="5.5" />
        <circle cx="32.5" cy="18" r="6" />
        <circle cx="25" cy="9.5" r="5" />
        <path
          d="M21 20
             C20.3 24 20.6 28 21.5 32
             C20 35 17.5 37 14.5 40
             C16.2 41.6 18.5 41 20 39
             C22 36.5 23 30 23 24
             L25 24
             C25 30 26 36.5 28 39
             C29.5 41 31.8 41.6 33.5 40
             C30.5 37 28 35 26.5 32
             C27.4 28 27.7 24 27 20
             Z"
        />
      </g>
    </svg>
  );
}

export function BaobabWordmark({ className = '', textClassName = 'text-3xl' }: IconProps & { textClassName?: string }) {
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className={`bg-flame bg-clip-text font-heading font-bold leading-none text-transparent ${textClassName}`}>
        Baobab
      </span>
      <svg viewBox="0 0 120 12" className="mt-1.5 h-2.5 w-full text-amber-500/60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 2.5 C 26 2.5 42 8 60 8 C 78 8 94 2.5 118 2.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M60 8 L 55.5 10.5 M60 8 L 64.5 10.5 M60 8 L 60 11" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function IconFire({ className = 'h-5 w-5' }: IconProps) {
  const uid = useId();
  const gradientId = `fire-${uid}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="6" y1="2" x2="18" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffcf7d" />
          <stop offset="50%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#e2481c" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M12 2 C13.2 6 17 8.2 17 13 a5 5 0 0 1 -10 0 c0 -1.6 0.6 -2.7 1.3 -3.7 C8.7 11 9 13 10.3 13.6 C9.4 10.6 10.2 8.2 12 2 Z"
      />
    </svg>
  );
}

export function IconHome({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 11.5 L12 4.5 L20 11.5" />
      <path d="M6 10 V19 a1 1 0 0 0 1 1 h3 v-5.5 h4 V20 h3 a1 1 0 0 0 1 -1 V10" />
    </svg>
  );
}

export function IconSearch({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20 L15.8 15.8" />
    </svg>
  );
}

export function IconBag({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 8 V6.5 a5 5 0 0 1 10 0 V8" />
      <path d="M5.5 8 H18.5 L17.6 19.4 a2 2 0 0 1 -2 1.8 H8.4 a2 2 0 0 1 -2 -1.8 Z" />
    </svg>
  );
}

export function IconOrders({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 8 L12 4 L20 8 L12 12 Z" />
      <path d="M4 8 V16 L12 20 L20 16 V8" />
      <path d="M12 12 V20" />
    </svg>
  );
}

export function IconAccount({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20 c0 -4 3.1 -6.5 7 -6.5 s7 2.5 7 6.5" />
    </svg>
  );
}

export function IconChat({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 6.5 a2 2 0 0 1 2 -2 h12 a2 2 0 0 1 2 2 v7.5 a2 2 0 0 1 -2 2 H9.5 L5 19.5 V16 H6 a2 2 0 0 1 -2 -2 Z" />
    </svg>
  );
}

export function IconSettings({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3 v2.4 M12 18.6 V21 M21 12 h-2.4 M5.4 12 H3 M18.4 5.6 l-1.7 1.7 M7.3 16.7 l-1.7 1.7 M18.4 18.4 l-1.7 -1.7 M7.3 7.3 L5.6 5.6" />
    </svg>
  );
}

export function IconLocation({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21 C12 21 19 14.5 19 9 a7 7 0 1 0 -14 0 c0 5.5 7 12 7 12 Z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  );
}

export function IconHeart({ className = 'h-5 w-5', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20 C6 15.5 3 12.2 3 8.6 3 5.9 5.1 4 7.6 4 c1.6 0 3.2 0.9 4.4 2.4 C13.2 4.9 14.8 4 16.4 4 18.9 4 21 5.9 21 8.6 21 12.2 18 15.5 12 20 Z" />
    </svg>
  );
}

export function IconStar({ className = 'h-4 w-4', filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'}>
      <path d="M12 3 L14.6 8.6 20.7 9.3 16.2 13.5 17.4 19.5 12 16.5 6.6 19.5 7.8 13.5 3.3 9.3 9.4 8.6 Z" />
    </svg>
  );
}

export function IconHistory({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 12 a7.5 7.5 0 1 0 2.4 -5.5" />
      <path d="M3 4.5 v4.5 h4.5" />
      <path d="M12 8 v4.3 l3.2 2" />
    </svg>
  );
}

export function IconTruck({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 7 h11 v9 H3 Z" />
      <path d="M14 10 h4 l3 3 v3 h-7 Z" />
      <circle cx="7" cy="18.2" r="1.6" />
      <circle cx="17.5" cy="18.2" r="1.6" />
    </svg>
  );
}

export function IconCash({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M6.3 9 h0.02 M17.7 15 h0.02" />
    </svg>
  );
}

export function IconCheck({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.4 l2.6 2.6 L16.5 9" />
    </svg>
  );
}

export function IconWarning({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.2 L21.6 20 H2.4 Z" />
      <path d="M12 9.5 v4.3 M12 16.8 v0.1" />
    </svg>
  );
}

export function IconClock({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 v5.5 l3.6 2.2" />
    </svg>
  );
}

export function IconClose({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9 l6 6 M15 9 l-6 6" />
    </svg>
  );
}

export function IconHourglass({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 3 h12 M6 21 h12" />
      <path d="M7 3 v2.6 c0 2.4 2 3.9 5 5.9 c3 2 5 3.4 5 5.9 V21" />
      <path d="M17 3 v2.6 c0 2.4 -2 3.9 -5 5.9 c-3 2 -5 3.4 -5 5.9 V21" />
    </svg>
  );
}

export function IconShop({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 9 L5 4 h14 l1 5" />
      <path d="M4 9 a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5.5 10.5 V20 h13 v-9.5" />
      <path d="M9.5 20 v-5 h5 v5" />
    </svg>
  );
}

export function IconGrid({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconFashion({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 4 a2 2 0 1 1 -2 2" />
      <path d="M12 6 v2 l9 6 a2 2 0 0 1 -1 3.7 H4 A2 2 0 0 1 3 14 Z" />
    </svg>
  );
}

export function IconHomeGoods({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12 h13 v1.5 a6.5 6.5 0 0 1 -6.5 6.5 h0 A6.5 6.5 0 0 1 4 13.5 Z" />
      <path d="M17 13.2 h1.5 a2.4 2.4 0 0 1 0 4.8 H17.3" />
      <path d="M7.3 6 c0 1.2 0.9 1.4 0.9 2.6 M11.3 6 c0 1.2 0.9 1.4 0.9 2.6" />
    </svg>
  );
}

export function IconElectronics({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeLinejoin="round">
      <path d="M13 2 L4 14 h6 l-1 8 L20 10 h-6 Z" />
    </svg>
  );
}

export function IconBeauty({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3 c3.2 4.2 6 6.6 6 10.2 a6 6 0 0 1 -12 0 c0 -3.6 2.8 -6 6 -10.2 Z" />
    </svg>
  );
}

import { useId } from 'react';

/**
 * Système d'icônes Westzone — traits fins (1.75), angles arrondis, grille 24×24.
 * Aucune icône ne vient d'une bibliothèque tierce : chaque tracé est dessiné
 * pour ce produit. IconFire et WestzoneMark sont les deux seules formes pleines
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

/**
 * Monogramme WESTZONE : un « W » dessiné comme deux caps de la côte
 * ouest-africaine, sous un soleil sahelien. Le dégradé or → terre cuite
 * fonctionne aussi bien sur fond clair que sur fond indigo.
 */
export function WestzoneMark({ className = 'h-8 w-8' }: IconProps) {
  const uid = useId();
  const gradientId = `westzone-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="8" y1="14" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F2C46A" />
          <stop offset="55%" stopColor="#D9A441" />
          <stop offset="100%" stopColor="#C05A32" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="8.5" r="3" fill="#D9A441" />
      <path
        d="M6.5 16 15.5 36 24 20.5 32.5 36 41.5 16"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WestzoneWordmark({ className = '', textClassName = 'text-3xl' }: IconProps & { textClassName?: string }) {
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className={`font-heading font-bold leading-none tracking-[0.14em] ${textClassName}`}>
        WEST<span className="text-[#C05A32]">ZONE</span>
      </span>
      <span className="mt-2 flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.3em] opacity-60">
        <span className="h-px w-5 bg-current opacity-40" />
        Afrique de l&apos;Ouest
        <span className="h-px w-5 bg-current opacity-40" />
      </span>
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

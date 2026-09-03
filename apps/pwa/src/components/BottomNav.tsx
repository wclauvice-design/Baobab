import { NavLink } from 'react-router-dom';
import { useCart } from '../lib/cart';

const tabs = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/search', label: 'Rechercher', icon: '🔍' },
  { to: '/cart', label: 'Panier', icon: '🛒' },
  { to: '/orders', label: 'Commandes', icon: '📦' },
  { to: '/account', label: 'Compte', icon: '👤' },
];

export function BottomNav() {
  const { items } = useCart();
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-white/[0.06] bg-base-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-200 ${
                isActive ? 'text-amber-400' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-xl2 text-lg leading-none transition-all duration-300 ${
                    isActive ? '-translate-y-1 bg-flame shadow-glow' : ''
                  }`}
                >
                  {tab.icon}
                  {tab.to === '/cart' && count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-none text-base-950 shadow-glow-emerald animate-pulse-glow">
                      {count}
                    </span>
                  )}
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

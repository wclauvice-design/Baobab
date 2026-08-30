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
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-base-700 bg-base-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-400'
              }`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.to === '/cart' && count > 0 && (
              <span className="absolute right-3 top-1 min-w-[16px] rounded-full bg-emerald-500 px-1 text-[10px] font-semibold leading-4 text-base-950">
                {count}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

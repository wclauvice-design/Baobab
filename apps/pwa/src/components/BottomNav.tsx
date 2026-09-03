import { NavLink } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { IconAccount, IconBag, IconHome, IconOrders, IconSearch } from './icons';

const tabs = [
  { to: '/', label: 'Accueil', Icon: IconHome },
  { to: '/search', label: 'Rechercher', Icon: IconSearch },
  { to: '/cart', label: 'Panier', Icon: IconBag },
  { to: '/orders', label: 'Commandes', Icon: IconOrders },
  { to: '/account', label: 'Compte', Icon: IconAccount },
];

export function BottomNav() {
  const { items } = useCart();
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-white/[0.06] bg-base-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-200 ${
                isActive ? 'text-amber-400' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-xl2 transition-all duration-300 ${
                    isActive ? '-translate-y-1 bg-flame text-base-950 shadow-glow' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {to === '/cart' && count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-none text-base-950 shadow-glow-emerald animate-pulse-glow">
                      {count}
                    </span>
                  )}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { useUnreadMessages } from '../lib/unreadMessages';
import { usePendingClientCounts } from '../lib/clientCounts';
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
  const { unreadCount } = useUnreadMessages();
  const pending = usePendingClientCounts();
  const count = items.reduce((n, i) => n + i.quantity, 0);

  const badgeFor = (to: string): number => {
    if (to === '/cart') return count;
    if (to === '/orders') return pending.total;
    if (to === '/account') return unreadCount;
    return 0;
  };

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
                  {badgeFor(to) > 0 && (
                    <span
                      className={`absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                        to === '/cart'
                          ? 'bg-emerald-500 text-base-950 shadow-glow-emerald animate-pulse-glow'
                          : 'bg-red-500 text-white shadow-[0_0_0_2px_rgba(10,14,23,0.9)]'
                      }`}
                    >
                      {badgeFor(to) > 99 ? '99+' : badgeFor(to)}
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

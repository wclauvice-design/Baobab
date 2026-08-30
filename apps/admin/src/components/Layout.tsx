import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const ADMIN_LINKS = [
  { to: '/', label: 'File des paiements' },
  { to: '/sellers', label: 'Vendeurs' },
  { to: '/catalog', label: 'Catalogue' },
  { to: '/orders', label: 'Commandes' },
];

const SELLER_LINKS = [
  { to: '/', label: 'Tableau de bord' },
  { to: '/products', label: 'Mes produits' },
  { to: '/seller-orders', label: 'Mes commandes' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const links = user?.role === 'ADMIN' ? ADMIN_LINKS : SELLER_LINKS;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white px-4 py-6">
        <h1 className="mb-6 text-lg font-bold">Baobab</h1>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-amber-500/10 font-medium text-amber-600' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>{user?.phone}</p>
          <p className="mb-2">{user?.role}</p>
          <button onClick={logout} className="underline">
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}

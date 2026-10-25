import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NotificationBell } from "./NotificationBell";
import "../pages/operations.css";

export function Layout() {
  const { user, logout, impersonatedShopName, stopImpersonation } = useAuth();
  const links =
    user?.role === "ADMIN"
      ? [
          ["/", "Vue d’ensemble"],
          ["/messages", "Messages"],
          ["/orders", "Commandes & devis"],
          ["/customers", "Clients"],
          ["/catalog", "Annonces & modération"],
          ["/sellers", "Commerçants"],
          ["/settings", "Paramètres"],
          ["/legacy-orders", "Anciennes commandes"],
          ["/legacy-payments", "Anciens paiements"],
        ]
      : [
          ["/", "Mon activité"],
          ["/products", "Mes annonces"],
        ];

  return (
    <div className={`backoffice-shell ${impersonatedShopName ? "pt-12" : ""}`}>
      {impersonatedShopName && (
        <div className="fixed top-0 left-0 right-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-2.5 text-slate-950 font-bold shadow-lg text-sm border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <span>Session Commerçant Active :</span>
            <span className="rounded bg-black/15 px-2.5 py-0.5 font-black uppercase tracking-wide">
              {impersonatedShopName}
            </span>
            <span className="text-xs font-semibold text-slate-900">
              ({user?.phone}) — Vous administrez la boutique avec les droits du commerçant
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition-all active:scale-95"
          >
            ✕ Quitter le mode commerçant & revenir à l'Admin
          </button>
        </div>
      )}

      <aside className="backoffice-nav">
        <div className="backoffice-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          baobab<small>ESPACE PROFESSIONNEL</small>
          <NotificationBell />
        </div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <footer>
          {user?.phone}
          <br />
          {user?.role === "ADMIN" ? (
            "Administration"
          ) : (
            <span className="text-amber-400 font-semibold">Commerçant Partenaire</span>
          )}
          <button onClick={logout}>Se déconnecter</button>
        </footer>
      </aside>
      <main className="backoffice-main">
        <Outlet />
      </main>
    </div>
  );
}

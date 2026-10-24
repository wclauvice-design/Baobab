import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import "../pages/operations.css";
export function Layout() {
  const { user, logout } = useAuth();
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
    <div className="backoffice-shell">
      <aside className="backoffice-nav">
        <div className="backoffice-brand">
          baobab<small>ESPACE PROFESSIONNEL</small>
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
          {user?.role === "ADMIN" ? "Administration" : "Commerçant"}
          <button onClick={logout}>Se déconnecter</button>
        </footer>
      </aside>
      <main className="backoffice-main">
        <Outlet />
      </main>
    </div>
  );
}

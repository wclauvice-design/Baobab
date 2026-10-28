import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { NotificationBell } from "./NotificationBell";
import "../pages/operations.css";

export function Layout() {
  const { user, logout, impersonatedShopName, stopImpersonation } = useAuth();
  const [counts, setCounts] = useState({
    pendingSellers: 0,
    pendingListings: 0,
    unreadMessages: 0,
    pendingPayments: 0,
    pendingQuotes: 0,
  });
  const [sellerCounts, setSellerCounts] = useState({ rejectedListings: 0 });

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    let active = true;
    const load = async () => {
      try {
        const data = await api.get<{
          pendingSellers: number;
          pendingListings: number;
          unreadMessages: number;
          pendingPayments?: number;
          pendingQuotes?: number;
        }>("/admin/concierge/counts");
        if (active && data) {
          let unread = data.unreadMessages || 0;
          if (unread === 0) {
            const convs = await api.get<any[]>('/admin/concierge/conversations').catch(() => []);
            unread = (convs || []).filter((c: any) => c.needsReply && c.state === 'OPEN').length;
          }
          setCounts({
            pendingSellers: data.pendingSellers || 0,
            pendingListings: data.pendingListings || 0,
            unreadMessages: unread,
            pendingPayments: data.pendingPayments || 0,
            pendingQuotes: data.pendingQuotes || 0,
          });
          return;
        }
      } catch {
        // Resilient fallback
        try {
          const [convs, sellers, prods] = await Promise.all([
            api.get<any[]>('/admin/concierge/conversations').catch(() => []),
            api.get<any[]>('/admin/sellers').catch(() => []),
            api.get<any[]>('/products').catch(() => []),
          ]);
          if (active) {
            const unread = (convs || []).filter((c: any) => c.needsReply && c.state === 'OPEN').length;
            const pendingSellers = (sellers || []).filter((s: any) => s.status === 'PENDING').length;
            const pendingListings = (Array.isArray(prods) ? prods : (prods as any)?.data || []).filter((p: any) => p.moderation === 'PENDING').length;
            setCounts({ unreadMessages: unread, pendingSellers, pendingListings, pendingPayments: 0, pendingQuotes: 0 });
          }
        } catch {
          // ignore
        }
      }
    };
    load();
    const id = setInterval(load, 12000);
    // Rafraîchissement immédiat après traitement d'un élément
    const onRefresh = () => load();
    window.addEventListener("westzone:refresh-counts", onRefresh);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("westzone:refresh-counts", onRefresh);
    };
  }, [user?.role]);

  // Commerçant : compteur rouge des annonces refusées à corriger
  useEffect(() => {
    if (user?.role !== "SELLER") return;
    let active = true;
    const load = async () => {
      try {
        const products = await api.get<any[]>("/products/mine");
        if (!active) return;
        setSellerCounts({
          rejectedListings: (products || []).filter((p) => p.moderation === "REJECTED").length,
        });
      } catch {
        // silencieux
      }
    };
    load();
    const id = setInterval(load, 20000);
    const onRefresh = () => load();
    window.addEventListener("westzone:refresh-counts", onRefresh);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("westzone:refresh-counts", onRefresh);
    };
  }, [user?.role]);

  const badgeFor = (to: string): number => {
    if (user?.role !== "ADMIN") {
      // Commerçant : annonces refusées à corriger
      return to === "/products" ? sellerCounts.rejectedListings : 0;
    }
    if (to === "/messages") return counts.unreadMessages;
    if (to === "/sellers") return counts.pendingSellers;
    if (to === "/catalog") return counts.pendingListings;
    if (to === "/orders") return counts.pendingPayments + counts.pendingQuotes;
    return 0;
  };

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
          WESTZONE<small>ESPACE PROFESSIONNEL · AFRIQUE DE L'OUEST</small>
          <NotificationBell />
        </div>
        <nav>
          {links.map(([to, label]) => {
            const n = badgeFor(to);
            return (
              <NavLink key={to} to={to} end={to === "/"}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>{label}</span>
                  {n > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      minWidth: '20px',
                      textAlign: 'center',
                      boxShadow: '0 1px 3px rgba(239, 68, 68, 0.4)',
                      display: 'inline-block',
                      lineHeight: 1,
                    }}>
                      {n}
                    </span>
                  )}
                </span>
              </NavLink>
            );
          })}
        </nav>
        <footer>
          {user?.phone}
          <br />
          {user?.role === "ADMIN" ? (
            "Administration"
          ) : (
            <span style={{ color: "#10b981", fontWeight: 700 }}>
              Boutique Commerçant
            </span>
          )}
          <br />
          <button className="backoffice-link" onClick={logout}>
            Se déconnecter
          </button>
        </footer>
      </aside>
      <main className="backoffice-main">
        <Outlet />
      </main>
    </div>
  );
}

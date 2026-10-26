import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export function NotificationBell() {
  const [counts, setCounts] = useState({
    pendingSellers: 0,
    pendingListings: 0,
    unreadMessages: 0,
    pendingPayments: 0,
    pendingQuotes: 0,
  });
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Try dedicated counts endpoint first
        const data = await api.get<{
          pendingSellers: number;
          pendingListings: number;
          unreadMessages: number;
          pendingPayments?: number;
          pendingQuotes?: number;
        }>('/admin/concierge/counts');
        if (active && data) {
          // If unreadMessages was 0 from backend, still cross-check conversations
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
        // Resilient live fallback
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
    const onRefresh = () => load();
    window.addEventListener('baobab:refresh-counts', onRefresh);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener('baobab:refresh-counts', onRefresh);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const total =
    counts.pendingSellers +
    counts.pendingListings +
    counts.unreadMessages +
    counts.pendingPayments +
    counts.pendingQuotes;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Centre de notifications et alertes"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>🔔</span>
        {total > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '1px 5px',
              minWidth: 17,
              textAlign: 'center',
              boxShadow: '0 0 0 2px #1e293b',
              animation: 'pulse 2s infinite',
            }}
          >
            {total}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '290px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0',
            zIndex: 1000,
            overflow: 'hidden',
            color: '#1e293b',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Alertes & Notifications</strong>
            {total > 0 && (
              <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                {total} à traiter
              </span>
            )}
          </div>

          <div style={{ padding: '6px 0' }}>
            <Link
              to="/messages"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.82rem',
                borderBottom: '1px solid #f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📩</span>
                <span>Messages clients</span>
              </div>
              {counts.unreadMessages > 0 ? (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px' }}>
                  {counts.unreadMessages}
                </span>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>0</span>
              )}
            </Link>

            <Link
              to="/sellers"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.82rem',
                borderBottom: '1px solid #f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏪</span>
                <span>Commerçants en attente</span>
              </div>
              {counts.pendingSellers > 0 ? (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px' }}>
                  {counts.pendingSellers}
                </span>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>0</span>
              )}
            </Link>

            <Link
              to="/catalog"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📦</span>
                <span>Annonces à modérer</span>
              </div>
              {counts.pendingListings > 0 ? (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px' }}>
                  {counts.pendingListings}
                </span>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>0</span>
              )}
            </Link>
            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.82rem',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💳</span>
                <span>Paiements à vérifier</span>
              </div>
              {counts.pendingPayments > 0 ? (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px' }}>
                  {counts.pendingPayments}
                </span>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>0</span>
              )}
            </Link>

            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝</span>
                <span>Devis en attente</span>
              </div>
              {counts.pendingQuotes > 0 ? (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px' }}>
                  {counts.pendingQuotes}
                </span>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>0</span>
              )}
            </Link>
          </div>

          <div style={{ padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Mise à jour en direct automatique
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

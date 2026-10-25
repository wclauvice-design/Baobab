import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function ClientNotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={bellRef} className="client-notif-bell-wrap" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Notifications et alertes"
        aria-label="Notifications"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          color: 'inherit',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              lineHeight: '18px',
              textAlign: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px #fff',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="client-notif-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '300px',
            background: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.25), 0 4px 10px rgba(0, 0, 0, 0.1)',
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
            <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Vos Notifications</strong>
            {unreadCount > 0 && (
              <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                {unreadCount} nouveau(x)
              </span>
            )}
          </div>

          <div style={{ padding: '6px 0' }}>
            <Link
              to="/messages"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                textDecoration: 'none',
                color: 'inherit',
                borderBottom: '1px solid #f8fafc',
                background: unreadCount > 0 ? '#fef2f2' : 'transparent',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>💬</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '0.85rem', color: unreadCount > 0 ? '#b91c1c' : '#0f172a' }}>
                    Messages Conciergerie
                  </strong>
                  {unreadCount > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                  {unreadCount > 0
                    ? `Vous avez ${unreadCount} nouveau(x) message(s) de l'équipe Baobab.`
                    : 'Discutez en direct avec votre conseiller Baobab.'}
                </p>
              </div>
            </Link>

            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                textDecoration: 'none',
                color: 'inherit',
                borderBottom: '1px solid #f8fafc',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📦</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Mes Commandes & Devis</strong>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                  Consultez l'avancement de vos achats et validez vos devis en 1 clic.
                </p>
              </div>
            </Link>

            <Link
              to="/terms"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🛡️</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.85rem', color: '#166534' }}>Garantie Paiement Protégé</strong>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                  Vos fonds sont sécurisés jusqu'à l'inspection de conformité.
                </p>
              </div>
            </Link>
          </div>

          <div style={{ padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Service Conciergerie Baobab · Dubaï & Afrique
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

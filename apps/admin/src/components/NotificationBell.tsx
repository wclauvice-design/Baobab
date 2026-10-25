import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function NotificationBell() {
  const [counts, setCounts] = useState({ pendingSellers: 0, pendingListings: 0, unreadMessages: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api.get<{ pendingSellers: number; pendingListings: number; unreadMessages: number }>('/admin/counts');
        if (active) setCounts(data);
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const total = counts.pendingSellers + counts.pendingListings + counts.unreadMessages;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ fontSize: '1.4rem' }}>🔔</span>
      {total > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -6,
          background: '#f59e0b', color: '#000', borderRadius: '9999px',
          fontSize: '0.7rem', fontWeight: 700, padding: '1px 5px', minWidth: 16, textAlign: 'center',
        }}>
          {total}
        </span>
      )}
    </div>
  );
}
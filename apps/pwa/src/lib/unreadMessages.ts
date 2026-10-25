import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { call, getDeviceActiveConversation } from './concierge';

const UNREAD_KEY = 'baobab_unread_messages_count';
const LAST_SEEN_KEY = 'baobab_last_seen_msg_count';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(UNREAD_KEY) || 0);
    } catch {
      return 0;
    }
  });

  const location = useLocation();
  const isViewingMessages = location.pathname.startsWith('/messages');

  // When user is viewing messages, immediately reset unread count
  useEffect(() => {
    if (isViewingMessages) {
      setUnreadCount(0);
      try {
        localStorage.setItem(UNREAD_KEY, '0');
      } catch {}

      const active = getDeviceActiveConversation();
      if (active) {
        call(`/concierge/conversations/${active.id}`, undefined, active.token)
          .then((conv: any) => {
            const count = (conv?.messages || []).length;
            localStorage.setItem(LAST_SEEN_KEY, String(count));
          })
          .catch(() => {});
      }
    }
  }, [isViewingMessages]);

  // Polling when not viewing messages to detect new incoming messages from Baobab staff
  useEffect(() => {
    if (isViewingMessages) return;

    let active = true;
    const checkUnread = async () => {
      const activeConv = getDeviceActiveConversation();
      if (!activeConv) return;

      try {
        const conv = await call(`/concierge/conversations/${activeConv.id}`, undefined, activeConv.token);
        if (!active || !conv?.messages) return;

        const messages: any[] = conv.messages;
        const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0);

        if (messages.length > lastSeen) {
          const newBaobabMsgs = messages.slice(lastSeen).filter((m: any) => m.role === 'BAOBAB' || m.role === 'STAFF').length;
          const count = newBaobabMsgs > 0 ? newBaobabMsgs : (messages.length > lastSeen ? 1 : 0);
          if (count > 0) {
            setUnreadCount(count);
            localStorage.setItem(UNREAD_KEY, String(count));
          }
        }
      } catch {
        // ignore
      }
    };

    checkUnread();
    const timer = setInterval(checkUnread, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isViewingMessages]);

  const markAllRead = () => {
    setUnreadCount(0);
    try {
      localStorage.setItem(UNREAD_KEY, '0');
    } catch {}
  };

  return { unreadCount, markAllRead };
}

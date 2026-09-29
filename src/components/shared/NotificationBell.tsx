import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications';
import { NotificationPanel } from './NotificationPanel';
// import type { Notification, NotificationKind } from '@/types/notification';

export function NotificationBell() {
  const { fetchAll, panelOpen, openPanel, closePanel } = useNotificationsStore();
  const unreadCount = useNotificationsStore((s) => s.items.filter((n) => !n.read).length);

  // Load once on mount, then poll every 30 seconds
  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return (
    <div className="relative">
      <button
        onClick={panelOpen ? closePanel : openPanel}
        className="relative p-2 rounded-md text-ink-600 hover:bg-ink-100 transition-colors"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />

        {/* Unread indicator */}
        {unreadCount > 0 && (
          <>
            {/* The dot — always visible */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />

            {/* The count badge — a pill, slightly bigger than the dot */}
            {unreadCount > 1 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            {/* The pulse — very subtle, indicates "new" */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75" />
          </>
        )}
      </button>

      {panelOpen && <NotificationPanel />}
    </div>
  );
}
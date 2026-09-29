import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Ticket, ArrowUp, CheckCircle2, MessageSquare, RotateCcw, Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications';
import { cn } from '@/lib/cn';
import type { Notification, NotificationKind } from '@/types/notification';

const KIND_ICONS: Record<NotificationKind, LucideIcon> = {
  TICKET_ASSIGNED:  Ticket,
  TICKET_FORWARDED: ArrowUp,
  TICKET_ESCALATED: ArrowUp,
  TICKET_RESOLVED:  CheckCircle2,
  TICKET_REOPENED:  RotateCcw,
  TICKET_COMMENT:   MessageSquare,
  SYSTEM:           Bell,
};

type Filter = 'all' | 'unread';

export function NotificationPanel() {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const { items, loading, markRead, markAllRead, closePanel } = useNotificationsStore();
  const [filter, setFilter] = useState<Filter>('all');

  const unreadCount = items.filter((n) => !n.read).length;
  const newItems = items.filter((n) => !n.read);
  const earlierItems = items.filter((n) => n.read);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [closePanel]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closePanel]);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.ticketId) {
      navigate(`/tickets/${n.ticketId}`);
      closePanel();
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-95 max-w-[calc(100vw-2rem)] bg-white border border-ink-200 rounded-lg shadow-lg overflow-hidden z-50"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[11px] font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </header>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 pt-2.5 pb-1 border-b border-ink-100">
        <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterTab>
        <FilterTab active={filter === 'unread'} onClick={() => setFilter('unread')}>
          Unread
          {unreadCount > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold text-rose-600">{unreadCount}</span>
          )}
        </FilterTab>
      </div>

      {/* Body */}
      <div className="max-h-120 overflow-y-auto">
        {loading && items.length === 0 ? (
          <SkeletonList />
        ) : filter === 'all' ? (
          <AllView
            newItems={newItems}
            earlierItems={earlierItems}
            onItemClick={handleClick}
          />
        ) : (
          <UnreadView items={newItems} onItemClick={handleClick} />
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <footer className="border-t border-ink-100 px-4 py-2.5">
          <button
            onClick={() => {
              navigate('/notifications');
              closePanel();
            }}
            className="w-full text-[11px] font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            View all notifications
          </button>
        </footer>
      )}
    </div>
  );
}

/* ─── All view — grouped into New and Earlier ───────────────── */
function AllView({
  newItems,
  earlierItems,
  onItemClick,
}: {
  newItems: Notification[];
  earlierItems: Notification[];
  onItemClick: (n: Notification) => void;
}) {
  if (!newItems.length && !earlierItems.length) {
    return <EmptyState filter="all" />;
  }

  return (
    <>
      {newItems.length > 0 && (
        <Section title="New" count={newItems.length}>
          {newItems.map((n) => (
            <NotificationRow key={n.id} notification={n} onClick={() => onItemClick(n)} />
          ))}
        </Section>
      )}

      {earlierItems.length > 0 && (
        <Section title="Earlier">
          {earlierItems.map((n) => (
            <NotificationRow key={n.id} notification={n} onClick={() => onItemClick(n)} />
          ))}
        </Section>
      )}
    </>
  );
}

/* ─── Unread view — flat list ─────────────────────────────── */
function UnreadView({
  items,
  onItemClick,
}: {
  items: Notification[];
  onItemClick: (n: Notification) => void;
}) {
  if (!items.length) return <EmptyState filter="unread" />;

  return (
    <ul className="divide-y divide-ink-100">
      {items.map((n) => (
        <NotificationRow key={n.id} notification={n} onClick={() => onItemClick(n)} />
      ))}
    </ul>
  );
}

/* ─── Section wrapper ─────────────────────────────────────── */
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="sticky top-0 z-10 bg-ink-50/95 backdrop-blur-sm px-4 py-1.5 border-y border-ink-100 first:border-t-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-semibold text-rose-600">{count}</span>
          )}
        </div>
      </div>
      <ul className="divide-y divide-ink-100">{children}</ul>
    </section>
  );
}

/* Filter tab */
function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-2.5 pb-2 pt-1 text-xs font-medium transition-colors',
        active ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700'
      )}
    >
      <span className="flex items-center">{children}</span>
      {active && (
        <span className="absolute left-1.5 right-1.5 -bottom-px h-0.5 rounded-full bg-ink-900" />
      )}
    </button>
  );
}

/* Row (unchanged) */
function NotificationRow({
  notification: n,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = KIND_ICONS[n.kind] ?? Bell;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors',
          n.read ? 'hover:bg-ink-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
            n.read
              ? 'bg-ink-100 text-ink-500'
              : 'bg-white text-brand-700 ring-1 ring-blue-100'
          )}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm leading-tight',
                n.read ? 'font-medium text-ink-700' : 'font-semibold text-ink-900'
              )}
            >
              {n.title}
            </p>
            {!n.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">{n.body}</p>
          <p className="mt-1 text-[10px] text-ink-400 font-medium">
            {timeAgo(n.createdAt)}
          </p>
        </div>
      </button>
    </li>
  );
}

/* ─── States ──────────────────────────────────────────────── */
function SkeletonList() {
  return (
    <ul className="divide-y divide-ink-100">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-ink-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-ink-100 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-ink-100 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <Inbox className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">
        {filter === 'unread' ? 'No unread notifications' : "You're all caught up"}
      </p>
      <p className="mt-1 text-xs text-ink-400">
        {filter === 'unread'
          ? 'Everything here has been read.'
          : 'No notifications to show right now.'}
      </p>
    </div>
  );
}

/* ─── Time formatter ──────────────────────────────────────── */
function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
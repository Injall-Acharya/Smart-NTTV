import { Link } from 'react-router-dom';
import {
  Ticket,
  Clock,
  CheckCircle2,
  CornerDownLeft,
  PlusCircle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useFetch } from '@/hooks/useFetch';
import { Card } from '@/components/shared/Card';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badges';
import { ticketsApi } from '@/api/endpoints';
import { timeAgo } from '@/lib/time';
import type { Ticket as TicketType } from '@/types/ticket';

export function StaffDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, loading, error } = useFetch(() => ticketsApi.mine({ pageSize: 5 }));

  const tickets = data?.results ?? [];
  const stats = data?.stats ?? {
    total: 0,
    inProgress: 0,
    resolved: 0,
    unreadComments: 0,
    forwardedBack: 0,
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="pb-6 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-medium">
          Staff console
        </p>
        <h1 className="mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          Welcome back, {user?.firstName}.
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Track the status of the tickets you've submitted.
        </p>
      </header>

      {/* ── Action-required banner (only when there's something waiting) ── */}
      {!loading && stats.forwardedBack > 0 && (
        <Link
          to="/staff/tickets?status=FORWARDED_BACK"
          className="mt-6 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3.5 transition-colors hover:bg-orange-100/70"
        >
          <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <CornerDownLeft className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-900">
              {stats.forwardedBack} ticket{stats.forwardedBack === 1 ? '' : 's'} returned to you
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              An agent has sent these back for your action. Review and resolve them.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
        </Link>
      )}

      {/* ── KPI strip ─────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-8 bg-ink-200 rounded-lg overflow-hidden border border-ink-200">
        <KPI icon={Ticket}         label="Total submitted" value={stats.total}          loading={loading} />
        <KPI icon={Clock}          label="In progress"     value={stats.inProgress}     loading={loading} />
        <KPI icon={CheckCircle2}   label="Resolved"        value={stats.resolved}       loading={loading} />
        <KPI
          icon={CornerDownLeft}
          label="Action required"
          value={stats.forwardedBack}
          loading={loading}
          tone={stats.forwardedBack > 0 ? 'warn' : 'default'}
        />
      </section>

      {/* ── Recent tickets ────────────────────────────── */}
      <section className="mt-8">
        <Card
          title="Recent tickets"
          subtitle="Your latest 5 submissions"
          action={
            <Link
              to="/staff/tickets"
              className="text-[11px] font-medium text-ink-500 hover:text-ink-900 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          }
          flush
        >
          {loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.length === 0 ? (
            <EmptyTickets />
          ) : (
            <ul className="divide-y divide-ink-100">
              {tickets.map((t) => (
                <TicketRow key={t.id} ticket={t} />
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ── New ticket button ─────────────────────────── */}
      {/* Floating on mobile, static on desktop */}
      <Link
        to="/staff/tickets/new"
        className="fixed bottom-6 right-6 lg:hidden inline-flex items-center gap-2 h-12 px-5 rounded-full bg-brand-900 text-white font-medium shadow-lg shadow-ink-900/20 active:scale-[0.98] transition-transform"
        aria-label="Create new ticket"
      >
        <PlusCircle className="w-5 h-5" />
        New Ticket
      </Link>

      <div className="hidden lg:block mt-6">
        <Link
          to="/staff/tickets/new"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Ticket
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────── */

function KPI({
  icon: Icon,
  label,
  value,
  loading,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  loading?: boolean;
  tone?: 'default' | 'warn';
}) {
  return (
    <div className="bg-white px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
          {label}
        </p>
        <Icon
          className={
            tone === 'warn' && value > 0
              ? 'w-3.5 h-3.5 text-orange-500'
              : 'w-3.5 h-3.5 text-ink-300'
          }
          strokeWidth={1.75}
        />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">
        {loading ? (
          <span className="inline-block w-10 h-7 rounded bg-ink-100 animate-pulse" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: TicketType }) {
  const isReturned = ticket.status === 'FORWARDED_BACK';

  return (
    <li>
      <Link
        to={`/staff/tickets/${ticket.id}`}
        className={`block px-5 py-4 transition-colors ${
          isReturned
            ? 'border-l-2 border-l-orange-400 bg-orange-50/40 hover:bg-orange-50/70'
            : 'hover:bg-ink-50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ink-900 truncate">
                {ticket.title}
              </p>
              {isReturned && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Action
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-500 mt-1 font-mono">
              #{ticket.id.slice(0, 8)} · {ticket.categoryName} · {timeAgo(ticket.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} viewerIsCreator />
          </div>
        </div>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-ink-100">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-ink-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-ink-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-5 bg-ink-100 rounded-full animate-pulse" />
              <div className="w-20 h-5 bg-ink-100 rounded-full animate-pulse" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyTickets() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <Ticket className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">No tickets yet</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">
        Submit your first ticket to get help from our support team.
      </p>
      <Link
        to="/staff/tickets/new"
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
      >
        <PlusCircle className="w-3.5 h-3.5" />
        Create a ticket
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">Could not load tickets</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">{message}</p>
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  SearchX,
  Clock,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useFetch } from '@/hooks/useFetch';
import { ticketsApi } from '@/api/endpoints';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badges';
import { TicketInfoCard } from '@/components/shared/TicketInfoCard';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';
import { TicketActions } from '@/components/shared/TicketActions';
import { timeAgo } from '@/lib/time';
import type { Ticket, TicketActivity } from '@/types/ticket';
import { ForwardTicketDialog } from '@/components/shared/ForwardTicketDialog';
import { EscalateTicketDialog } from '@/components/shared/EscalateTicketDialog';

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Refetch helper — reuses useFetch by forcing a reload via state bump
  const [reloadKey, setReloadKey] = useState(0);
  
  const { data: ticket, loading: loadingTicket, error: ticketError } =
  useFetch(() => ticketsApi.get(ticketId!), [ticketId, reloadKey]);

  const { data: activities, loading: loadingActivities, error: activitiesError } =
  useFetch(() => ticketsApi.activities(ticketId!), [ticketId, reloadKey]);

  const [forwardOpen, setForwardOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);


  const backHref = user?.role === 'agent' ? '/agent' : '/staff/tickets';

  // ── Actions ────────────────────────────────────
  const runAction = async (fn: () => Promise<Ticket>) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      setReloadKey((k) => k + 1);   // force re-fetch
    } catch (e: any) {
      setActionError(e?.response?.data?.detail ?? 'Action failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleStart = () => runAction(() => ticketsApi.start(ticketId!));
  const handleForward = async (target: { teamId: string; agentId?: string }) => {
    setBusy(true);
    setActionError(null);
    try {
      await ticketsApi.forward(ticketId!, target);
      setForwardOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setActionError(e?.response?.data?.detail ?? 'Forward failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleEscalate = async (target: { teamId: string; agentId?: string }) => {
    setBusy(true);
    setActionError(null);
    try {
      await ticketsApi.escalate(ticketId!, target);
      setEscalateOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setActionError(e?.response?.data?.detail ?? 'Escalate failed.');
    } finally {
      setBusy(false);
    }
  };
  const handleResolve = () => runAction(() => ticketsApi.resolve(ticketId!));
//   const handleReopen = () => runAction(() => ticketsApi.reopen(ticketId!));

  // ── Loading ────────────────────────────────────
  if (loadingTicket) return <PageSkeleton />;

  // ── Not found ──────────────────────────────────
  if (ticketError && ticketError.includes('404')) {
    return <NotFound backHref={backHref} />;
  }

  // ── Generic error ──────────────────────────────
  if (ticketError || !ticket) {
    return <ErrorState message={ticketError ?? 'Could not load ticket.'} backHref={backHref} />;
  }

  // ── Main render ────────────────────────────────
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-6xl mx-auto">
      {/* Back */}
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to tickets
      </Link>

      {/* Header */}
      <header className="mt-4 pb-6 border-b border-ink-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight leading-snug">
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-ink-500">
              <span className="font-mono">#{ticket.id.slice(0, 12)}</span>
              <span className="w-px h-3 bg-ink-200" />
              <span>{ticket.categoryName}</span>
              <span className="w-px h-3 bg-ink-200" />
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(ticket.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} viewerIsCreator />
          </div>
        </div>
      </header>

      {/* Action error */}
      {actionError && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">{actionError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6">
        <TicketActions
          ticket={ticket}
          user={user}
          onStart={handleStart}
          onResolve={handleResolve}
          onForward={() => setForwardOpen(true)}
          onEscalate={() => setEscalateOpen(true)}
          busy={busy}
        />

        <ForwardTicketDialog
          open={forwardOpen}
          onClose={() => setForwardOpen(false)}
          ticketId={ticket.id}
          onConfirm={handleForward}
          submitting={busy}
        />

        <EscalateTicketDialog
          open={escalateOpen}
          onClose={() => setEscalateOpen(false)}
          ticketId={ticket.id}
          currentLevel={(ticket.level ?? 'L1') as 'L1' | 'L2' | 'L3'}
          onConfirm={handleEscalate}
          submitting={busy}
        />
      </div>

      {/* Two-column body */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Left column — description + timeline */}
        <div className="space-y-6 min-w-0">
          {/* Description */}
          <section className="rounded-lg border border-ink-200 bg-white p-5">
            <h2 className="text-[10px] uppercase tracking-wider font-medium text-ink-400 mb-3">
              Description
            </h2>
            <p className="text-sm text-ink-800 leading-relaxed whitespace-pre-wrap">
              {ticket.description || (
                <span className="text-ink-400 italic">No description provided.</span>
              )}
            </p>
          </section>

          {/* Timeline */}
          <section className="rounded-lg border border-ink-200 bg-white p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-3.5 h-3.5 text-ink-400" />
                <h2 className="text-[10px] uppercase tracking-wider font-medium text-ink-400">
                  Activity
                </h2>
              </div>
              {activities && activities.length > 0 && (
                <span className="text-[10px] text-ink-400 tabular-nums">
                  {activities.length} event{activities.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {loadingActivities ? (
              <TimelineSkeleton />
            ) : activitiesError ? (
              <p className="text-xs text-red-600">{activitiesError}</p>
            ) : (
              <ActivityTimeline activities={activities ?? []} />
            )}
          </section>
        </div>

        {/* Right column — info card */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <TicketInfoCard ticket={ticket} />
        </aside>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   States
   ───────────────────────────────────────────────── */

function PageSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-6xl mx-auto">
      <div className="h-3 w-32 rounded bg-ink-100 animate-pulse" />
      <div className="mt-4 pb-6 border-b border-ink-200">
        <div className="h-7 w-2/3 rounded bg-ink-100 animate-pulse" />
        <div className="mt-3 h-3 w-1/3 rounded bg-ink-100 animate-pulse" />
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <div className="h-40 rounded-lg border border-ink-200 bg-white p-5">
            <div className="h-3 w-20 rounded bg-ink-100 animate-pulse" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-ink-100 animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-ink-100 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-ink-100 animate-pulse" />
            </div>
          </div>
          <div className="h-64 rounded-lg border border-ink-200 bg-white p-5">
            <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-ink-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded bg-ink-100 animate-pulse" />
                    <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="h-96 rounded-lg border border-ink-200 bg-white" />
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-ink-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-40 rounded bg-ink-100 animate-pulse" />
            <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotFound({ backHref }: { backHref: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto rounded-xl bg-ink-100 flex items-center justify-center text-ink-500">
          <SearchX className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-lg font-semibold">Ticket not found</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          This ticket may have been removed or you don't have access to it.
        </p>
        <Link
          to={backHref}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to tickets
        </Link>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  backHref,
}: {
  message: string;
  backHref: string;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 flex items-center justify-center text-red-600">
          <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-lg font-semibold">Couldn't load ticket</h1>
        <p className="mt-1.5 text-sm text-ink-500">{message}</p>
        <Link
          to={backHref}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to tickets
        </Link>
      </div>
    </div>
  );
}
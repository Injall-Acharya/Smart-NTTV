import { Play, CheckCircle2, Forward, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Ticket } from '@/types/ticket';
import type { User } from '@/types/user';

interface Props {
  ticket: Ticket;
  user: User | null;
  onStart: () => void;
  onResolve: () => void;
  onForward: () => void;
  onEscalate: () => void;
  busy: boolean;
}

export function TicketActions({
  ticket,
  user,
  onStart,
  onResolve,
  onForward,
  onEscalate,
  busy,
}: Props) {
  if (!user) return null;

  const isStaff = user.role === 'staff';
  const isAgent = user.role === 'agent';
  const isAdmin = user.role === 'admin';

  const isCreator = ticket.createdById === user.id;
  const agentOwnsTicket =
  isAgent &&
  (ticket.assignedToId === user.id ||
    (!!ticket.assignedTeamId && ticket.assignedTeamId === user.teamId && !ticket.assignedToId));

  const staffOwnsTicket = isStaff && isCreator;
  const staffAwaitingAction = staffOwnsTicket && ticket.status === 'FORWARDED_BACK';

  // ── Start ───────────────────────────────────────
  const canStart =
    staffAwaitingAction ||
    (agentOwnsTicket && ['ASSIGNED', 'FORWARDED', 'ESCALATED'].includes(ticket.status)) ||
    (isAdmin && ['ASSIGNED', 'FORWARDED', 'ESCALATED'].includes(ticket.status));

  // ── Resolve ─────────────────────────────────────
  // Agents can resolve after starting work
  const canResolve =
    (staffOwnsTicket && ticket.status === 'INPROCESS') ||
    (agentOwnsTicket && ticket.status === 'INPROCESS') ||
    (isAdmin && ticket.status === 'INPROCESS');

  // ── Forward ─────────────────────────────────────
  // Agents can forward while working on the ticket
  const canForward =
    (agentOwnsTicket &&
      ['INPROCESS', 'ASSIGNED', 'FORWARDED', 'ESCALATED'].includes(ticket.status)) ||
    (isAdmin && ['INPROCESS', 'ASSIGNED', 'FORWARDED', 'ESCALATED'].includes(ticket.status));

  // ── Escalate ────────────────────────────────────
  // Agents can escalate while working on the ticket, only if not L3
  const canEscalate =
    ((agentOwnsTicket || isAdmin) &&
      ['INPROCESS', 'ASSIGNED', 'FORWARDED', 'ESCALATED'].includes(ticket.status) &&
      ticket.level !== 'L3');

  const actions = [];

  if (canStart) {
    actions.push({
      label: 'Start working',
      icon: Play,
      onClick: onStart,
      style: 'primary' as const,
    });
  }

  if (canResolve) {
    actions.push({
      label: 'Mark resolved',
      icon: CheckCircle2,
      onClick: onResolve,
      style: 'success' as const,
    });
  }

  if (canForward) {
    actions.push({
      label: 'Forward',
      icon: Forward,
      onClick: onForward,
      style: 'neutral' as const,
    });
  }

  if (canEscalate) {
    actions.push({
      label: 'Escalate',
      icon: ArrowUp,
      onClick: onEscalate,
      style: 'warn' as const,
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <p className="text-[10px] uppercase tracking-wider font-medium text-ink-400 mb-3">
        Available actions
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              disabled={busy}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-sm font-medium transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                a.style === 'primary' && 'bg-brand-900 hover:bg-brand-800 text-white',
                a.style === 'success' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                a.style === 'warn' && 'bg-orange-600 hover:bg-orange-700 text-white',
                a.style === 'neutral' &&
                  'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
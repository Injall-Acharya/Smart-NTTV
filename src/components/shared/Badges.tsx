import { cn } from '@/lib/cn';
import type { TicketStatus, TicketPriority } from '@/types/ticket';
import { TICKET_STATUS_LABELS } from '@/types/ticket';

const STATUS_STYLES: Record<TicketStatus, string> = {
  NEW:            'bg-blue-50 text-blue-700 ring-blue-200',
  ASSIGNED:       'bg-violet-50 text-violet-700 ring-violet-200',
  INPROCESS:      'bg-amber-50 text-amber-700 ring-amber-200',
  FORWARDED:      'bg-cyan-50 text-cyan-700 ring-cyan-200',
  FORWARDED_BACK: 'bg-orange-50 text-orange-700 ring-orange-200',
  ESCALATED:      'bg-rose-50 text-rose-700 ring-rose-200',
  RESOLVED:       'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REOPENED:       'bg-pink-50 text-pink-700 ring-pink-200',
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  CRITICAL: 'bg-rose-50 text-rose-700 ring-rose-200',
  HIGH:     'bg-orange-50 text-orange-700 ring-orange-200',
  MEDIUM:   'bg-blue-50 text-blue-700 ring-blue-200',
  LOW:      'bg-ink-100 text-ink-600 ring-ink-200',
};

export function StatusBadge({
  status,
  viewerIsCreator = false,
}: {
  status: TicketStatus;
  viewerIsCreator?: boolean;
}) {
  const label =
    status === 'FORWARDED_BACK' && !viewerIsCreator
      ? 'Forwarded back'
      : TICKET_STATUS_LABELS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
        STATUS_STYLES[status]
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 capitalize',
        PRIORITY_STYLES[priority]
      )}
    >
      {priority.toLowerCase()}
    </span>
  );
}
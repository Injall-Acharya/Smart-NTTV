import {
  FileText,
  Send,
  ArrowUp,
  Play,
  CheckCircle2,
  RotateCcw,
  Forward,
  MessageSquare,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/time';
import type { TicketActivity, ActivityType } from '@/types/ticket';

const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: LucideIcon; className: string }
> = {
  CREATED:     { label: 'Ticket created',  icon: FileText,      className: 'bg-blue-50 text-blue-600' },
  DISPATCHED:  { label: 'Dispatched',      icon: Send,          className: 'bg-violet-50 text-violet-600' },
  FORWARDED:   { label: 'Forwarded',       icon: Forward,       className: 'bg-cyan-50 text-cyan-600' },
  ESCALATED:   { label: 'Escalated',       icon: ArrowUp,       className: 'bg-orange-50 text-orange-600' },
  IN_PROGRESS: { label: 'Work started',    icon: Play,          className: 'bg-amber-50 text-amber-600' },
  RESOLVED:    { label: 'Marked resolved', icon: CheckCircle2,  className: 'bg-emerald-50 text-emerald-600' },
  REOPENED:    { label: 'Reopened',        icon: RotateCcw,     className: 'bg-pink-50 text-pink-600' },
  COMMENT:     { label: 'Comment',         icon: MessageSquare, className: 'bg-ink-100 text-ink-600' },
};

interface Props {
  activities: TicketActivity[];
}

export function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Activity className="w-6 h-6 text-ink-300 mb-2" />
        <p className="text-xs text-ink-400">No activity yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative">
      {/* Vertical guide line */}
      <span
        aria-hidden
        className="absolute left-4 top-4 bottom-4 w-px bg-ink-200"
      />

      {activities.map((activity, idx) => {
        const meta = ACTIVITY_META[activity.type] ?? ACTIVITY_META.COMMENT;
        const Icon = meta.icon;
        const isLast = idx === activities.length - 1;

        return (
          <li
            key={activity.id}
            className={cn('relative flex gap-3.5', !isLast && 'pb-6')}
          >
            {/* Icon bubble */}
            <div
              className={cn(
                'relative z-10 w-8 h-8 shrink-0 rounded-full flex items-center justify-center ring-4 ring-white',
                meta.className
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="text-sm font-medium text-ink-900">
                  {meta.label}
                </p>
                <time
                  className="text-[11px] text-ink-400 shrink-0"
                  dateTime={activity.timestamp}
                >
                  {timeAgo(activity.timestamp)}
                </time>
              </div>

              <p className="mt-0.5 text-xs text-ink-500">
                by{' '}
                <span className="font-medium text-ink-700">
                  {activity.performedBy.username}
                </span>
              </p>

              {/* Optional extra context */}
              {(activity.fromLevel || activity.toLevel) && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-ink-500">
                  <span className="font-mono">
                    {activity.fromLevel ?? '—'}
                  </span>
                  <span>→</span>
                  <span className="font-mono text-ink-700">
                    {activity.toLevel}
                  </span>
                  {activity.toTeamName && (
                    <>
                      <span className="text-ink-300">·</span>
                      <span className="text-ink-600">
                        {activity.toTeamName}
                      </span>
                    </>
                  )}
                </p>
              )}

              {activity.note && (
                <p className="mt-2 rounded-md bg-ink-50 border border-ink-100 px-3 py-2 text-xs text-ink-700 leading-relaxed">
                  {activity.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
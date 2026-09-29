import {
  Users,
  User as UserIcon,
  FolderTree,
  Layers,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from './Badges';
import { formatDate } from '@/lib/time';
import type { Ticket } from '@/types/ticket';

interface Props {
  ticket: Ticket;
}

export function TicketInfoCard({ ticket }: Props) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white divide-y divide-ink-100">
      <Row label="Status">
        <StatusBadge status={ticket.status} viewerIsCreator />
      </Row>

      <Row label="Priority">
        <PriorityBadge priority={ticket.priority} />
      </Row>

      <Row label="Category" icon={FolderTree}>
        <span className="text-sm text-ink-800">{ticket.categoryName}</span>
      </Row>

      {ticket.level && (
        <Row label="Support level" icon={Layers}>
          <span className="text-xs font-mono text-ink-700">{ticket.level}</span>
        </Row>
      )}

      {ticket.assignedTeamName && (
        <Row label="Assigned team" icon={Users}>
          <span className="text-sm text-ink-800">{ticket.assignedTeamName}</span>
        </Row>
      )}

      <Row label="Assigned to" icon={UserIcon}>
        <span className="text-sm text-ink-800">
          {ticket.assignedToName ?? (
            <span className="text-ink-400 italic">Unassigned</span>
          )}
        </span>
      </Row>

      <Row label="Created by">
        <span className="text-sm text-ink-800">{ticket.createdByName}</span>
      </Row>

      <Row label="Created" icon={Calendar}>
        <span className="text-xs text-ink-600">
          {formatDate(ticket.createdAt)}
        </span>
      </Row>

      <Row label="Updated">
        <span className="text-xs text-ink-600">
          {formatDate(ticket.updatedAt)}
        </span>
      </Row>

      {ticket.resolvedAt && (
        <Row label="Resolved" icon={CheckCircle2}>
          <span className="text-xs text-emerald-700 font-medium">
            {formatDate(ticket.resolvedAt)}
          </span>
        </Row>
      )}
    </div>
  );
}

function Row({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="w-3 h-3 text-ink-400" />}
        <p className="text-[10px] uppercase tracking-wider font-medium text-ink-400">
          {label}
        </p>
      </div>
      {children}
    </div>
  );
}
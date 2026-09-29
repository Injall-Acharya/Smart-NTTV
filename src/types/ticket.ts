import type { UserSummary } from './user';
import type { TeamLevel } from './team';

// ─── Enums ────────────────────────────────────────────────
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'INPROCESS'
  | 'FORWARDED'         // forwarded to another team/agent
  | 'FORWARDED_BACK'    // forwarded back to the creator
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REOPENED';


// ─── Ticket ───────────────────────────────────────────────
export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  categoryId: string;
  categoryName: string;
  level?: TeamLevel;

  // Creator (immutable)
  createdById: string;
  createdByName: string;
  createdByRole: 'staff' | 'admin';

  // Current assignee (mutable)
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedToId?: string;
  assignedToName?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ─── Activity timeline ────────────────────────────────────
export type ActivityType =
  | 'CREATED'
  | 'DISPATCHED'
  | 'FORWARDED'
  | 'ESCALATED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REOPENED'
  | 'COMMENT';

export interface TicketActivity {
  id: string;
  ticketId: string;
  type: ActivityType;
  performedBy: UserSummary;
  timestamp: string;
  note?: string;
  fromLevel?: TeamLevel;
  toLevel?: TeamLevel;
  fromTeamName?: string;
  toTeamName?: string;
  fromUserName?: string;
  toUserName?: string;
}

// ─── Dispatch history ─────────────────────────────────────
export type DispatchTarget =
  | { type: 'TEAM';  teamId: string; teamName: string }
  | { type: 'AGENT'; agentId: string; username: string };

export interface TicketRecipient {
  id: string;
  agentId: string;
  agentName: string;
  receivedAt: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
}

export interface TicketDispatch {
  id: string;
  ticketId: string;
  targets: DispatchTarget[];
  dispatchedBy: UserSummary;
  dispatchedAt: string;
  recipients: TicketRecipient[];
}

// ─── Display helpers ──────────────────────────────────────
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  INPROCESS: 'In progress',
  FORWARDED: 'Forwarded',
  FORWARDED_BACK: 'Returned to you',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
};
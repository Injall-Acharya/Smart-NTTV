export type NotificationKind =
  | 'TICKET_ASSIGNED'
  | 'TICKET_FORWARDED'
  | 'TICKET_ESCALATED'
  | 'TICKET_RESOLVED'
  | 'TICKET_REOPENED'
  | 'TICKET_COMMENT'
  | 'SYSTEM';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  ticketId?: string;
  createdAt: string;         
  actorName?: string;        // who triggered it
}
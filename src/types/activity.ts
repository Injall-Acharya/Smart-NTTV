export type {
  ActivityType,
  TicketActivity,
} from './ticket';

/** Human-readable labels for each activity type */
export const ACTIVITY_LABELS: Record<
  import('./ticket').ActivityType,
  string
> = {
  CREATED:      'Ticket created',
  DISPATCHED:   'Dispatched',
  FORWARDED:    'Forwarded',
  ESCALATED:    'Escalated',
  IN_PROGRESS:  'Work started',
  RESOLVED:     'Marked resolved',
  REOPENED:     'Reopened',
  COMMENT:      'Comment added',
};
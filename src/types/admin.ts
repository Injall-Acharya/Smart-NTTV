import type { TicketPriority } from './ticket';

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface CategoryBucket {
  name: string;
  value: number;
}

export interface PriorityBucket {
  name: TicketPriority;
  value: number;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  level: 'L1' | 'L2' | 'L3';
  assigned: number;
  resolved: number;
  resolutionRate: number;
}

export interface AgentPerformance {
  agentId: string;
  username: string;
  level: 'L1' | 'L2' | 'L3';
  resolved: number;
  assigned: number;
}

export interface AdminStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  unresolvedTickets: number;
  activeUsers: number;
  avgResolutionHours: number;
  trend: TrendPoint[];
  byCategory: CategoryBucket[];
  byPriority: PriorityBucket[];
  byTeam: TeamPerformance[];
  topAgents: AgentPerformance[];
}
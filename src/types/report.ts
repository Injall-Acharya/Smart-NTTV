
export interface ReportTrendPoint {
  date: string;         // 'YYYY-MM-DD'
  created: number;
  resolved: number;
}

export interface ReportFilters {
  dateFrom?: string;      // ISO 'YYYY-MM-DD'
  dateTo?: string;
  status?: string;
  categoryId?: string;
}

export interface ReportSummaryMetrics {
  totalTickets: number;
  resolvedTickets: number;
  unresolvedTickets: number;
  avgResolutionHours: number;
  resolutionRate: number;         // 0–100
}

export interface TeamReportRow {
  teamId: string;
  teamName: string;
  level: 'L1' | 'L2' | 'L3';
  received: number;
  resolved: number;
  avgResolutionHours: number;
  resolutionRate: number;
}

export interface CategoryReportRow {
  categoryId: string;
  categoryName: string;
  total: number;
  resolved: number;
  unresolved: number;
}

export interface AgentReportRow {
  agentId: string;
  username: string;
  level: 'L1' | 'L2' | 'L3';
  assigned: number;
  resolved: number;
  resolutionRate: number;
  avgResolutionHours: number; 
}

export interface ReportSummary {
  metrics: ReportSummaryMetrics;
  trend: ReportTrendPoint[];    // ← add
  byTeam: TeamReportRow[];
  byCategory: CategoryReportRow[];
  byAgent: AgentReportRow[];
}

export interface DetailedReportRow {
  id: string;
  title: string;
  categoryName: string;
  priority: string;
  status: string;
  level?: string;
  createdByName: string;
  assignedToName?: string;
  assignedTeamName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionHours?: number;
}

export interface DetailedReport {
  rows: DetailedReportRow[];
  total: number;
}

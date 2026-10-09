import { Fragment, useMemo, useState } from 'react';
import {
  BarChart3,
  FileText,
  Download,
  FileSpreadsheet,
  AlertCircle,
  FileDown,
  Users2,
  FolderTree,
  Headset,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import { useFetch } from '@/hooks/useFetch';
import { reportsApi, categoriesApi } from '@/api/endpoints';
import { Card } from '@/components/shared/Card';
import { KpiStrip } from '@/components/shared/KpiStrip';
import { FilterBar } from '@/components/shared/FilterBar';
import { ReportTrendChart, CategoryPieChart, TeamPerformanceChart, tooltipStyle } from '@/components/shared/charts';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { cn } from '@/lib/cn';
import { downloadCsv, downloadPdf } from '@/lib/export';
import type { ReportFilters } from '@/types/report';
import {
  Ticket,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

type Tab = 'summary' | 'detailed';

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('summary');

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const { data: categories } = useFetch(() => categoriesApi.list());

  const filters: ReportFilters = useMemo(() => {
    const f: ReportFilters = {};
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (statusFilter !== 'ALL') f.status = statusFilter;
    if (categoryFilter !== 'ALL') f.categoryId = categoryFilter;
    return f;
  }, [dateFrom, dateTo, statusFilter, categoryFilter]);

  // Fetch both tabs' data lazily
  const summaryQuery = useFetch(
    () => reportsApi.summary(filters),
    [filters, 'summary']
  );
  const detailedQuery = useFetch(
    () => reportsApi.detailed(filters),
    [filters, 'detailed']
  );

  const hasActiveFilters =
    !!dateFrom || !!dateTo || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  const handleExportSummaryCsv = () => {
    if (!summaryQuery.data) return;
    const { metrics, byTeam, byCategory, byAgent } = summaryQuery.data;

    const rows: Array<Array<string | number>> = [];
    rows.push(['Metric', 'Value']);
    rows.push(['Total tickets', metrics.totalTickets]);
    rows.push(['Resolved tickets', metrics.resolvedTickets]);
    rows.push(['Unresolved tickets', metrics.unresolvedTickets]);
    rows.push(['Avg. resolution (hours)', metrics.avgResolutionHours]);
    rows.push(['Resolution rate (%)', metrics.resolutionRate]);
    rows.push([]);
    rows.push(['Team', 'Level', 'Received', 'Resolved', 'Avg hours', 'Rate %']);
    byTeam.forEach((t) =>
      rows.push([t.teamName, t.level, t.received, t.resolved, t.avgResolutionHours, t.resolutionRate])
    );
    rows.push([]);
    rows.push(['Category', 'Total', 'Resolved', 'Unresolved']);
    byCategory.forEach((c) =>
      rows.push([c.categoryName, c.total, c.resolved, c.unresolved])
    );
    rows.push([]);
    rows.push(['Agent', 'Level', 'Assigned', 'Resolved', 'Rate %']);
    byAgent.forEach((a) =>
      rows.push([a.username, a.level, a.assigned, a.resolved, a.resolutionRate])
    );

    downloadCsv(`ntc-report-summary-${dateStamp()}.csv`, rows[0] as string[], rows.slice(1));
  };

  const handleExportSummaryPdf = () => {
    if (!summaryQuery.data) return;
    const { metrics, byTeam, byCategory, byAgent } = summaryQuery.data;

    downloadPdf({
      filename: `ntc-report-summary-${dateStamp()}.pdf`,
      title: 'Summary Report',
      subtitle: rangeLabel(dateFrom, dateTo),
      sections: [
        {
          title: 'Overall metrics',
          headers: ['Metric', 'Value'],
          rows: [
            ['Total tickets', metrics.totalTickets],
            ['Resolved tickets', metrics.resolvedTickets],
            ['Unresolved tickets', metrics.unresolvedTickets],
            ['Avg. resolution time', `${metrics.avgResolutionHours} hrs`],
            ['Resolution rate', `${metrics.resolutionRate}%`],
          ],
        },
        {
          title: 'By team',
          headers: ['Team', 'Level', 'Received', 'Resolved', 'Avg hours', 'Rate %'],
          rows: byTeam.map((t) => [
            t.teamName,
            t.level,
            t.received,
            t.resolved,
            t.avgResolutionHours,
            `${t.resolutionRate}%`,
          ]),
        },
        {
          title: 'By category',
          headers: ['Category', 'Total', 'Resolved', 'Unresolved'],
          rows: byCategory.map((c) => [
            c.categoryName,
            c.total,
            c.resolved,
            c.unresolved,
          ]),
        },
        {
          title: 'By agent',
          headers: ['Agent', 'Level', 'Assigned', 'Resolved', 'Rate %'],
          rows: byAgent.map((a) => [
            a.username,
            a.level,
            a.assigned,
            a.resolved,
            `${a.resolutionRate}%`,
          ]),
        },
      ],
    });
  };

  const handleExportDetailedCsv = () => {
    if (!detailedQuery.data) return;
    const headers = [
      'ID', 'Title', 'Category', 'Priority', 'Status', 'Level',
      'Created By', 'Assigned To', 'Team', 'Created', 'Updated', 'Resolved', 'Hours',
    ];
    const rows = detailedQuery.data.rows.map((r) => [
      r.id,
      r.title,
      r.categoryName,
      r.priority,
      r.status,
      r.level ?? '',
      r.createdByName,
      r.assignedToName ?? '',
      r.assignedTeamName ?? '',
      r.createdAt,
      r.updatedAt,
      r.resolvedAt ?? '',
      r.resolutionHours ?? '',
    ]);
    downloadCsv(`ntc-report-detailed-${dateStamp()}.csv`, headers, rows);
  };

  const handleExportDetailedPdf = () => {
    if (!detailedQuery.data) return;
    downloadPdf({
      filename: `ntc-report-detailed-${dateStamp()}.pdf`,
      title: 'Detailed Ticket Report',
      subtitle: rangeLabel(dateFrom, dateTo),
      sections: [
        {
          title: `Tickets (${detailedQuery.data.rows.length})`,
          headers: [
            'ID', 'Title', 'Category', 'Priority', 'Status',
            'Assigned', 'Created', 'Resolved', 'Hours',
          ],
          rows: detailedQuery.data.rows.map((r) => [
            r.id.slice(0, 12),
            truncate(r.title, 40),
            r.categoryName,
            r.priority,
            r.status,
            r.assignedToName ?? r.assignedTeamName ?? '—',
            new Date(r.createdAt).toLocaleDateString(),
            r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : '—',
            r.resolutionHours ?? '—',
          ]),
        },
      ],
    });
  };

  const categoryOptions = (categories ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="pb-6 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-medium">
          Admin console
        </p>
        <h1 className="mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          Reports
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Analyze and export ticket activity.
        </p>
      </header>

      {/* Filter bar */}
      <div className="mt-6 space-y-3">
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(next) => {
            if ('dateFrom' in next) setDateFrom(next.dateFrom ?? '');
            if ('dateTo' in next) setDateTo(next.dateTo ?? '');
          }}
        />

        <FilterBar
          searchValue=""
          onSearchChange={() => {}}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          selects={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL',       label: 'All statuses' },
                { value: 'NEW',       label: 'New' },
                { value: 'ASSIGNED',  label: 'Assigned' },
                { value: 'INPROCESS', label: 'In progress' },
                { value: 'ESCALATED', label: 'Escalated' },
                { value: 'RESOLVED',  label: 'Resolved' },
              ],
            },
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'ALL', label: 'All categories' },
                ...categoryOptions,
              ],
            },
          ]}
          action={
            <div className="flex items-center gap-2">
              <ExportButton
                onClick={tab === 'summary' ? handleExportSummaryCsv : handleExportDetailedCsv}
                disabled={
                  tab === 'summary' ? !summaryQuery.data : !detailedQuery.data
                }
                icon={FileSpreadsheet}
                label="CSV"
              />
              <ExportButton
                onClick={tab === 'summary' ? handleExportSummaryPdf : handleExportDetailedPdf}
                disabled={
                  tab === 'summary' ? !summaryQuery.data : !detailedQuery.data
                }
                icon={FileDown}
                label="PDF"
              />
            </div>
          }
        />
      </div>

      {/* Tab switcher */}
      <div className="mt-6 flex items-center gap-1 border-b border-ink-200">
        <TabButton active={tab === 'summary'} onClick={() => setTab('summary')} icon={BarChart3}>
          Summary
        </TabButton>
        <TabButton active={tab === 'detailed'} onClick={() => setTab('detailed')} icon={FileText}>
          Detailed
        </TabButton>
      </div>

      {/* Content */}
      <div className="mt-6">
        {tab === 'summary' ? (
          <SummaryView
            loading={summaryQuery.loading}
            error={summaryQuery.error}
            data={summaryQuery.data}
          />
        ) : (
          <DetailedView
            loading={detailedQuery.loading}
            error={detailedQuery.error}
            data={detailedQuery.data}
            summary = {summaryQuery.data}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
        active ? 'text-ink-900' : 'text-ink-500 hover:text-ink-700'
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
      {active && (
        <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-ink-900" />
      )}
    </button>
  );
}

function ExportButton({
  onClick,
  disabled,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium transition-colors',
        'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
        'disabled:opacity-40 disabled:cursor-not-allowed'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────
   Summary view
   ───────────────────────────────────────────────── */

function SummaryView({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: string | null;
  data: any;
}) {
  if (error) return <ErrorState message={error} />;

  const metrics = data?.metrics ?? {
    totalTickets: 0,
    resolvedTickets: 0,
    unresolvedTickets: 0,
    avgResolutionHours: 0,
    resolutionRate: 0,
  };

  const trend = data?.trend ?? [];
  const byTeam = data?.byTeam ?? [];
  const byCategory = data?.byCategory ?? [];
  const byAgent = data?.byAgent ?? [];

  // Team performance data for the bar chart
  const teamChartData = byTeam.map((t: any) => ({
    teamName: t.teamName,
    level: t.level,
    assigned: t.received,
    resolved: t.resolved,
    resolutionRate: t.resolutionRate,
  }));

  // Category pie data
  const categoryChartData = byCategory.map((c: any) => ({
    name: c.categoryName,
    value: c.total,
  }));

  return (
    <div className="space-y-6">
      {/* ── KPI strip ─────────────────────────────── */}
      <KpiStrip
        loading={loading}
        columns={4}
        items={[
          { label: 'Total',           value: metrics.totalTickets,        icon: Ticket,        tone: 'info' },
          { label: 'Resolved',        value: metrics.resolvedTickets,     icon: CheckCircle2,  tone: 'success' },
          { label: 'Unresolved',      value: metrics.unresolvedTickets,   icon: AlertTriangle, tone: 'warn' },
          { label: 'Resolution rate', value: `${metrics.resolutionRate}%`, icon: TrendingUp,    tone: 'info' },
        ]}
      />

      {/* ── Trend chart (full width) ──────────────── */}
      <Card title="Ticket activity" subtitle="Created vs resolved · per day">
        {loading ? (
          <ChartSkeleton h={260} />
        ) : (
          <ReportTrendChart data={trend} />
        )}
      </Card>

      {/* ── Team + Category row ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-2"
          title="Team performance"
          subtitle="Assigned vs resolved per team"
        >
          {loading ? (
            <ChartSkeleton h={260} />
          ) : (
            <TeamPerformanceChart data={teamChartData} />
          )}
        </Card>

        <Card title="Category distribution" subtitle="Ticket volume by category">
          {loading ? (
            <ChartSkeleton h={260} />
          ) : (
            <CategoryPieChart data={categoryChartData} />
          )}
        </Card>
      </div>

      {/* ── Agent leaderboard ─────────────────────── */}
      <Card
        title="Agent resolution rate"
        subtitle="Ranked by % of assigned tickets resolved"
      >
        {loading ? (
          <ChartSkeleton h={Math.max(220, byAgent.length * 44)} />
        ) : (
          <AgentResolutionChart data={byAgent} />
        )}
      </Card>
    </div>
  );
}

/* ── Agent resolution horizontal bar chart ─────────── */
function AgentResolutionChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-ink-400">
        No agent data.
      </div>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(220, data.length * 44)}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 40, left: 8, bottom: 0 }}
        barCategoryGap="24%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f3f5"
          horizontal={false}
        />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: '#97a1ac' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="username"
          width={100}
          tick={{ fontSize: 11, fill: '#4a5560' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, _name, item) => {
            const row = (item as any).payload;
            return [
              `${value}% (${row.resolved}/${row.assigned})`,
              'Resolution rate',
            ];
          }}
        />
        <Bar
          dataKey="resolutionRate"
          fill="#1f5fa8"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Chart skeleton ───────────────────────────────── */
function ChartSkeleton({ h }: { h: number }) {
  return <div className="rounded-md bg-ink-100 animate-pulse" style={{ height: h }} />;
}

function DataTableSimple({
  loading,
  headers,
  rows,
  empty,
}: {
  loading: boolean;
  headers: string[];
  rows: Array<Array<string | number>>;
  empty: string;
}) {
  if (loading) {
    return (
      <div className="p-5 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-ink-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-10 text-center text-sm text-ink-400">{empty}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 border-y border-ink-100">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-5 py-2.5 text-[10px] uppercase tracking-wider font-medium text-ink-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-ink-50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    'px-5 py-2.5',
                    j === 0 ? 'font-medium text-ink-900' : 'text-ink-700',
                    typeof cell === 'number' && 'tabular-nums'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Detailed view
   ───────────────────────────────────────────────── */

function DetailedView({
  loading,
  error,
  data,
  summary,
}: {
  loading: boolean;
  error: string | null;
  data: any;
  summary: any;     // ← pass the summary too, so we can reuse by-team/category/agent
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (error) return <ErrorState message={error} />;

  const rows = data?.rows ?? [];
  const byTeam = summary?.byTeam ?? [];
  const byCategory = summary?.byCategory ?? [];
  const byAgent = summary?.byAgent ?? [];

  return (
    <div className="space-y-8">

      {/* ═══════════════════════════════════════════════
          Section 1 — Tickets
         ═══════════════════════════════════════════════ */}
      <Section
        title="Tickets"
        subtitle={`${rows.length} matching the current filters`}
        exportable
        onExportCsv={() => {
          const headers = [
            'ID', 'Title', 'Category', 'Priority', 'Status', 'Level',
            'Created By', 'Assigned To', 'Team', 'Created', 'Updated', 'Resolved', 'Hours',
          ];
          const csvRows = rows.map((r: any) => [
            r.id, r.title, r.categoryName, r.priority, r.status, r.level ?? '',
            r.createdByName, r.assignedToName ?? '', r.assignedTeamName ?? '',
            r.createdAt, r.updatedAt, r.resolvedAt ?? '', r.resolutionHours ?? '',
          ]);
          downloadCsv(`ntc-tickets-${dateStamp()}.csv`, headers, csvRows);
        }}
        onExportPdf={() => {
          downloadPdf({
            filename: `ntc-tickets-${dateStamp()}.pdf`,
            title: 'Ticket List',
            subtitle: `${rows.length} tickets`,
            sections: [{
              title: 'All tickets',
              headers: ['ID', 'Title', 'Category', 'Priority', 'Status', 'Assigned', 'Created', 'Hours'],
              rows: rows.map((r: any) => [
                r.id.slice(0, 12),
                truncate(r.title, 35),
                r.categoryName,
                r.priority,
                r.status,
                r.assignedToName ?? r.assignedTeamName ?? '—',
                new Date(r.createdAt).toLocaleDateString(),
                r.resolutionHours ?? '—',
              ]),
            }],
          });
        }}
      >
        {loading ? (
          <SectionSkeleton rows={6} />
        ) : rows.length === 0 ? (
          <SectionEmpty message="No tickets match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  {['Ticket', 'Category', 'Priority', 'Status', 'Assigned', 'Created', 'Resolved'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-medium text-ink-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((r: any) => {
                  const expanded = expandedId === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        onClick={() => setExpandedId(expanded ? null : r.id)}
                        className="hover:bg-ink-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-ink-900 truncate max-w-xs">
                            {r.title}
                          </p>
                          <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
                            #{r.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-700">{r.categoryName}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">
                            {r.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-600">
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-700">
                          {r.assignedToName ?? r.assignedTeamName ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-500">
                          {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-ink-50/50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <Detail label="Created by" value={r.createdByName} />
                              <Detail label="Assigned team" value={r.assignedTeamName ?? '—'} />
                              <Detail label="Level" value={r.level ?? '—'} />
                              <Detail
                                label="Resolution time"
                                value={r.resolutionHours != null ? `${r.resolutionHours} hrs` : '—'}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          Section 2 — By agent
         ═══════════════════════════════════════════════ */}
      <Section
        title="By agent"
        subtitle={`${byAgent.length} agent${byAgent.length === 1 ? '' : 's'} with assigned tickets`}
        exportable
        onExportCsv={() => {
          const headers = ['Agent', 'Level', 'Assigned', 'Resolved', 'Avg hours', 'Resolution rate'];
          const csvRows = byAgent.map((a: any) => [
            a.username, a.level, a.assigned, a.resolved, a.avgResolutionHours, `${a.resolutionRate}%`,
          ]);
          downloadCsv(`ntc-by-agent-${dateStamp()}.csv`, headers, csvRows);
        }}
        onExportPdf={() => {
          downloadPdf({
            filename: `ntc-by-agent-${dateStamp()}.pdf`,
            title: 'Agent Performance',
            subtitle: `${byAgent.length} agents`,
            sections: [{
              title: 'Per-agent metrics',
              headers: ['Agent', 'Level', 'Assigned', 'Resolved', 'Avg hrs', 'Rate'],
              rows: byAgent.map((a: any) => [
                a.username, a.level, a.assigned, a.resolved, a.avgResolutionHours, `${a.resolutionRate}%`,
              ]),
            }],
          });
        }}
      >
        {loading ? (
          <SectionSkeleton rows={4} />
        ) : byAgent.length === 0 ? (
          <SectionEmpty message="No agent activity in this range." />
        ) : (
          <DataTableSimple
            loading={false}
            headers={['Agent', 'Level', 'Assigned', 'Resolved', 'Avg hrs', 'Rate']}
            rows={byAgent.map((a: any) => [
              a.username, a.level, a.assigned, a.resolved, a.avgResolutionHours, `${a.resolutionRate}%`,
            ])}
            empty="No agent data."
          />
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          Section 3 — By category
         ═══════════════════════════════════════════════ */}
      <Section
        title="By category"
        subtitle={`${byCategory.length} categor${byCategory.length === 1 ? 'y' : 'ies'} represented`}
        exportable
        onExportCsv={() => {
          const headers = ['Category', 'Total', 'Resolved', 'Unresolved', 'Resolution rate'];
          const csvRows = byCategory.map((c: any) => [
            c.categoryName, c.total, c.resolved, c.unresolved,
            c.total > 0 ? `${Math.round((c.resolved / c.total) * 100)}%` : '0%',
          ]);
          downloadCsv(`ntc-by-category-${dateStamp()}.csv`, headers, csvRows);
        }}
        onExportPdf={() => {
          downloadPdf({
            filename: `ntc-by-category-${dateStamp()}.pdf`,
            title: 'Category Performance',
            subtitle: `${byCategory.length} categories`,
            sections: [{
              title: 'Per-category metrics',
              headers: ['Category', 'Total', 'Resolved', 'Unresolved', 'Rate'],
              rows: byCategory.map((c: any) => [
                c.categoryName, c.total, c.resolved, c.unresolved,
                c.total > 0 ? `${Math.round((c.resolved / c.total) * 100)}%` : '0%',
              ]),
            }],
          });
        }}
      >
        {loading ? (
          <SectionSkeleton rows={4} />
        ) : byCategory.length === 0 ? (
          <SectionEmpty message="No category activity in this range." />
        ) : (
          <DataTableSimple
            loading={false}
            headers={['Category', 'Total', 'Resolved', 'Unresolved', 'Rate']}
            rows={byCategory.map((c: any) => [
              c.categoryName, c.total, c.resolved, c.unresolved,
              c.total > 0 ? `${Math.round((c.resolved / c.total) * 100)}%` : '0%',
            ])}
            empty="No category data."
          />
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          Section 4 — By team
         ═══════════════════════════════════════════════ */}
      <Section
        title="By team"
        subtitle={`${byTeam.length} team${byTeam.length === 1 ? '' : 's'} involved`}
        exportable
        onExportCsv={() => {
          const headers = ['Team', 'Level', 'Received', 'Resolved', 'Avg hours', 'Resolution rate'];
          const csvRows = byTeam.map((t: any) => [
            t.teamName, t.level, t.received, t.resolved, t.avgResolutionHours, `${t.resolutionRate}%`,
          ]);
          downloadCsv(`ntc-by-team-${dateStamp()}.csv`, headers, csvRows);
        }}
        onExportPdf={() => {
          downloadPdf({
            filename: `ntc-by-team-${dateStamp()}.pdf`,
            title: 'Team Performance',
            subtitle: `${byTeam.length} teams`,
            sections: [{
              title: 'Per-team metrics',
              headers: ['Team', 'Level', 'Received', 'Resolved', 'Avg hrs', 'Rate'],
              rows: byTeam.map((t: any) => [
                t.teamName, t.level, t.received, t.resolved, t.avgResolutionHours, `${t.resolutionRate}%`,
              ]),
            }],
          });
        }}
      >
        {loading ? (
          <SectionSkeleton rows={4} />
        ) : byTeam.length === 0 ? (
          <SectionEmpty message="No team activity in this range." />
        ) : (
          <DataTableSimple
            loading={false}
            headers={['Team', 'Level', 'Received', 'Resolved', 'Avg hrs', 'Rate']}
            rows={byTeam.map((t: any) => [
              t.teamName, t.level, t.received, t.resolved, t.avgResolutionHours, `${t.resolutionRate}%`,
            ])}
            empty="No team data."
          />
        )}
      </Section>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Section wrapper with export buttons
   ───────────────────────────────────────────────── */

function Section({
  title,
  subtitle,
  exportable,
  onExportCsv,
  onExportPdf,
  children,
}: {
  title: string;
  subtitle?: string;
  exportable?: boolean;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-ink-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-ink-100">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {subtitle && (
            <p className="text-[11px] uppercase tracking-wider text-ink-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {exportable && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium text-ink-600 hover:bg-ink-100 border border-ink-200 transition-colors"
            >
              <FileSpreadsheet className="w-3 h-3" />
              CSV
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium text-ink-600 hover:bg-ink-100 border border-ink-200 transition-colors"
            >
              <FileDown className="w-3 h-3" />
              PDF
            </button>
          </div>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="p-5 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 rounded bg-ink-100 animate-pulse" />
      ))}
    </div>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return (
    <div className="p-10 text-center text-sm text-ink-400">{message}</div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-medium text-ink-400">
        {label}
      </p>
      <p className="mt-0.5 text-ink-800 font-medium">{value}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card flush>
      <div className="p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium text-ink-700">Could not load report</p>
        <p className="mt-1 text-xs text-ink-400">{message}</p>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────── */

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function rangeLabel(from: string, to: string): string {
  if (!from && !to) return 'All time';
  if (from && to) return `${from} → ${to}`;
  if (from) return `From ${from}`;
  return `Until ${to}`;
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
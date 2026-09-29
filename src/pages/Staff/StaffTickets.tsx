import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  CornerDownLeft,
//   AlertTriangle,
  PlusCircle,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useFetch } from '@/hooks/useFetch';
// import { Card } from '@/components/shared/Card';
import { DataTable, type Column, type SortDirection } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { KpiStrip } from '@/components/shared/KpiStrip';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badges';
import { ticketsApi } from '@/api/endpoints';
import { timeAgo } from '@/lib/time';
// import { cn } from '@/lib/cn';
import type { Ticket, TicketPriority } from '@/types/ticket';

type SortKey = 'created' | 'priority' | 'status';

const PRIORITY_RANK: Record<TicketPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function StaffTicketsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const priorityFilter = searchParams.get('priority') ?? 'ALL';
  const categoryFilter = searchParams.get('category') ?? 'ALL';

  // Local state
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data, loading, error } = useFetch(() => ticketsApi.mine({ pageSize: 100 }));

  const tickets: Ticket[] = data?.results ?? [];
  const stats = data?.stats ?? {
    total: 0, inProgress: 0, resolved: 0, forwardedBack: 0, unreadComments: 0,
  };

  // Derive category options from the ticket list
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    tickets.forEach((t) => {
      if (!map.has(t.categoryId)) map.set(t.categoryId, t.categoryName);
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [tickets]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearch('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters =
    !!search ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    categoryFilter !== 'ALL';

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tickets.filter((t) => {
      if (q) {
        const haystack = `${t.title} ${t.id} ${t.categoryName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.categoryId !== categoryFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'created') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'priority') {
        cmp = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter, sortKey, sortDirection]);

  const handleSortChange = (key: string, dir: SortDirection) => {
    setSortKey(key as SortKey);
    setSortDirection(dir);
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'title',
      header: 'Ticket',
      sortable: false,
      render: (t) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">{t.title}</p>
          <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
            #{t.id.slice(0, 8)} · {t.categoryName}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: 'w-32',
      render: (t) => <StatusBadge status={t.status} viewerIsCreator />,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      width: 'w-24',
      render: (t) => <PriorityBadge priority={t.priority} />,
    },
    {
      key: 'created',
      header: 'Created',
      sortable: true,
      align: 'right',
      width: 'w-32',
      render: (t) => (
        <span className="text-xs text-ink-500">{timeAgo(t.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="pb-6 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-medium">
          Staff console
        </p>
        <h1 className="mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          My Tickets
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          All tickets you've submitted, in one place.
        </p>
      </header>

      {/* ── KPI strip ──────────────────────────────────────── */}
      <div className="mt-8">
        <KpiStrip
          loading={loading}
          items={[
            { label: 'Total submitted', value: stats.total,        icon: TicketIcon,     tone: 'info'    },
            { label: 'In progress',     value: stats.inProgress,   icon: Clock,          tone: 'default' },
            { label: 'Resolved',        value: stats.resolved,     icon: CheckCircle2,   tone: 'success' },
            { label: 'Action required', value: stats.forwardedBack, icon: CornerDownLeft,
              tone: stats.forwardedBack > 0 ? 'warn' : 'default' },
          ]}
        />
      </div>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="mt-6">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tickets…"
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          selects={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: (v) => setParam('status', v),
              options: [
                { value: 'ALL',            label: 'All statuses' },
                { value: 'NEW',            label: 'New' },
                { value: 'ASSIGNED',       label: 'Assigned' },
                { value: 'INPROCESS',      label: 'In progress' },
                { value: 'FORWARDED',      label: 'Forwarded' },
                { value: 'FORWARDED_BACK', label: 'Returned to you' },
                { value: 'ESCALATED',      label: 'Escalated' },
                { value: 'RESOLVED',       label: 'Resolved' },
                { value: 'REOPENED',       label: 'Reopened' },
              ],
            },
            {
              key: 'priority',
              label: 'Priority',
              value: priorityFilter,
              onChange: (v) => setParam('priority', v),
              options: [
                { value: 'ALL',      label: 'All priorities' },
                { value: 'CRITICAL', label: 'Critical' },
                { value: 'HIGH',     label: 'High' },
                { value: 'MEDIUM',   label: 'Medium' },
                { value: 'LOW',      label: 'Low' },
              ],
            },
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: (v) => setParam('category', v),
              options: [
                { value: 'ALL', label: 'All categories' },
                ...categoryOptions,
              ],
            },
          ]}
          action={
            <Link
              to="/staff/tickets/new"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New ticket
            </Link>
          }
        />
      </div>

      {/* ── Results meta ───────────────────────────────────── */}
      {!loading && !error && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-ink-500">
            {filtered.length === tickets.length
              ? `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`
              : `${filtered.length} of ${tickets.length} tickets`}
          </p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="mt-3">
        <DataTable<Ticket>
          data={filtered}
          columns={columns}
          keyExtractor={(t) => t.id}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onRowClick={(t) => navigate(`/staff/tickets/${t.id}`)}
          loading={loading}
          error={error}
          emptyState={
            hasActiveFilters ? (
              <FilteredEmpty onClear={clearFilters} />
            ) : (
              <BlankEmpty />
            )
          }
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Empty states
   ───────────────────────────────────────────────────────── */

function BlankEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <Inbox className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">No tickets yet</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">
        Submit your first ticket to get help from our support team.
      </p>
      <Link
        to="/staff/tickets/new"
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
      >
        <PlusCircle className="w-3.5 h-3.5" />
        Create a ticket
      </Link>
    </div>
  );
}

function FilteredEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">No matches</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">
        No tickets match your current filters.
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-xs font-medium text-ink-900 hover:underline underline-offset-2"
      >
        Clear all filters
      </button>
    </div>
  );
}
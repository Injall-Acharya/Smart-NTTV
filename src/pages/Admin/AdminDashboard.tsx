import { useEffect, useState } from 'react';
import {
  Ticket, Clock, CheckCircle2, AlertTriangle,
  TrendingUp, Timer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { adminApi } from '@/api/endpoints';
// import { useAuthStore } from '@/store/auth';
// import type { AdminStats } from '@/types/admin';
import {
  TicketTrendChart,
  PriorityChart,
  TeamPerformanceChart,
  CategoryPieChart,
} from '@/components/shared/charts';

function useFetch<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fn()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, deps);

  return { data, loading };
}

export function AdminDashboard() {
  // const user = useAuthStore((s) => s.user);
  const { data, loading } = useFetch(adminApi.stats);

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="pb-6 border-b border-ink-200">
        <p className="mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          Admin console
        </p>

        {/* <h1 className="mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          Good to see you, {user?.firstName}.
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">Here's how the system is performing today.</p> */}
      </header>

      {/* ── KPI strip ──────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-8 bg-ink-200 rounded-lg overflow-hidden border border-ink-200">
        <KPI icon={Ticket}         label="Total tickets"  value={data?.totalTickets}      loading={loading} />
        <KPI icon={Clock}          label="In Progress"           value={data?.openTickets}       loading={loading} />
        <KPI icon={CheckCircle2}   label="Resolved"       value={data?.resolvedTickets}   loading={loading} />
        <KPI icon={AlertTriangle}  label="Unresolved"     value={data?.unresolvedTickets} loading={loading} tone="warn" />
      </section>

      {/* ── Secondary KPIs ─────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 mt-4">
        <MiniStat
          icon={Timer}
          label="Avg. resolution time"
          value={data?.avgResolutionHours != null ? `${data.avgResolutionHours.toFixed(1)} hrs` : '—'}
          loading={loading}
        />
        <MiniStat
          icon={TrendingUp}
          label="Resolution rate"
          value={
            data?.totalTickets
              ? `${((data.resolvedTickets / data.totalTickets) * 100).toFixed(1)}%`
              : '—'
          }
          loading={loading}
        />
      </section>

      {/* ── Trend + Priority ───────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
        <Card
          className="lg:col-span-2"
          title="Ticket activity"
          subtitle="Created vs resolved · last 7 days"
        >
          {loading ? <ChartSkeleton h={260} /> : <TicketTrendChart data={data?.trend ?? []} />}
        </Card>

        <Card title="By priority" subtitle="Distribution across all tickets">
          {loading ? <ChartSkeleton h={260} /> : <PriorityChart data={data?.byPriority ?? []} />}
        </Card>
      </section>

      {/* ── Team performance ───────────────────────────────── */}
      <section className="mt-6">
        <Card
          title="Team performance"
          subtitle="Assigned vs resolved · ranked by resolution rate"
        >
          {loading ? <ChartSkeleton h={300} /> : <TeamPerformanceChart data={data?.byTeam ?? []} />}
        </Card>
      </section>

      {/* ── Categories + Agents ────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Ticket categories" subtitle="Volume share by category">
          {loading ? <ChartSkeleton h={260} /> : <CategoryPieChart data={data?.byCategory ?? []} />}
        </Card>

        <Card title="Top agents" subtitle="Resolved tickets this period">
          {loading ? <ListSkeleton /> : <AgentLeaderboard agents={data?.topAgents ?? []} />}
        </Card>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────── */

function KPI({
  icon: Icon, label, value, loading, tone,
}: {
  icon: LucideIcon; label: string; value?: number; loading?: boolean;
  tone?: 'default' | 'warn';
}) {
  return (
    <div className="bg-white px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
          {label}
        </p>
        <Icon
          className={tone === 'warn' ? 'w-3.5 h-3.5 text-amber-600' : 'w-3.5 h-3.5 text-ink-300'}
        />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">
        {loading ? <span className="inline-block w-12 h-7 rounded bg-ink-100 animate-pulse" /> : (value ?? 0)}
      </p>
    </div>
  );
}

function MiniStat({
  icon: Icon, label, value, loading,
}: {
  icon: LucideIcon; label: string; value: string; loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-5 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-md bg-ink-100 text-ink-600 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">
          {loading ? <span className="inline-block w-16 h-5 rounded bg-ink-100 animate-pulse" /> : value}
        </p>
      </div>
    </div>
  );
}

function Card({
  title, subtitle, className, children,
}: {
  title: string; subtitle?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-ink-200 bg-white ${className ?? ''}`}>
      <div className="px-5 pt-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && (
          <p className="text-[11px] uppercase tracking-wider text-ink-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="px-3 pb-4 pt-2">{children}</div>
    </div>
  );
}

function AgentLeaderboard({
  agents,
}: {
  agents: { agentId: string; username: string; level: string; assigned: number; resolved: number }[];
}) {
  if (!agents.length) {
    return <div className="h-40 flex items-center justify-center text-xs text-ink-400">No agent data yet.</div>;
  }

  const max = Math.max(...agents.map((a) => a.resolved), 1);

  return (
    <ul className="divide-y divide-ink-100">
      {agents.map((a, idx) => (
        <li key={a.agentId} className="px-2 py-3 flex items-center gap-3">
          <span className="w-5 text-xs font-mono text-ink-400">{idx + 1}</span>
          <div className="w-8 h-8 rounded-full bg-ink-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {a.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-ink-900 truncate">{a.username}</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-ink-100 text-ink-600 shrink-0">
                {a.level}
              </span>
            </div>
            {/* progress bar */}
            <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full bg-brand-700 rounded-full transition-all"
                style={{ width: `${(a.resolved / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold tabular-nums">{a.resolved}</p>
            <p className="text-[10px] text-ink-400">of {a.assigned}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChartSkeleton({ h }: { h: number }) {
  return <div className="rounded-md bg-ink-100 animate-pulse" style={{ height: h }} />;
}

function ListSkeleton() {
  return (
    <ul className="space-y-3 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="h-10 rounded bg-ink-100 animate-pulse" />
      ))}
    </ul>
  );
}
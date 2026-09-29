import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Legend,
} from 'recharts';
import type { TrendPoint, CategoryBucket, PriorityBucket, TeamPerformance } from '@/types/admin';

/* ─── Palette ─────────────────────────────────────────────── */
const PALETTE = ['#1f5fa8', '#4c81c8', '#7da5db', '#b45309', '#047857', '#6d28d9'];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#be123c',
  HIGH:     '#b45309',
  MEDIUM:   '#1f5fa8',
  LOW:      '#6b7681',
};

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e6ea',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(13,17,23,0.06)',
  padding: '8px 12px',
};

const pieTooltipStyle = {
  borderRadius: 8,
  border: '1px solid #edeff2',
  background: '#ffffff',                    // solid white — fixes readability
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(13,17,23,0.10), 0 1px 3px rgba(13,17,23,0.06)',
  padding: '8px 12px',
};

function pct(value: number, total: number) {
  if (!total || total <= 0) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

/* ─── Custom tooltip ──────────────────────────────────────── */
interface PieTooltipProps {
  active?: boolean;
  payload?: readonly any[];
  total: number;
}

function PieTooltip({ active, payload, total }: PieTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const entry = payload[0];
  const name = String(entry.name ?? '');
  const value = Number(entry.value) || 0;
  const color = entry.payload?.fill ?? '#1f5fa8';

  return (
    <div style={pieTooltipStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, color }}>{name}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <span style={{ fontWeight: 600, color }}>{value}</span>
        <span style={{ marginLeft: 4, color }}>({pct(value, total)})</span>
      </div>
    </div>
  );
}

/* ─── Custom legend renderer ──────────────────────────────── */
interface LegendEntry {
  value: string;
  color: string;
}

function ColoredLegend({ items }: { items: LegendEntry[] }) {
  return (
    <ul
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px 16px',
        paddingTop: 8,
        fontSize: 11,
        listStyle: 'none',
        margin: 0,
      }}
    >
      {items.map((item) => (
        <li
          key={item.value}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4a5560' }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span>{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Ticket trend ────────────────────────────────────────── */
export function TicketTrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return <Empty label="No trend data yet." />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1f5fa8" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#1f5fa8" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#047857" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#047857" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#97a1ac' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis tick={{ fontSize: 11, fill: '#97a1ac' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone" dataKey="created" stroke="#1f5fa8" strokeWidth={2}
          fill="url(#gradCreated)" name="Created"
        />
        <Area
          type="monotone" dataKey="resolved" stroke="#047857" strokeWidth={2}
          fill="url(#gradResolved)" name="Resolved"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── Priority donut ──────────────────────────────────────── */
export function PriorityChart({ data }: { data: PriorityBucket[] }) {
  if (!data.length) return <Empty label="No priority data yet." />;
  const total = data.reduce((s, d) => s + d.value, 0);

  const colored = data.map((d) => ({
    ...d,
    fill: PRIORITY_COLORS[d.name] ?? '#97a1ac',
  }));

  const legendItems = colored.map((d) => ({ value: d.name, color: d.fill }));

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={colored}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          />
          <Tooltip
            content={(props) => (
              <div style={{ background: '#ffffff', borderRadius: 8 }}>
                <PieTooltip {...props} total={total} />
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <ColoredLegend items={legendItems} />
    </div>
  );
}

/* ─── Team performance ────────────────────────────────────── */
export function TeamPerformanceChart({ data }: { data: TeamPerformance[] }) {
  if (!data.length) return <Empty label="No team data yet." />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
        barCategoryGap="24%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#97a1ac' }} tickLine={false} axisLine={false} />
        <YAxis
          type="category" dataKey="teamName" width={110}
          tick={{ fontSize: 11, fill: '#4a5560' }} tickLine={false} axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="assigned" fill="#c1c8d0" name="Assigned" radius={[0, 4, 4, 0]} />
        <Bar dataKey="resolved" fill="#1f5fa8" name="Resolved" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Category pie ────────────────────────────────────────── */
export function CategoryPieChart({ data }: { data: CategoryBucket[] }) {
  if (!data.length) return <Empty label="No category data yet." />;
  const total = data.reduce((s, d) => s + d.value, 0);

  // Attach the color directly to each data row
  const colored = data.map((d, i) => ({
    ...d,
    fill: PALETTE[i % PALETTE.length],
  }));

  const legendItems = colored.map((d) => ({ value: d.name, color: d.fill }));

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={colored}
            dataKey="value"
            nameKey="name"
            innerRadius={0}
            outerRadius={90}
            paddingAngle={1}
            stroke="#fff"
            strokeWidth={2}
            // Recharts reads `fill` from each data row automatically
          />
          <Tooltip
            content={(props) => (
              <div style={{ background: '#ffffff', borderRadius: 8 }}>
                <PieTooltip {...props} total={total} />
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <ColoredLegend items={legendItems} />
    </div>
  );
}
/* ─── Empty state ─────────────────────────────────────────── */
function Empty({ label }: { label: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-xs text-ink-400">
      {label}
    </div>
  );
}
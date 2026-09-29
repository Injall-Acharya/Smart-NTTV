import type { LucideIcon } from 'lucide-react';

export interface KpiItem {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: 'default' | 'warn' | 'success' | 'info';
}

interface KpiStripProps {
  items: KpiItem[];
  loading?: boolean;
  columns?: 2 | 3 | 4 | 5;
}

const TONE_ICON: Record<NonNullable<KpiItem['tone']>, string> = {
  default: 'text-ink-300',
  warn:    'text-orange-500',
  success: 'text-emerald-500',
  info:    'text-blue-500',
};

export function KpiStrip({ items, loading, columns = 4 }: KpiStripProps) {
  const gridCols =
    columns === 2 ? 'grid-cols-2'
    : columns === 3 ? 'grid-cols-2 lg:grid-cols-3'
    : columns === 4 ? 'grid-cols-2 lg:grid-cols-4'
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';

  return (
    <section
      className={columns === 5
      ? 'grid grid-cols-5 gap-px bg-ink-200 rounded-lg overflow-hidden border border-ink-200'
      : `grid ${gridCols} gap-px bg-ink-200 rounded-lg overflow-hidden border border-ink-200`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const tone = item.tone ?? 'default';
        return (
          <div key={item.label} className="bg-white px-4 py-4 lg:px-5 lg:py-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-ink-400 font-medium truncate">
                {item.label}
              </p>
              <Icon
                className={`w-3.5 h-3.5 ${TONE_ICON[tone]}`}
                strokeWidth={1.75}
              />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {loading ? (
                <span className="inline-block w-10 h-7 rounded bg-ink-100 animate-pulse" />
              ) : (
                item.value
              )}
            </p>
          </div>
        );
      })}
    </section>
  );
}
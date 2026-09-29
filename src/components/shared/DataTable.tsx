import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  /** If true, this column can be sorted by clicking the header */
  sortable?: boolean;
  /** Alignment for the cell contents */
  align?: 'left' | 'right' | 'center';
  /** Custom width class, e.g. 'w-32' */
  width?: string;
  /** Render function */
  render: (row: T) => ReactNode;
  /** Optional: hide this column on mobile (the card view handles it differently) */
  hideOnMobile?: boolean;
}

export type SortDirection = 'asc' | 'desc';

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  /** Current sort key */
  sortKey?: string;
  sortDirection?: SortDirection;
  onSortChange?: (key: string, dir: SortDirection) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: string | null;
  emptyState?: ReactNode;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  /** Render function for the mobile card view. If omitted, mobile shows a default layout. */
  renderMobileCard?: (row: T) => ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  sortKey,
  sortDirection,
  onSortChange,
  onRowClick,
  loading,
  error,
  emptyState,
  skeletonRows = 5,
  renderMobileCard,
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{error}</p>
      </div>
    );
  }

  if (loading) {
    return <SkeletonList rows={skeletonRows} />;
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 bg-white">
        {emptyState ?? (
          <div className="p-12 text-center">
            <p className="text-sm text-ink-500">No results.</p>
          </div>
        )}
      </div>
    );
  }

  const handleHeaderClick = (col: Column<T>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortDirection =
      sortKey === col.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(col.key, nextDir);
  };

  return (
    <>
      {/* ── Desktop table ─────────────────────────────── */}
      <div className="hidden md:block rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              {columns.map((col) => {
                const active = sortKey === col.key;
                const SortIcon = !active
                  ? ArrowUpDown
                  : sortDirection === 'asc'
                  ? ArrowUp
                  : ArrowDown;

                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.align !== 'right' && col.align !== 'center' && 'text-left',
                      col.width,
                      col.sortable && 'cursor-pointer select-none hover:text-ink-900'
                    )}
                    onClick={() => handleHeaderClick(col)}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'right' && 'flex-row-reverse'
                      )}
                    >
                      {col.header}
                      {col.sortable && (
                        <SortIcon
                          className={cn(
                            'w-3 h-3 transition-colors',
                            active ? 'text-ink-900' : 'text-ink-300'
                          )}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-ink-50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 align-middle',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ──────────────────────────── */}
      <div className="md:hidden space-y-2">
        {data.map((row) =>
          renderMobileCard ? (
            <div key={keyExtractor(row)}>{renderMobileCard(row)}</div>
          ) : (
            <DefaultMobileCard
              key={keyExtractor(row)}
              row={row}
              columns={columns}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            />
          )
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

function DefaultMobileCard<T>({
  row,
  columns,
  onClick,
}: {
  row: T;
  columns: Column<T>[];
  onClick?: () => void;
}) {
  const visible = columns.filter((c) => !c.hideOnMobile);
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-ink-200 bg-white p-4 space-y-2',
        onClick && 'cursor-pointer hover:bg-ink-50 transition-colors'
      )}
    >
      {visible.map((col) => (
        <div key={col.key} className="flex items-start justify-between gap-3">
          <span className="text-[10px] uppercase tracking-wider text-ink-400 font-medium shrink-0">
            {col.header}
          </span>
          <span className="text-right flex-1 min-w-0">{col.render(row)}</span>
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <>
      {/* Desktop skeleton */}
      <div className="hidden md:block rounded-lg border border-ink-200 bg-white overflow-hidden">
        <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
          <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
        </div>
        <ul className="divide-y divide-ink-100">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 bg-ink-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-ink-100 rounded animate-pulse" />
                </div>
                <div className="w-16 h-5 bg-ink-100 rounded-full animate-pulse" />
                <div className="w-20 h-5 bg-ink-100 rounded-full animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-ink-200 bg-white p-4 space-y-2">
            <div className="h-4 w-3/4 bg-ink-100 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-ink-100 rounded animate-pulse" />
            <div className="flex gap-2 pt-1">
              <div className="w-16 h-5 bg-ink-100 rounded-full animate-pulse" />
              <div className="w-20 h-5 bg-ink-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
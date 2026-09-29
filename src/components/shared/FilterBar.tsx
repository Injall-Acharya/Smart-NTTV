import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSelect {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  selects?: FilterSelect[];
  /** Optional right-aligned slot (e.g. "New ticket" button) */
  action?: ReactNode;
  /** Show a "Clear" button when any filter is active */
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

export function FilterBar({
  searchValue,
  searchPlaceholder = 'Search…',
  onSearchChange,
  selects = [],
  action,
  onClear,
  hasActiveFilters = false,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-md border border-ink-200 bg-white pl-9 pr-8 text-sm placeholder:text-ink-300
                     focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-ink-400 hover:text-ink-700"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {selects.map((select) => (
          <FilterSelectControl key={select.key} config={select} />
        ))}

        {hasActiveFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-medium text-ink-500 hover:text-ink-900 px-2 py-1.5 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right-aligned action */}
      {action && <div className="sm:ml-auto">{action}</div>}
    </div>
  );
}

function FilterSelectControl({ config }: { config: FilterSelect }) {
  const isDefault = config.value === config.options[0]?.value;
  return (
    <div className="relative">
      <select
        value={config.value}
        onChange={(e) => config.onChange(e.target.value)}
        aria-label={config.label}
        className={cn(
          'h-9 rounded-md border bg-white pl-3 pr-8 text-xs font-medium appearance-none cursor-pointer',
          'focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10',
          isDefault
            ? 'border-ink-200 text-ink-600'
            : 'border-ink-900 text-ink-900 bg-ink-50'
        )}
      >
        {config.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Custom chevron */}
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
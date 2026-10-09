import { Calendar } from 'lucide-react';

interface Props {
  dateFrom: string;
  dateTo: string;
  onChange: (next: { dateFrom?: string; dateTo?: string }) => void;
}

export function DateRangeFilter({ dateFrom, dateTo, onChange }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const preset = (from: string, to: string) => onChange({ dateFrom: from, dateTo: to });

  const thisWeek = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 6);
    preset(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
  };

  const thisMonth = () => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    preset(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
  };

  const last30 = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    preset(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-[10px] uppercase tracking-wider font-medium text-ink-400 mb-1">
          From
        </label>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none" />
          <input
            type="date"
            value={dateFrom}
            max={dateTo || today}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className="h-9 rounded-md border border-ink-200 bg-white pl-8 pr-2 text-xs
                       focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider font-medium text-ink-400 mb-1">
          To
        </label>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none" />
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            max={today}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className="h-9 rounded-md border border-ink-200 bg-white pl-8 pr-2 text-xs
                       focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 pb-0.5">
        <button
          type="button"
          onClick={thisWeek}
          className="text-[10px] font-medium px-2 py-1 rounded text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
        >
          This week
        </button>
        <button
          type="button"
          onClick={last30}
          className="text-[10px] font-medium px-2 py-1 rounded text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
        >
          30d
        </button>
        <button
          type="button"
          onClick={thisMonth}
          className="text-[10px] font-medium px-2 py-1 rounded text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
        >
          This month
        </button>
      </div>
    </div>
  );
}
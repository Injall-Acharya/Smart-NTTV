import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Category } from '@/types/category';

interface Props {
  category: Category;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function CategoryActionsMenu({
  category,
  onEdit,
  onToggleStatus,
  onDelete,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = category.status === 'active';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        disabled={disabled}
        className={cn(
          'p-1.5 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors',
          'disabled:opacity-40'
        )}
        aria-label="Category actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md border border-ink-200 shadow-lg z-20 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-ink-400" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onToggleStatus();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 transition-colors"
          >
            {isActive ? (
              <>
                <PowerOff className="w-3.5 h-3.5 text-ink-400" />
                Mark inactive
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5 text-emerald-500" />
                Mark active
              </>
            )}
          </button>

          <div className="h-px bg-ink-100 my-1" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
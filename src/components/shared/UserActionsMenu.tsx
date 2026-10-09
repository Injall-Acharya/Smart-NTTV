import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Power, PowerOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { User } from '@/types/user';

interface Props {
  user: User;
  onToggleActive: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function UserActionsMenu({
  user,
  onToggleActive,
  onDelete,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

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
        aria-label="User actions"
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
              onToggleActive();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 transition-colors"
          >
            {user.isActive ? (
              <>
                <PowerOff className="w-3.5 h-3.5 text-ink-400" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5 text-emerald-500" />
                Activate
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
            Delete team
          </button>
        </div>
      )}
    </div>
  );
}
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
  submitting?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  submitting = false,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg border border-ink-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-5">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              variant === 'danger'
                ? 'bg-red-50 text-red-600'
                : 'bg-ink-100 text-ink-600'
            )}
          >
            <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
            <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-1 rounded-md text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-100 bg-ink-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-brand-900 hover:bg-brand-800 text-white'
            )}
          >
            {submitting ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
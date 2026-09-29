import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AttachmentPickerProps {
  value: File[];
  onChange: (next: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPicker({
  value,
  onChange,
  maxFiles = 3,
  maxSizeMB = 10,
  accept = 'image/png,image/jpeg,image/webp,application/pdf',
  disabled = false,
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = maxFiles - value.length;
  const isFull = remaining <= 0;

  const addFiles = (incoming: File[]) => {
    setError(null);

    if (value.length + incoming.length > maxFiles) {
      setError(`You can attach up to ${maxFiles} files.`);
      return;
    }

    for (const file of incoming) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" is larger than ${maxSizeMB} MB.`);
        return;
      }
    }

    onChange([...value, ...incoming]);
  };

  const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) addFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isFull) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) addFiles(files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isFull) return;
    setDragOver(true);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Dropzone — hidden when full */}
      {!isFull && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            'rounded-md border-2 border-dashed px-5 py-6 text-center transition-colors',
            'focus:outline-none focus-visible:border-brand-900 focus-visible:ring-[3px] focus-visible:ring-brand-900/10',
            disabled
              ? 'border-ink-200 bg-ink-50/50 cursor-not-allowed opacity-60'
              : dragOver
              ? 'border-brand-900 bg-brand-50/40 cursor-copy'
              : 'border-ink-200 bg-ink-50/50 hover:border-ink-300 hover:bg-ink-50 cursor-pointer'
          )}
        >
          <UploadCloud
            className={cn(
              'w-5 h-5 mx-auto transition-colors',
              dragOver ? 'text-brand-900' : 'text-ink-400'
            )}
          />
          <p className="mt-2 text-sm font-medium text-ink-700">
            {dragOver ? 'Drop files here' : 'Click to upload or drag files'}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-400">
            PNG, JPG, WEBP, or PDF · up to {maxSizeMB} MB ·{' '}
            {remaining} slot{remaining === 1 ? '' : 's'} left
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handlePick}
            onClick={(e) => e.stopPropagation()}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Selected files */}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((file, i) => (
            <li
              key={`${file.name}-${file.size}-${i}`}
              className="flex items-center gap-3 rounded-md border border-ink-200 bg-white p-2.5"
            >
              <div className="w-9 h-9 shrink-0 rounded-md bg-ink-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-ink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-ink-400 tabular-nums">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 p-1.5 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
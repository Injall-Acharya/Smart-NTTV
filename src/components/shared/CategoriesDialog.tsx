import { useEffect, useState } from 'react';
import { X, AlertCircle, FolderPlus, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import { categoriesApi, type CreateCategoryPayload } from '@/api/endpoints';
import type { Category } from '@/types/category';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (category: Category) => void;
  /** When provided, the dialog is in edit mode */
  category?: Category | null;
}

interface FormState {
  name: string;
  description: string;
}

const INITIAL: FormState = { name: '', description: '' };

export function CategoryDialog({ open, onClose, onSaved, category }: Props) {
  const isEdit = !!category;
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Reset / hydrate when opening
  useEffect(() => {
    if (!open) return;
    if (category) {
      setForm({ name: category.name, description: category.description });
    } else {
      setForm(INITIAL);
    }
    setTouched({});
    setServerError(null);
    setNameError(null);
  }, [open, category]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const blur = (key: string) => () => setTouched((t) => ({ ...t, [key]: true }));

  const errors = {
    name: touched.name && form.name.trim().length < 2 ? 'At least 2 characters' : '',
  };

  const isValid = form.name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true });
    setServerError(null);
    setNameError(null);

    if (!isValid) return;

    setSubmitting(true);
    try {
      const payload: CreateCategoryPayload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      const saved = category
        ? await categoriesApi.update(category.id, payload)
        : await categoriesApi.create(payload);

      onSaved(saved);
      onClose();
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.name) {
        setNameError(data.name[0]);
      } else {
        setServerError(data?.detail ?? 'Could not save category.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-[2px]"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg border border-ink-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-ink-100">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-md flex items-center justify-center shrink-0',
                isEdit
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-brand-50 text-brand-700'
              )}
            >
              {isEdit ? (
                <Pencil className="w-4 h-4" strokeWidth={2} />
              ) : (
                <FolderPlus className="w-4 h-4" strokeWidth={2} />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-900">
                {isEdit ? 'Edit category' : 'Add category'}
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                {isEdit
                  ? 'Update this category\'s details.'
                  : 'Create a new category for tickets.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 -mr-1.5 -mt-1.5 rounded-md text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form id="category-form" onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={blur('name')}
              placeholder="e.g. Network, Hardware, Software"
              autoFocus
              className={inputCls}
            />
            {(nameError || errors.name) && (
              <p className="mt-1.5 text-xs text-red-600">
                {nameError || errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Short description shown when staff submit a ticket."
              rows={3}
              maxLength={200}
              className={cn(inputCls, 'h-auto py-2.5 resize-none')}
            />
            <div className="mt-1 text-right">
              <span className="text-[10px] text-ink-400 tabular-nums">
                {form.description.length}/200
              </span>
            </div>
          </div>

          {serverError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{serverError}</p>
            </div>
          )}
        </form>

        {/* Footer */}
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
            type="submit"
            form="category-form"
            disabled={submitting || !isValid}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? isEdit
                ? 'Saving…'
                : 'Creating…'
              : isEdit
              ? 'Save changes'
              : 'Create category'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm ' +
  'placeholder:text-ink-300 ' +
  'focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10';
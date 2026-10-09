import { useEffect, useState } from 'react';
import { X, AlertCircle, Users2, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import { teamsApi, type CreateTeamPayload } from '@/api/endpoints';
import { categoriesApi } from '@/api/endpoints';
import { useFetch } from '@/hooks/useFetch';
import type { Team, TeamLevel } from '@/types/team';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (team: Team) => void;
  team?: Team | null;
}

interface FormState {
  name: string;
  categoryId: string;
  level: TeamLevel;
}

const INITIAL: FormState = { name: '', categoryId: '', level: 'L1' };

export function TeamDialog({ open, onClose, onSaved, team }: Props) {
  const isEdit = !!team;
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: categories } = useFetch(() => categoriesApi.list(), [open]);
  const activeCategories = (categories ?? []).filter((c) => c.status === 'active');

  useEffect(() => {
    if (!open) return;
    if (team) {
      setForm({
        name: team.name,
        categoryId: team.categoryId,
        level: team.level,
      });
    } else {
      setForm(INITIAL);
    }
    setTouched({});
    setServerError(null);
  }, [open, team]);

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
    categoryId: touched.categoryId && !form.categoryId ? 'Required' : '',
  };

  const isValid = form.name.trim().length >= 2 && !!form.categoryId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, categoryId: true });
    setServerError(null);

    if (!isValid) return;

    setSubmitting(true);
    try {
      const payload: CreateTeamPayload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        level: form.level,
      };

      const saved = team
        ? await teamsApi.update(team.id, payload)
        : await teamsApi.create(payload);

      onSaved(saved);
      onClose();
    } catch (e: any) {
      setServerError(e?.response?.data?.detail ?? 'Could not save team.');
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
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-ink-100">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-md flex items-center justify-center shrink-0',
                isEdit ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'
              )}
            >
              {isEdit ? (
                <Pencil className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Users2 className="w-4 h-4" strokeWidth={2} />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-900">
                {isEdit ? 'Edit team' : 'Add team'}
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                {isEdit
                  ? 'Update this team\'s details.'
                  : 'Each category can have one team per level.'}
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

        <form id="team-form" onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Team name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={blur('name')}
              placeholder="e.g. Network L1"
              autoFocus
              className={inputCls}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={form.categoryId}
                onChange={(e) => setField('categoryId', e.target.value)}
                onBlur={blur('categoryId')}
                disabled={isEdit}
                className={cn(
                  inputCls,
                  'appearance-none pr-8 disabled:bg-ink-50 disabled:cursor-not-allowed'
                )}
              >
                <option value="">Select a category…</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
            {errors.categoryId && (
              <p className="mt-1.5 text-xs text-red-600">{errors.categoryId}</p>
            )}
            {isEdit && (
              <p className="mt-1.5 text-[11px] text-ink-400">
                Category can't be changed after creation.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Support level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['L1', 'L2', 'L3'] as TeamLevel[]).map((lvl) => {
                const selected = form.level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setField('level', lvl)}
                    className={cn(
                      'h-9 rounded-md border text-xs font-mono font-semibold transition-colors',
                      selected
                        ? 'border-brand-900 bg-brand-50 text-brand-900 ring-1 ring-brand-900'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                    )}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-400">
              L1 handles initial issues. L2 / L3 handle escalations.
            </p>
          </div>

          {serverError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{serverError}</p>
            </div>
          )}
        </form>

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
            form="team-form"
            disabled={submitting || !isValid}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? isEdit
                ? 'Saving…'
                : 'Creating…'
              : isEdit
              ? 'Save changes'
              : 'Create team'}
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
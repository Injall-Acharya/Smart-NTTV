import { useEffect, useState } from 'react';
import { X, AlertCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { adminApi, type CreateUserPayload } from '@/api/endpoints';
import type { User, UserRole } from '@/types/user';
import type { TeamLevel } from '@/types/team';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  level: TeamLevel | '';
  teamId: string;
}

const INITIAL: FormState = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'staff',
  level: '',
  teamId: '',
};

export function AddUserDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setForm(INITIAL);
      setTouched({});
      setServerError(null);
      setFieldErrors({});
    }
  }, [open]);

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
    firstName: touched.firstName && !form.firstName ? 'Required' : '',
    lastName: touched.lastName && !form.lastName ? 'Required' : '',
    username:
      touched.username && form.username.length < 3 ? 'At least 3 characters' : '',
    email: touched.email && !form.email.includes('@') ? 'Invalid email' : '',
    password:
      touched.password && form.password.length < 8 ? 'At least 8 characters' : '',
    level:
      touched.level && form.role === 'agent' && !form.level ? 'Required for agents' : '',
  };

  const isValid =
    form.firstName &&
    form.lastName &&
    form.username.length >= 3 &&
    form.email.includes('@') &&
    form.password.length >= 8 &&
    (form.role !== 'agent' || !!form.level);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      password: true,
      level: true,
    });
    setServerError(null);
    setFieldErrors({});

    if (!isValid) return;

    setSubmitting(true);
    try {
      const payload: CreateUserPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      if (form.role === 'agent') {
        payload.level = form.level as TeamLevel;
        if (form.teamId) payload.teamId = form.teamId;
      }

      const created = await adminApi.createUser(payload);
      onCreated(created);
      onClose();
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.username) {
        setFieldErrors({ username: data.username[0] });
      } else if (data?.email) {
        setFieldErrors({ email: data.email[0] });
      } else {
        setServerError(data?.detail ?? 'Could not create user.');
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
        className="w-full max-w-lg bg-white rounded-lg border border-ink-200 shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-ink-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Add new user</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Create an account and assign a role.
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
        <form
          id="add-user-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName}>
              <input
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                onBlur={blur('firstName')}
                className={inputCls}
                placeholder="Jane"
                autoFocus
              />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                onBlur={blur('lastName')}
                className={inputCls}
                placeholder="Doe"
              />
            </Field>
          </div>

          <Field label="Username" error={fieldErrors.username || errors.username}>
            <input
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              onBlur={blur('username')}
              className={inputCls}
              placeholder="jane.doe"
              autoComplete="off"
            />
          </Field>

          <Field label="Work email" error={fieldErrors.email || errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={blur('email')}
              className={inputCls}
              placeholder="jane@ntc.com.np"
              autoComplete="off"
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              onBlur={blur('password')}
              className={inputCls}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </Field>

          <Field label="Role">
            <div className="grid grid-cols-3 gap-2">
              {(['staff', 'agent', 'admin'] as UserRole[]).map((r) => {
                const selected = form.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setField('role', r);
                      if (r !== 'agent') {
                        setField('level', '');
                        setField('teamId', '');
                      }
                    }}
                    className={cn(
                      'h-9 rounded-md border text-xs font-medium capitalize transition-colors',
                      selected
                        ? 'border-brand-900 bg-brand-50 text-brand-900 ring-1 ring-brand-900'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </Field>

          {form.role === 'agent' && (
            <Field label="Level" error={errors.level}>
              <div className="grid grid-cols-3 gap-2">
                {(['L1', 'L2', 'L3'] as TeamLevel[]).map((lvl) => {
                  const selected = form.level === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setField('level', lvl)}
                      className={cn(
                        'h-9 rounded-md border text-xs font-medium transition-colors',
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
            </Field>
          )}

          {serverError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{serverError}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-100 bg-ink-50/50 shrink-0">
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
            form="add-user-form"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create user'}
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
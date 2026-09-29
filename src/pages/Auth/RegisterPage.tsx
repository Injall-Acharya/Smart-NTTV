import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, ready, register, loading, error } = useAuthStore();

  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '', confirm: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user && ready) navigate('/', { replace: true });
  }, [user, ready, navigate]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const blur = (key: string) => () => setTouched((t) => ({ ...t, [key]: true }));

  const pwChecks = [
    { label: '8+ characters', ok: form.password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(form.password) },
    { label: 'Number', ok: /[0-9]/.test(form.password) },
  ];
  const pwValid = pwChecks.every((c) => c.ok);
  const passwordsMatch = form.password === form.confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, username: true, email: true, password: true, confirm: true });

    if (!form.firstName || !form.lastName || form.username.length < 3) return;
    if (!form.email.includes('@')) return;
    if (!pwValid || !passwordsMatch) return;

    try {
      await register(form);
      navigate('/', { replace: true });
    } catch { /* store shows error */ }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-xl border border-ink-200 shadow-sm p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-500">Staff registration.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name" error={touched.firstName && !form.firstName ? 'Required' : ''}>
              <input value={form.firstName} onChange={update('firstName')} onBlur={blur('firstName')} className={inputClass} />
            </Field>
            <Field label="Last name" error={touched.lastName && !form.lastName ? 'Required' : ''}>
              <input value={form.lastName} onChange={update('lastName')} onBlur={blur('lastName')} className={inputClass} />
            </Field>
          </div>

          <Field label="Username" error={touched.username && form.username.length < 3 ? 'Min 3 characters' : ''}>
            <input value={form.username} onChange={update('username')} onBlur={blur('username')} className={inputClass} />
          </Field>

          <Field label="Work email" error={touched.email && !form.email.includes('@') ? 'Invalid email' : ''}>
            <input type="email" value={form.email} onChange={update('email')} onBlur={blur('email')} className={inputClass} />
          </Field>

          <Field label="Password">
            <input type="password" value={form.password} onChange={update('password')} onBlur={blur('password')} className={inputClass} />
          </Field>

          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {pwChecks.map((c) => (
              <li key={c.label} className={`flex items-center gap-1.5 text-[11px] ${c.ok ? 'text-emerald-700' : 'text-ink-400'}`}>
                <Check className={`w-3 h-3 ${c.ok ? '' : 'opacity-30'}`} strokeWidth={3} />
                {c.label}
              </li>
            ))}
          </ul>

          <Field label="Confirm password" error={touched.confirm && !passwordsMatch ? 'Does not match' : ''}>
            <input type="password" value={form.confirm} onChange={update('confirm')} onBlur={blur('confirm')} className={inputClass} />
          </Field>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium rounded-md disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-500">
          Already registered?{' '}
          <Link to="/login" className="text-ink-900 font-medium underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm ' +
  'placeholder:text-ink-300 focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
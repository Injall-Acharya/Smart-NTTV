import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { hasRole, roleForPath, homePathFor } from '@/lib/permissions';
// import type { UserRole } from '@/types/user';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, ready, login, loading, error } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });

  // If already logged in, redirect
  useEffect(() => {
    if (!ready || !user) return;

    const from = (location.state as any)?.from?.pathname as string | undefined;

    let target: string;
    if (from) {
      const required = roleForPath(from);
      target = (!required || hasRole(user, required))
        ? from
        : homePathFor(user.role);
    } else {
      target = homePathFor(user.role);
    }

    navigate(target, { replace: true });
  }, [ready, user, navigate, location.state]);

  const usernameError = touched.username && username.length < 3
    ? 'At least 3 characters' : '';
  const passwordError = touched.password && password.length < 6
    ? 'At least 6 characters' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (username.length < 3 || password.length < 6) return;
    try { await login(username, password); } catch { /* store shows error */ }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_minmax(0,480px)] bg-white">
      {/* Left brand panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-brand-900 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-white text-brand-900 text-sm font-black flex items-center justify-center">
            NTC
          </div>
          <div>
            <p className="text-sm font-semibold">Nepal Telecom</p>
            <p className="text-[11px] text-white/60 uppercase tracking-[0.15em]">
              Ticket Distribution
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Internal system</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight leading-[1.1]">
            Every ticket,<br />routed to the right team.
          </h1>
          <p className="mt-6 text-sm text-white/60 leading-relaxed">
            Report faults, track progress, escalate issues — from one console.
          </p>
        </div>

        <p className="text-[11px] text-white/40">© 2026 Nepal Telecom</p>
      </aside>

      {/* Right form panel */}
      <main className="flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-md bg-brand-900 text-white text-xs font-black flex items-center justify-center">
              NTC
            </div>
            <p className="text-sm font-semibold">Nepal Telecom</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-sm text-ink-500">Use your employee credentials.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Username</label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                placeholder="jane.doe"
                className={inputClass}
              />
              {usernameError && <p className="mt-1.5 text-xs text-red-600">{usernameError}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-700"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>}
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2
                         bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium
                         rounded-md transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : (<>Continue <ArrowRight className="w-3.5 h-3.5" /></>)}
            </button>
          </form>

          <p className="mt-8 text-xs text-ink-500">
            Need an account?{' '}
            <Link to="/register" className="text-ink-900 font-medium underline underline-offset-2">
              Register as staff
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm ' +
  'placeholder:text-ink-300 focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { NotificationBell } from '@/components/shared/NotificationBell';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-14 lg:h-16 shrink-0 bg-white border-b border-ink-200 flex items-center px-4 lg:px-6 gap-4">

      {/* ── Left zone ───────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md text-ink-600 hover:bg-ink-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <p className="text-sm text-ink-500 truncate">
          Welcome back!
          {/* <span className="font-medium text-ink-900 capitalize">{user?.role}</span> */}
        </p>
      </div>

      {/* ── Spacer pushes right zone to the edge ────────── */}
      <div className="flex-1" />

      {/* ── Right zone ──────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        <NotificationBell />

        {/* Divider — a subtle vertical line between bell and the user chip */}
        <span className="w-px h-5 bg-ink-200" aria-hidden="true" />

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-ink-400 font-medium">Signed in as</span>
          <span className="text-[11px] px-2 py-1 rounded-md bg-ink-100 text-ink-700 capitalize font-semibold">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
}
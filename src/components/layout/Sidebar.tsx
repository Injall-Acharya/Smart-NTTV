import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Users2, FolderTree, FileText,
  Ticket, PlusCircle, LogOut, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';
import type { UserRole } from '@/types/user';

interface NavItem { label: string; to: string; icon: LucideIcon; }

const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Overview',   to: '/admin',            icon: LayoutDashboard },
    { label: 'Users',      to: '/admin/users',      icon: Users },
    { label: 'Teams',      to: '/admin/teams',      icon: Users2 },
    { label: 'Categories', to: '/admin/categories', icon: FolderTree },
    { label: 'Reports',    to: '/admin/reports',    icon: FileText },
  ],
  staff: [
    { label: 'Overview',   to: '/staff',             icon: LayoutDashboard },
    { label: 'My Tickets', to: '/staff/tickets',     icon: Ticket },
    { label: 'New Ticket', to: '/staff/tickets/new', icon: PlusCircle },
  ],
  agent: [
    { label: 'Overview', to: '/agent', icon: LayoutDashboard },
  ],
};

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    // Navigate explicitly, without state — prevents stale `from`
    navigate('/login', { replace: true });
  };

  const items = NAV[user.role] ?? [];

  return (
    <>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 shrink-0',
          'bg-white border-r border-ink-200 flex flex-col',
          'transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-ink-200">
          <div className="w-8 h-8 rounded-md bg-brand-900 text-white text-xs font-bold flex items-center justify-center">
            NTC
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900 leading-tight">Nepal Telecom</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-400">Internal Portal</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-ink-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-ink-100 text-ink-900 font-medium'
                    : 'text-ink-600 hover:bg-ink-50'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-200 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-ink-900 text-white text-xs font-semibold flex items-center justify-center">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">{user.username}</p>
              <p className="text-[11px] text-ink-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
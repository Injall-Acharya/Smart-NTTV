import { useMemo, useState } from 'react';
import {
  Users as UsersIcon,
  Shield,
  Headset,
  UserCheck,
  Plus,
  Inbox,
  AlertCircle,
} from 'lucide-react';

import { useFetch } from '@/hooks/useFetch';
import { adminApi } from '@/api/endpoints';
import { KpiStrip } from '@/components/shared/KpiStrip';
import { FilterBar } from '@/components/shared/FilterBar';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { AddUserDialog } from '@/components/shared/AddUserDialog';
import { UserActionsMenu } from '@/components/shared/UserActionsMenu';
import { cn } from '@/lib/cn';
import type { User, UserRole } from '@/types/user';

export function UsersPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const { data: users, loading, error } = useFetch(
    () => adminApi.users(),
    [reloadKey]
  );

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  const list = users ?? [];

  const stats = useMemo(() => {
    return {
      total: list.length,
      admins: list.filter((u) => u.role === 'admin').length,
      agents: list.filter((u) => u.role === 'agent').length,
      staff: list.filter((u) => u.role === 'staff').length,
    };
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = `${u.username} ${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [list, search, roleFilter]);

  const hasActiveFilters = !!search || roleFilter !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
  };

  const handleCreated = () => {
    setReloadKey((k) => k + 1);
  };

  const handleToggleActive = async (user: User) => {
    setBusy(true);
    try {
      await adminApi.updateUser(user.id, { isActive: !user.isActive });
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-ink-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
            {(u.firstName[0] ?? '') + (u.lastName[0] ?? '')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5 font-mono truncate">
              @{u.username}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => (
        <span className="text-xs text-ink-600 truncate">{u.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: 'w-32',
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: 'level',
      header: 'Level',
      width: 'w-20',
      render: (u) =>
        u.level ? (
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-ink-100 text-ink-600">
            {u.level}
          </span>
        ) : (
          <span className="text-ink-300 text-xs">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-24',
      render: (u) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium',
            u.isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-ink-100 text-ink-500'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              u.isActive ? 'bg-emerald-500' : 'bg-ink-400'
            )}
          />
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 'w-12',
      render: (u) => (
        <UserActionsMenu
          user={u}
          disabled={busy}
          onToggleActive={() => handleToggleActive(u)}
          onDelete={() => setDeleteTarget(u)}
        />
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="pb-6 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-medium">
          Admin console
        </p>
        <h1 className="mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          User management
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Manage accounts, roles, and access.
        </p>
      </header>

      {/* KPI strip */}
      <div className="mt-8">
        <KpiStrip
          loading={loading}
          columns={4}
          items={[
            { label: 'Total users', value: stats.total,  icon: UsersIcon, tone: 'info' },
            { label: 'Admins',      value: stats.admins, icon: Shield,    tone: 'default' },
            { label: 'Agents',      value: stats.agents, icon: Headset,   tone: 'default' },
            { label: 'Staff',       value: stats.staff,  icon: UserCheck, tone: 'success' },
          ]}
        />
      </div>

      {/* Filter bar + Add button */}
      <div className="mt-6">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, username, or email…"
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          selects={[
            {
              key: 'role',
              label: 'Role',
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { value: 'ALL',   label: 'All roles' },
                { value: 'admin', label: 'Admin' },
                { value: 'agent', label: 'Agent' },
                { value: 'staff', label: 'Staff' },
              ],
            },
          ]}
          action={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add user
            </button>
          }
        />
      </div>

      {/* Results meta */}
      {!loading && !error && (
        <div className="mt-5">
          <p className="text-xs text-ink-500">
            {filtered.length === list.length
              ? `${list.length} user${list.length === 1 ? '' : 's'}`
              : `${filtered.length} of ${list.length} users`}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="mt-3">
        <DataTable<User>
          data={filtered}
          columns={columns}
          keyExtractor={(u) => u.id}
          loading={loading}
          error={error}
          renderMobileCard={(u) => (
            <MobileUserCard
              user={u}
              busy={busy}
              onToggleActive={() => handleToggleActive(u)}
              onDelete={() => setDeleteTarget(u)}
            />
          )}
          emptyState={
            hasActiveFilters ? (
              <FilteredEmpty onClear={clearFilters} />
            ) : (
              <BlankEmpty onAdd={() => setAddOpen(true)} />
            )
          }
        />
      </div>

      {/* Dialogs */}
      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !busy && setDeleteTarget(null)}
        onConfirm={handleDelete}
        submitting={busy}
        title="Delete this user?"
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.firstName} ${deleteTarget.lastName} (@${deleteTarget.username}). This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        variant="danger"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────── */

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    admin: 'bg-violet-50 text-violet-700',
    agent: 'bg-blue-50 text-blue-700',
    staff: 'bg-ink-100 text-ink-600',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
        styles[role]
      )}
    >
      {role}
    </span>
  );
}

function MobileUserCard({
  user,
  busy,
  onToggleActive,
  onDelete,
}: {
  user: User;
  busy: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-ink-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {(user.firstName[0] ?? '') + (user.lastName[0] ?? '')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5 font-mono truncate">
              @{user.username}
            </p>
          </div>
        </div>
        <UserActionsMenu
          user={user}
          disabled={busy}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RoleBadge role={user.role} />
          {user.level && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-ink-100 text-ink-600">
              {user.level}
            </span>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium',
            user.isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-ink-100 text-ink-500'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              user.isActive ? 'bg-emerald-500' : 'bg-ink-400'
            )}
          />
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-ink-500 truncate">{user.email}</p>
    </div>
  );
}

function BlankEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <Inbox className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">No users yet</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">
        Add the first team member to get started.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add user
      </button>
    </div>
  );
}

function FilteredEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">No matches</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">
        No users match your current search or filter.
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-xs font-medium text-ink-900 hover:underline underline-offset-2"
      >
        Clear all filters
      </button>
    </div>
  );
}
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users2,
  Plus,
  Inbox,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { teamsApi, categoriesApi } from '@/api/endpoints';
import { KpiStrip } from '@/components/shared/KpiStrip';
import { FilterBar } from '@/components/shared/FilterBar';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TeamDialog } from '@/components/shared/TeamDialog';
import { TeamActionsMenu } from '@/components/shared/TeamActionsMenu';
import { cn } from '@/lib/cn';
import type { Team, TeamLevel } from '@/types/team';

const LEVEL_STYLES: Record<TeamLevel, string> = {
  L1: 'bg-blue-50 text-blue-700',
  L2: 'bg-amber-50 text-amber-700',
  L3: 'bg-violet-50 text-violet-700',
};

export function TeamsPage() {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const { data: teams, loading, error } = useFetch(
    () => teamsApi.list(),
    [reloadKey]
  );
  const { data: categories } = useFetch(() => categoriesApi.list());

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const list = teams ?? [];

  const stats = useMemo(
    () => ({
      total: list.length,
      l1: list.filter((t) => t.level === 'L1').length,
      l2: list.filter((t) => t.level === 'L2').length,
      l3: list.filter((t) => t.level === 'L3').length,
    }),
    [list]
  );

  const categoryOptions = useMemo(
    () =>
      (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((t) => {
      if (levelFilter !== 'ALL' && t.level !== levelFilter) return false;
      if (categoryFilter !== 'ALL' && t.categoryId !== categoryFilter) return false;
      if (!q) return true;
      const haystack = `${t.name} ${t.categoryName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [list, search, levelFilter, categoryFilter]);

  const hasActiveFilters =
    !!search || levelFilter !== 'ALL' || categoryFilter !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setLevelFilter('ALL');
    setCategoryFilter('ALL');
  };

  const refresh = () => setReloadKey((k) => k + 1);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await teamsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (e: any) {
      setDeleteError(e?.response?.data?.detail ?? 'Could not delete team.');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Team>[] = [
    {
      key: 'name',
      header: 'Team',
      render: (t) => (
        <Link
          to={`/admin/teams/${t.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 min-w-0 group"
        >
          <div
            className={cn(
              'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
              LEVEL_STYLES[t.level]
            )}
          >
            <Users2 className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate group-hover:text-brand-700 transition-colors">
              {t.name}
            </p>
            <p className="text-[11px] text-ink-400 mt-0.5 font-mono truncate">
              {t.id}
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (t) => (
        <span className="text-xs text-ink-700">{t.categoryName}</span>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      width: 'w-20',
      render: (t) => (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold',
            LEVEL_STYLES[t.level]
          )}
        >
          {t.level}
        </span>
      ),
    },
    {
      key: 'members',
      header: 'Members',
      width: 'w-28',
      align: 'right',
      render: (t) => (
        <span className="text-xs tabular-nums text-ink-600 font-medium">
          {t.memberCount}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 'w-12',
      render: (t) => (
        <TeamActionsMenu
          team={t}
          disabled={busy}
          onEdit={() => {
            setEditTarget(t);
            setDialogOpen(true);
          }}
          onDelete={() => {
            setDeleteError(null);
            setDeleteTarget(t);
          }}
        />
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-7xl mx-auto">
      <header className="pb-6 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-medium">
          Admin console
        </p>
        <h1 className="mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          Teams
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Support teams grouped by category and level.
        </p>
      </header>

      <div className="mt-8">
        <KpiStrip
          loading={loading}
          columns={4}
          items={[
            { label: 'Total teams', value: stats.total, icon: Users2, tone: 'info' },
            { label: 'L1',          value: stats.l1,    icon: Users2, tone: 'info' },
            { label: 'L2',          value: stats.l2,    icon: Users2, tone: 'warn' },
            { label: 'L3',          value: stats.l3,    icon: Users2, tone: 'default' },
          ]}
        />
      </div>

      <div className="mt-6">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search teams…"
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          selects={[
            {
              key: 'level',
              label: 'Level',
              value: levelFilter,
              onChange: setLevelFilter,
              options: [
                { value: 'ALL', label: 'All levels' },
                { value: 'L1',  label: 'L1' },
                { value: 'L2',  label: 'L2' },
                { value: 'L3',  label: 'L3' },
              ],
            },
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'ALL', label: 'All categories' },
                ...categoryOptions,
              ],
            },
          ]}
          action={
            <button
              type="button"
              onClick={() => {
                setEditTarget(null);
                setDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add team
            </button>
          }
        />
      </div>

      {!loading && !error && (
        <div className="mt-5">
          <p className="text-xs text-ink-500">
            {filtered.length === list.length
              ? `${list.length} team${list.length === 1 ? '' : 's'}`
              : `${filtered.length} of ${list.length} teams`}
          </p>
        </div>
      )}

      <div className="mt-3">
        <DataTable<Team>
          data={filtered}
          columns={columns}
          keyExtractor={(t) => t.id}
          onRowClick={(t) => navigate(`/admin/teams/${t.id}`)}
          loading={loading}
          error={error}
          renderMobileCard={(t) => (
            <MobileTeamCard
              team={t}
              busy={busy}
              onEdit={() => {
                setEditTarget(t);
                setDialogOpen(true);
              }}
              onDelete={() => {
                setDeleteError(null);
                setDeleteTarget(t);
              }}
            />
          )}
          emptyState={
            hasActiveFilters ? (
              <FilteredEmpty onClear={clearFilters} />
            ) : (
              <BlankEmpty
                onAdd={() => {
                  setEditTarget(null);
                  setDialogOpen(true);
                }}
              />
            )
          }
        />
      </div>

      <TeamDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={refresh}
        team={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          if (!busy) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDelete}
        submitting={busy}
        title="Delete this team?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed. ${
                deleteTarget.memberCount > 0
                  ? `It currently has ${deleteTarget.memberCount} member(s) — you'll need to remove them first.`
                  : 'This action cannot be undone.'
              }`
            : ''
        }
        confirmLabel="Delete team"
        variant="danger"
      />

      {/* Delete error toast — inline banner if backend rejected */}
      {deleteError && (
        <div className="fixed bottom-6 right-6 max-w-sm rounded-lg border border-red-200 bg-white shadow-lg p-4 z-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-800">{deleteError}</p>
            </div>
            <button
              onClick={() => setDeleteError(null)}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTeamCard({
  team,
  busy,
  onEdit,
  onDelete,
}: {
  team: Team;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/admin/teams/${team.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'w-10 h-10 rounded-md flex items-center justify-center shrink-0',
              LEVEL_STYLES[team.level]
            )}
          >
            <Users2 className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{team.name}</p>
            <p className="text-[11px] text-ink-400 mt-0.5 font-mono truncate">
              {team.id}
            </p>
          </div>
        </Link>
        <TeamActionsMenu
          team={team}
          disabled={busy}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-medium text-ink-400">
            {team.categoryName}
          </span>
          <span
            className={cn(
              'text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded',
              LEVEL_STYLES[team.level]
            )}
          >
            {team.level}
          </span>
        </div>
        <span className="text-[11px] text-ink-500">
          <span className="font-medium text-ink-700 tabular-nums">
            {team.memberCount}
          </span>{' '}
          member{team.memberCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}

function BlankEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <Inbox className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700">No teams yet</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">
        Teams route tickets to the right agents. Create your first one.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add team
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
        No teams match your current filters.
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
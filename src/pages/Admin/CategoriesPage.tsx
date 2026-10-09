import { useMemo, useState } from 'react';
import {
  FolderTree,
  CheckCircle2,
  FolderMinus,
  Ticket as TicketIcon,
  Plus,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { categoriesApi } from '@/api/endpoints';
import { KpiStrip } from '@/components/shared/KpiStrip';
import { FilterBar } from '@/components/shared/FilterBar';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CategoryDialog } from '@/components/shared/CategoriesDialog';
import { CategoryActionsMenu } from '@/components/shared/CategoryActionsMenu';
import { cn } from '@/lib/cn';
import type { Category } from '@/types/category';

export function CategoriesPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const { data: categories, loading, error } = useFetch(
    () => categoriesApi.list(),
    [reloadKey]
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const list = categories ?? [];

  const stats = useMemo(() => {
    return {
      total: list.length,
      active: list.filter((c) => c.status === 'active').length,
      inactive: list.filter((c) => c.status === 'inactive').length,
      totalTickets: list.reduce((sum, c) => sum + (c.ticketCount ?? 0), 0),
    };
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${c.name} ${c.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [list, search, statusFilter]);

  const hasActiveFilters = !!search || statusFilter !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  const refresh = () => setReloadKey((k) => k + 1);

  const handleSaved = () => refresh();

  const handleToggleStatus = async (category: Category) => {
    setBusy(true);
    try {
      await categoriesApi.update(category.id, {
        status: category.status === 'active' ? 'inactive' : 'active',
      });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await categoriesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditTarget(category);
    setDialogOpen(true);
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      render: (c) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-ink-100 text-ink-600 flex items-center justify-center shrink-0">
            <FolderTree className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{c.name}</p>
            <p className="text-[11px] text-ink-400 mt-0.5 font-mono truncate">
              {c.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (c) => (
        <span className="text-xs text-ink-600 line-clamp-1">
          {c.description || <span className="text-ink-400 italic">—</span>}
        </span>
      ),
    },
    {
      key: 'tickets',
      header: 'Tickets',
      width: 'w-24',
      align: 'right',
      render: (c) => (
        <span className="text-xs tabular-nums text-ink-600 font-medium">
          {c.ticketCount ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-28',
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 'w-12',
      render: (c) => (
        <CategoryActionsMenu
          category={c}
          disabled={busy}
          onEdit={() => openEdit(c)}
          onToggleStatus={() => handleToggleStatus(c)}
          onDelete={() => setDeleteTarget(c)}
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
          Categories
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Ticket categories used across the system.
        </p>
      </header>

      {/* KPI strip */}
      <div className="mt-8">
        <KpiStrip
          loading={loading}
          columns={4}
          items={[
            { label: 'Total',    value: stats.total,        icon: FolderTree,     tone: 'info' },
            { label: 'Active',   value: stats.active,       icon: CheckCircle2,   tone: 'success' },
            { label: 'Inactive', value: stats.inactive,     icon: FolderMinus,    tone: 'default' },
            { label: 'Tickets',  value: stats.totalTickets, icon: TicketIcon,     tone: 'info' },
          ]}
        />
      </div>

      {/* Filter bar + Add */}
      <div className="mt-6">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search categories…"
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          selects={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL',      label: 'All statuses' },
                { value: 'active',   label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add category
            </button>
          }
        />
      </div>

      {/* Results meta */}
      {!loading && !error && (
        <div className="mt-5">
          <p className="text-xs text-ink-500">
            {filtered.length === list.length
              ? `${list.length} categor${list.length === 1 ? 'y' : 'ies'}`
              : `${filtered.length} of ${list.length} categories`}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="mt-3">
        <DataTable<Category>
          data={filtered}
          columns={columns}
          keyExtractor={(c) => c.id}
          loading={loading}
          error={error}
          renderMobileCard={(c) => (
            <MobileCategoryCard
              category={c}
              busy={busy}
              onEdit={() => openEdit(c)}
              onToggleStatus={() => handleToggleStatus(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          )}
          emptyState={
            hasActiveFilters ? (
              <FilteredEmpty onClear={clearFilters} />
            ) : (
              <BlankEmpty onAdd={openCreate} />
            )
          }
        />
      </div>

      {/* Dialogs */}
      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
        category={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !busy && setDeleteTarget(null)}
        onConfirm={handleDelete}
        submitting={busy}
        title="Delete this category?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed. Tickets already using this category will keep a reference, but the category will no longer be selectable.`
            : ''
        }
        confirmLabel="Delete category"
        variant="danger"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────── */

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const isActive = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium',
        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-ink-400'
        )}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function MobileCategoryCard({
  category,
  busy,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  category: Category;
  busy: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-md bg-ink-100 text-ink-600 flex items-center justify-center shrink-0">
            <FolderTree className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">
              {category.name}
            </p>
            <p className="text-[11px] text-ink-400 mt-0.5 font-mono truncate">
              {category.id}
            </p>
          </div>
        </div>
        <CategoryActionsMenu
          category={category}
          disabled={busy}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      </div>

      {category.description && (
        <p className="mt-3 text-xs text-ink-600 leading-relaxed line-clamp-2">
          {category.description}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between gap-3">
        <StatusBadge status={category.status} />
        <span className="text-[11px] text-ink-500">
          <span className="font-medium text-ink-700 tabular-nums">
            {category.ticketCount ?? 0}
          </span>{' '}
          ticket{(category.ticketCount ?? 0) === 1 ? '' : 's'}
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
      <p className="text-sm font-medium text-ink-700">No categories yet</p>
      <p className="mt-1 text-xs text-ink-400 max-w-xs">
        Categories route tickets to the right teams. Create your first one to get started.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add category
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
        No categories match your current search or filter.
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
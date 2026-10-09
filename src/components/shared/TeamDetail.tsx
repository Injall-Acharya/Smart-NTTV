import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserPlus,
  X,
  Search,
  AlertCircle,
  Loader2,
  Inbox,
} from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { teamsApi } from '@/api/endpoints';
import { Card } from '@/components/shared/Card';
import { cn } from '@/lib/cn';
import type { TeamLevel } from '@/types/team';

const LEVEL_STYLES: Record<TeamLevel, string> = {
  L1: 'bg-blue-50 text-blue-700',
  L2: 'bg-amber-50 text-amber-700',
  L3: 'bg-violet-50 text-violet-700',
};

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);

  const { data: team, loading, error } = useFetch(
    () => teamsApi.get(teamId!),
    [teamId, reloadKey]
  );
  const { data: agents } = useFetch(() => teamsApi.availableAgents(), [reloadKey]);

  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => setReloadKey((k) => k + 1);

  const handleAssign = async (userId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await teamsApi.assignMember(teamId!, userId);
      refresh();
    } catch (e: any) {
      setActionError(e?.response?.data?.detail ?? 'Could not add member.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await teamsApi.unassignMember(teamId!, userId);
      refresh();
    } catch (e: any) {
      setActionError(e?.response?.data?.detail ?? 'Could not remove member.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error || !team) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 mx-auto rounded-xl bg-ink-100 flex items-center justify-center text-ink-500">
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h1 className="mt-5 text-lg font-semibold">Team not found</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            This team may have been removed.
          </p>
          <Link
            to="/admin/teams"
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to teams
          </Link>
        </div>
      </div>
    );
  }

  // ── Compute available agents ──────────────────────
  const memberIds = new Set(team.memberDetails.map((m) => m.id));

  const eligibleAgents = (agents ?? []).filter(
    (u) =>
      u.role === 'agent' &&
      u.level === team.level &&
      !memberIds.has(u.id)
  );

  const q = search.trim().toLowerCase();
  const filteredAgents = eligibleAgents.filter((a) => {
    if (!q) return true;
    return `${a.username} ${a.firstName} ${a.lastName}`.toLowerCase().includes(q);
  });

  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-6xl mx-auto">
      {/* Back */}
      <Link
        to="/admin/teams"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to teams
      </Link>

      {/* Header */}
      <header className="mt-4 pb-6 border-b border-ink-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-md flex items-center justify-center shrink-0',
                LEVEL_STYLES[team.level]
              )}
            >
              <Users className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight leading-snug">
                {team.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-ink-500">
                <span>{team.categoryName}</span>
                <span className="w-px h-3 bg-ink-200" />
                <span
                  className={cn(
                    'font-mono font-semibold px-1.5 py-0.5 rounded text-[10px]',
                    LEVEL_STYLES[team.level]
                  )}
                >
                  {team.level}
                </span>
                <span className="w-px h-3 bg-ink-200" />
                <span className="font-mono">{team.id}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Action error banner */}
      {actionError && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 flex-1">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Two columns */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current members */}
        <Card
          title="Team members"
          subtitle={`${team.memberDetails.length} assigned`}
          flush
        >
          {team.memberDetails.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
                <Inbox className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <p className="text-sm text-ink-500">No members yet</p>
              <p className="text-xs text-ink-400 mt-1">
                Add eligible {team.level} agents from the right.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {team.memberDetails.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-ink-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-ink-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {(m.firstName[0] ?? '') + (m.lastName[0] ?? '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-[11px] text-ink-500 mt-0.5 font-mono truncate">
                      @{m.username}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    disabled={busy}
                    className="shrink-0 p-1.5 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    aria-label={`Remove ${m.username}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Available agents */}
        <Card
          title="Available agents"
          subtitle={`${eligibleAgents.length} eligible at ${team.level}`}
          flush
        >
          {/* Search */}
          {eligibleAgents.length > 0 && (
            <div className="px-5 pt-4 pb-3 border-b border-ink-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or username…"
                  className="h-9 w-full rounded-md border border-ink-200 bg-white pl-9 pr-3 text-sm placeholder:text-ink-300 focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10"
                />
              </div>
            </div>
          )}

          {eligibleAgents.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
                <Users className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <p className="text-sm text-ink-500">No eligible agents</p>
              <p className="text-xs text-ink-400 mt-1">
                No unassigned {team.level} agents available.
              </p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ink-500">No matches</p>
              <p className="text-xs text-ink-400 mt-1">
                No agents match "{search}".
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100 max-h-125 overflow-y-auto">
              {filteredAgents.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-ink-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-ink-100 text-ink-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {(a.firstName[0] ?? '') + (a.lastName[0] ?? '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {a.firstName} {a.lastName}
                    </p>
                    <p className="text-[11px] text-ink-500 mt-0.5 font-mono truncate">
                      @{a.username}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssign(a.id)}
                    disabled={busy}
                    className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-ink-200 bg-white text-[11px] font-medium text-ink-700 hover:bg-brand-900 hover:text-white hover:border-brand-900 transition-colors disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserPlus className="w-3 h-3" />
                    )}
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-6xl mx-auto">
      <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
      <div className="mt-4 pb-6 border-b border-ink-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-ink-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-1/3 rounded bg-ink-100 animate-pulse" />
          <div className="h-3 w-1/4 rounded bg-ink-100 animate-pulse" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 rounded-lg border border-ink-200 bg-white" />
        <div className="h-96 rounded-lg border border-ink-200 bg-white" />
      </div>
    </div>
  );
}
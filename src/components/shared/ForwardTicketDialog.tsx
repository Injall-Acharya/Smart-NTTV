import { useEffect, useState } from 'react';
import { Forward, X, Users, User as UserIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ticketsApi, type ForwardTargets } from '@/api/endpoints';

interface Props {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  onConfirm: (target: { teamId: string; agentId?: string }) => void;
  submitting: boolean;
}

export function ForwardTicketDialog({
  open,
  onClose,
  ticketId,
  onConfirm,
  submitting,
}: Props) {
  const [targets, setTargets] = useState<ForwardTargets | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teamId, setTeamId] = useState('');
  const [agentId, setAgentId] = useState('');

  // Reset + fetch when opened
  useEffect(() => {
    if (!open) return;
    setTeamId('');
    setAgentId('');
    setError(null);
    setLoading(true);
    ticketsApi
      .eligibleTargets(ticketId, 'forward')
      .then(setTargets)
      .catch(() => setError('Could not load targets.'))
      .finally(() => setLoading(false));
  }, [open, ticketId]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const team = targets?.teams.find((t) => t.id === teamId);
  const availableAgents = (targets?.agents ?? []).filter(
    (a) => !teamId || a.teamId === teamId
  );

  const handleConfirm = () => {
    if (!teamId) return;
    onConfirm({ teamId, agentId: agentId || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-lg border border-ink-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-ink-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <Forward className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Forward ticket</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Send this ticket to another team or agent at the same level.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 -mt-1.5 rounded-md text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="space-y-2">
              <div className="h-10 rounded-md bg-ink-100 animate-pulse" />
              <div className="h-10 rounded-md bg-ink-100 animate-pulse" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          {!loading && targets && (
            <>
              {/* Team */}
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-2">
                  Team
                </label>
                {targets.teams.length === 0 ? (
                  <p className="text-xs text-ink-500 italic">
                    No teams available at this level.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {targets.teams.map((t) => {
                      const isSelected = teamId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTeamId(t.id);
                            setAgentId('');
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors',
                            isSelected
                              ? 'border-brand-900 bg-brand-50/50 ring-1 ring-brand-900'
                              : 'border-ink-200 hover:bg-ink-50'
                          )}
                        >
                          <Users className="w-4 h-4 text-ink-400 shrink-0" />
                          <span className="flex-1 text-sm font-medium text-ink-900">
                            {t.name}
                          </span>
                          <span className="text-[10px] font-mono text-ink-500">
                            {t.level}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Agent (optional) */}
              {teamId && (
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-2">
                    Agent <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  {availableAgents.length === 0 ? (
                    <p className="text-xs text-ink-500 italic">
                      No specific agents available — team will pick it up.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setAgentId('')}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors',
                          agentId === ''
                            ? 'border-brand-900 bg-brand-50/50 ring-1 ring-brand-900'
                            : 'border-ink-200 hover:bg-ink-50'
                        )}
                      >
                        <Users className="w-4 h-4 text-ink-400 shrink-0" />
                        <span className="flex-1 text-sm text-ink-700">
                          Any agent in team
                        </span>
                      </button>
                      {availableAgents.map((a) => {
                        const isSelected = agentId === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setAgentId(a.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors',
                              isSelected
                                ? 'border-brand-900 bg-brand-50/50 ring-1 ring-brand-900'
                                : 'border-ink-200 hover:bg-ink-50'
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-ink-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                              {a.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="flex-1 text-sm text-ink-900">
                              {a.username}
                            </span>
                            <span className="text-[10px] font-mono text-ink-500">
                              {a.level}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
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
            type="button"
            onClick={handleConfirm}
            disabled={!teamId || submitting}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Forwarding…' : (
              <>
                <Forward className="w-3.5 h-3.5" />
                Forward
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
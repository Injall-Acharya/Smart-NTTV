import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Send,
  Wifi, Laptop, AppWindow, KeyRound, Receipt, HelpCircle,
  AlertCircle, FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useFetch } from '@/hooks/useFetch';
import { categoriesApi, ticketsApi } from '@/api/endpoints';
import { cn } from '@/lib/cn';
// import type { Category } from '@/types/category';
import type { TicketPriority } from '@/types/ticket';
import { AttachmentPicker } from '@/components/shared/AttachmentPicker';

/* ─────────────────────────────────────────────────
   Step definitions
   ───────────────────────────────────────────────── */
type StepId = 1 | 2 | 3;

interface Step {
  id: StepId;
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  { id: 1, title: 'Category', subtitle: 'What is this about?' },
  { id: 2, title: 'Details',  subtitle: 'Describe the issue' },
  { id: 3, title: 'Review',   subtitle: 'Confirm and submit' },
];

/* Category icon map — falls back to HelpCircle */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  network:  Wifi,
  hardware: Laptop,
  software: AppWindow,
  access:   KeyRound,
  billing:  Receipt,
  other:    HelpCircle,
};

const iconFor = (name: string): LucideIcon =>
  CATEGORY_ICONS[name.toLowerCase()] ?? HelpCircle;

/* Priority options */
const PRIORITIES: Array<{ value: TicketPriority; label: string; hint: string; dot: string }> = [
  { value: 'LOW',      label: 'Low',      hint: 'Minor inconvenience, not blocking work',     dot: 'bg-ink-400' },
  { value: 'MEDIUM',   label: 'Medium',   hint: 'Slows you down but workaround exists',       dot: 'bg-blue-500' },
  { value: 'HIGH',     label: 'High',     hint: 'Blocking important work',                    dot: 'bg-orange-500' },
  { value: 'CRITICAL', label: 'Critical', hint: 'Total outage — immediate attention needed',  dot: 'bg-rose-500' },
];

/* ─────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────── */
export function NewTicketPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<StepId>(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [files, setFiles] = useState<File[]>([]);

  const { data: categories, loading: loadingCats } = useFetch(categoriesApi.list);
  const selectedCategory = categories?.find((c) => c.id === categoryId);

  /* ── Validation ─────────────────────────────── */
  const titleError =
    touched.title && title.trim().length < 4 ? 'At least 4 characters' : '';
  const descriptionError =
    touched.description && description.trim().length < 10 ? 'At least 10 characters' : '';
  const categoryError =
    touched.categoryId && !categoryId ? 'Pick a category' : '';

  const canProceed = {
    1: !!categoryId,
    2: title.trim().length >= 4 && description.trim().length >= 10,
    3: true,
  }[step];

  /* ── Navigation ──────────────────────────────── */
  const goNext = () => {
    if (step === 1) {
      setTouched((t) => ({ ...t, categoryId: true }));
      if (!categoryId) return;
      setStep(2);
    } else if (step === 2) {
      setTouched((t) => ({ ...t, title: true, description: true }));
      if (title.trim().length < 4 || description.trim().length < 10) return;
      setStep(3);
    }
  };

  const goBack = () => {
    if (step === 1) return;
    setStep((step - 1) as StepId);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const ticket = await ticketsApi.create({
        title: title.trim(),
        description: description.trim(),
        priority,
        categoryId,
      });
      setCreatedTicketId(ticket.id);
    } catch (e: any) {
      setSubmitError(
        e?.response?.data?.detail ?? 'Something went wrong. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setCreatedTicketId(null);
    setStep(1);
    setCategoryId('');
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setTouched({});
    setSubmitError(null);
  };

  /* ── Success screen ─────────────────────────── */
  if (createdTicketId) {
    return (
      <SuccessScreen
        ticketId={createdTicketId}
        onView={() => navigate(`/staff/tickets/${createdTicketId}`)}
        onAnother={resetAll}
      />
    );
  }

  /* ── Wizard ─────────────────────────────────── */
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-12 py-6 lg:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <header className="pb-6 border-b border-ink-200">
        <Link
          to="/staff/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to my tickets
        </Link>
        <h1 className="mt-3 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight">
          Submit a new ticket
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Describe the issue and we'll route it to the right team.
        </p>
      </header>

      {/* Layout: sidebar steps + content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
        {/* ── Step sidebar (desktop) ──────────────── */}
        <nav className="hidden lg:block">
          <ol className="space-y-1">
            {STEPS.map((s) => {
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => isDone && setStep(s.id)}
                    disabled={!isDone && !isActive}
                    className={cn(
                      'w-full text-left flex items-start gap-3 p-3 rounded-md transition-colors',
                      isDone && 'cursor-pointer hover:bg-ink-50',
                      isActive && 'bg-ink-50',
                      !isDone && !isActive && 'cursor-default opacity-60'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold',
                        isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : isActive
                          ? 'bg-brand-900 text-white'
                          : 'bg-ink-100 text-ink-500'
                      )}
                    >
                      {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : s.id}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={cn(
                          'block text-sm font-medium',
                          isActive ? 'text-ink-900' : 'text-ink-600'
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="block text-xs text-ink-400 mt-0.5">
                        {s.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── Mobile step indicator ───────────────── */}
        <div className="lg:hidden">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-medium text-ink-500">
              Step {step} of {STEPS.length}
            </span>
            <div className="flex-1 h-1 rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full bg-brand-900 transition-all duration-300"
                style={{ width: `${(step / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────── */}
        <main className="min-w-0">
          {/* STEP 1 — Category */}
          {step === 1 && (
            <section>
              <h2 className="text-lg font-semibold">What is this about?</h2>
              <p className="text-sm text-ink-500 mt-1">
                Choose the category that best matches your issue.
              </p>

              {loadingCats ? (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-ink-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(categories ?? []).map((cat) => {
                    const Icon = iconFor(cat.name);
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(cat.id);
                          setTouched((t) => ({ ...t, categoryId: true }));
                        }}
                        className={cn(
                          'group flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
                          isSelected
                            ? 'border-brand-900 bg-brand-50/40 ring-1 ring-brand-900'
                            : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50'
                        )}
                      >
                        <span
                          className={cn(
                            'w-9 h-9 shrink-0 rounded-md flex items-center justify-center',
                            isSelected
                              ? 'bg-brand-900 text-white'
                              : 'bg-ink-100 text-ink-600'
                          )}
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.75} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={cn(
                              'block text-sm font-semibold',
                              isSelected ? 'text-brand-900' : 'text-ink-900'
                            )}
                          >
                            {cat.name}
                          </span>
                          <span className="block text-xs text-ink-500 mt-0.5 truncate">
                            {cat.description}
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-brand-900 shrink-0 mt-0.5" strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {categoryError && (
                <p className="mt-3 text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {categoryError}
                </p>
              )}
            </section>
          )}

          {/* STEP 2 — Details */}
          {step === 2 && (
            <section>
              <h2 className="text-lg font-semibold">Describe the issue</h2>
              <p className="text-sm text-ink-500 mt-1">
                The more detail you give, the faster we can help.
              </p>

              <div className="mt-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                    placeholder="e.g. Cannot connect to VPN from home"
                    maxLength={120}
                    autoFocus
                    className={cn(
                      'h-10 w-full rounded-md border bg-white px-3 text-sm',
                      'placeholder:text-ink-300',
                      'focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10',
                      titleError ? 'border-red-300' : 'border-ink-200'
                    )}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    {titleError ? (
                      <p className="text-xs text-red-600">{titleError}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-ink-400 tabular-nums">
                      {title.length}/120
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                    placeholder="What were you doing? What did you expect? What happened instead? Include any error messages."
                    rows={6}
                    maxLength={2000}
                    className={cn(
                      'w-full rounded-md border bg-white px-3 py-2.5 text-sm resize-none',
                      'placeholder:text-ink-300',
                      'focus:outline-none focus:border-ink-900 focus:ring-[3px] focus:ring-ink-900/10',
                      descriptionError ? 'border-red-300' : 'border-ink-200'
                    )}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    {descriptionError ? (
                      <p className="text-xs text-red-600">{descriptionError}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-ink-400 tabular-nums">
                      {description.length}/2000
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">
                    Priority
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRIORITIES.map((p) => {
                      const isSelected = priority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={cn(
                            'flex items-start gap-2.5 p-3 rounded-md border text-left transition-all',
                            isSelected
                              ? 'border-brand-900 bg-brand-50/40 ring-1 ring-brand-900'
                              : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50'
                          )}
                        >
                          <span className={cn('mt-1 w-2 h-2 rounded-full shrink-0', p.dot)} />
                          <span className="flex-1 min-w-0">
                            <span
                              className={cn(
                                'block text-sm font-medium',
                                isSelected ? 'text-brand-900' : 'text-ink-900'
                              )}
                            >
                              {p.label}
                            </span>
                            <span className="block text-[11px] text-ink-500 mt-0.5">
                              {p.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1.5">
                    Attachments <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <AttachmentPicker
                    value={files}
                    onChange={setFiles}
                    maxFiles={3}
                    maxSizeMB={10}
                  />
                </div>
              </div>
            </section>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <section>
              <h2 className="text-lg font-semibold">Review your ticket</h2>
              <p className="text-sm text-ink-500 mt-1">
                Make sure everything is correct before submitting.
              </p>

              <div className="mt-6 rounded-lg border border-ink-200 bg-white divide-y divide-ink-100">
                <ReviewRow label="Category">
                  {selectedCategory?.name ?? '—'}
                </ReviewRow>
                <ReviewRow label="Priority">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        PRIORITIES.find((p) => p.value === priority)?.dot ?? 'bg-ink-400'
                      )}
                    />
                    {PRIORITIES.find((p) => p.value === priority)?.label}
                  </span>
                </ReviewRow>
                <ReviewRow label="Subject">
                  <span className="font-medium text-ink-900">{title}</span>
                </ReviewRow>
                <ReviewRow label="Description">
                  <p className="text-sm text-ink-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                    {description}
                  </p>
                </ReviewRow>

                {files.length > 0 && (
                <ReviewRow label="Attachments">
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs text-ink-700">
                        <FileText className="w-3 h-3 text-ink-400 shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-ink-400 tabular-nums shrink-0">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>
                </ReviewRow>
                )}

                <ReviewRow label="Submitted by">
                  {user?.firstName} {user?.lastName}{' '}
                  <span className="text-ink-400">({user?.username})</span>
                </ReviewRow>
              </div>

              {submitError && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">{submitError}</p>
                </div>
              )}
            </section>
          )}

          {/* ── Action bar ──────────────────────────── */}
          <div className="mt-10 pt-6 border-t border-ink-200 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-sm font-medium text-ink-600 hover:bg-ink-100 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit ticket
                  </>
                )}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────── */

function ReviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 px-5 py-4">
      <span className="text-xs font-medium text-ink-500 pt-0.5">{label}</span>
      <div className="text-sm text-ink-800 min-w-0">{children}</div>
    </div>
  );
}

function SuccessScreen({
  ticketId,
  onView,
  onAnother,
}: {
  ticketId: string;
  onView: () => void;
  onAnother: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={1.75} />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Ticket submitted
        </h1>
        <p className="mt-2 text-sm text-ink-500 leading-relaxed">
          Our auto-dispatcher has assigned your ticket to the right team.
          You'll be notified as it progresses.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider font-medium text-ink-400">
            Ticket ID
          </span>
          <code className="text-xs font-mono text-ink-900">
            #{ticketId.slice(0, 12)}
          </code>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium transition-colors"
          >
            View ticket
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onAnother}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-sm font-medium transition-colors"
          >
            Create another
          </button>
        </div>

        <Link
          to="/staff/tickets"
          className="mt-6 inline-block text-xs font-medium text-ink-500 hover:text-ink-900"
        >
          Back to my tickets
        </Link>
      </div>
    </div>
  );
}
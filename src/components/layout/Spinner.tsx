export function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50">
      <div className="w-8 h-8 rounded-full border-2 border-ink-200 border-t-brand-900 animate-spin" />
    </div>
  );
}
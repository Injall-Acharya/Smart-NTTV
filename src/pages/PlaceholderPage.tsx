import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

export function PlaceholderPage({ title }: Props) {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="text-sm text-slate-500">
          This page is under construction.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12
                      flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <Construction className="w-6 h-6" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Coming soon
        </p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          We're building this page next. Check back shortly.
        </p>
      </div>
    </div>
  );
}
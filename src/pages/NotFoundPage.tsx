import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto rounded-xl bg-ink-100 border border-ink-200 flex items-center justify-center">
          <SearchX className="w-7 h-7 text-ink-600" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-ink-500">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-block px-5 py-2.5 rounded-md bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
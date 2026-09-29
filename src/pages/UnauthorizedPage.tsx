import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
          <ShieldX className="w-7 h-7 text-red-600" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-ink-500">
          You don't have permission to view this page.
        </p>
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
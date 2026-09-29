import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { hasRole } from '@/lib/permissions';
import { Spinner } from './Spinner';
import type { UserRole } from '@/types/user';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user, ready } = useAuthStore();
  const location = useLocation();

  //  console.log('[ProtectedRoute]', {
  //   path: location.pathname,
  //   role: user?.role,
  //   allowed: allowedRoles,
  // });

  if (!ready) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(user, ...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
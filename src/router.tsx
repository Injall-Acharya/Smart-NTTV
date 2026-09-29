import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/auth';

import { LoginPage } from '@/pages/Auth/LoginPage';
import { RegisterPage } from '@/pages/Auth/RegisterPage';
import { AdminDashboard } from '@/pages/Admin/AdminDashboard';
import { StaffDashboard } from '@/pages/Staff/StaffDashboard';
import { StaffTicketsPage } from '@/pages/Staff/StaffTickets';
import { NewTicketPage } from '@/pages/Staff/NewTicket';
import { TicketDetailPage } from './components/shared/TicketDetail';
import { AgentDashboard } from '@/pages/Expert/AgentDashboard';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [{ path: '/admin', element: <AdminDashboard /> }],
          },
          {
            element: <ProtectedRoute allowedRoles={['staff']} />,
            children: [
              { path: '/staff', element: <StaffDashboard /> },
              { path: '/staff/tickets', element: <StaffTicketsPage /> },
              { path: '/staff/tickets/new', element: <NewTicketPage /> },       
              { path: '/staff/tickets/:ticketId', element: <TicketDetailPage /> }, 
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['agent']} />,
            children: [
              { path: '/agent', element: <AgentDashboard /> },
              { path: '/agent/tickets/:ticketId', element: <TicketDetailPage /> },
            ],
          },
          { path: '/', element: <RoleRedirect /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/agent" replace />;
}
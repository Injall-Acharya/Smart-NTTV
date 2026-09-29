import type { User, UserRole } from '@/types/user';
// import type { Ticket } from '@/types/ticket';

export const hasRole = (user: User | null, ...roles: UserRole[]) => {
  // console.log('[hasRole]', { userRole: user?.role, allowed: roles });
  return !!user && roles.includes(user.role);
};

export const can = {
  manageUsers:      (u: User | null) => hasRole(u, 'admin'),
  manageTeams:      (u: User | null) => hasRole(u, 'admin'),
  manageCategories: (u: User | null) => hasRole(u, 'admin'),
  viewReports:      (u: User | null) => hasRole(u, 'admin'),
  viewAllTickets:   (u: User | null) => hasRole(u, 'admin'),
  createTicket:     (u: User | null) => hasRole(u, 'admin', 'staff', 'agent'),
};

export function roleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/staff')) return 'staff';
  if (pathname.startsWith('/agent')) return 'agent';
  return null;
}

export function homePathFor(role: UserRole): string {
  return role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/agent';
}
import { api } from './client';
import type { AdminStats } from '@/types/admin';
import type { LoginResponse } from '@/types/auth';
import type { User, UserRole } from '@/types/user';
import type { Notification } from '@/types/notification';
import type { Ticket, TicketActivity } from '@/types/ticket';
// import type { Paginated } from '@/types/common';
import type { Category, CategoryStatus } from '@/types/category';
import type { Team, TeamDetail, TeamLevel } from '@/types/team';

import type { ReportFilters, ReportSummary, DetailedReport } from '@/types/report';

export const reportsApi = {
  summary: (filters: ReportFilters) =>
    api.get<ReportSummary>('/admin/reports/summary/', { params: filters }).then((r) => r.data),

  detailed: (filters: ReportFilters) =>
    api.get<DetailedReport>('/admin/reports/detailed/', { params: filters }).then((r) => r.data),
};

export interface CreateTeamPayload {
  name: string;
  categoryId: string;
  level: TeamLevel;
}

export interface UpdateTeamPayload {
  name?: string;
  categoryId?: string;
  level?: TeamLevel;
}

export const teamsApi = {
  list: () =>
    api.get<Team[]>('/teams/').then((r) => r.data),

  get: (id: string) =>
    api.get<TeamDetail>(`/teams/${id}/`).then((r) => r.data),

  create: (payload: CreateTeamPayload) =>
    api.post<Team>('/teams/', payload).then((r) => r.data),

  update: (id: string, patch: UpdateTeamPayload) =>
    api.patch<Team>(`/teams/${id}/`, patch).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/teams/${id}/`).then((r) => r.data),

  /** List all agents (for member picker). Filter client-side by level. */
  availableAgents: () =>
    api
      .get<User[]>('/admin/users/', { params: { role: 'agent' } })
      .then((r) => r.data),

  assignMember: (teamId: string, userId: string) =>
    api
      .post<TeamDetail>(`/teams/${teamId}/members/`, { userId })
      .then((r) => r.data),

  unassignMember: (teamId: string, userId: string) =>
    api
      .delete<TeamDetail>(`/teams/${teamId}/members/${userId}/`)
      .then((r) => r.data),
};

export interface CreateCategoryPayload {
  name: string;
  description: string;
  status?: CategoryStatus;
}

export const categoriesApi = {
  list: () =>
    api.get<Category[]>('/categories/').then((r) => r.data),

  create: (payload: CreateCategoryPayload) =>
    api.post<Category>('/categories/', payload).then((r) => r.data),

  update: (id: string, patch: Partial<CreateCategoryPayload>) =>
    api.patch<Category>(`/categories/${id}/`, patch).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/categories/${id}/`).then((r) => r.data),
};

export interface CreateUserPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  level?: TeamLevel;
  teamId?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  level?: TeamLevel;
  teamId?: string;
  isActive?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { username, password }).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post('/auth/register/', payload).then((r) => r.data),

  refresh: () =>
    api.post<LoginResponse>('/auth/refresh/', {}).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout/', {}).then((r) => r.data),
};

export const adminApi = {
  stats: () =>
    api.get<AdminStats>('/admin/stats/').then((r) => r.data),

  users: () =>
    api.get<User[]>('/admin/users/').then((r) => r.data),

  createUser: (payload: CreateUserPayload) =>
    api.post<User>('/admin/users/', payload).then((r) => r.data),

  updateUser: (id: string, patch: UpdateUserPayload) =>
    api.patch<User>(`/admin/users/${id}/`, patch).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}/`).then((r) => r.data),
};

export const notificationsApi = {
  list: () =>
    api.get<Notification[]>('/notifications/').then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count/').then((r) => r.data),

  markRead: (id: string) =>
    api.post(`/notifications/${id}/read/`).then((r) => r.data),

  markAllRead: () =>
    api.post('/notifications/mark-all-read/').then((r) => r.data),
};

export interface MyTicketsResponse {
  count: number;
  results: Ticket[];
  stats: {
    total: number;
    inProgress: number;
    resolved: number;
    unreadComments: number;
    forwardedBack: number;
  };
}

export interface ForwardTargets {
  teams: Array<{
    id: string;
    name: string;
    level: 'L1' | 'L2' | 'L3';
  }>;
  agents: Array<{
    id: string;
    username: string;
    level: 'L1' | 'L2' | 'L3';
    teamId: string;
  }>;
}

export const ticketsApi = {
  /** Returns tickets created by the current staff + aggregated stats. */
  mine: (params?: { pageSize?: number }) =>
    api
      .get<MyTicketsResponse>('/tickets/mine/', {
        params: { page_size: params?.pageSize },
      })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<Ticket>(`/tickets/${id}/`).then((r) => r.data),

  // Will be used by the wizard and detail pages
  create: (payload: {
    title: string;
    description: string;
    priority: string;
    categoryId: string;
  }) => api.post<Ticket>('/tickets/', payload).then((r) => r.data),

  assignedToMe: () =>
  api.get<{
    count: number;
    results: Ticket[];
    stats: {
      total: number;
      inProgress: number;
      resolved: number;
      forwarded: number;
      escalated: number;
      overdue: number;
    };
  }>('/tickets/assigned-to-me/').then((r) => r.data),

  activities: (id: string) =>
    api.get<TicketActivity[]>(`/tickets/${id}/activities/`).then((r) => r.data),

  start: (id: string) =>
    api.post<Ticket>(`/tickets/${id}/start/`).then((r) => r.data),

  resolve: (id: string) =>
    api.post<Ticket>(`/tickets/${id}/resolve/`).then((r) => r.data),

  // reopen: (id: string) =>
  //   api.post<Ticket>(`/tickets/${id}/reopen/`).then((r) => r.data),

  eligibleTargets: (id: string, mode: 'forward' | 'escalate') =>
  api.get<ForwardTargets>(`/tickets/${id}/eligible-targets/`, {
      params: { mode },
    }).then((r) => r.data),

  forward: (id: string, body: { teamId: string; agentId?: string }) =>
    api.post<Ticket>(`/tickets/${id}/forward/`, body).then((r) => r.data),

  escalate: (id: string, body: { teamId: string; agentId?: string }) =>
    api.post<Ticket>(`/tickets/${id}/escalate/`, body).then((r) => r.data),
};

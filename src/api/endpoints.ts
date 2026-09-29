import { api } from './client';
import type { AdminStats } from '@/types/admin';
import type { LoginResponse } from '@/types/auth';
import type { User } from '@/types/user';
import type { Notification } from '@/types/notification';
import type { Ticket, TicketActivity } from '@/types/ticket';
import type { Category } from '@/types/category';


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

export const categoriesApi = {
  list: () =>
    api.get<Category[]>('/categories/').then((r) => r.data),
};
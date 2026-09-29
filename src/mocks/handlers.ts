import { http, HttpResponse, delay } from 'msw';
import type { Notification } from '@/types/notification';
import type { Category } from '@/types/category';
import type { Ticket } from '@/types/ticket';
import type { User } from '@/types/user';
import type { TicketActivity } from '@/types/ticket';


const API = 'http://localhost:8000/api';

const SESSION_KEY = 'msw_session_user_id';

const setMockSession = (userId: string) => {
  try { localStorage.setItem(SESSION_KEY, userId); } catch {}
};
const clearMockSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
};
const getMockSession = (): string | null => {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
};

interface MockUser extends User {
  password: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    password: 'admin123',
    email: 'admin@ntc.com.np',
    firstName: 'Sita',
    lastName: 'Sharma',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2025-01-01').toISOString(),
  },
  {
    id: 'usr_self',                     // ← matches createdById in mock tickets
    username: 'sita',
    password: 'sita123',
    email: 'sita.rai@ntc.com.np',
    firstName: 'Sita',
    lastName: 'Rai',
    role: 'staff',
    isActive: true,
    createdAt: new Date('2025-01-15').toISOString(),
  },
  {
    id: 'agent_ram',                    // ← matches assignedToId in mock tickets
    username: 'ram',
    password: 'ram123',
    email: 'ram.thapa@ntc.com.np',
    firstName: 'Ram',
    lastName: 'Thapa',
    role: 'agent',
    level: 'L1',
    teamId: 'team_net_l1',
    teamName: 'Network L1',
    isActive: true,
    createdAt: new Date('2025-02-01').toISOString(),
  },
  // L2 agent
  {
    id: 'agent_l2_bikash',
    username: 'bikash',
    password: 'bikash123',
    email: 'bikash.g@ntc.com.np',
    firstName: 'Bikash',
    lastName: 'Gurung',
    role: 'agent',
    level: 'L2',
    teamId: 'team_net_l2',
    teamName: 'Network L2',
    isActive: true,
    createdAt: new Date('2025-02-05').toISOString(),
  },
  // L3 agent
  {
    id: 'agent_l3_krishna',
    username: 'krishna',
    password: 'krishna123',
    email: 'krishna.b@ntc.com.np',
    firstName: 'Krishna',
    lastName: 'Bahadur',
    role: 'agent',
    level: 'L3',
    teamId: 'team_infra_l3',
    teamName: 'Infra L3',
    isActive: true,
    createdAt: new Date('2025-02-10').toISOString(),
  },
  // Second L1 agent (same team as Ram — for "forward to peer agent")
  {
    id: 'agent_l1_anita',
    username: 'anita',
    password: 'anita123',
    email: 'anita.s@ntc.com.np',
    firstName: 'Anita',
    lastName: 'Shrestha',
    role: 'agent',
    level: 'L1',
    teamId: 'team_net_l1',
    teamName: 'Network L1',
    isActive: true,
    createdAt: new Date('2025-02-15').toISOString(),
  },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat_network',  name: 'Network',  description: 'Connectivity, VPN, Wi-Fi issues', status: 'active' },
  { id: 'cat_hardware', name: 'Hardware', description: 'Laptops, printers, peripherals',  status: 'active' },
  { id: 'cat_software', name: 'Software', description: 'Applications, licensing, updates', status: 'active' },
  { id: 'cat_access',   name: 'Access',   description: 'Accounts, permissions, shared drives', status: 'active' },
  { id: 'cat_billing',  name: 'Billing',  description: 'Invoices, payments, subscriptions', status: 'active' },
  { id: 'cat_other',    name: 'Other',    description: 'Anything else', status: 'active' },
];

/** Strip the password before sending a user back to the client. */
const toPublicUser = (u: MockUser): User => {
  const { password, ...rest } = u;
  return rest;
};

/** Find a user by username + password (case-insensitive username). */
const findUser = (username: string, password: string): MockUser | undefined =>{
  const found = MOCK_USERS.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password
  );
  // console.log('[mock findUser]', { username, found: found?.role ?? 'NOT FOUND' });
  return found;
};

// ── Notifications ─────────────────────────────────────
const mockNotifications: Notification[] = [
  {
    id: 'n1',
    kind: 'TICKET_ASSIGNED',
    title: 'New ticket assigned',
    body: 'Ticket #TKT-1042 — Network outage at Block C — assigned to you.',
    read: false,
    ticketId: 'tkt_1042',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),   // 2m ago
    actorName: 'Auto-dispatcher',
  },
  {
    id: 'n2',
    kind: 'TICKET_COMMENT',
    title: 'New comment on #TKT-1039',
    body: 'Bikash Gurung: "Restarted the router, monitoring for 10 mins."',
    read: false,
    ticketId: 'tkt_1039',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),  // 15m ago
    actorName: 'bikash.g',
  },
  {
    id: 'n3',
    kind: 'TICKET_ESCALATED',
    title: 'Ticket escalated to L2',
    body: '#TKT-1027 — Access control issue — escalated by Ram Thapa.',
    read: true,
    ticketId: 'tkt_1027',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),  // 3h ago
    actorName: 'ram.thapa',
  },
  {
    id: 'n4',
    kind: 'TICKET_RESOLVED',
    title: 'Ticket resolved',
    body: '#TKT-1015 — Printer driver fault — marked resolved.',
    read: true,
    ticketId: 'tkt_1015',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26h ago
    actorName: 'anita.shrestha',
  },
];

// ── Ticket mocks ──────────────────────────────────────
const mockTickets: Ticket[] = [
  {
    id: 'tkt_1050fwd',
    title: 'Cannot print from my laptop',
    description: 'Printer shows "offline" for my laptop but others can print fine.',
    priority: 'MEDIUM',
    status: 'FORWARDED_BACK',
    categoryId: 'cat_hardware',
    categoryName: 'Hardware',
    createdById: 'usr_self',
    createdByName: 'sita',
    createdByRole: 'staff',
    assignedToId: 'agent_hari',
    assignedToName: 'hari.bhatta',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'tkt_1042abcd',
    title: 'Wi-Fi keeps dropping on 3rd floor',
    description: 'Intermittent connection since Monday.',
    priority: 'HIGH',
    status: 'INPROCESS',
    categoryId: 'cat_network',
    categoryName: 'Network',
    level: 'L1',
    assignedTeamId: 'team_net_l1',
    assignedTeamName: 'Network L1',
    assignedToId: 'agent_ram',
    assignedToName: 'ram.thapa',
    createdById: 'usr_self',
    createdByName: 'sita',
    createdByRole: 'staff',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tkt_1039xyz',
    title: 'Cannot access shared drive',
    description: 'Access denied when opening \\\\fileserver\\shared.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    categoryId: 'cat_access',
    categoryName: 'Access',
    level: 'L1',
    createdById: 'usr_self',
    createdByName: 'sita',
    createdByRole: 'staff',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tkt_1027abc',
    title: 'Printer out of toner',
    description: 'HP LaserJet on 2nd floor showing low toner warning.',
    priority: 'LOW',
    status: 'ASSIGNED',
    categoryId: 'cat_hardware',
    categoryName: 'Hardware',
    level: 'L1',
    assignedTeamId: 'team_hw_l1',
    assignedTeamName: 'Hardware L1',
    createdById: 'usr_self',
    createdByName: 'sita',
    createdByRole: 'staff',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'tkt_1015ghi',
    title: 'Email not syncing on phone',
    description: 'Outlook app stopped receiving new emails yesterday.',
    priority: 'MEDIUM',
    status: 'NEW',
    categoryId: 'cat_software',
    categoryName: 'Software',
    createdById: 'usr_self',
    createdByName: 'jane.doe',
    createdByRole: 'staff',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
  id: 'tkt_agent_101',
  title: 'VPN authentication failing',
  description: 'Users report "invalid credentials" errors when connecting to VPN.',
  priority: 'HIGH',
  status: 'ASSIGNED',
  categoryId: 'cat_network',
  categoryName: 'Network',
  level: 'L1',
  assignedTeamId: 'team_net_l1',
  assignedTeamName: 'Network L1',
  assignedToId: 'agent_ram',
  assignedToName: 'ram.thapa',
  createdById: 'usr_other',
  createdByName: 'hari',
  createdByRole: 'staff',
  createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tkt_agent_102',
    title: 'Switch port down in Server Room',
    description: 'Port 24 on switch B has no link light.',
    priority: 'CRITICAL',
    status: 'ESCALATED',
    categoryId: 'cat_network',
    categoryName: 'Network',
    level: 'L2',
    assignedTeamId: 'team_net_l1',
    assignedTeamName: 'Network L1',
    assignedToId: 'agent_ram',
    assignedToName: 'ram.thapa',
    createdById: 'usr_other',
    createdByName: 'hari',
    createdByRole: 'staff',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tkt_agent_103',
    title: 'Guest Wi-Fi captive portal broken',
    description: 'Guests get 404 after submitting the portal form.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    categoryId: 'cat_network',
    categoryName: 'Network',
    level: 'L1',
    assignedTeamId: 'team_net_l1',
    assignedTeamName: 'Network L1',
    assignedToId: 'agent_ram',
    assignedToName: 'ram.thapa',
    createdById: 'usr_self',
    createdByName: 'sita',
    createdByRole: 'staff',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

// A reference table for the mock's eligible-target logic
const MOCK_TEAMS = [
  { id: 'team_net_l1',  name: 'Network L1',  categoryId: 'cat_network',  level: 'L1' as const },
  { id: 'team_net_l2',  name: 'Network L2',  categoryId: 'cat_network',  level: 'L2' as const },
  { id: 'team_infra_l3', name: 'Infra L3',   categoryId: 'cat_network',  level: 'L3' as const },
];

const MOCK_ACTIVITIES: Record<string, TicketActivity[]> = {
  // Fully-resolved ticket
  tkt_1015ghi: [
    {
      id: 'act_1',
      ticketId: 'tkt_1015ghi',
      type: 'CREATED',
      performedBy: { id: 'usr_self', username: 'sita', role: 'staff' },
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ],
  // In-process ticket — full journey
  tkt_1042abcd: [
    {
      id: 'act_1',
      ticketId: 'tkt_1042abcd',
      type: 'CREATED',
      performedBy: { id: 'usr_self', username: 'sita', role: 'staff' },
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_2',
      ticketId: 'tkt_1042abcd',
      type: 'DISPATCHED',
      performedBy: { id: 'system', username: 'Auto-dispatcher', role: 'admin' },
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      note: 'Assigned to Network L1',
      toLevel: 'L1',
      toTeamName: 'Network L1',
    },
    {
      id: 'act_3',
      ticketId: 'tkt_1042abcd',
      type: 'IN_PROGRESS',
      performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  // Resolved ticket
  tkt_1039xyz: [
    {
      id: 'act_1',
      ticketId: 'tkt_1039xyz',
      type: 'CREATED',
      performedBy: { id: 'usr_self', username: 'sita', role: 'staff' },
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_2',
      ticketId: 'tkt_1039xyz',
      type: 'DISPATCHED',
      performedBy: { id: 'system', username: 'Auto-dispatcher', role: 'admin' },
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60_000).toISOString(),
      toLevel: 'L1',
      toTeamName: 'Access L1',
    },
    {
      id: 'act_3',
      ticketId: 'tkt_1039xyz',
      type: 'IN_PROGRESS',
      performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
      timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_4',
      ticketId: 'tkt_1039xyz',
      type: 'RESOLVED',
      performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  // Assigned — awaiting start
  tkt_1027abc: [
    {
      id: 'act_1',
      ticketId: 'tkt_1027abc',
      type: 'CREATED',
      performedBy: { id: 'usr_self', username: 'sita', role: 'staff' },
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_2',
      ticketId: 'tkt_1027abc',
      type: 'DISPATCHED',
      performedBy: { id: 'system', username: 'Auto-dispatcher', role: 'admin' },
      timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
      note: 'Assigned to Hardware L1',
      toLevel: 'L1',
      toTeamName: 'Hardware L1',
    },
  ],
  // Forwarded back
  tkt_1050fwd: [
    {
      id: 'act_1',
      ticketId: 'tkt_1050fwd',
      type: 'CREATED',
      performedBy: { id: 'usr_self', username: 'sita', role: 'staff' },
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_2',
      ticketId: 'tkt_1050fwd',
      type: 'DISPATCHED',
      performedBy: { id: 'system', username: 'Auto-dispatcher', role: 'admin' },
      timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_3',
      ticketId: 'tkt_1050fwd',
      type: 'FORWARDED',
      performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      note: 'This is a duplicate of #tkt_1042. Please review and close.',
      fromUserName: 'ram',
      toUserName: 'sita',
    },
  ],

  tkt_agent_101: [
  {
    id: 'act_101_1',
    ticketId: 'tkt_agent_101',
    type: 'CREATED',
    performedBy: { id: 'usr_other', username: 'hari', role: 'staff' },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act_101_2',
    ticketId: 'tkt_agent_101',
    type: 'DISPATCHED',
    performedBy: { id: 'system', username: 'Auto-dispatcher', role: 'admin' },
    timestamp: new Date(Date.now() - 3.9 * 60 * 60 * 1000).toISOString(),
    note: 'Assigned to Network L1',
    toLevel: 'L1',
    toTeamName: 'Network L1',
  },
  ],
  tkt_agent_102: [
    {
      id: 'act_102_1',
      ticketId: 'tkt_agent_102',
      type: 'CREATED',
      performedBy: { id: 'usr_other', username: 'hari', role: 'staff' },
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_102_2',
      ticketId: 'tkt_agent_102',
      type: 'DISPATCHED',
      performedBy: { id: 'system', username: 'Auto-dispatcher', role: 'admin' },
      timestamp: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(),
      toLevel: 'L1',
      toTeamName: 'Network L1',
    },
    {
      id: 'act_102_3',
      ticketId: 'tkt_agent_102',
      type: 'ESCALATED',
      performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      note: 'Escalated to L2 for hardware intervention',
      fromLevel: 'L1',
      toLevel: 'L2',
      toTeamName: 'Network L2',
    },
  ],
  tkt_agent_103: [
    {
      id: 'act_103_1',
      ticketId: 'tkt_agent_103',
      type: 'CREATED',
      performedBy: { id: 'usr_self', username: 'sita', role: 'staff' },
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act_103_2',
      ticketId: 'tkt_agent_103',
      type: 'RESOLVED',
      performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
};


export const handlers = [
  // ── Auth ────
http.post(`${API}/auth/login/`, async ({ request }) => {
  await delay(300);
  const body = (await request.json()) as { username: string; password: string };
  const user = findUser(body.username, body.password);

  if (!user) {
    return HttpResponse.json(
      { detail: 'Invalid username or password' },
      { status: 401 }
    );
  }

  setMockSession(user.id);   // ← remember who logged in

  return HttpResponse.json({
    access: `fake.jwt.${user.id}`,
    user: toPublicUser(user),
  });
}),

http.post(`${API}/auth/refresh/`, async () => {
  await delay(150);
  const userId = getMockSession();
  const user = userId ? MOCK_USERS.find((u) => u.id === userId) : null;

  if (!user) {
    return HttpResponse.json(
      { detail: 'Not authenticated' },
      { status: 401 }
    );
  }

  return HttpResponse.json({
    access: `fake.jwt.${user.id}`,
    user: toPublicUser(user),
  });
}),

http.post(`${API}/auth/logout/`, async () => {
  clearMockSession();        // ← forget the session
  return HttpResponse.json({ ok: true });
}),

  http.post(`${API}/auth/register/`, async ({ request }) => {
  await delay(400);
  const body = (await request.json()) as {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  };

  if (MOCK_USERS.some((u) => u.username.toLowerCase() === body.username.toLowerCase())) {
    return HttpResponse.json(
      { username: ['This username is already taken.'] },
      { status: 400 }
    );
  }
  if (MOCK_USERS.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
    return HttpResponse.json(
      { email: ['An account with this email already exists.'] },
      { status: 400 }
    );
  }

  const newUser: MockUser = {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    username: body.username,
    password: body.password,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    role: 'staff',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS.push(newUser);

  return HttpResponse.json({ user: toPublicUser(newUser) }, { status: 201 });
  }),


  // ── Admin ─────────────────────────────────────────
  http.get(`${API}/admin/stats/`, async () => {
  await delay(400);

  const today = new Date();
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      created: 8 + Math.floor(Math.random() * 12),
      resolved: 6 + Math.floor(Math.random() * 10),
    };
  });

  return HttpResponse.json({
    totalTickets: 428,
    openTickets: 82,
    resolvedTickets: 311,
    unresolvedTickets: 117,
    activeUsers: 47,
    avgResolutionHours: 14.6,

    trend,

    byCategory: [
      { name: 'Network',   value: 142 },
      { name: 'Hardware',  value: 98  },
      { name: 'Software',  value: 76  },
      { name: 'Access',    value: 64  },
      { name: 'Billing',   value: 30  },
      { name: 'Other',     value: 18  },
    ],

    byPriority: [
      { name: 'CRITICAL', value: 34  },
      { name: 'HIGH',     value: 92  },
      { name: 'MEDIUM',   value: 187 },
      { name: 'LOW',      value: 115 },
    ],

    byTeam: [
      { teamId: 't1', teamName: 'Network L1',  level: 'L1', assigned: 142, resolved: 128, resolutionRate: 90 },
      { teamId: 't2', teamName: 'Hardware L1', level: 'L1', assigned: 98,  resolved: 81,  resolutionRate: 83 },
      { teamId: 't3', teamName: 'Software L1', level: 'L1', assigned: 76,  resolved: 68,  resolutionRate: 89 },
      { teamId: 't4', teamName: 'Access L1',   level: 'L1', assigned: 64,  resolved: 41,  resolutionRate: 64 },
      { teamId: 't5', teamName: 'Network L2',  level: 'L2', assigned: 46,  resolved: 44,  resolutionRate: 96 },
      { teamId: 't6', teamName: 'Infra L3',    level: 'L3', assigned: 22,  resolved: 21,  resolutionRate: 95 },
    ],

    topAgents: [
      { agentId: 'a1', username: 'ram.thapa',    level: 'L1', assigned: 62, resolved: 58 },
      { agentId: 'a2', username: 'sita.rai',     level: 'L1', assigned: 54, resolved: 49 },
      { agentId: 'a3', username: 'bikash.g',     level: 'L2', assigned: 41, resolved: 40 },
      { agentId: 'a4', username: 'anita.shrestha', level: 'L1', assigned: 48, resolved: 38 },
      { agentId: 'a5', username: 'krishna.b',    level: 'L3', assigned: 22, resolved: 21 },
    ],
  });
  }),

  http.get(`${API}/notifications/`, async () => {
  await delay(300);
  return HttpResponse.json(mockNotifications);
  }),

  http.post(`${API}/notifications/:id/read/`, async ({ params }) => {
  const { id } = params;
  const n = mockNotifications.find((x) => x.id === id);
  if (n) n.read = true;
  return HttpResponse.json({ ok: true });
  }),

  http.post(`${API}/notifications/mark-all-read/`, async () => {
  mockNotifications.forEach((n) => { n.read = true; });
  return HttpResponse.json({ ok: true });
  }),

  http.get(`${API}/tickets/mine/`, async () => {
  await delay(350);
  return HttpResponse.json({
    count: mockTickets.length,
    results: mockTickets,
    stats: {
      total: mockTickets.length,
      inProgress: mockTickets.filter((t) => t.status === 'INPROCESS').length,
      resolved: mockTickets.filter((t) => t.status === 'RESOLVED').length,
      unreadComments: 0,
      forwardedBack: mockTickets.filter(
        (t) => t.status === 'FORWARDED_BACK' && t.createdById === 'usr_self'
      ).length,
    },
  });
  }),

  // ── Categories ────────────────────────────────────
  http.get(`${API}/categories/`, async () => {
    await delay(200);
    return HttpResponse.json(MOCK_CATEGORIES);
  }),

  // ── Tickets ───────────────────────────────────────
http.post(`${API}/tickets/`, async ({ request }) => {
  await delay(500);
  const body = (await request.json()) as {
    title: string;
    description: string;
    priority: string;
    categoryId: string;
  };

  const me = MOCK_USERS.find((u) => u.id === 'usr_self')!;
  const category = MOCK_CATEGORIES.find((c) => c.id === body.categoryId);

  const newTicket: Ticket = {
    id: `tkt_${Math.random().toString(36).slice(2, 10)}`,
    title: body.title,
    description: body.description,
    priority: body.priority as Ticket['priority'],
    status: 'NEW',
    categoryId: body.categoryId,
    categoryName: category?.name ?? 'Unknown',
    createdById: me.id,
    createdByName: me.username,
    createdByRole: 'staff',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Push into the mock list
  mockTickets.unshift(newTicket);

  return HttpResponse.json(newTicket, { status: 201 });
}),

http.get(`${API}/tickets/:id/eligible-targets/`, async ({ params, request }) => {
  await delay(250);

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'forward';

  const ticket = mockTickets.find((t) => t.id === params.id);
  if (!ticket) {
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const currentLevel = ticket.level ?? 'L1';

  if (mode === 'forward') {
    // Forward: same category, same level. Not the current assignee.
    const teams = MOCK_TEAMS.filter(
      (t) => t.categoryId === ticket.categoryId && t.level === currentLevel
    );
    const teamIds = new Set(teams.map((t) => t.id));

    const agents = MOCK_USERS.filter(
      (u) =>
        u.role === 'agent' &&
        u.level === currentLevel &&
        u.teamId &&
        teamIds.has(u.teamId) &&
        u.id !== ticket.assignedToId
    ).map((u) => ({
      id: u.id,
      username: u.username,
      level: u.level!,
      teamId: u.teamId!,
    }));

    return HttpResponse.json({
      teams: teams.map((t) => ({ id: t.id, name: t.name, level: t.level })),
      agents,
    });
  }

  // mode === 'escalate'
  const nextLevel = currentLevel === 'L1' ? 'L2' : currentLevel === 'L2' ? 'L3' : null;
  if (!nextLevel) {
    return HttpResponse.json({ teams: [], agents: [] });
  }

  const teams = MOCK_TEAMS.filter(
    (t) => t.categoryId === ticket.categoryId && t.level === nextLevel
  );
  const teamIds = new Set(teams.map((t) => t.id));

  const agents = MOCK_USERS.filter(
    (u) => u.role === 'agent' && u.level === nextLevel && u.teamId && teamIds.has(u.teamId)
  ).map((u) => ({
    id: u.id,
    username: u.username,
    level: u.level!,
    teamId: u.teamId!,
  }));

  return HttpResponse.json({
    teams: teams.map((t) => ({ id: t.id, name: t.name, level: t.level })),
    agents,
  });
}),

// ── Activities ────────────────────────────────────
http.get(`${API}/tickets/:id/activities/`, async ({ params }) => {
  await delay(250);
  const { id } = params;
  const activities = MOCK_ACTIVITIES[id as string] ?? [];
  // Newest first
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return HttpResponse.json(sorted);
}),

// ── Actions ───────────────────────────────────────
http.post(`${API}/tickets/:id/start/`, async ({ params }) => {
  await delay(300);
  const t = mockTickets.find((x) => x.id === params.id);
  if (!t) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });

  t.status = 'INPROCESS';
  t.updatedAt = new Date().toISOString();

  const acts = MOCK_ACTIVITIES[t.id] ?? (MOCK_ACTIVITIES[t.id] = []);
  acts.push({
    id: `act_${Math.random().toString(36).slice(2, 8)}`,
    ticketId: t.id,
    type: 'IN_PROGRESS',
    performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
    timestamp: new Date().toISOString(),
  });

  return HttpResponse.json(t);
}),

http.post(`${API}/tickets/:id/forward/`, async ({ params, request }) => {
  await delay(400);
  const body = (await request.json()) as { teamId: string; agentId?: string };

  const t = mockTickets.find((x) => x.id === params.id);
  if (!t) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });

  const team = MOCK_TEAMS.find((x) => x.id === body.teamId);
  const agent = body.agentId ? MOCK_USERS.find((u) => u.id === body.agentId) : null;

  const fromTeamName = t.assignedTeamName;
  const fromUserName = t.assignedToName;

  t.assignedTeamId = body.teamId;
  t.assignedTeamName = team?.name;
  t.assignedToId = body.agentId;
  t.assignedToName = agent?.username;
  t.status = 'FORWARDED';
  t.updatedAt = new Date().toISOString();

  const acts = MOCK_ACTIVITIES[t.id] ?? (MOCK_ACTIVITIES[t.id] = []);
  acts.push({
    id: `act_${Math.random().toString(36).slice(2, 8)}`,
    ticketId: t.id,
    type: 'FORWARDED',
    performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
    timestamp: new Date().toISOString(),
    fromTeamName,
    toTeamName: team?.name,
    fromUserName,
    toUserName: agent?.username,
  });

  return HttpResponse.json(t);
}),

http.post(`${API}/tickets/:id/escalate/`, async ({ params, request }) => {
  await delay(400);
  const body = (await request.json()) as { teamId: string; agentId?: string };

  const t = mockTickets.find((x) => x.id === params.id);
  if (!t) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });

  const team = MOCK_TEAMS.find((x) => x.id === body.teamId);
  const agent = body.agentId ? MOCK_USERS.find((u) => u.id === body.agentId) : null;

  const fromLevel = t.level ?? 'L1';
  const toLevel = team?.level ?? 'L2';

  const fromTeamName = t.assignedTeamName;
  const fromUserName = t.assignedToName;

  t.level = toLevel;
  t.assignedTeamId = body.teamId;
  t.assignedTeamName = team?.name;
  t.assignedToId = body.agentId;
  t.assignedToName = agent?.username;
  t.status = 'ESCALATED';
  t.updatedAt = new Date().toISOString();

  const acts = MOCK_ACTIVITIES[t.id] ?? (MOCK_ACTIVITIES[t.id] = []);
  acts.push({
    id: `act_${Math.random().toString(36).slice(2, 8)}`,
    ticketId: t.id,
    type: 'ESCALATED',
    performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
    timestamp: new Date().toISOString(),
    fromLevel,
    toLevel,
    fromTeamName,
    toTeamName: team?.name,
    fromUserName,
    toUserName: agent?.username,
  });

  return HttpResponse.json(t);
}),

http.post(`${API}/tickets/:id/resolve/`, async ({ params }) => {
  await delay(300);
  const t = mockTickets.find((x) => x.id === params.id);
  if (!t) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });

  t.status = 'RESOLVED';
  t.resolvedAt = new Date().toISOString();
  t.updatedAt = new Date().toISOString();

  const acts = MOCK_ACTIVITIES[t.id] ?? (MOCK_ACTIVITIES[t.id] = []);
  acts.push({
    id: `act_${Math.random().toString(36).slice(2, 8)}`,
    ticketId: t.id,
    type: 'RESOLVED',
    performedBy: { id: 'agent_ram', username: 'ram', role: 'agent' },
    timestamp: new Date().toISOString(),
  });

  return HttpResponse.json(t);
  }),

  // http.post(`${API}/tickets/:id/reopen/`, async ({ params }) => {
  //   await delay(300);
  //   const t = mockTickets.find((x) => x.id === params.id);
  //   if (!t) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });

  //   t.status = 'REOPENED';
  //   t.resolvedAt = undefined;
  //   t.updatedAt = new Date().toISOString();

  //   const acts = MOCK_ACTIVITIES[t.id] ?? (MOCK_ACTIVITIES[t.id] = []);
  //   acts.push({
  //     id: `act_${Math.random().toString(36).slice(2, 8)}`,
  //     ticketId: t.id,
  //     type: 'REOPENED',
  //     performedBy: { id: 'usr_self', username: 'sita', role: 'staff' },
  //     timestamp: new Date().toISOString(),
  //   });

  //   return HttpResponse.json(t);
  // }),

  http.get(`${API}/tickets/assigned-to-me/`, async () => {
  await delay(350);

  const CURRENT_AGENT_ID = 'agent_ram';
  const CURRENT_AGENT_TEAM = 'team_net_l1';
  const CURRENT_AGENT_LEVEL = 'L1';

  const isMine = (t: Ticket) => {
    // Ticket must be at the agent's level — this is the key filter
    if (t.level !== CURRENT_AGENT_LEVEL) return false;

    // Then it must be directly assigned to them OR to their team
    return (
      t.assignedToId === CURRENT_AGENT_ID ||
      t.assignedTeamId === CURRENT_AGENT_TEAM
    );
  };

  const mine = mockTickets.filter(isMine);

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const resolvedToday = mine.filter(
    (t) => t.resolvedAt && new Date(t.resolvedAt).getTime() > oneDayAgo
  ).length;

  return HttpResponse.json({
    count: mine.length,
    results: mine,
    stats: {
      total: mine.length,
      inProgress: mine.filter((t) => t.status === 'INPROCESS').length,
      resolvedToday,
      escalated: mine.filter((t) => t.status === 'ESCALATED').length,
      forwarded: mine.filter((t) => t.status === 'FORWARDED').length,
      overdue: 0,
    },
  });
  }),

  // ── Get single ticket ─────────────────────────────
  http.get(`${API}/tickets/:id/`, async ({ params }) => {
    await delay(200);
    const { id } = params;
    const ticket = mockTickets.find((t) => t.id === id);
    if (!ticket) {
      return HttpResponse.json({ detail: 'Ticket not found' }, { status: 404 });
    }
    return HttpResponse.json(ticket);
  }),
];
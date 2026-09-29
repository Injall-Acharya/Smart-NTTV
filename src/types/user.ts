import type { TeamLevel } from './team'

export type UserRole = 'admin' | 'staff' | 'agent';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  level?: TeamLevel;       // agents only
  teamId?: string;          // agents only
  teamName?: string;        //agents in a team only
  isActive: boolean;
  createdAt: string;        
}

/* For embedding in other entities (ticket creator, activity performer, etc.) */
export interface UserSummary {
  id: string;
  username: string;
  role: UserRole;
}
import type { UserSummary } from './user';

export type TeamLevel = 'L1' | 'L2' | 'L3';

export interface Team {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  level: TeamLevel;
  members: UserSummary[];
  memberCount: number;
}
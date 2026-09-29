import type { User } from './user';

export interface LoginResponse {
  access: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
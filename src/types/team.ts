import { User } from './user';

export interface TeamUser {
  id: number;
  name: string;
  email: string;
  role?: string; // Role within the team (e.g., "closer", "pre-sales")
  profile_photo_url?: string | null;
  pivot?: {
    team_id: number;
    user_id: number;
    role: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  manager_user_id: number;
  manager: User;
  users: TeamUser[];
  created_at: string;
  updated_at: string;
}

export interface TeamFormData {
  name: string;
  description: string | null;
  manager_user_id: number | null;
  users: { id: number; role?: string }[];
}

export interface TeamFilters {
  search: string;
}

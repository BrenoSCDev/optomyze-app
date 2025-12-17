export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  phone: string;
  phone_secondary?: string | null;
  role: string;
  status?: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  profile_photo_url: string | null;
  profile_pic: string | null;
  avatar?: string | null;
  background_image_url: string | null;
  title?: string | null;
  department_id?: number | null;
  department?: any | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export type ViewMode = 'grid' | 'table';

// Helper to normalize API response to User type
export function normalizeUser(apiUser: any): User {
  return {
    ...apiUser,
    is_active: apiUser.is_active ?? (apiUser.status === 'active'),
    profile_pic: apiUser.profile_pic ?? apiUser.avatar ?? null,
  };
}
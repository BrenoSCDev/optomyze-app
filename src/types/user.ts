export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  phone: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  profile_photo_url: string | null;
  profile_pic: string | null;
  background_image_url: string | null;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export type ViewMode = 'grid' | 'table';
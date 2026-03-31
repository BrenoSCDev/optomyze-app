import api from './api';

export interface Permission {
  key: string;
  group: string;
  description: string;
}

export type PermissionGroups = Record<string, Permission[]>;
export type RolePermissions = Record<string, string[]>;

export const roleApi = {
  async getPermissions(): Promise<PermissionGroups> {
    const res = await api.get('/api/permissions');
    return res.data;
  },

  async getRoles(): Promise<RolePermissions> {
    const res = await api.get('/api/roles');
    return res.data;
  },

  async updateRolePermissions(role: string, permissions: string[]): Promise<string[]> {
    const res = await api.put(`/api/roles/${role}/permissions`, { permissions });
    return res.data;
  },
};

// Ordered group display
export const PERMISSION_GROUP_ORDER = [
  'menu', 'leads', 'deals', 'products',
  'users', 'teams', 'roles',
  'funnels', 'tags', 'companies',
  'integrations', 'calendar', 'chat',
  'reports', 'sales', 'search',
];

export const SYSTEM_ROLES = ['admin', 'manager', 'agent'];

export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-500 border-red-500/30',
  manager: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  agent: 'bg-green-500/15 text-green-500 border-green-500/30',
};

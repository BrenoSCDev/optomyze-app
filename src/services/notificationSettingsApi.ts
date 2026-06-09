// Notification Settings Types - Aligned with API payload
import api from './api';

// API Response Types (matching backend exactly)
export interface NotificationChannels {
  email: boolean;
  whatsapp: boolean;
  in_app: boolean;
}

export interface DefaultRecipients {
  admin: boolean;
  deal_owner: boolean;
  lead_owner: boolean;
  team_manager: boolean;
}

export type NotificationPriority = 'low' | 'normal' | 'high';
export type NotificationChannel = keyof NotificationChannels;

// Events are stored as a Record<string, { enabled, priority }> from API
export interface NotificationEventConfig {
  enabled: boolean;
  priority: NotificationPriority;
}

export type NotificationEvents = Record<string, NotificationEventConfig>;

export interface QuietHoursSettings {
  enabled: boolean;
  from: string | null;
  to: string | null;
}

// Full API response structure
export interface ApiNotificationSettings {
  id: number;
  company_id: number;
  channels: NotificationChannels;
  default_recipients: DefaultRecipients;
  events: NotificationEvents;
  quiet_hours: QuietHoursSettings;
}

// Frontend-normalized structure (camelCase)
export interface NotificationSettings {
  id: number;
  companyId: number;
  channels: NotificationChannels;
  defaultRecipients: DefaultRecipients;
  events: NotificationEvents;
  quietHours: QuietHoursSettings;
}

// Transform API response to frontend format
export const transformApiToFrontend = (data: ApiNotificationSettings): NotificationSettings => ({
  id: data.id,
  companyId: data.company_id,
  channels: data.channels,
  defaultRecipients: data.default_recipients,
  events: data.events,
  quietHours: data.quiet_hours,
});

// API Functions
export const activateNotificationSettings = async (): Promise<NotificationSettings> => {
  const response = await api.post('/api/notification-settings');
  return transformApiToFrontend(response.data);
};

export interface PatchNotificationPayload {
  channels?: Partial<NotificationChannels>;
  default_recipients?: Partial<DefaultRecipients>;
  events?: Record<string, Partial<NotificationEventConfig>>;
  quiet_hours?: Partial<QuietHoursSettings>;
}

export const patchNotificationSettings = async (
  patch: PatchNotificationPayload
): Promise<NotificationSettings> => {
  const response = await api.patch('/api/notification-settings', patch);
  return transformApiToFrontend(response.data);
};

// Mock users for preview section (can be removed when we have real user API)
export const mockUsers = [
  { id: 'user_1', name: 'John Silva', role: 'admin' },
  { id: 'user_2', name: 'Maria Santos', role: 'manager' },
  { id: 'user_3', name: 'Pedro Costa', role: 'sales' },
  { id: 'user_4', name: 'Ana Oliveira', role: 'sales' },
];

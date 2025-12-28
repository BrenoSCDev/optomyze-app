// Notification Settings Types & Mock Data

export interface NotificationChannels {
  email: boolean;
  whatsapp: boolean;
  slack: boolean;
  in_app: boolean;
  push: boolean;
}

export interface DefaultRecipients {
  deal_owner: boolean;
  lead_owner: boolean;
  manager: boolean;
  admin: boolean;
}

export type NotificationPriority = 'low' | 'normal' | 'high';
export type NotificationChannel = 'email' | 'whatsapp' | 'slack' | 'in_app' | 'push';
export type RecipientType = 'deal_owner' | 'lead_owner' | 'manager' | 'admin';

export interface NotificationEvent {
  id: string;
  event: string;
  enabled: boolean;
  channels: NotificationChannel[];
  recipients: RecipientType[];
  priority: NotificationPriority;
}

export interface FrequencySettings {
  groupSimilar: boolean;
  maxPerHour: number;
  delayNonCritical: boolean;
  delayDuration: number;
}

export interface QuietHoursSettings {
  enabled: boolean;
  start: string;
  end: string;
  applyToWeekends: boolean;
  allowCritical: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
}

export interface NotificationSettings {
  channels: NotificationChannels;
  defaultRecipients: DefaultRecipients;
  events: NotificationEvent[];
  frequency: FrequencySettings;
  quietHours: QuietHoursSettings;
  templates: NotificationTemplate[];
}

// Mock event types
export const NOTIFICATION_EVENTS = [
  'lead_created',
  'lead_assigned',
  'deal_created',
  'deal_stage_changed',
  'deal_won',
  'deal_lost',
  'deal_idle',
  'product_added',
  'discount_applied',
] as const;

export type NotificationEventType = typeof NOTIFICATION_EVENTS[number];

// Default mock data
export const defaultNotificationSettings: NotificationSettings = {
  channels: {
    email: true,
    whatsapp: false,
    slack: false,
    in_app: true,
    push: false,
  },
  defaultRecipients: {
    deal_owner: true,
    lead_owner: true,
    manager: false,
    admin: true,
  },
  events: [
    {
      id: 'evt_1',
      event: 'lead_created',
      enabled: true,
      channels: ['in_app'],
      recipients: ['lead_owner', 'manager'],
      priority: 'normal',
    },
    {
      id: 'evt_2',
      event: 'lead_assigned',
      enabled: true,
      channels: ['email', 'in_app'],
      recipients: ['lead_owner'],
      priority: 'normal',
    },
    {
      id: 'evt_3',
      event: 'deal_created',
      enabled: true,
      channels: ['in_app'],
      recipients: ['deal_owner', 'manager'],
      priority: 'normal',
    },
    {
      id: 'evt_4',
      event: 'deal_stage_changed',
      enabled: true,
      channels: ['in_app'],
      recipients: ['deal_owner'],
      priority: 'low',
    },
    {
      id: 'evt_5',
      event: 'deal_won',
      enabled: true,
      channels: ['email', 'in_app'],
      recipients: ['deal_owner', 'manager', 'admin'],
      priority: 'high',
    },
    {
      id: 'evt_6',
      event: 'deal_lost',
      enabled: true,
      channels: ['email', 'in_app'],
      recipients: ['deal_owner', 'manager'],
      priority: 'high',
    },
    {
      id: 'evt_7',
      event: 'deal_idle',
      enabled: false,
      channels: ['in_app'],
      recipients: ['deal_owner'],
      priority: 'low',
    },
    {
      id: 'evt_8',
      event: 'product_added',
      enabled: false,
      channels: ['in_app'],
      recipients: ['deal_owner'],
      priority: 'low',
    },
    {
      id: 'evt_9',
      event: 'discount_applied',
      enabled: true,
      channels: ['in_app'],
      recipients: ['manager', 'admin'],
      priority: 'normal',
    },
  ],
  frequency: {
    groupSimilar: true,
    maxPerHour: 20,
    delayNonCritical: false,
    delayDuration: 15,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    applyToWeekends: true,
    allowCritical: true,
  },
  templates: [
    {
      id: 'tpl_1',
      name: 'Deal Won Email',
      channel: 'email',
      subject: 'Congratulations! Deal {deal_name} was won',
      body: 'Hi {owner_name},\n\nGreat news! The deal "{deal_name}" with {company_name} has been marked as won.\n\nDeal value: {deal_value}\n\nKeep up the great work!',
      variables: ['deal_name', 'owner_name', 'company_name', 'deal_value'],
    },
    {
      id: 'tpl_2',
      name: 'Lead Assigned',
      channel: 'email',
      subject: 'New lead assigned: {lead_name}',
      body: 'Hi {owner_name},\n\nA new lead has been assigned to you:\n\nName: {lead_name}\nEmail: {lead_email}\nPhone: {lead_phone}\n\nPlease follow up within 24 hours.',
      variables: ['lead_name', 'owner_name', 'lead_email', 'lead_phone'],
    },
    {
      id: 'tpl_3',
      name: 'Deal Lost Alert',
      channel: 'in_app',
      body: 'Deal "{deal_name}" was lost. Reason: {loss_reason}',
      variables: ['deal_name', 'loss_reason'],
    },
    {
      id: 'tpl_4',
      name: 'WhatsApp Follow-up',
      channel: 'whatsapp',
      body: 'Olá {contact_name}! Seguindo nossa conversa sobre {deal_name}. Podemos agendar uma reunião?',
      variables: ['contact_name', 'deal_name'],
    },
  ],
};

// Mock users for testing
export const mockUsers = [
  { id: 'user_1', name: 'John Silva', role: 'admin' },
  { id: 'user_2', name: 'Maria Santos', role: 'manager' },
  { id: 'user_3', name: 'Pedro Costa', role: 'sales' },
  { id: 'user_4', name: 'Ana Oliveira', role: 'sales' },
];

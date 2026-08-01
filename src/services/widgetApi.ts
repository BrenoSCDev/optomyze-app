/**
 * WIDGETS API
 *
 * Client for the embeddable-widget engine. Every widget type shares this
 * endpoint surface — `type` selects the behaviour and `config` carries the
 * type-specific schema — so new widget types need no new service code.
 */

import api from './api';

export type WidgetType = 'form' | 'chat';
export type WidgetStatus = 'active' | 'disabled';

export type FormFieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'date';
export type FormFieldSource = 'lead' | 'custom';

/** Built-in lead fields a form widget can collect. */
export const LEAD_FIELD_KEYS = ['name', 'email', 'phone'] as const;

/** Icons the embed script knows how to draw — keep in sync with public/widgets/form.js. */
export const WIDGET_ICONS = [
  'message-circle', 'mail', 'user', 'phone', 'calendar',
  'star', 'rocket', 'heart', 'sparkles', 'briefcase',
] as const;

export type WidgetIcon = typeof WIDGET_ICONS[number];

/** How the widget presents itself on the customer's page. */
export type WidgetDisplayMode = 'inline' | 'collapsible' | 'floating';
export type WidgetPosition = 'bottom-right' | 'bottom-left';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  key: string;
  source: FormFieldSource;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  help_text?: string;
  required: boolean;
  enabled: boolean;
  order?: number;
  options?: FormFieldOption[];
  validation?: {
    min?: number | null;
    max?: number | null;
    max_length?: number | null;
  };
}

export interface FormWidgetConfig {
  theme: {
    primary_color: string;
    icon: WidgetIcon;
    display: WidgetDisplayMode;
    launcher_text: string;
    position: WidgetPosition;
  };
  content: {
    title: string;
    description: string;
    submit_text: string;
    success_message: string;
  };
  fields: FormField[];
  mapping: {
    funnel_id: number | null;
    stage_id: number | null;
  };
  spam?: {
    honeypot?: boolean;
    min_submit_seconds?: number;
    captcha?: { provider: string };
  };
}

export interface Widget {
  id: number;
  public_id: string;
  type: WidgetType;
  name: string;
  status: WidgetStatus;
  allowed_domains: string[];
  config: FormWidgetConfig | ChatWidgetConfig;
  submissions_count: number;
  last_submission_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** ── Chat widget ─────────────────────────────────────────────────────── */

export type ChatIdentificationMode = 'none' | 'basic' | 'full';
export type ChatFieldState = 'required' | 'optional' | 'hidden';

/** Fields each identification mode offers — mirrors ChatWidgetType::MODE_FIELDS. */
export const CHAT_MODE_FIELDS: Record<ChatIdentificationMode, ('name' | 'email' | 'phone')[]> = {
  none: [],
  basic: ['name', 'email'],
  full: ['name', 'email', 'phone'],
};

export interface ChatWidgetConfig {
  theme: {
    primary_color: string;
    icon: WidgetIcon;
    position: WidgetPosition;
    launcher_text: string;
  };
  content: {
    header_title: string;
    header_subtitle: string;
    welcome_message: string;
    online_text: string;
    offline_text: string;
    input_placeholder: string;
  };
  branding: {
    agent_avatar_url: string | null;
    company_logo_url: string | null;
  };
  identification: {
    mode: ChatIdentificationMode;
    fields: Record<'name' | 'email' | 'phone', ChatFieldState>;
    intro: string;
    submit_text: string;
  };
  mapping: {
    funnel_id: number | null;
    stage_id: number | null;
    assigned_user_id: number | null;
    assigned_team_id: number | null;
  };
  behavior: {
    auto_open_delay: number;
    remember_state: boolean;
  };
}

export interface WidgetOptionsFunnel {
  id: number;
  name: string;
  stages: { id: number; name: string; type: string }[];
}

export interface WidgetOptions {
  funnels: WidgetOptionsFunnel[];
  users: { id: number; name: string }[];
  embed_base_url: string;
}

export interface WidgetPayload {
  name: string;
  type?: WidgetType;
  status?: WidgetStatus;
  allowed_domains: string[];
  config: FormWidgetConfig | ChatWidgetConfig;
}

export const fetchWidgets = async (type?: WidgetType): Promise<Widget[]> => {
  const response = await api.get('/api/widgets', { params: type ? { type } : undefined });
  return response.data.data;
};

export const fetchWidgetOptions = async (): Promise<WidgetOptions> => {
  const response = await api.get('/api/widgets/options');
  return response.data;
};

export const createWidget = async (payload: WidgetPayload): Promise<Widget> => {
  const response = await api.post('/api/widgets', payload);
  return response.data.data;
};

export const updateWidget = async (id: number, payload: WidgetPayload): Promise<Widget> => {
  const response = await api.put(`/api/widgets/${id}`, payload);
  return response.data.data;
};

export const deleteWidget = async (id: number): Promise<void> => {
  await api.delete(`/api/widgets/${id}`);
};

export const duplicateWidget = async (id: number): Promise<Widget> => {
  const response = await api.post(`/api/widgets/${id}/duplicate`);
  return response.data.data;
};

export const updateWidgetStatus = async (id: number, status: WidgetStatus): Promise<Widget> => {
  const response = await api.patch(`/api/widgets/${id}/status`, { status });
  return response.data.data;
};

export const regenerateWidgetPublicId = async (id: number): Promise<Widget> => {
  const response = await api.post(`/api/widgets/${id}/regenerate-public-id`);
  return response.data.data;
};

/** The snippet the customer pastes into their website. */
export const buildEmbedCode = (widget: Widget, baseUrl: string): string => {
  const origin = (baseUrl || '').replace(/\/$/, '');
  const isChat = widget.type === 'chat';

  return [
    `<script src="${origin}/widgets/${isChat ? 'chat' : 'form'}.js" async></script>`,
    '',
    '<div',
    `  data-widget-id="${widget.public_id}"`,
    `  id="crm-${isChat ? 'chat' : 'form'}-widget">`,
    '</div>',
  ].join('\n');
};

/**
 * Translator signature used to seed a new widget with copy in the CRM's
 * selected language — the customer's visitors read these strings, so they
 * should not default to English for a Portuguese or Spanish team.
 */
export type Translate = (key: string) => string;

/** Blank chat config used when creating a chat widget. */
export const defaultChatConfig = (t: Translate): ChatWidgetConfig => ({
  theme: {
    primary_color: '#7C3AED',
    icon: 'message-circle',
    position: 'bottom-right',
    launcher_text: t('widgets.defaults.chat.launcher-text'),
  },
  content: {
    header_title: t('widgets.defaults.chat.header-title'),
    header_subtitle: t('widgets.defaults.chat.header-subtitle'),
    welcome_message: t('widgets.defaults.chat.welcome-message'),
    online_text: t('widgets.defaults.chat.online-text'),
    offline_text: t('widgets.defaults.chat.offline-text'),
    input_placeholder: t('widgets.defaults.chat.input-placeholder'),
  },
  branding: {
    agent_avatar_url: null,
    company_logo_url: null,
  },
  identification: {
    mode: 'basic',
    fields: { name: 'required', email: 'required', phone: 'hidden' },
    intro: t('widgets.defaults.chat.identification-intro'),
    submit_text: t('widgets.defaults.chat.identification-submit'),
  },
  mapping: { funnel_id: null, stage_id: null, assigned_user_id: null, assigned_team_id: null },
  behavior: { auto_open_delay: 0, remember_state: true },
});

/** Blank form config used when creating a widget. */
export const defaultFormConfig = (t: Translate): FormWidgetConfig => ({
  theme: {
    primary_color: '#7C3AED',
    icon: 'message-circle',
    display: 'inline',
    launcher_text: t('widgets.defaults.form.launcher-text'),
    position: 'bottom-right',
  },
  content: {
    title: t('widgets.defaults.form.title'),
    description: t('widgets.defaults.form.description'),
    submit_text: t('widgets.defaults.form.submit-text'),
    success_message: t('widgets.defaults.form.success-message'),
  },
  fields: [
    {
      key: 'name', source: 'lead', type: 'text',
      label: t('widgets.defaults.field.name-label'),
      placeholder: t('widgets.defaults.field.name-placeholder'),
      required: true, enabled: true,
    },
    {
      key: 'email', source: 'lead', type: 'text',
      label: t('widgets.defaults.field.email-label'),
      placeholder: t('widgets.defaults.field.email-placeholder'),
      required: true, enabled: true,
    },
    {
      key: 'phone', source: 'lead', type: 'text',
      label: t('widgets.defaults.field.phone-label'),
      placeholder: t('widgets.defaults.field.phone-placeholder'),
      required: false, enabled: true,
    },
  ],
  mapping: { funnel_id: null, stage_id: null },
  spam: { honeypot: true, min_submit_seconds: 2, captcha: { provider: 'none' } },
});

// Funnel Settings Types & API Service

// Stage Types
export type TemplateStageType = 'entry' | 'normal' | 'service' | 'proposition' | 'qualified' | 'conversion' | 'lost';

// Entry requirement from API (for template stages)
export interface StageEntryRequirement {
  id: number;
  stage_id: number;
  require_assigned_owner: boolean;
  require_contact_email: boolean;
  require_phone_number: boolean;
  require_at_least_one_product: boolean;
  require_deal_value: boolean;
  require_recent_activity: boolean;
  created_at: string;
  updated_at: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  description?: string;
  type: 'lead' | 'deal';
  templateType?: TemplateStageType;
  order: number;
  probability: number;
  color: string;
  isFinalStage: boolean;
  finalType?: 'won' | 'lost';
  allowBackward: boolean;
  entryRules: StageEntryRules;
  actions: StageAction[];
  // API returns entry_requirement for template stages
  entry_requirement?: StageEntryRequirement;
}

export interface StageEntryRules {
  requireAssignedOwner: boolean;
  requireCompanyLinked: boolean;
  requireContactEmail: boolean;
  requirePhoneNumber: boolean;
  requireAtLeastOneProduct: boolean;
  requireDealValue: boolean;
  requireExpectedCloseDate: boolean;
  requireLastActivityDays: number | null;
}

export interface StageAction {
  id: string;
  type: 'create-task' | 'send-notification' | 'send-email' | 'send-whatsapp' | 'assign-owner' | 'add-tag' | 'set-expected-close' | 'update-custom-field';
  enabled: boolean;
  order: number;
  config: Record<string, any>;
}

// Funnel Types
export interface Funnel {
  id: string;
  name: string;
  type?: 'regular' | 'model'; // 'model' = template funnel
  isDefault: boolean;
  appliesTo: 'leads' | 'deals' | 'both';
  stages: FunnelStage[];
}

// Funnel Stage with template support
export interface FunnelStageCreate extends Omit<FunnelStage, 'id'> {
  template_type?: 'model'; // Used when creating stages in model funnels
}

// Automated Transition Types
export interface AutomatedTransition {
  id: string;
  trigger: 'lead-created' | 'deal-created' | 'product-added' | 'proposal-sent' | 'message-replied' | 'no-response' | 'manual-override';
  sourceStageId: string;
  targetStageId: string;
  delay: { type: 'immediate' | 'hours' | 'days'; value: number };
  enabled: boolean;
}

// Inactivity Rules
export interface InactivityRules {
  idleLeadAlertDays: number;
  idleDealAlertDays: number;
  autoMoveToCold: boolean;
  coldStageId: string;
  autoAssignFollowUpTask: boolean;
  notifyOwnerOnIdle: boolean;
  notifyManagerOnIdle: boolean;
}

// Notification Event Types
export interface NotificationEvent {
  id: string;
  event: 'lead-enters-stage' | 'deal-enters-stage' | 'deal-won' | 'deal-lost' | 'deal-idle' | 'deal-value-changes' | 'discount-applied';
  stageId?: string;
  enabled: boolean;
  recipients: {
    dealOwner: boolean;
    teamManager: boolean;
    admin: boolean;
    customUserIds: string[];
  };
  channels: {
    email: boolean;
    whatsapp: boolean;
    slack: boolean;
  };
  templateId: string;
}

// Lead Automation Rules
export interface LeadAutomationRule {
  id: string;
  type: 'auto-assign-owner' | 'auto-assign-pipeline' | 'auto-tag' | 'auto-convert';
  enabled: boolean;
  config: Record<string, any>;
}

// Lead to Deal Conversion Settings
export interface ConversionSettings {
  allowManualConversion: boolean;
  autoConvertAtStageId: string;
  defaultDealStageId: string;
  defaultDealOwnerId: string;
  copyLeadActivities: boolean;
  copyLeadTags: boolean;
}

// Loss Handling Settings
export interface LossHandlingSettings {
  lossReasons: string[];
  requireLossReason: boolean;
  autoNotifyManagerOnLoss: boolean;
  autoCreateFollowUpLead: boolean;
  cooldownDays: number;
}

// Complete Funnel Settings
export interface FunnelSettings {
  funnels: Funnel[];
  automatedTransitions: AutomatedTransition[];
  inactivityRules: InactivityRules;
  notificationEvents: NotificationEvent[];
  leadAutomationRules: LeadAutomationRule[];
  conversionSettings: ConversionSettings;
  lossHandlingSettings: LossHandlingSettings;
}

// Default empty stage entry rules
export const defaultStageEntryRules: StageEntryRules = {
  requireAssignedOwner: false,
  requireCompanyLinked: false,
  requireContactEmail: false,
  requirePhoneNumber: false,
  requireAtLeastOneProduct: false,
  requireDealValue: false,
  requireExpectedCloseDate: false,
  requireLastActivityDays: null,
};

// Default settings
export const defaultFunnelSettings: FunnelSettings = {
  funnels: [
    {
      id: 'default-funnel',
      name: 'Default Sales Funnel',
      type: 'regular',
      isDefault: true,
      appliesTo: 'both',
      stages: [
        { id: 'stage-1', name: 'New', type: 'lead', order: 1, probability: 10, color: '#3b82f6', isFinalStage: false, allowBackward: true, entryRules: defaultStageEntryRules, actions: [] },
        { id: 'stage-2', name: 'Qualified', type: 'lead', order: 2, probability: 25, color: '#8b5cf6', isFinalStage: false, allowBackward: true, entryRules: defaultStageEntryRules, actions: [] },
        { id: 'stage-3', name: 'Proposal', type: 'deal', order: 3, probability: 50, color: '#f59e0b', isFinalStage: false, allowBackward: true, entryRules: defaultStageEntryRules, actions: [] },
        { id: 'stage-4', name: 'Negotiation', type: 'deal', order: 4, probability: 75, color: '#10b981', isFinalStage: false, allowBackward: true, entryRules: defaultStageEntryRules, actions: [] },
        { id: 'stage-5', name: 'Won', type: 'deal', order: 5, probability: 100, color: '#22c55e', isFinalStage: true, finalType: 'won', allowBackward: false, entryRules: defaultStageEntryRules, actions: [] },
        { id: 'stage-6', name: 'Lost', type: 'deal', order: 6, probability: 0, color: '#ef4444', isFinalStage: true, finalType: 'lost', allowBackward: false, entryRules: defaultStageEntryRules, actions: [] },
      ],
    },
  ],
  automatedTransitions: [],
  inactivityRules: {
    idleLeadAlertDays: 3,
    idleDealAlertDays: 7,
    autoMoveToCold: false,
    coldStageId: '',
    autoAssignFollowUpTask: true,
    notifyOwnerOnIdle: true,
    notifyManagerOnIdle: false,
  },
  notificationEvents: [],
  leadAutomationRules: [],
  conversionSettings: {
    allowManualConversion: true,
    autoConvertAtStageId: '',
    defaultDealStageId: '',
    defaultDealOwnerId: '',
    copyLeadActivities: true,
    copyLeadTags: true,
  },
  lossHandlingSettings: {
    lossReasons: ['Budget constraints', 'Chose competitor', 'No response', 'Project cancelled', 'Timing not right', 'Other'],
    requireLossReason: true,
    autoNotifyManagerOnLoss: true,
    autoCreateFollowUpLead: false,
    cooldownDays: 30,
  },
};

export const STAGE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export const TRIGGER_TYPES = [
  { value: 'lead-created', label: 'Lead Created' },
  { value: 'deal-created', label: 'Deal Created' },
  { value: 'product-added', label: 'Product Added to Deal' },
  { value: 'proposal-sent', label: 'Proposal Sent' },
  { value: 'message-replied', label: 'Message Replied' },
  { value: 'no-response', label: 'No Response for X Days' },
  { value: 'manual-override', label: 'Manual Override' },
];

export const ACTION_TYPES = [
  { value: 'create-task', label: 'Create Task' },
  { value: 'send-notification', label: 'Send Internal Notification' },
  { value: 'send-email', label: 'Send Email' },
  { value: 'send-whatsapp', label: 'Send WhatsApp Message' },
  { value: 'assign-owner', label: 'Assign Owner' },
  { value: 'add-tag', label: 'Add Tag' },
  { value: 'set-expected-close', label: 'Set Expected Close Date' },
  { value: 'update-custom-field', label: 'Update Custom Field' },
];

export const EVENT_TYPES = [
  { value: 'lead-enters-stage', label: 'Lead Enters Stage' },
  { value: 'deal-enters-stage', label: 'Deal Enters Stage' },
  { value: 'deal-won', label: 'Deal is Won' },
  { value: 'deal-lost', label: 'Deal is Lost' },
  { value: 'deal-idle', label: 'Deal is Idle' },
  { value: 'deal-value-changes', label: 'Deal Value Changes' },
  { value: 'discount-applied', label: 'Discount Applied' },
];

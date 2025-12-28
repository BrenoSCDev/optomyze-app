import api from './api';

export interface CustomField {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  required: boolean;
  defaultValue: string;
  applyTo: 'all' | 'services' | 'physical';
}

export interface PricingRules {
  allowPriceOverride: boolean;
  maxDiscountPercent: number;
  defaultDiscountType: 'percentage' | 'fixed';
  minDealValue: number;
}

export interface ProductSettings {
  default_type: 'service' | 'physical';
  lock_type: boolean;
  default_pricing_model: 'fixed' | 'recurring' | 'hourly' | 'per-unit';
  default_currency: string;
  auto_sku: boolean;
  sku_format: string;
  default_status: 'active' | 'draft';
  default_custom_fields: CustomField[];
  pricing_rules: PricingRules;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
}

export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStage[];
}

export interface DealDefaults {
  defaultOwnerId: string;
  autoAssign: 'manual' | 'round-robin' | 'by-source';
  defaultCurrency: string;
  autoCalculateValue: boolean;
  lockManualValue: boolean;
}

export interface DealRules {
  allowDealsWithoutProducts: boolean;
  requireProductForProposal: boolean;
  requirePricingForNegotiation: boolean;
  lockProductsAfterWon: boolean;
}

export interface Commissions {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  base: 'deal-total' | 'product-value';
  defaultRate: number;
  allowPerProductOverride: boolean;
  allowSplitCommissions: boolean;
}

export interface Notifications {
  notifyOnDealWon: boolean;
  notifyRecipients: ('deal-owner' | 'team-manager' | 'admin')[];
  channels: {
    email: boolean;
    whatsapp: boolean;
    slack: boolean;
  };
}

export interface Automations {
  autoCreateFollowUp: boolean;
  idleDealAlertDays: number;
  autoSetExpectedClose: boolean;
}

export interface SalesPermissions {
  canCreateProducts: string[];
  canEditPrices: string[];
  canApplyDiscounts: string[];
  canViewCommissions: string[];
}

export interface SalesSettings {
  pipelines: Pipeline[];
  deal_defaults: DealDefaults;
  deal_rules: DealRules;
  commissions: Commissions;
  notifications: Notifications;
  automations: Automations;
  permissions: SalesPermissions;
}

export interface SettingsPanel {
  product_settings: ProductSettings;
  sales_settings: SalesSettings;
}

const defaultProductSettings: ProductSettings = {
  default_type: 'service',
  lock_type: false,
  default_pricing_model: 'fixed',
  default_currency: 'USD',
  auto_sku: false,
  sku_format: 'SRV-{0001}',
  default_status: 'active',
  default_custom_fields: [],
  pricing_rules: {
    allowPriceOverride: true,
    maxDiscountPercent: 20,
    defaultDiscountType: 'percentage',
    minDealValue: 0,
  },
};

const defaultSalesSettings: SalesSettings = {
  pipelines: [],
  deal_defaults: {
    defaultOwnerId: '',
    autoAssign: 'manual',
    defaultCurrency: 'USD',
    autoCalculateValue: true,
    lockManualValue: false,
  },
  deal_rules: {
    allowDealsWithoutProducts: true,
    requireProductForProposal: false,
    requirePricingForNegotiation: false,
    lockProductsAfterWon: true,
  },
  commissions: {
    enabled: false,
    type: 'percentage',
    base: 'deal-total',
    defaultRate: 10,
    allowPerProductOverride: false,
    allowSplitCommissions: false,
  },
  notifications: {
    notifyOnDealWon: true,
    notifyRecipients: ['deal-owner'],
    channels: {
      email: true,
      whatsapp: false,
      slack: false,
    },
  },
  automations: {
    autoCreateFollowUp: false,
    idleDealAlertDays: 7,
    autoSetExpectedClose: false,
  },
  permissions: {
    canCreateProducts: ['admin'],
    canEditPrices: ['admin'],
    canApplyDiscounts: ['admin', 'sales'],
    canViewCommissions: ['admin'],
  },
};

export const defaultSettings: SettingsPanel = {
  product_settings: defaultProductSettings,
  sales_settings: defaultSalesSettings,
};

export const getSettings = async (): Promise<SettingsPanel> => {
  try {
    const response = await api.get('/api/settings-panel');
    return response.data;
  } catch (error) {
    console.warn('Failed to load settings, using defaults:', error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: SettingsPanel): Promise<SettingsPanel> => {
  const response = await api.put('/api/settings-panel', settings);
  return response.data;
};

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
];

export const ROLES = [
  { id: 'admin', name: 'Admin' },
  { id: 'manager', name: 'Manager' },
  { id: 'sales', name: 'Sales' },
  { id: 'support', name: 'Support' },
];

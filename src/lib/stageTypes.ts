// Stage type definitions based on funnel type
// Shared types: entry, normal, qualified, lost, conversion
// Sales-oriented: service, proposition
// Deal-oriented: negotiation, approval, contract, won, on_hold

interface StageTypeOption {
  value: string;
  label: string;
}

// Shared stage types (available for both sale and deal funnels)
const SHARED_STAGE_TYPES: StageTypeOption[] = [
  { value: 'entry', label: 'Entry' },
  { value: 'normal', label: 'Normal' },
  { value: 'lost', label: 'Lost' },
];

// Sales-oriented stage types
const SALES_STAGE_TYPES: StageTypeOption[] = [
  { value: 'qualified', label: 'Qualified' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'service', label: 'Service' },
  { value: 'proposition', label: 'Proposition' },
];

// Deal-oriented stage types
const DEAL_STAGE_TYPES: StageTypeOption[] = [
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'approval', label: 'Approval' },
  { value: 'contract', label: 'Contract' },
  { value: 'won', label: 'Won' },
  { value: 'on_hold', label: 'On Hold' },
];

// Get stage types based on funnel type
export const getStageTypesForFunnel = (funnelType: 'contact' | 'deal'): StageTypeOption[] => {
  if (funnelType === 'deal') {
    return [...SHARED_STAGE_TYPES, ...DEAL_STAGE_TYPES];
  }
  return [...SHARED_STAGE_TYPES, ...SALES_STAGE_TYPES];
};

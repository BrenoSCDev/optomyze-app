/**
 * LEAD COMPANY TYPE DEFINITIONS
 * 
 * Type definitions for B2B company management in the CRM
 */

export interface LeadCompany {
  id: number;
  // Identification
  legal_name: string;
  trade_name: string;
  tax_id?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  // Contact
  email?: string;
  phone?: string;
  secondary_phone?: string;
  // Address
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  // CRM
  source?: string;
  status: 'prospect' | 'lead' | 'customer' | 'partner' | 'inactive';
  notes?: string;
  // Assets
  logo_path?: string | null;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface LeadCompanyFormData {
  legal_name: string;
  trade_name: string;
  tax_id?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  source?: string;
  status: 'prospect' | 'lead' | 'customer' | 'partner' | 'inactive';
  notes?: string;
  logo?: File | null;
}

export interface LeadCompanyFilters {
  search: string;
  industry: string;
  status: string;
  city: string;
  state: string;
  country: string;
  hasLogo: 'all' | 'yes' | 'no';
}

export const COMPANY_STATUSES = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'lead', label: 'Lead' },
  { value: 'customer', label: 'Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1001+ employees' },
] as const;

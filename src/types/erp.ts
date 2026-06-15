/**
 * ERP TYPES
 * 
 * Type definitions for ERP integration
 */

export interface ERPProduct {
  id: number;
  name: string;
  sku: string;
  type: string;
  base_price: number;
  description: string | null;
  is_active: boolean;
}

export interface ERPUnit {
  id: number;
  name: string;
}

export interface ERPPaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ERPProductsResponse {
  products: ERPPaginatedResponse<ERPProduct>;
  units: ERPPaginatedResponse<ERPUnit>;
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface QuoteItem {
  id: string;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total: number;
  description?: string;
}

export interface Quote {
  customer_name: string;
  unit_id: number | null;
  status: QuoteStatus;
  discount: number;
  notes: string;
  valid_until: Date | null;
  items: QuoteItem[];
  subtotal: number;
  total: number;
}

// ERP Budget Request
export interface ERPBudgetItemRequest {
  product_id: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface ERPBudgetRequest {
  company_id: number;
  name: string;
  email: string;
  phone: string;
  unit_id: number;
  status: QuoteStatus;
  discount: number;
  valid_until: string | null;
  notes: string;
  items: ERPBudgetItemRequest[];
}

// ERP Budget Response
export interface ERPBudgetItemResponse {
  id: number;
  product_id: number;
  description: string;
  quantity: number;
  unit_price: string;
  total: string;
}

export interface ERPBudgetResponse {
  id: number;
  customer_id: number;
  company_id: number;
  unit_id: number;
  status: QuoteStatus;
  discount: string;
  valid_until: string | null;
  notes: string | null;
  total: string;
  created_at: string;
  updated_at: string;
  items: ERPBudgetItemResponse[];
}

// CRM Budget (linked to lead)
export interface CRMBudget {
  id: number;
  lead_id: number;
  erp_budget_id: number;
  erp_budget_data: ERPBudgetResponse;
  created_at: string;
  updated_at: string;
}

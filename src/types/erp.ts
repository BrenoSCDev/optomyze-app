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
  category: string;
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

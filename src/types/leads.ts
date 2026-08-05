/**
 * LEADS TYPE DEFINITIONS
 *
 * Comprehensive type definitions for the leads management system
 */

import { Tag } from './tags';

export type SourcePlatform =
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'meta_ads'
  | 'google_ads'
  | 'telegram'
  | 'phone'
  | 'sms'
  | 'email'
  | 'website'
  | 'api'
  | 'calendar'
  | 'other';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  score: number;
  value: number;
  source: SourcePlatform;
  tags: Tag[];
  lastActivity: string;
  priority: 'high' | 'medium' | 'low';
  stage: string;
  avatar?: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
}

/** Order a single board column is loaded in — resolved server-side. */
export type StageSort = 'newest' | 'oldest';

export interface KanbanColumn {
  id: string;
  title: string;
  /** Only the pages fetched so far; `total` is the stage's real size. */
  leads: Lead[];
  color?: string;
  total?: number;
  hasMore?: boolean;
}

export interface LeadFilter {
  scoreRange: [number, number];
  valueRange: [number, number];
  tags: string[];
  sources: string[];
  assignedTo: string[];
  dateRange: {
    start: string;
    end: string;
  };
  lastActivity: string;
}

export interface SalesFunnel {
  id: string;
  name: string;
  totalLeads: number;
  columns: KanbanColumn[];
}
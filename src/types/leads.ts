/**
 * LEADS TYPE DEFINITIONS
 * 
 * Comprehensive type definitions for the leads management system
 */

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  // company: string;
  // title: string;
  score: number;
  value: number;
  source: 'Meta Ads' | 'Google Ads' | 'Organic' | 'Referral' | 'Direct';
  tags: (string | { id: number; name: string; [key: string]: any })[];
  lastActivity: string;
  priority: 'high' | 'medium' | 'low';
  stage: string;
  avatar?: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  leads: Lead[];
  color?: string;
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
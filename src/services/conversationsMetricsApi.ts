/**
 * CONVERSATIONS METRICS API SERVICE
 *
 * Reporting/analytics built on top of ChatSession data.
 */

import api from './api';

export type ConversationsDateRange =
  | 'today' | 'yesterday' | '7_days' | '30_days' | '60_days' | '90_days' | '120_days' | 'full';

export interface ConversationsMetricsFilters {
  period?: ConversationsDateRange;
  agent_id?: number;
  team_id?: number;
  channel?: string;
  channelable_type?: string;
  channelable_id?: number;
  closing_reason_id?: number;
}

export interface ConversationsByAccount {
  channelable_type: string;
  channelable_id: number;
  channel: string;
  count: number;
}

export interface ConversationsByClosingReason {
  name: string;
  outcome: 'won' | 'lost' | 'neutral';
  count: number;
}

export interface ConversationsByAgent {
  agent_id: number;
  agent_name: string;
  count: number;
}

export interface AgentProductivity {
  agent_id: number;
  agent_name: string;
  closed_count: number;
  avg_duration_seconds: number;
  messages_sent: number;
}

export interface ConversationsMetricsData {
  conversations_started: number;
  conversations_closed: number;
  active_conversations: number;
  avg_first_response_time_seconds: number;
  avg_response_time_seconds: number;
  avg_conversation_duration_seconds: number;
  conversion_rate: number;
  resolution_rate: number;
  lead_to_sale_rate: number;
  reopened_conversations: number;
  by_channel: Record<string, number>;
  by_connected_account: ConversationsByAccount[];
  by_closing_reason: ConversationsByClosingReason[];
  by_agent: ConversationsByAgent[];
  agent_productivity: AgentProductivity[];
}

export const fetchConversationsMetrics = async (
  filters: ConversationsMetricsFilters
): Promise<ConversationsMetricsData> => {
  const response = await api.get('/api/conversations-metrics/dashboard', { params: filters });
  return response.data.data;
};

export interface DailyReportData {
  date: string;
  conversations_started: number;
  conversations_closed: number;
  by_closing_reason: Record<string, number>;
  unanswered_conversations: number;
  missed_conversations: number;
}

export const fetchConversationsDailyReport = async (date?: string): Promise<DailyReportData> => {
  const response = await api.get('/api/conversations-metrics/daily-report', { params: { date } });
  return response.data.data;
};

/**
 * AI AGENT API SERVICE
 *
 * CRUD + configuration for native AI Agents (ChatGPT-powered inbox agents).
 */

import api from './api';

export interface AiAgentChannelBinding {
  channelable_type: 'whatsapp_instance' | 'instagram';
  channelable_id: number;
  label: string;
  channel: 'whatsapp' | 'instagram';
}

export interface AiAgent {
  id: number;
  name: string;
  description: string | null;
  status: 'enabled' | 'disabled';
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
  enabled_tools: string[];
  response_delay_seconds: number;
  handover_message: string | null;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  channel_bindings: AiAgentChannelBinding[];
}

export interface AiAgentPayload {
  name: string;
  description?: string | null;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string | null;
  enabled_tools?: string[];
  response_delay_seconds: number;
  handover_message?: string | null;
}

export interface AiAgentTool {
  key: string;
  label: string;
  description: string;
  always_enabled: boolean;
}

export interface ChannelAccount {
  channelable_type: 'whatsapp_instance' | 'instagram';
  channelable_id: number;
  label: string;
  channel: 'whatsapp' | 'instagram';
  bound_agent: { id: number; name: string } | null;
}

export const getAiAgents = async (): Promise<AiAgent[]> => {
  const response = await api.get('/api/ai-agents');
  return response.data;
};

export const createAiAgent = async (payload: AiAgentPayload): Promise<AiAgent> => {
  const response = await api.post('/api/ai-agents', payload);
  return response.data.agent;
};

export const updateAiAgent = async (id: number, payload: AiAgentPayload): Promise<AiAgent> => {
  const response = await api.put(`/api/ai-agents/${id}`, payload);
  return response.data.agent;
};

export const updateAiAgentStatus = async (id: number, status: 'enabled' | 'disabled'): Promise<AiAgent> => {
  const response = await api.put(`/api/ai-agents/${id}/status`, { status });
  return response.data.agent;
};

export const deleteAiAgent = async (id: number): Promise<void> => {
  await api.delete(`/api/ai-agents/${id}`);
};

export const syncAiAgentChannels = async (
  id: number,
  bindings: { channelable_type: string; channelable_id: number }[]
): Promise<AiAgent> => {
  const response = await api.put(`/api/ai-agents/${id}/channels`, { bindings });
  return response.data.agent;
};

export const getAiAgentTools = async (): Promise<AiAgentTool[]> => {
  const response = await api.get('/api/ai-agents/tools');
  return response.data;
};

export const getChannelAccounts = async (): Promise<ChannelAccount[]> => {
  const response = await api.get('/api/ai-agents/channel-accounts');
  return response.data;
};

export const getAiAgentExecutions = async (id: number, page = 1) => {
  const response = await api.get(`/api/ai-agents/${id}/executions`, { params: { page } });
  return response.data;
};

export const getOpenAiModels = async (): Promise<string[]> => {
  const response = await api.get('/api/integrations/openai/models');
  return response.data.models || [];
};

export interface PreviewChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PreviewChatToolCall {
  tool: string;
  arguments: Record<string, unknown>;
  success: boolean;
  simulated: boolean;
}

export interface PreviewChatResult {
  reply: string | null;
  tool_calls: PreviewChatToolCall[];
  handover: boolean;
  handover_message: string | null;
}

/**
 * Sandbox chat against the agent config currently in the form (saved or
 * not). Read-only tools run for real, mutations are simulated.
 */
export const previewAiAgentChat = async (
  config: Omit<AiAgentPayload, 'name' | 'description' | 'response_delay_seconds'> & { name?: string },
  messages: PreviewChatMessage[]
): Promise<PreviewChatResult> => {
  const response = await api.post('/api/ai-agents/preview-chat', { config, messages });
  return response.data;
};

/**
 * LLM PROVIDER API SERVICE
 *
 * One provider-neutral surface for every LLM vendor that can power AI Agents
 * (OpenAI, Gemini, Claude). The backend registry decides which vendors exist
 * and what credentials each needs, so nothing here is per-vendor.
 */

import api from './api';

export type LlmConnectionStatus = 'not_configured' | 'connected' | 'error';

/** A credential input the vendor needs, as declared by the backend driver. */
export interface LlmCredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
  placeholder?: string;
}

/** This company's account with one vendor. Absent until the app is installed. */
export interface LlmProviderAccount {
  id: number;
  provider: string;
  name: string | null;
  has_api_key: boolean;
  api_key_hint: string | null;
  organization_id: string | null;
  connection_status: LlmConnectionStatus;
  last_tested_at: string | null;
  is_active: boolean;
}

export interface LlmProvider {
  key: string;
  label: string;
  docs_url: string | null;
  credential_fields: LlmCredentialField[];
  models: string[];
  default_model: string | null;
  account: LlmProviderAccount | null;
}

export interface LlmCatalog {
  default_provider: string;
  providers: LlmProvider[];
}

export const getLlmCatalog = async (): Promise<LlmCatalog> => {
  const response = await api.get('/api/integrations/llm');
  return response.data;
};

export const installLlmProvider = async (provider: string): Promise<LlmProviderAccount> => {
  const response = await api.post(`/api/integrations/llm/${provider}`);
  return response.data.account;
};

export const configureLlmProvider = async (
  provider: string,
  credentials: Record<string, string>,
): Promise<{ account: LlmProviderAccount; models: string[] }> => {
  const response = await api.put(`/api/integrations/llm/${provider}/configure`, credentials);
  return { account: response.data.account, models: response.data.models || [] };
};

export const testLlmProvider = async (
  provider: string,
): Promise<{ account: LlmProviderAccount; models: string[] }> => {
  const response = await api.post(`/api/integrations/llm/${provider}/test-connection`);
  return { account: response.data.account, models: response.data.models || [] };
};

export const disconnectLlmProvider = async (provider: string): Promise<LlmProviderAccount> => {
  const response = await api.post(`/api/integrations/llm/${provider}/disconnect`);
  return response.data.account;
};

export const getLlmModels = async (provider: string): Promise<string[]> => {
  const response = await api.get(`/api/integrations/llm/${provider}/models`);
  return response.data.models || [];
};

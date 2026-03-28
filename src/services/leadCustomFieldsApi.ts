import api from './api';

export interface LeadCustomField {
  id: number;
  company_id: number;
  field_key: string;
  field_type: 'title' | 'text' | 'number' | 'boolean' | 'json' | 'date';
  field_value: string;
  type: 'model' | 'lead';
  lead_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCustomFieldFormData {
  field_key: string;
  field_type: 'title' | 'text' | 'number' | 'boolean' | 'json' | 'date';
  field_value: string | number;
  type?: 'model' | 'lead';
  lead_id?: number | null;
}

// Model-level (default) fields — managed from CRM Panel
export const getLeadCustomFields = async (): Promise<LeadCustomField[]> => {
  const response = await api.get('/api/lead-custom-fields');
  return response.data;
};

export const createLeadCustomField = async (data: LeadCustomFieldFormData): Promise<LeadCustomField> => {
  const response = await api.post('/api/lead-custom-fields', data);
  return response.data.data || response.data;
};

export const updateLeadCustomField = async (id: number, data: LeadCustomFieldFormData): Promise<LeadCustomField> => {
  const response = await api.put(`/api/lead-custom-fields/${id}`, data);
  return response.data.data || response.data;
};

export const deleteLeadCustomField = async (id: number): Promise<void> => {
  await api.delete(`/api/lead-custom-fields/${id}`);
};

// Per-lead field values — managed from lead detail
export const getLeadFields = async (leadId: number): Promise<LeadCustomField[]> => {
  const response = await api.get(`/api/leads/${leadId}/custom-fields`);
  return response.data;
};

export const saveLeadField = async (leadId: number, data: LeadCustomFieldFormData): Promise<LeadCustomField> => {
  const response = await api.post(`/api/leads/${leadId}/custom-fields`, data);
  return response.data.data || response.data;
};

export const deleteLeadField = async (leadId: number, fieldKey: string): Promise<void> => {
  await api.delete(`/api/leads/${leadId}/custom-fields/${fieldKey}`);
};

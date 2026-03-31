import api from './api';

export interface LeadSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  funnel_id: number;
}

export const searchLeads = async (query: string): Promise<LeadSearchResult[]> => {
  const response = await api.get('/api/leads/search/products', {
    params: { q: query }
  });
  return response.data;
};

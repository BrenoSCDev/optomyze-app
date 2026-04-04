import api from './api';

export interface DealActivityLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface DealActivitySale {
  id: number;
  lead_id: number;
  user_id: number;
  name: string;
  total: string;
  created_at: string;
  charges_total: number;
  final_total: number;
  lead: DealActivityLead;
  charges: any[];
}

export interface DealActivityUser {
  id: number;
  name: string;
  email: string;
}

export interface DealActivityTransaction {
  id: number;
  sale_id: number;
  company_id: number;
  user_id: number;
  type: string;
  action: string;
  description: string;
  source: string;
  created_at: string;
  updated_at: string;
  sale: DealActivitySale | null;
  user: DealActivityUser | null;
}

export interface DealTransactionsResponse {
  transactions: DealActivityTransaction[];
}

export const dealActivityApi = {
  fetchTransactions: async (): Promise<DealTransactionsResponse> => {
    try {
      const response = await api.get('/api/deals-activity/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching deal transactions:', error);
      throw error;
    }
  },
};

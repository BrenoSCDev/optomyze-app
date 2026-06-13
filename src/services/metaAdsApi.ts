import api from './api';

export type MetaAdsDateRangeValue = 'today' | 'yesterday' | '7_days' | '30_days' | 'this_month' | 'last_month' | 'custom';

export interface MetaAdsActionValue {
  action_type: string;
  value: string;
}

export interface MetaAdsInsightRow {
  campaign_id: string;
  campaign_name: string;
  objective?: string;
  impressions: string;
  reach: string;
  frequency: string;
  clicks: string;
  inline_link_clicks?: string;
  unique_clicks?: string;
  unique_ctr?: string;
  spend: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  cost_per_inline_link_click?: string;
  cpp?: string;
  actions?: MetaAdsActionValue[];
  action_values?: MetaAdsActionValue[];
  cost_per_action_type?: MetaAdsActionValue[];
  date_start: string;
  date_stop: string;
}

export interface MetaAdsAdsetRow {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  reach: string;
  frequency: string;
  clicks: string;
  spend: string;
  ctr?: string;
  cpc?: string;
  actions?: MetaAdsActionValue[];
  action_values?: MetaAdsActionValue[];
  date_start: string;
  date_stop: string;
}

export interface MetaAdsResponse {
  message: string;
  range: {
    date_range: MetaAdsDateRangeValue;
    current: { since: string; until: string };
    previous: { since: string; until: string };
  };
  data: {
    current: MetaAdsInsightRow[];
    previous: MetaAdsInsightRow[];
  };
  adsets: MetaAdsAdsetRow[];
}

export interface MetaAdsQueryParams {
  date_range?: MetaAdsDateRangeValue;
  date_from?: string;
  date_to?: string;
}

export const metaAdsApi = {
  fetchMetaData: async (params?: MetaAdsQueryParams): Promise<MetaAdsResponse> => {
    const response = await api.get<MetaAdsResponse>('/api/integrations/meta-ads/fetch-meta-data', { params });
    return response.data;
  },
};

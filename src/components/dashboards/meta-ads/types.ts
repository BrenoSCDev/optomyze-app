/**
 * Frontend-derived types for the Meta Ads dashboard. These describe values
 * computed from `MetaAdsResponse` rows, shared across calculations, the
 * insight engine, and the presentational sections.
 */

export interface AggregatedMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  results: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpl: number;
}

export interface CampaignSummary {
  id: string;
  name: string;
  objective?: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  results: number;
  ctr: number;
  cpl: number | null;
}

export interface AdsetSummary {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  results: number;
  ctr: number;
  cpl: number | null;
}

export interface DailyTrendPoint {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  results: number;
  ctr: number;
  cpl: number | null;
}

export interface CampaignIntelligence {
  best: CampaignSummary | null;
  worst: CampaignSummary | null;
  highestCtr: CampaignSummary | null;
  highestSpend: CampaignSummary | null;
  lowestCpl: CampaignSummary | null;
  wastedSpend: CampaignSummary[];
}

export interface KpiDelta {
  current: number;
  previous: number;
  /** Percentage change vs. previous period, or null when both periods are 0. */
  deltaPct: number | null;
  /** True when |deltaPct| crosses the "significant change" threshold. */
  isSignificant: boolean;
  /** Direction of the change, accounting for "lower is better" metrics. */
  isPositive: boolean;
}

export type InsightType = 'positive' | 'negative' | 'neutral' | 'warning';

export interface InsightEntry {
  id: string;
  type: InsightType;
  textKey: string;
  params: Record<string, string | number>;
}

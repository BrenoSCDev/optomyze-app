/**
 * Pure aggregation/derivation helpers for the Meta Ads dashboard. No React,
 * no i18n - just math over `MetaAdsInsightRow`/`MetaAdsAdsetRow` arrays.
 */

import type { MetaAdsActionValue, MetaAdsAdsetRow, MetaAdsInsightRow } from '@/services/metaAdsApi';
import type {
  AdsetSummary,
  AggregatedMetrics,
  CampaignIntelligence,
  CampaignSummary,
  DailyTrendPoint,
  KpiDelta,
} from './types';

/** A swing of this size or more (in percent) is called out as "significant". */
export const SIGNIFICANT_CHANGE_THRESHOLD = 20;

/** Minimum spend (in account currency units) for a zero-result campaign to be flagged as "wasted spend". */
export const WASTED_SPEND_MIN_THRESHOLD = 5;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Pick the most meaningful "result" for a row: a native `lead` action if the
 * campaign is optimized for lead generation, otherwise messaging
 * conversations (the dominant conversion type for chat-based campaigns).
 */
export function extractResultsCount(actions?: MetaAdsActionValue[]): number {
  if (!actions) return 0;

  const priority = ['lead', 'onsite_conversion.total_messaging_connection'];
  for (const type of priority) {
    const match = actions.find((a) => a.action_type === type);
    if (match) return parseInt(match.value || '0', 10);
  }

  return 0;
}

export function aggregateMetrics(rows: MetaAdsInsightRow[]): AggregatedMetrics {
  const totals = rows.reduce(
    (acc, row) => {
      acc.spend += parseFloat(row.spend || '0');
      acc.impressions += parseInt(row.impressions || '0', 10);
      acc.clicks += parseInt(row.clicks || '0', 10);
      acc.reach += parseInt(row.reach || '0', 10);
      acc.results += extractResultsCount(row.actions);
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, reach: 0, results: 0 }
  );

  return {
    spend: round2(totals.spend),
    impressions: totals.impressions,
    clicks: totals.clicks,
    reach: totals.reach,
    results: totals.results,
    frequency: totals.reach > 0 ? totals.impressions / totals.reach : 0,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    cpl: totals.results > 0 ? totals.spend / totals.results : 0,
  };
}

export function buildCampaignSummaries(rows: MetaAdsInsightRow[]): CampaignSummary[] {
  const grouped = new Map<string, CampaignSummary>();

  rows.forEach((row) => {
    const id = row.campaign_id;
    const existing = grouped.get(id) ?? {
      id,
      name: row.campaign_name,
      objective: row.objective,
      spend: 0,
      impressions: 0,
      clicks: 0,
      reach: 0,
      frequency: 0,
      results: 0,
      ctr: 0,
      cpl: null,
    };

    existing.spend += parseFloat(row.spend || '0');
    existing.impressions += parseInt(row.impressions || '0', 10);
    existing.clicks += parseInt(row.clicks || '0', 10);
    existing.reach += parseInt(row.reach || '0', 10);
    existing.results += extractResultsCount(row.actions);

    grouped.set(id, existing);
  });

  return Array.from(grouped.values()).map((c) => ({
    ...c,
    spend: round2(c.spend),
    frequency: c.reach > 0 ? c.impressions / c.reach : 0,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    cpl: c.results > 0 ? round2(c.spend / c.results) : null,
  }));
}

export function buildDailyTrend(rows: MetaAdsInsightRow[]): DailyTrendPoint[] {
  const grouped = new Map<string, { date: string; spend: number; clicks: number; impressions: number; reach: number; results: number }>();

  rows.forEach((row) => {
    const date = row.date_start;
    const existing = grouped.get(date) ?? { date, spend: 0, clicks: 0, impressions: 0, reach: 0, results: 0 };

    existing.spend += parseFloat(row.spend || '0');
    existing.clicks += parseInt(row.clicks || '0', 10);
    existing.impressions += parseInt(row.impressions || '0', 10);
    existing.reach += parseInt(row.reach || '0', 10);
    existing.results += extractResultsCount(row.actions);

    grouped.set(date, existing);
  });

  return Array.from(grouped.values())
    .map((d) => ({
      ...d,
      spend: round2(d.spend),
      ctr: d.impressions > 0 ? round2((d.clicks / d.impressions) * 100) : 0,
      cpl: d.results > 0 ? round2(d.spend / d.results) : null,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function buildAdsetSummaries(adsets: MetaAdsAdsetRow[]): AdsetSummary[] {
  return adsets
    .map((row) => {
      const spend = parseFloat(row.spend || '0');
      const impressions = parseInt(row.impressions || '0', 10);
      const clicks = parseInt(row.clicks || '0', 10);
      const reach = parseInt(row.reach || '0', 10);
      const results = extractResultsCount(row.actions);

      return {
        id: row.adset_id,
        name: row.adset_name,
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        spend: round2(spend),
        impressions,
        clicks,
        reach,
        frequency: reach > 0 ? impressions / reach : 0,
        results,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpl: results > 0 ? round2(spend / results) : null,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

/**
 * Trend vs. previous-period comparison used by the KPI grid and insight engine.
 * `lowerIsBetter` flips the positive/negative direction for cost metrics (CPC, CPM, CPL...).
 */
export function computeKpiDelta(current: number, previous: number, lowerIsBetter = false): KpiDelta {
  const deltaPct = previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;
  const isSignificant = deltaPct !== null && Math.abs(deltaPct) >= SIGNIFICANT_CHANGE_THRESHOLD;
  const direction = deltaPct ?? 0;
  const isPositive = lowerIsBetter ? direction <= 0 : direction >= 0;

  return { current, previous, deltaPct, isSignificant, isPositive };
}

export function buildCampaignIntelligence(summaries: CampaignSummary[]): CampaignIntelligence {
  const withResults = summaries.filter((c) => c.results > 0);
  const best = withResults.length
    ? [...withResults].sort((a, b) => {
        if (b.results !== a.results) return b.results - a.results;
        return (a.cpl ?? Infinity) - (b.cpl ?? Infinity);
      })[0]
    : null;

  const spendingCampaigns = summaries.filter((c) => c.spend > 0);
  const worst = spendingCampaigns.length
    ? [...spendingCampaigns].sort((a, b) => {
        if (a.results !== b.results) return a.results - b.results;
        return b.spend - a.spend;
      })[0]
    : null;

  const withImpressions = summaries.filter((c) => c.impressions > 0);
  const highestCtr = withImpressions.length
    ? [...withImpressions].sort((a, b) => b.ctr - a.ctr)[0]
    : null;

  const highestSpend = summaries.length
    ? [...summaries].sort((a, b) => b.spend - a.spend)[0]
    : null;

  const withCpl = summaries.filter((c) => c.cpl !== null);
  const lowestCpl = withCpl.length
    ? [...withCpl].sort((a, b) => (a.cpl as number) - (b.cpl as number))[0]
    : null;

  const wastedSpend = summaries
    .filter((c) => c.results === 0 && c.spend >= WASTED_SPEND_MIN_THRESHOLD)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return { best, worst, highestCtr, highestSpend, lowestCpl, wastedSpend };
}

export interface TopAction {
  name: string;
  value: number;
  percentage: number;
}

export function actionTypeDistribution(rows: MetaAdsInsightRow[]): Record<string, number> {
  return rows.reduce((acc, item) => {
    item.actions?.forEach((action) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + parseInt(action.value || '0', 10);
    });
    return acc;
  }, {} as Record<string, number>);
}

export function topActions(rows: MetaAdsInsightRow[], n = 5): TopAction[] {
  const distribution = actionTypeDistribution(rows);
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({
      name: name.replace('onsite_conversion.', '').replace(/_/g, ' '),
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
}

export function formatCurrencyValue(value: number, symbol: string): string {
  return `${symbol}${value.toFixed(2)}`;
}

export function formatDeltaPct(deltaPct: number): string {
  const sign = deltaPct > 0 ? '+' : '';
  return `${sign}${deltaPct.toFixed(1)}%`;
}

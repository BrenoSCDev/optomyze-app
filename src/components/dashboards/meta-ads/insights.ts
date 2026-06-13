/**
 * Narrative insight engine for the Meta Ads dashboard. Turns aggregated
 * numbers into a short, prioritized list of human-readable observations.
 *
 * Each `InsightEntry` carries a `textKey` (i18n key) and `params` for
 * `{{placeholder}}` substitution - the i18n `t()` helper does not support
 * interpolation, so `renderInsightText` performs the substitution manually.
 */

import { formatCurrencyValue, formatDeltaPct, WASTED_SPEND_MIN_THRESHOLD } from './calculations';
import type { CampaignIntelligence, CampaignSummary, InsightEntry, KpiDelta } from './types';

/** Frequency at/above this is flagged as a likely ad-fatigue risk. */
export const HIGH_FREQUENCY_THRESHOLD = 3.5;

const MAX_INSIGHTS = 6;

export interface InsightsInput {
  campaignSummaries: CampaignSummary[];
  intelligence: CampaignIntelligence;
  deltas: {
    spend: KpiDelta;
    ctr: KpiDelta;
  };
  currencySymbol: string;
}

export function generateInsights(input: InsightsInput): InsightEntry[] {
  const { campaignSummaries, intelligence, deltas, currencySymbol } = input;
  const insights: InsightEntry[] = [];

  if (intelligence.best) {
    insights.push({
      id: 'best-campaign',
      type: 'positive',
      textKey: 'meta.insight.best-campaign',
      params: {
        name: intelligence.best.name,
        results: intelligence.best.results,
        cpl: intelligence.best.cpl !== null ? formatCurrencyValue(intelligence.best.cpl, currencySymbol) : '-',
      },
    });
  }

  if (intelligence.lowestCpl && intelligence.lowestCpl.id !== intelligence.best?.id) {
    insights.push({
      id: 'lowest-cpl',
      type: 'positive',
      textKey: 'meta.insight.lowest-cpl',
      params: {
        name: intelligence.lowestCpl.name,
        cpl: formatCurrencyValue(intelligence.lowestCpl.cpl as number, currencySymbol),
      },
    });
  }

  if (deltas.ctr.isSignificant && deltas.ctr.deltaPct !== null) {
    const declining = deltas.ctr.deltaPct < 0;
    insights.push({
      id: declining ? 'ctr-declining' : 'ctr-improving',
      type: declining ? 'warning' : 'positive',
      textKey: declining ? 'meta.insight.ctr-declining' : 'meta.insight.ctr-improving',
      params: { pct: formatDeltaPct(Math.abs(deltas.ctr.deltaPct)) },
    });
  }

  campaignSummaries
    .filter((c) => c.frequency >= HIGH_FREQUENCY_THRESHOLD)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 2)
    .forEach((c) => {
      insights.push({
        id: `high-frequency-${c.id}`,
        type: 'warning',
        textKey: 'meta.insight.high-frequency',
        params: { name: c.name, frequency: c.frequency.toFixed(1) },
      });
    });

  intelligence.wastedSpend.slice(0, 2).forEach((c) => {
    insights.push({
      id: `wasted-spend-${c.id}`,
      type: 'negative',
      textKey: 'meta.insight.wasted-spend',
      params: { name: c.name, spend: formatCurrencyValue(c.spend, currencySymbol), threshold: WASTED_SPEND_MIN_THRESHOLD },
    });
  });

  if (deltas.spend.isSignificant && deltas.spend.deltaPct !== null) {
    const up = deltas.spend.deltaPct > 0;
    insights.push({
      id: up ? 'spend-trend-up' : 'spend-trend-down',
      type: 'neutral',
      textKey: up ? 'meta.insight.spend-trend-up' : 'meta.insight.spend-trend-down',
      params: { pct: formatDeltaPct(Math.abs(deltas.spend.deltaPct)) },
    });
  }

  if (insights.length === 0) {
    return [
      {
        id: 'not-enough-data',
        type: 'neutral',
        textKey: 'meta.insight.not-enough-data',
        params: {},
      },
    ];
  }

  const priority: Record<InsightEntry['type'], number> = { negative: 0, warning: 1, positive: 2, neutral: 3 };
  return insights.sort((a, b) => priority[a.type] - priority[b.type]).slice(0, MAX_INSIGHTS);
}

/** Render an insight's `textKey` through `t()`, substituting `{{param}}` tokens. */
export function renderInsightText(t: (key: string) => string, entry: InsightEntry): string {
  let text = t(entry.textKey);
  Object.entries(entry.params).forEach(([key, value]) => {
    text = text.split(`{{${key}}}`).join(String(value));
  });
  return text;
}

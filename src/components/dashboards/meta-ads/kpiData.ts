/**
 * Builds the data (title/value/trend/highlight) for the primary and
 * secondary KPI grids. i18n- and currency-aware - kept separate from
 * `calculations.ts` (which stays framework-agnostic pure math).
 */

import { computeKpiDelta, formatCurrencyValue, formatDeltaPct } from './calculations';
import type { AggregatedMetrics, KpiDelta } from './types';

export interface KpiCardData {
  title: string;
  value: string | number;
  trend: { value: string; isPositive: boolean };
  highlight: boolean;
}

export interface KpiDeltas {
  spend: KpiDelta;
  impressions: KpiDelta;
  clicks: KpiDelta;
  ctr: KpiDelta;
  cpc: KpiDelta;
  results: KpiDelta;
  cpl: KpiDelta;
  cpm: KpiDelta;
}

export function buildKpiDeltas(current: AggregatedMetrics, previous: AggregatedMetrics): KpiDeltas {
  return {
    spend: computeKpiDelta(current.spend, previous.spend),
    impressions: computeKpiDelta(current.impressions, previous.impressions),
    clicks: computeKpiDelta(current.clicks, previous.clicks),
    ctr: computeKpiDelta(current.ctr, previous.ctr),
    cpc: computeKpiDelta(current.cpc, previous.cpc, true),
    results: computeKpiDelta(current.results, previous.results),
    cpl: computeKpiDelta(current.cpl, previous.cpl, true),
    cpm: computeKpiDelta(current.cpm, previous.cpm, true),
  };
}

/** Render a `KpiDelta` into the `{ trend, highlight }` shape `KPICard` expects. */
export function buildKpiTrend(t: (key: string) => string, delta: KpiDelta): { trend: { value: string; isPositive: boolean }; highlight: boolean } {
  if (delta.deltaPct === null) {
    return { trend: { value: t('meta.kpi.no-previous-data'), isPositive: true }, highlight: false };
  }

  const text = t('meta.kpi.vs-previous').split('{{pct}}').join(formatDeltaPct(delta.deltaPct));
  return { trend: { value: text, isPositive: delta.isPositive }, highlight: delta.isSignificant };
}

export function buildPrimaryKpis(t: (key: string) => string, cs: string, current: AggregatedMetrics, deltas: KpiDeltas): KpiCardData[] {
  return [
    { title: t('meta.total-spend'), value: formatCurrencyValue(current.spend, cs), ...buildKpiTrend(t, deltas.spend) },
    { title: t('meta.impressions'), value: current.impressions.toLocaleString(), ...buildKpiTrend(t, deltas.impressions) },
    { title: t('meta.clicks'), value: current.clicks.toLocaleString(), ...buildKpiTrend(t, deltas.clicks) },
    { title: t('meta.ctr'), value: `${current.ctr.toFixed(2)}%`, ...buildKpiTrend(t, deltas.ctr) },
  ];
}

export function buildSecondaryKpis(t: (key: string) => string, cs: string, current: AggregatedMetrics, deltas: KpiDeltas): KpiCardData[] {
  return [
    { title: t('meta.cpc'), value: formatCurrencyValue(current.cpc, cs), ...buildKpiTrend(t, deltas.cpc) },
    { title: t('meta.conversions'), value: current.results.toLocaleString(), ...buildKpiTrend(t, deltas.results) },
    { title: t('meta.cpa'), value: formatCurrencyValue(current.cpl, cs), ...buildKpiTrend(t, deltas.cpl) },
    { title: t('meta.cpm'), value: formatCurrencyValue(current.cpm, cs), ...buildKpiTrend(t, deltas.cpm) },
  ];
}

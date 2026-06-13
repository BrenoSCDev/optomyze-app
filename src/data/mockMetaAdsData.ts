/**
 * MOCK META ADS DATA for Demo Dashboard
 *
 * Shaped like `MetaAdsResponse`: 14 days of per-campaign daily insights
 * (current period), a single aggregated row for the previous period, and
 * ad set breakdowns. The previous-period totals are derived from the
 * generated current totals so the KPI deltas and insight engine produce
 * a realistic, varied set of signals.
 */

import { aggregateMetrics } from '@/components/dashboards/meta-ads/calculations';
import type {
  MetaAdsActionValue,
  MetaAdsAdsetRow,
  MetaAdsInsightRow,
  MetaAdsResponse,
} from '@/services/metaAdsApi';

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Gentle day-to-day variation applied to each campaign's daily base values. */
const WAVE = [0.9, 0.95, 1.0, 1.05, 1.1, 1.05, 1.0, 0.95, 0.9, 0.95, 1.0, 1.08, 1.12, 1.15];

const CURRENT_DATES = [
  '2026-05-29', '2026-05-30', '2026-05-31', '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04',
  '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11',
];

interface SecondaryAction {
  type: string;
  dailyBase: number;
}

interface CampaignBlueprint {
  id: string;
  name: string;
  objective: string;
  dailyImpressions: number;
  dailyClicks: number;
  dailySpend: number;
  dailyReach: number;
  dailyResults: number;
  resultActionType?: string;
  secondaryActions: SecondaryAction[];
}

const CAMPAIGN_BLUEPRINTS: CampaignBlueprint[] = [
  {
    id: 'camp_001',
    name: 'Lead Gen - Enterprise',
    objective: 'OUTCOME_LEADS',
    dailyImpressions: 10000,
    dailyClicks: 300,
    dailySpend: 100,
    dailyReach: 8300,
    dailyResults: 12,
    resultActionType: 'lead',
    secondaryActions: [
      { type: 'link_click', dailyBase: 300 },
      { type: 'page_engagement', dailyBase: 450 },
      { type: 'video_view', dailyBase: 600 },
    ],
  },
  {
    id: 'camp_002',
    name: 'Retargeting - Website Visitors',
    objective: 'OUTCOME_ENGAGEMENT',
    dailyImpressions: 5000,
    dailyClicks: 200,
    dailySpend: 70,
    dailyReach: 1250,
    dailyResults: 1,
    resultActionType: 'onsite_conversion.total_messaging_connection',
    secondaryActions: [
      { type: 'link_click', dailyBase: 200 },
      { type: 'purchase', dailyBase: 2 },
      { type: 'page_engagement', dailyBase: 300 },
    ],
  },
  {
    id: 'camp_003',
    name: 'Holiday Promo - Black Friday',
    objective: 'OUTCOME_ENGAGEMENT',
    dailyImpressions: 27000,
    dailyClicks: 680,
    dailySpend: 300,
    dailyReach: 22500,
    dailyResults: 15,
    resultActionType: 'onsite_conversion.total_messaging_connection',
    secondaryActions: [
      { type: 'link_click', dailyBase: 680 },
      { type: 'page_engagement', dailyBase: 900 },
      { type: 'purchase', dailyBase: 10 },
      { type: 'video_view', dailyBase: 1200 },
    ],
  },
  {
    id: 'camp_004',
    name: 'Brand Awareness Q4',
    objective: 'OUTCOME_AWARENESS',
    dailyImpressions: 15700,
    dailyClicks: 236,
    dailySpend: 79,
    dailyReach: 13100,
    dailyResults: 0,
    secondaryActions: [
      { type: 'link_click', dailyBase: 236 },
      { type: 'page_engagement', dailyBase: 470 },
      { type: 'post_engagement', dailyBase: 350 },
      { type: 'video_view', dailyBase: 900 },
    ],
  },
  {
    id: 'camp_005',
    name: 'Instagram Stories - Product Launch',
    objective: 'OUTCOME_AWARENESS',
    dailyImpressions: 10700,
    dailyClicks: 214,
    dailySpend: 54,
    dailyReach: 8900,
    dailyResults: 0,
    secondaryActions: [
      { type: 'link_click', dailyBase: 214 },
      { type: 'page_engagement', dailyBase: 320 },
      { type: 'post_engagement', dailyBase: 260 },
      { type: 'video_view', dailyBase: 700 },
    ],
  },
  {
    id: 'camp_006',
    name: 'Summer Sale 2024',
    objective: 'OUTCOME_SALES',
    dailyImpressions: 11400,
    dailyClicks: 350,
    dailySpend: 69,
    dailyReach: 9500,
    dailyResults: 6,
    resultActionType: 'onsite_conversion.total_messaging_connection',
    secondaryActions: [
      { type: 'link_click', dailyBase: 350 },
      { type: 'post_engagement', dailyBase: 400 },
      { type: 'video_view', dailyBase: 800 },
    ],
  },
];

function buildCampaignRows(blueprint: CampaignBlueprint): MetaAdsInsightRow[] {
  return CURRENT_DATES.map((date, i) => {
    const wave = WAVE[i];
    const impressions = Math.round(blueprint.dailyImpressions * wave);
    const clicks = Math.round(blueprint.dailyClicks * wave);
    const reach = Math.round(blueprint.dailyReach * wave);
    const spend = round2(blueprint.dailySpend * wave);

    const actions: MetaAdsActionValue[] = [];
    if (blueprint.resultActionType) {
      actions.push({ action_type: blueprint.resultActionType, value: String(blueprint.dailyResults) });
    }
    blueprint.secondaryActions.forEach((action) => {
      actions.push({ action_type: action.type, value: String(Math.round(action.dailyBase * wave)) });
    });

    return {
      campaign_id: blueprint.id,
      campaign_name: blueprint.name,
      objective: blueprint.objective,
      impressions: String(impressions),
      reach: String(reach),
      frequency: (impressions / reach).toFixed(2),
      clicks: String(clicks),
      spend: spend.toFixed(2),
      ctr: ((clicks / impressions) * 100).toFixed(2),
      cpc: (spend / clicks).toFixed(2),
      cpm: ((spend / impressions) * 1000).toFixed(2),
      actions,
      date_start: date,
      date_stop: date,
    };
  });
}

const currentRows: MetaAdsInsightRow[] = CAMPAIGN_BLUEPRINTS.flatMap(buildCampaignRows);

/**
 * The previous period is represented as a single aggregated row. Its totals
 * are derived as ratios of the generated current totals, chosen so the KPI
 * deltas and insight engine surface a realistic mix of signals (spend up,
 * CTR down, conversions up).
 */
const currentMetrics = aggregateMetrics(currentRows);

const previousImpressions = Math.round(currentMetrics.impressions / 1.25);
const previousReach = Math.round(previousImpressions / 1.25);
const previousCtr = currentMetrics.ctr * 1.3;
const previousClicks = Math.round((previousImpressions * previousCtr) / 100);
const previousSpend = round2(currentMetrics.spend / 1.35);
const previousResults = Math.round(currentMetrics.results / 1.27);

const previousRow: MetaAdsInsightRow = {
  campaign_id: 'previous_aggregate',
  campaign_name: 'All Campaigns (Previous Period)',
  impressions: String(previousImpressions),
  reach: String(previousReach),
  frequency: (previousImpressions / previousReach).toFixed(2),
  clicks: String(previousClicks),
  spend: previousSpend.toFixed(2),
  ctr: previousCtr.toFixed(2),
  cpc: (previousSpend / previousClicks).toFixed(2),
  cpm: ((previousSpend / previousImpressions) * 1000).toFixed(2),
  actions: [{ action_type: 'lead', value: String(previousResults) }],
  date_start: '2026-05-15',
  date_stop: '2026-05-28',
};

const adsets: MetaAdsAdsetRow[] = [
  {
    adset_id: 'adset_001a',
    adset_name: 'Conversion - Feed',
    campaign_id: 'camp_001',
    campaign_name: 'Lead Gen - Enterprise',
    impressions: '85200',
    reach: '70716',
    frequency: '1.20',
    clicks: '2556',
    spend: '852.00',
    ctr: '3.00',
    cpc: '0.33',
    actions: [{ action_type: 'lead', value: '101' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_001b',
    adset_name: 'Conversion - Stories',
    campaign_id: 'camp_001',
    campaign_name: 'Lead Gen - Enterprise',
    impressions: '56800',
    reach: '47144',
    frequency: '1.20',
    clicks: '1704',
    spend: '568.00',
    ctr: '3.00',
    cpc: '0.33',
    actions: [{ action_type: 'lead', value: '67' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_002a',
    adset_name: 'Feed Retarget',
    campaign_id: 'camp_002',
    campaign_name: 'Retargeting - Website Visitors',
    impressions: '49700',
    reach: '12425',
    frequency: '4.00',
    clicks: '1988',
    spend: '695.80',
    ctr: '4.00',
    cpc: '0.35',
    actions: [{ action_type: 'onsite_conversion.total_messaging_connection', value: '10' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_002b',
    adset_name: 'Audience Network Retarget',
    campaign_id: 'camp_002',
    campaign_name: 'Retargeting - Website Visitors',
    impressions: '21300',
    reach: '5325',
    frequency: '4.00',
    clicks: '852',
    spend: '298.20',
    ctr: '4.00',
    cpc: '0.35',
    actions: [{ action_type: 'onsite_conversion.total_messaging_connection', value: '4' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_003a',
    adset_name: 'Black Friday - Feed',
    campaign_id: 'camp_003',
    campaign_name: 'Holiday Promo - Black Friday',
    impressions: '210870',
    reach: '175725',
    frequency: '1.20',
    clicks: '5311',
    spend: '2343.00',
    ctr: '2.52',
    cpc: '0.44',
    actions: [{ action_type: 'onsite_conversion.total_messaging_connection', value: '116' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_003b',
    adset_name: 'Black Friday - Reels',
    campaign_id: 'camp_003',
    campaign_name: 'Holiday Promo - Black Friday',
    impressions: '172530',
    reach: '143775',
    frequency: '1.20',
    clicks: '4345',
    spend: '1917.00',
    ctr: '2.52',
    cpc: '0.44',
    actions: [{ action_type: 'onsite_conversion.total_messaging_connection', value: '94' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_004a',
    adset_name: 'Awareness - Feed',
    campaign_id: 'camp_004',
    campaign_name: 'Brand Awareness Q4',
    impressions: '222940',
    reach: '186020',
    frequency: '1.20',
    clicks: '3351',
    spend: '1121.80',
    ctr: '1.50',
    cpc: '0.33',
    actions: [
      { action_type: 'link_click', value: '3351' },
      { action_type: 'page_engagement', value: '6627' },
    ],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_005a',
    adset_name: 'Explore - Stories',
    campaign_id: 'camp_005',
    campaign_name: 'Instagram Stories - Product Launch',
    impressions: '151940',
    reach: '126380',
    frequency: '1.20',
    clicks: '3039',
    spend: '766.80',
    ctr: '2.00',
    cpc: '0.25',
    actions: [
      { action_type: 'link_click', value: '3019' },
      { action_type: 'page_engagement', value: '4513' },
    ],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_006a',
    adset_name: 'Summer Sale - Feed',
    campaign_id: 'camp_006',
    campaign_name: 'Summer Sale 2024',
    impressions: '97128',
    reach: '80940',
    frequency: '1.20',
    clicks: '2982',
    spend: '587.88',
    ctr: '3.07',
    cpc: '0.20',
    actions: [{ action_type: 'onsite_conversion.total_messaging_connection', value: '50' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
  {
    adset_id: 'adset_006b',
    adset_name: 'Summer Sale - Stories',
    campaign_id: 'camp_006',
    campaign_name: 'Summer Sale 2024',
    impressions: '64752',
    reach: '53960',
    frequency: '1.20',
    clicks: '1988',
    spend: '391.92',
    ctr: '3.07',
    cpc: '0.20',
    actions: [{ action_type: 'onsite_conversion.total_messaging_connection', value: '34' }],
    date_start: '2026-05-29',
    date_stop: '2026-06-11',
  },
];

export const mockMetaAdsData: MetaAdsResponse = {
  message: 'success',
  range: {
    date_range: '30_days',
    current: { since: '2026-05-29', until: '2026-06-11' },
    previous: { since: '2026-05-15', until: '2026-05-28' },
  },
  data: {
    current: currentRows,
    previous: [previousRow],
  },
  adsets,
};

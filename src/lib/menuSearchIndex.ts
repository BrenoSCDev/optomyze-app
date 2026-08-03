/**
 * MENU SEARCH
 *
 * Makes the navigation itself searchable: type "categor" and get
 * "CRM Panel › Product categories" rather than having to remember which tab it
 * ended up under.
 *
 * This matters more than it used to. Several screens that were once top-level
 * menu entries now live inside tabs and accordions (funnel management, tags and
 * product categories are all inside the CRM Panel), so their names no longer
 * appear anywhere in the sidebar.
 *
 * Entries are built from the same ids the Sidebar dispatches, so navigating a
 * result is the same call the menu makes.
 */

import type { UnifiedSearchResult } from './searchConfig';

export interface MenuEntry {
  /** Section id passed to onSectionChange, or a router path when `path` is set. */
  id: string;
  labelKey: string;
  /** Breadcrumb shown under the result, e.g. "Settings › CRM Panel". */
  trailKeys: string[];
  /** Router path for destinations that are real routes rather than sections. */
  path?: string;
  /** Opens the CRM Panel on a specific tab. */
  tab?: string;
  /** Extra words to match on that are not in the visible label. */
  keywords?: string[];
}

/**
 * Every destination reachable from the navigation, including the ones now
 * buried inside the CRM Panel.
 */
export const MENU_ENTRIES: MenuEntry[] = [
  // ── Dashboards ──
  { id: 'optomyze-metrics', labelKey: 'dashboard.optomyze-metrics', trailKeys: ['nav.dashboard'] },
  { id: 'plan-usage',       labelKey: 'dashboard.plan-usage',       trailKeys: ['nav.dashboard'] },
  { id: 'meta-ads',         labelKey: 'dashboard.meta-ads',         trailKeys: ['nav.dashboard'] },
  { id: 'google-ads',       labelKey: 'dashboard.google-ads',       trailKeys: ['nav.dashboard'] },

  // ── Activity (section id `reports`, labelled "Activity") ──
  { id: 'record-logs', labelKey: 'reports.record-logs', trailKeys: ['nav.reports'] },
  { id: 'tasks',       labelKey: 'nav.tasks',           trailKeys: ['nav.reports'] },

  // ── Direct links ──
  { id: 'contacts',           labelKey: 'nav.contacts', trailKeys: [] },
  { id: 'global-inbox',       labelKey: 'nav.inbox',    trailKeys: [] },
  { id: 'optomyze-calendar',  labelKey: 'nav.calendar', trailKeys: [] },

  // ── Products ──
  { id: 'manage-products', labelKey: 'products.manage', trailKeys: ['nav.products'] },

  // ── Organization ──
  { id: 'manage-users',   labelKey: 'organization.users',  trailKeys: ['nav.organization'] },
  { id: 'manage-teams',   labelKey: 'organization.teams',  trailKeys: ['nav.organization'] },
  { id: 'optomyze-inbox', labelKey: 'nav.optomyze-teams',  trailKeys: ['nav.organization'] },

  // ── App Store & automations ──
  // 'integrations' is still the section id the router knows; only the label
  // moved to "App Store".
  { id: 'integrations',   labelKey: 'nav.app-store',              trailKeys: [], keywords: ['apps', 'integrations', 'store'] },
  { id: 'manage-agents',  labelKey: 'ai-agents.manage.menu-title', trailKeys: ['nav.automations'] },

  // ── API ──
  { id: 'api-tokens',     labelKey: 'nav.api', trailKeys: ['nav.api'], keywords: ['token', 'api'] },
  { id: 'allowed-origins', labelKey: 'api.allowed-origins.title', trailKeys: ['nav.api'] },
  { id: 'api-logs',        labelKey: 'api.logs.title',            trailKeys: ['nav.api'] },

  // ── Settings ──
  { id: 'crm-panel',        labelKey: 'nav.crm-panel',        trailKeys: ['nav.settings'] },
  { id: 'business-profile', labelKey: 'nav.business-profile', trailKeys: ['nav.settings'] },
  { id: 'companies',        labelKey: 'nav.companies',        trailKeys: ['nav.settings'] },
  { id: 'preferences',      labelKey: 'nav.preferences',      trailKeys: ['nav.settings'] },
  { id: 'open-ticket',      labelKey: 'nav.support',          trailKeys: [] },

  /*
   * Inside the CRM Panel. These have no sidebar entry at all, so menu search
   * is the only way to find them by name.
   */
  {
    id: 'crm-panel', tab: 'funnels',
    labelKey: 'settings.crm-panel.funnel-management',
    trailKeys: ['nav.settings', 'nav.crm-panel'],
    keywords: ['funnel', 'pipeline', 'stage'],
  },
  {
    id: 'crm-panel', tab: 'tags',
    labelKey: 'settings.crm-panel.tabs.tags',
    trailKeys: ['nav.settings', 'nav.crm-panel'],
    keywords: ['tag', 'label'],
  },
  {
    id: 'crm-panel', tab: 'products',
    labelKey: 'settings.crm-panel.product-categories',
    trailKeys: ['nav.settings', 'nav.crm-panel'],
    keywords: ['category', 'categories', 'product'],
  },
  {
    id: 'crm-panel', tab: 'notifications',
    labelKey: 'settings.crm-panel.tabs.notifications',
    trailKeys: ['nav.settings', 'nav.crm-panel'],
  },
  {
    id: 'crm-panel', tab: 'conversations',
    labelKey: 'settings.crm-panel.tabs.conversations',
    trailKeys: ['nav.settings', 'nav.crm-panel'],
  },
  {
    id: 'crm-panel', tab: 'sales',
    labelKey: 'settings.crm-panel.tabs.sales',
    trailKeys: ['nav.settings', 'nav.crm-panel'],
  },
  {
    id: 'crm-panel', tab: 'appointments',
    labelKey: 'settings.crm-panel.tabs.appointments',
    trailKeys: ['nav.settings', 'nav.crm-panel'],
  },
];

/** Fold accents so "funis" matches "funís" and "orgao" matches "órgão". */
const normalise = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export interface MenuSearchHit extends UnifiedSearchResult {
  meta: {
    sectionId: string;
    path?: string;
    tab?: string;
  };
}

/**
 * Search the navigation.
 *
 * `funnels` are folded in from the auth context so a user can jump straight to
 * a named funnel — those are the destinations that change most between
 * companies and are impossible to hardcode.
 */
export function searchMenu(
  query: string,
  t: (key: string) => string,
  funnels: { id: number; name: string; type: string; is_active: boolean }[] = [],
): MenuSearchHit[] {
  const needle = normalise(query);
  if (!needle) return [];

  const candidates: { label: string; trail: string; entry: MenuEntry }[] = [
    ...MENU_ENTRIES.map(entry => ({
      label: t(entry.labelKey),
      trail: entry.trailKeys.map(k => t(k)).join(' › '),
      entry,
    })),
    ...funnels
      .filter(f => f.is_active)
      .map(f => ({
        label: f.name,
        trail: t('nav.funnels'),
        entry: {
          id: f.type === 'deal' ? `deal-${f.id}` : `sale-${f.id}`,
          labelKey: f.name,
          trailKeys: ['nav.funnels'],
          path: f.type === 'deal' ? `/deals/${f.id}` : `/leads/${f.id}`,
        } as MenuEntry,
      })),
  ];

  const scored = candidates
    .map(candidate => {
      const label = normalise(candidate.label);
      const trail = normalise(candidate.trail);
      const keywords = (candidate.entry.keywords ?? []).map(normalise);

      // Ranked so an exact-ish label match beats a match buried in a
      // breadcrumb or a keyword synonym.
      let score = -1;
      if (label === needle) score = 0;
      else if (label.startsWith(needle)) score = 1;
      else if (label.includes(needle)) score = 2;
      else if (keywords.some(k => k.includes(needle))) score = 3;
      else if (trail.includes(needle)) score = 4;

      return { candidate, score };
    })
    .filter(entry => entry.score >= 0)
    .sort((a, b) => a.score - b.score || a.candidate.label.localeCompare(b.candidate.label))
    .slice(0, 12);

  return scored.map(({ candidate }, index) => ({
    // Menu entries have no database id; the index keeps React keys unique and
    // is never used for navigation.
    id: index,
    title: candidate.label,
    subtitle: candidate.trail || undefined,
    meta: {
      sectionId: candidate.entry.id,
      path: candidate.entry.path,
      tab: candidate.entry.tab,
    },
  }));
}

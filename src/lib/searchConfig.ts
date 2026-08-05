/**
 * CENTRALIZED GLOBAL SEARCH CONFIGURATION
 *
 * Maps each search target to its API endpoint, response mapper,
 * icon, and navigation handler.
 */

import api from '@/services/api';
import { Compass, Users, UserCircle } from 'lucide-react';
import { MdCurrencyExchange } from 'react-icons/md';
import type { ComponentType } from 'react';
import { readCachedPreferences } from '@/contexts/UserPreferencesContext';
import { leadDisplayName } from '@/lib/leadName';

// ── Unified search result shape ────────────────────────────────────────
export interface UnifiedSearchResult {
  id: number;
  title: string;
  subtitle?: string;
  badge?: { label: string; variant: 'default' | 'success' | 'destructive' | 'secondary' };
  /** Extra data needed for navigation */
  meta?: Record<string, any>;
}

export type SearchTargetId = 'leads' | 'deals' | 'users' | 'menu';

export interface SearchTargetConfig {
  id: SearchTargetId;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  /**
   * Absent for targets resolved on the client. `menu` searches the navigation
   * itself, so there is nothing to call.
   */
  endpoint?: string;
  mapper?: (data: any[]) => UnifiedSearchResult[];
  /** True when results come from the client rather than an API call. */
  local?: boolean;
}

// ── Per-target configs ─────────────────────────────────────────────────

const SEARCH_TARGETS: Record<SearchTargetId, SearchTargetConfig> = {
  leads: {
    id: 'leads',
    labelKey: 'nav.leads',
    icon: Users as any,
    endpoint: '/api/leads/search/products',
    mapper: (data) =>
      data.map((l) => ({
        id: l.id,
        title: leadDisplayName(l, `#${l.id}`),
        meta: { funnel_id: l.funnel_id },
      })),
  },
  deals: {
    id: 'deals',
    labelKey: 'nav.deals',
    icon: MdCurrencyExchange as any,
    endpoint: '/api/sales/search',
    mapper: (data) =>
      data.map((d) => ({
        id: d.id,
        title: d.name,
        subtitle: d.total != null ? `$${Number(d.total).toLocaleString()}` : undefined,
        badge: d.status
          ? {
              label: d.status,
              variant: d.status === 'closed' ? 'success' as const : d.status === 'lost' ? 'destructive' as const : 'secondary' as const,
            }
          : undefined,
      })),
  },
  menu: {
    id: 'menu',
    labelKey: 'search.target.menu',
    icon: Compass as any,
    local: true,
  },
  users: {
    id: 'users',
    labelKey: 'nav.users',
    icon: UserCircle as any,
    endpoint: '/api/users/search',
    mapper: (data) =>
      data.map((u) => ({
        id: u.id,
        title: u.name,
        subtitle: u.email,
        badge: u.role ? { label: u.role, variant: 'secondary' as const } : undefined,
        meta: { profile_pic: u.profile_pic },
      })),
  },
};

export default SEARCH_TARGETS;

// ── API helper ─────────────────────────────────────────────────────────

export async function globalSearch(
  target: SearchTargetId,
  query: string,
): Promise<UnifiedSearchResult[]> {
  const config = SEARCH_TARGETS[target];

  // Local targets (menu) are resolved by the caller; there is no endpoint.
  if (config.local || !config.endpoint || !config.mapper) {
    return [];
  }

  const res = await api.get(config.endpoint, { params: { q: query } });
  const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  return config.mapper(raw);
}

// ── Persistence ────────────────────────────────────────────────────────
//
// The default target now lives in the server-backed user preferences
// (UserPreferencesContext). This module keeps only the reader, for the few
// call sites that need it outside React; writes go through
// updatePreferences({ default_search_target }).

export function getDefaultSearchTarget(): SearchTargetId {
  const stored = readCachedPreferences().default_search_target;
  return stored && stored in SEARCH_TARGETS ? (stored as SearchTargetId) : 'leads';
}

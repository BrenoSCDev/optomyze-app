/**
 * CENTRALIZED GLOBAL SEARCH CONFIGURATION
 *
 * Maps each search target to its API endpoint, response mapper,
 * icon, and navigation handler.
 */

import api from '@/services/api';
import { Users, UserCircle } from 'lucide-react';
import { MdCurrencyExchange } from 'react-icons/md';
import type { ComponentType } from 'react';

// ── Unified search result shape ────────────────────────────────────────
export interface UnifiedSearchResult {
  id: number;
  title: string;
  subtitle?: string;
  badge?: { label: string; variant: 'default' | 'success' | 'destructive' | 'secondary' };
  /** Extra data needed for navigation */
  meta?: Record<string, any>;
}

export type SearchTargetId = 'leads' | 'deals' | 'users';

export interface SearchTargetConfig {
  id: SearchTargetId;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  endpoint: string;
  /** Map raw API response array → unified results */
  mapper: (data: any[]) => UnifiedSearchResult[];
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
        title: `${l.first_name} ${l.last_name}`,
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
  const res = await api.get(config.endpoint, { params: { q: query } });
  const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  return config.mapper(raw);
}

// ── localStorage persistence ───────────────────────────────────────────

const STORAGE_KEY = 'crm_preferences';

/** Fired immediately (same tab) whenever the default search target changes. */
export const SEARCH_TARGET_CHANGE_EVENT = 'crm:search-target-changed';

export function getDefaultSearchTarget(): SearchTargetId {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const val = prefs?.search?.defaultTarget;
    if (val && val in SEARCH_TARGETS) return val as SearchTargetId;
  } catch { /* ignore */ }
  return 'leads';
}

export function setDefaultSearchTarget(target: SearchTargetId): void {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    prefs.search = { ...prefs.search, defaultTarget: target };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(SEARCH_TARGET_CHANGE_EVENT, { detail: target }));
}

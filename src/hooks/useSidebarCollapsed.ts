/**
 * SIDEBAR COLLAPSED STATE
 *
 * Whether the sidebar was left collapsed, shared by every page that renders
 * one.
 *
 * This lived inside Index and each of the other pages that host a sidebar
 * kept its own `useState(false)` — so the choice held on the dashboard and was
 * silently forgotten the moment you opened your profile or a deal funnel, and
 * collapsing it there did not stick either. One hook, so a page cannot host a
 * sidebar and get this wrong: reading and persisting come together.
 *
 * Read synchronously in useState's initialiser rather than applied by an
 * effect: the sidebar and the content margin both animate off this value, so
 * restoring it a render late would show the menu snapping shut on every load.
 *
 * localStorage rather than the server-side user preferences on purpose — how
 * much screen the menu should take is a property of the machine you are on,
 * not of the account. The same person wants it collapsed on a laptop and open
 * on a wide monitor. Being listed in DEVICE_PREFERENCE_KEYS is also what stops
 * a logout or a company switch from wiping it.
 */

import { useCallback, useState } from 'react';
import { DEVICE_PREFERENCE_KEYS } from '@/lib/devicePreferences';

const SIDEBAR_COLLAPSED_KEY = DEVICE_PREFERENCE_KEYS.sidebarCollapsed;

export const readSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;   // private mode
  }
};

/** @returns `[collapsed, toggle]` — toggling persists for the next page load. */
export const useSidebarCollapsed = (): [boolean, () => void] => {
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;

      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch { /* private mode — the choice just won't outlive the tab */ }

      return next;
    });
  }, []);

  return [collapsed, toggle];
};

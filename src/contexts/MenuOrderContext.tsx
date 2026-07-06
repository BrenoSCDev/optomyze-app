import React, { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'crm_menu_order';
const BANNER_DISMISSED_KEY = 'crm_preferences_banner_dismissed';
const NAV_LAYOUT_KEY = 'crm_nav_layout';

export type NavLayout = 'sidebar' | 'header';

// These are the reorderable top-level sidebar section IDs
export const DEFAULT_MENU_ORDER = [
  'dashboard',
  'leads',
  'deals',
  'settings',
  'reports',
  'integrations',
  'aiAgents',
  'api',
  'organization',
  'chat',
  'calendars',
  'products',
  'support',
];

interface MenuOrderState {
  order: string[];
  lastUpdated: number;
}

interface MenuOrderContextType {
  menuOrder: string[];
  setMenuOrder: (order: string[]) => void;
  resetToDefault: () => void;
  bannerDismissed: boolean;
  dismissBanner: () => void;
  navLayout: NavLayout;
  setNavLayout: (layout: NavLayout) => void;
}

const MenuOrderContext = createContext<MenuOrderContextType | undefined>(undefined);

export const MenuOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOrder, setMenuOrderState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MenuOrderState = JSON.parse(stored);
        const validIds = new Set(DEFAULT_MENU_ORDER);
        const ordered = parsed.order.filter(id => validIds.has(id));
        // Sections added after the user saved their order are inserted at
        // their default position (right after their default predecessor)
        // instead of being dumped at the end of the menu.
        DEFAULT_MENU_ORDER.forEach((id, defaultIndex) => {
          if (ordered.includes(id)) return;
          const prevDefault = DEFAULT_MENU_ORDER
            .slice(0, defaultIndex)
            .reverse()
            .find(prevId => ordered.includes(prevId));
          const insertAt = prevDefault ? ordered.indexOf(prevDefault) + 1 : 0;
          ordered.splice(insertAt, 0, id);
        });
        return ordered;
      }
    } catch { }
    return DEFAULT_MENU_ORDER;
  });

  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [navLayout, setNavLayoutState] = useState<NavLayout>(() => {
    try {
      const stored = localStorage.getItem(NAV_LAYOUT_KEY);
      if (stored === 'header' || stored === 'sidebar') return stored;
    } catch { }
    return 'sidebar';
  });

  const setMenuOrder = useCallback((order: string[]) => {
    setMenuOrderState(order);
    const state: MenuOrderState = { order, lastUpdated: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const resetToDefault = useCallback(() => {
    setMenuOrder(DEFAULT_MENU_ORDER);
  }, [setMenuOrder]);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  }, []);

  const setNavLayout = useCallback((layout: NavLayout) => {
    setNavLayoutState(layout);
    localStorage.setItem(NAV_LAYOUT_KEY, layout);
  }, []);

  return (
    <MenuOrderContext.Provider value={{ menuOrder, setMenuOrder, resetToDefault, bannerDismissed, dismissBanner, navLayout, setNavLayout }}>
      {children}
    </MenuOrderContext.Provider>
  );
};

export const useMenuOrder = () => {
  const context = useContext(MenuOrderContext);
  if (!context) {
    throw new Error('useMenuOrder must be used within a MenuOrderProvider');
  }
  return context;
};

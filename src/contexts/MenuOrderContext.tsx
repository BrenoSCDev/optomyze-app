import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'crm_menu_order';
const BANNER_DISMISSED_KEY = 'crm_preferences_banner_dismissed';

// These are the reorderable top-level sidebar section IDs
export const DEFAULT_MENU_ORDER = [
  'dashboard',
  'leads',
  'deals',
  'settings',
  'reports',
  'integrations',
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
}

const MenuOrderContext = createContext<MenuOrderContextType | undefined>(undefined);

export const MenuOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOrder, setMenuOrderState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MenuOrderState = JSON.parse(stored);
        // Merge: keep stored order but ensure all defaults exist and remove stale ones
        const validIds = new Set(DEFAULT_MENU_ORDER);
        const ordered = parsed.order.filter(id => validIds.has(id));
        // Add any new sections that weren't in storage
        DEFAULT_MENU_ORDER.forEach(id => {
          if (!ordered.includes(id)) ordered.push(id);
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

  return (
    <MenuOrderContext.Provider value={{ menuOrder, setMenuOrder, resetToDefault, bannerDismissed, dismissBanner }}>
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

/**
 * THEME
 *
 * A thin view over the server-backed user preferences. The `useTheme()` API is
 * unchanged so no consumer had to be touched; only the storage moved.
 *
 * The DOM class is applied from whatever the preferences context currently
 * holds — which on first paint is its localStorage cache, so the page never
 * flashes the wrong colour scheme while the server copy is in flight.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { ThemeMode, useUserPreferences } from './UserPreferencesContext';
import { isPublicRoute } from '@/lib/publicRoutes';

export type { ThemeMode };

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

function applyModeToDOM(mode: ThemeMode) {
  /*
   * Public pages own their own colour scheme.
   *
   * This provider sits above the router and applies on mount, and a child's
   * effect runs before its parent's — so without this guard the CRM user's
   * stored theme would overwrite whatever a visitor had chosen on a booking
   * page a moment earlier.
   */
  if (isPublicRoute()) {
    return;
  }

  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences } = useUserPreferences();
  const mode = preferences.theme;

  useEffect(() => {
    applyModeToDOM(mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    // Optimistic inside the preferences context, so the switch is instant.
    void updatePreferences({ theme: newMode });
  }, [updatePreferences]);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

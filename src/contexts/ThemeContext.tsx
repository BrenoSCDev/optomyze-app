import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemeName = 'midnight_pulse' | 'emerald_strike' | 'crimson_edge' | 'ocean_flow';

const STORAGE_KEY = 'crm_appearance';

interface AppearanceState {
  mode: ThemeMode;
  theme: ThemeName;
}

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeName;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemeName) => void;
}

export const THEME_PRESETS: Record<ThemeName, { label: string; emoji: string; accentDark: string; accentLight: string; description: string }> = {
  midnight_pulse: { label: 'Midnight Pulse', emoji: '🟣', accentDark: '#a855f7', accentLight: '#9333ea', description: 'Purple & Blue' },
  emerald_strike: { label: 'Emerald Strike', emoji: '🟢', accentDark: '#22c55e', accentLight: '#16a34a', description: 'Green & Lime' },
  crimson_edge: { label: 'Crimson Edge', emoji: '🔴', accentDark: '#ef4444', accentLight: '#dc2626', description: 'Red & Crimson' },
  ocean_flow: { label: 'Ocean Flow', emoji: '🔵', accentDark: '#3b82f6', accentLight: '#2563eb', description: 'Blue & Cyan' },
};

function getStoredAppearance(): AppearanceState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if ((parsed.mode === 'dark' || parsed.mode === 'light') && parsed.theme in THEME_PRESETS) {
        return parsed;
      }
    }
  } catch {}
  return { mode: 'dark', theme: 'midnight_pulse' };
}

function applyThemeToDOM(mode: ThemeMode, theme: ThemeName) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', theme);
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<AppearanceState>(getStoredAppearance);

  // Apply on mount and whenever state changes
  useEffect(() => {
    applyThemeToDOM(appearance.mode, appearance.theme);
  }, [appearance]);

  const persist = useCallback((state: AppearanceState) => {
    setAppearance(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    persist({ ...appearance, mode });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearance.theme, persist]);

  const setTheme = useCallback((theme: ThemeName) => {
    persist({ ...appearance, theme });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearance.mode, persist]);

  return (
    <ThemeContext.Provider value={{ mode: appearance.mode, theme: appearance.theme, setMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

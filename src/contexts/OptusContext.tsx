/**
 * OPTUS ASSISTANT CONTEXT
 *
 * Optus used to be a full page reached from the Support menu. It now lives in
 * a floating bubble that the user opts into from Settings > Preferences, so the
 * toggle and the bubble need to share state across the app.
 *
 * State is a view over the server-backed user preferences; the `useOptus()`
 * API is unchanged, only the storage moved.
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useUserPreferences } from './UserPreferencesContext';

interface OptusContextType {
  /** Whether the floating assistant bubble is shown. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const OptusContext = createContext<OptusContextType | undefined>(undefined);

export const OptusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences } = useUserPreferences();

  // Opt-in: the default is off, so the bubble never appears unannounced.
  const enabled = preferences.optus_enabled;

  const setEnabled = useCallback((next: boolean) => {
    void updatePreferences({ optus_enabled: next });
  }, [updatePreferences]);

  const value = useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);

  return (
    <OptusContext.Provider value={value}>
      {children}
    </OptusContext.Provider>
  );
};

export const useOptus = (): OptusContextType => {
  const context = useContext(OptusContext);
  if (!context) {
    throw new Error('useOptus must be used within an OptusProvider');
  }
  return context;
};

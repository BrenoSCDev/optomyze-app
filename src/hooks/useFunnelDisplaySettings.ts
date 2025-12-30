/**
 * FUNNEL DISPLAY SETTINGS HOOK
 * 
 * Manages visibility settings for the funnel view using localStorage
 */

import { useState, useEffect, useCallback } from 'react';

interface FunnelDisplaySettings {
  showEstimatedValues: boolean;
  showAssignedUser: boolean;
}

const STORAGE_KEYS = {
  SHOW_KPIS: 'funnel_settings_show_kpis',
  SHOW_ASSIGNED_USER: 'funnel_settings_show_assigned_user',
};

const DEFAULT_SETTINGS: FunnelDisplaySettings = {
  showEstimatedValues: true,
  showAssignedUser: true,
};

export const useFunnelDisplaySettings = () => {
  const [settings, setSettings] = useState<FunnelDisplaySettings>(() => {
    // Initialize from localStorage or use defaults
    const showKpis = localStorage.getItem(STORAGE_KEYS.SHOW_KPIS);
    const showAssignedUser = localStorage.getItem(STORAGE_KEYS.SHOW_ASSIGNED_USER);

    return {
      showEstimatedValues: showKpis !== null ? showKpis === 'true' : DEFAULT_SETTINGS.showEstimatedValues,
      showAssignedUser: showAssignedUser !== null ? showAssignedUser === 'true' : DEFAULT_SETTINGS.showAssignedUser,
    };
  });

  // Persist showEstimatedValues changes
  const setShowEstimatedValues = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showEstimatedValues: value }));
    localStorage.setItem(STORAGE_KEYS.SHOW_KPIS, String(value));
  }, []);

  // Persist showAssignedUser changes
  const setShowAssignedUser = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showAssignedUser: value }));
    localStorage.setItem(STORAGE_KEYS.SHOW_ASSIGNED_USER, String(value));
  }, []);

  return {
    settings,
    setShowEstimatedValues,
    setShowAssignedUser,
  };
};

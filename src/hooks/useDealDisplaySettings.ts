/**
 * DEAL FUNNEL DISPLAY SETTINGS HOOK
 * 
 * Manages visibility settings for deal funnel views using localStorage.
 * Controls: show products, show charges/discounts.
 */

import { useState, useCallback } from 'react';

interface DealDisplaySettings {
  showProducts: boolean;
  showCharges: boolean;
}

const STORAGE_KEYS = {
  SHOW_PRODUCTS: 'deal_funnel_show_products',
  SHOW_CHARGES: 'deal_funnel_show_charges',
};

const DEFAULT_SETTINGS: DealDisplaySettings = {
  showProducts: true,
  showCharges: true,
};

export const useDealDisplaySettings = () => {
  const [settings, setSettings] = useState<DealDisplaySettings>(() => {
    const showProducts = localStorage.getItem(STORAGE_KEYS.SHOW_PRODUCTS);
    const showCharges = localStorage.getItem(STORAGE_KEYS.SHOW_CHARGES);

    return {
      showProducts: showProducts !== null ? showProducts === 'true' : DEFAULT_SETTINGS.showProducts,
      showCharges: showCharges !== null ? showCharges === 'true' : DEFAULT_SETTINGS.showCharges,
    };
  });

  const setShowProducts = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showProducts: value }));
    localStorage.setItem(STORAGE_KEYS.SHOW_PRODUCTS, String(value));
  }, []);

  const setShowCharges = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showCharges: value }));
    localStorage.setItem(STORAGE_KEYS.SHOW_CHARGES, String(value));
  }, []);

  return {
    settings,
    setShowProducts,
    setShowCharges,
  };
};

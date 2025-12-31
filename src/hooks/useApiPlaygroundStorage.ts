/**
 * API Playground Local Storage Hook
 * Manages persistence of API Playground state in localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiRequest, Collection, Environment, KeyValuePair } from '@/components/api/playground/types';

// Storage keys namespace
const STORAGE_PREFIX = 'api-playground';
const STORAGE_KEYS = {
  HISTORY: `${STORAGE_PREFIX}-history`,
  COLLECTIONS: `${STORAGE_PREFIX}-collections`,
  VARIABLES: `${STORAGE_PREFIX}-variables`,
  ENVIRONMENT: `${STORAGE_PREFIX}-environment`,
  LAST_REQUEST: `${STORAGE_PREFIX}-last-request`,
  SETTINGS: `${STORAGE_PREFIX}-settings`,
} as const;

// Types for stored data
export interface StoredVariable {
  id: string;
  key: string;
  value: string;
  isEnvironment: boolean;
}

export interface PlaygroundSettings {
  showHistoryPanel: boolean;
  activeTab: string;
}

// Helper functions
const safeJsonParse = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

const safeLocalStorageGet = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return safeJsonParse(item, fallback);
  } catch {
    return fallback;
  }
};

const safeLocalStorageSet = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
};

// Main hook
export const useApiPlaygroundStorage = () => {
  // History state
  const [history, setHistoryState] = useState<ApiRequest[]>(() =>
    safeLocalStorageGet(STORAGE_KEYS.HISTORY, [])
  );

  // Collections state
  const [collections, setCollectionsState] = useState<Collection[]>(() =>
    safeLocalStorageGet(STORAGE_KEYS.COLLECTIONS, [])
  );

  // Variables state
  const [variables, setVariablesState] = useState<StoredVariable[]>(() =>
    safeLocalStorageGet(STORAGE_KEYS.VARIABLES, [
      { id: 'var-1', key: 'base_url', value: 'https://api.example.com', isEnvironment: true },
      { id: 'var-2', key: 'token', value: '', isEnvironment: true },
    ])
  );

  // Environment state
  const [environment, setEnvironmentState] = useState<Environment>(() =>
    safeLocalStorageGet(STORAGE_KEYS.ENVIRONMENT, 'dev' as Environment)
  );

  // Last request state
  const [lastRequest, setLastRequestState] = useState<ApiRequest | null>(() =>
    safeLocalStorageGet(STORAGE_KEYS.LAST_REQUEST, null)
  );

  // Settings state
  const [settings, setSettingsState] = useState<PlaygroundSettings>(() =>
    safeLocalStorageGet(STORAGE_KEYS.SETTINGS, {
      showHistoryPanel: true,
      activeTab: 'headers',
    })
  );

  // Persist history changes
  const setHistory = useCallback((historyOrUpdater: ApiRequest[] | ((prev: ApiRequest[]) => ApiRequest[])) => {
    setHistoryState(prev => {
      const newHistory = typeof historyOrUpdater === 'function' 
        ? historyOrUpdater(prev) 
        : historyOrUpdater;
      safeLocalStorageSet(STORAGE_KEYS.HISTORY, newHistory.slice(0, 100)); // Limit to 100 items
      return newHistory.slice(0, 100);
    });
  }, []);

  // Persist collections changes
  const setCollections = useCallback((collectionsOrUpdater: Collection[] | ((prev: Collection[]) => Collection[])) => {
    setCollectionsState(prev => {
      const newCollections = typeof collectionsOrUpdater === 'function' 
        ? collectionsOrUpdater(prev) 
        : collectionsOrUpdater;
      safeLocalStorageSet(STORAGE_KEYS.COLLECTIONS, newCollections);
      return newCollections;
    });
  }, []);

  // Persist variables changes
  const setVariables = useCallback((variablesOrUpdater: StoredVariable[] | ((prev: StoredVariable[]) => StoredVariable[])) => {
    setVariablesState(prev => {
      const newVariables = typeof variablesOrUpdater === 'function' 
        ? variablesOrUpdater(prev) 
        : variablesOrUpdater;
      safeLocalStorageSet(STORAGE_KEYS.VARIABLES, newVariables);
      return newVariables;
    });
  }, []);

  // Persist environment changes
  const setEnvironment = useCallback((env: Environment) => {
    setEnvironmentState(env);
    safeLocalStorageSet(STORAGE_KEYS.ENVIRONMENT, env);
  }, []);

  // Persist last request changes
  const setLastRequest = useCallback((request: ApiRequest | null) => {
    setLastRequestState(request);
    safeLocalStorageSet(STORAGE_KEYS.LAST_REQUEST, request);
  }, []);

  // Persist settings changes
  const setSettings = useCallback((settingsOrUpdater: PlaygroundSettings | ((prev: PlaygroundSettings) => PlaygroundSettings)) => {
    setSettingsState(prev => {
      const newSettings = typeof settingsOrUpdater === 'function' 
        ? settingsOrUpdater(prev) 
        : settingsOrUpdater;
      safeLocalStorageSet(STORAGE_KEYS.SETTINGS, newSettings);
      return newSettings;
    });
  }, []);

  // Clear all playground data
  const clearAllData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key} from localStorage`, error);
      }
    });
    setHistoryState([]);
    setCollectionsState([]);
    setVariablesState([
      { id: 'var-1', key: 'base_url', value: 'https://api.example.com', isEnvironment: true },
      { id: 'var-2', key: 'token', value: '', isEnvironment: true },
    ]);
    setEnvironmentState('dev');
    setLastRequestState(null);
    setSettingsState({ showHistoryPanel: true, activeTab: 'headers' });
  }, []);

  // Clear only history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  // Add to history
  const addToHistory = useCallback((request: ApiRequest) => {
    setHistory(prev => [request, ...prev.filter(r => r.id !== request.id)]);
  }, [setHistory]);

  // Get variable value by key
  const getVariableValue = useCallback((key: string): string => {
    const variable = variables.find(v => v.key === key);
    return variable?.value || '';
  }, [variables]);

  // Replace variables in text
  const replaceVariables = useCallback((text: string): string => {
    let result = text;
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  }, [variables]);

  return {
    // State
    history,
    collections,
    variables,
    environment,
    lastRequest,
    settings,
    
    // Setters
    setHistory,
    setCollections,
    setVariables,
    setEnvironment,
    setLastRequest,
    setSettings,
    
    // Actions
    clearAllData,
    clearHistory,
    addToHistory,
    getVariableValue,
    replaceVariables,
  };
};

export default useApiPlaygroundStorage;

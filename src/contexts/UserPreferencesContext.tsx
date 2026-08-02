/**
 * USER PREFERENCES
 *
 * Preferences live on the server so they follow a user between machines and
 * survive clearing site data. They used to be five separate localStorage keys.
 *
 * localStorage is still written, but only as a **cache for first paint**: the
 * theme has to be applied before the first frame, and waiting on a round trip
 * would flash the wrong colour scheme on every load. The server is always the
 * authority — the cached copy is overwritten as soon as the fetch lands.
 *
 * Writes are optimistic and rolled back on failure, so toggling a switch never
 * waits on the network.
 */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext';

export type ThemeMode = 'dark' | 'light';
export type PreferenceLanguage = 'en' | 'pt-BR' | 'de' | 'es';
export type SearchTargetId = 'leads' | 'deals' | 'users' | 'menu';

export interface UserPreferences {
  theme: ThemeMode;
  language: PreferenceLanguage;
  optus_enabled: boolean;
  notification_sound: string;
  default_search_target: SearchTargetId;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  language: 'en',
  optus_enabled: false,
  notification_sound: 'default',
  default_search_target: 'leads',
};

/** First-paint cache only — never the source of truth. */
const CACHE_KEY = 'optomyze_preferences_cache';

export const readCachedPreferences = (): UserPreferences => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const writeCache = (prefs: UserPreferences) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prefs));
  } catch { /* private mode — the server copy still persists */ }
};

/**
 * Preferences the visitor changed *before* signing in.
 *
 * The auth screens let you switch theme and language without an account, so
 * those writes have nowhere to go but localStorage. On sign-in the server copy
 * would normally win — which would silently throw away the choice just made.
 * Recording which keys were touched lets the reconcile step push exactly those
 * to the account and leave everything else alone.
 */
const PENDING_KEY = 'optomyze_preferences_pending';

const readPendingKeys = (): (keyof UserPreferences)[] => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writePendingKeys = (keys: (keyof UserPreferences)[]) => {
  try {
    if (keys.length) {
      localStorage.setItem(PENDING_KEY, JSON.stringify([...new Set(keys)]));
    } else {
      localStorage.removeItem(PENDING_KEY);
    }
  } catch { /* private mode */ }
};

export const clearPendingPreferences = () => writePendingKeys([]);

interface UserPreferencesContextType {
  preferences: UserPreferences;
  /** False until the server copy has landed. */
  loaded: boolean;
  saving: boolean;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth() as { isAuthenticated: boolean; isLoading: boolean };

  const [preferences, setPreferences] = useState<UserPreferences>(readCachedPreferences);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Guards against a stale response overwriting a newer optimistic write. */
  const writeSeq = useRef(0);

  /**
   * Pull the account's preferences once signed in, reconciling anything the
   * visitor changed on the auth screens beforehand.
   *
   * Keyed on isAuthenticated so it covers both a fresh sign-in and a page
   * refresh with an existing session.
   */
  useEffect(() => {
    // Wait for AuthContext to finish reading its stored session, or the first
    // pass would look unauthenticated and skip the fetch.
    if (isLoading) return;

    let cancelled = false;

    if (!isAuthenticated) {
      // Auth screens: the cached copy is all there is, and it is authoritative
      // until an account is attached to it.
      setLoaded(true);
      return;
    }

    const seqAtStart = writeSeq.current;

    api.get('/api/user/preferences')
      .then(async res => {
        // A write that started after this fetch wins — otherwise the server's
        // pre-write state would clobber what the user just chose.
        if (cancelled || writeSeq.current !== seqAtStart) return;

        const server = { ...DEFAULT_PREFERENCES, ...(res.data?.data ?? {}) };
        const pending = readPendingKeys();

        if (!pending.length) {
          setPreferences(server);
          writeCache(server);
          return;
        }

        // Overlay only the keys touched before sign-in, then persist exactly
        // those to the account so the choice survives the next login.
        const cached = readCachedPreferences();
        const overlay = Object.fromEntries(
          pending.filter(key => key in cached).map(key => [key, cached[key]]),
        ) as Partial<UserPreferences>;

        const merged = { ...server, ...overlay };
        setPreferences(merged);
        writeCache(merged);

        try {
          await api.put('/api/user/preferences', overlay);
        } catch { /* keep the local choice; it will retry on the next change */ }

        writePendingKeys([]);
      })
      .catch(() => { /* offline — carry on with the cached copy */ })
      .finally(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading]);

  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    writeSeq.current += 1;

    // Optimistic: a switch must move the instant it is clicked.
    const previous = preferences;
    const next = { ...preferences, ...patch };
    setPreferences(next);
    writeCache(next);

    // Signed out (auth screens): there is no account to write to. Remember
    // which keys were changed so sign-in can carry them onto the account.
    if (!isAuthenticated) {
      writePendingKeys([...readPendingKeys(), ...(Object.keys(patch) as (keyof UserPreferences)[])]);
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/api/user/preferences', patch);

      const confirmed = { ...DEFAULT_PREFERENCES, ...(res.data?.data ?? next) };
      setPreferences(confirmed);
      writeCache(confirmed);
    } catch (error) {
      setPreferences(previous);
      writeCache(previous);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [preferences, isAuthenticated]);

  const resetPreferences = useCallback(async () => {
    writeSeq.current += 1;
    try {
      setSaving(true);
      const res = await api.delete('/api/user/preferences');
      const fresh = { ...DEFAULT_PREFERENCES, ...(res.data?.data ?? {}) };
      setPreferences(fresh);
      writeCache(fresh);
    } finally {
      setSaving(false);
    }
  }, []);

  const value = useMemo(
    () => ({ preferences, loaded, saving, updatePreferences, resetPreferences }),
    [preferences, loaded, saving, updatePreferences, resetPreferences],
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return ctx;
};

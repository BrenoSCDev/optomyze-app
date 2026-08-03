/**
 * CALENDARS CONTEXT
 *
 * Owns the company's calendar list and which one is being viewed, so the
 * toolbar switcher, the manager sheet and the grid never disagree about it.
 *
 * The selection is remembered per company, not globally: the same browser can
 * hold accounts in several companies, and restoring calendar 7 after switching
 * tenants would either 404 or — worse — silently show nothing. Keying the
 * stored value by company id makes a stale entry impossible to misapply.
 *
 * `selectedIds` is an array even though the UI selects one at a time. The
 * overlay view (several calendars on one grid) is a stated next step, and the
 * API already accepts a list, so the only thing that would need to change is
 * the picker.
 */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { Calendar, CalendarPayload, calendarService } from '@/services/calendarApi';
import { useAuth } from './AuthContext';

const STORAGE_PREFIX = 'optomyze_calendar_selected';

const readStored = (companyId?: number | null): number | null => {
  if (!companyId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_${companyId}`);
    return raw ? Number(raw) || null : null;
  } catch {
    return null; // private mode
  }
};

const writeStored = (companyId: number | null | undefined, id: number | null) => {
  if (!companyId) return;
  try {
    if (id === null) localStorage.removeItem(`${STORAGE_PREFIX}_${companyId}`);
    else localStorage.setItem(`${STORAGE_PREFIX}_${companyId}`, String(id));
  } catch { /* the choice just won't outlive the tab */ }
};

interface CalendarsContextType {
  calendars: Calendar[];
  loading: boolean;
  /** The calendar currently being viewed. Null only before the first load. */
  selected: Calendar | null;
  selectedIds: number[];
  select: (id: number) => void;
  reload: () => Promise<void>;
  create: (payload: CalendarPayload) => Promise<Calendar>;
  update: (id: number, payload: CalendarPayload) => Promise<Calendar>;
  makeDefault: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const CalendarsContext = createContext<CalendarsContextType | undefined>(undefined);

export const CalendarsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const companyId = (user as { company_id?: number } | null)?.company_id ?? null;

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await calendarService.list();
      setCalendars(list);

      // Restore the remembered calendar, but only if it still exists and is
      // still active — otherwise fall back to the default rather than showing
      // an empty grid for a calendar that was archived or deleted elsewhere.
      setSelectedId(current => {
        const candidate = current ?? readStored(companyId);
        const usable = list.find(c => c.id === candidate);

        return usable ? usable.id : (list.find(c => c.is_default) ?? list[0])?.id ?? null;
      });
    } catch {
      setCalendars([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Signing out or switching company must not leave the previous tenant's
      // calendars — or its selection — in memory.
      setCalendars([]);
      setSelectedId(null);
      return;
    }
    void load();
  }, [isAuthenticated, load]);

  const select = useCallback((id: number) => {
    setSelectedId(id);
    writeStored(companyId, id);
  }, [companyId]);

  const create = useCallback(async (payload: CalendarPayload) => {
    const created = await calendarService.create(payload);
    await load();
    // Jump straight to what was just made; creating one is an act of intent.
    select(created.id);
    return created;
  }, [load, select]);

  const update = useCallback(async (id: number, payload: CalendarPayload) => {
    const updated = await calendarService.update(id, payload);
    await load();
    return updated;
  }, [load]);

  const makeDefault = useCallback(async (id: number) => {
    await calendarService.makeDefault(id);
    await load();
  }, [load]);

  const remove = useCallback(async (id: number) => {
    const { moved_to_calendar_id: movedTo } = await calendarService.remove(id);

    // Follow the records: whoever was looking at the deleted calendar should
    // land where its appointments went, not on a blank screen.
    if (selectedId === id) select(movedTo);

    await load();
  }, [load, select, selectedId]);

  const selected = useMemo(
    () => calendars.find(c => c.id === selectedId) ?? null,
    [calendars, selectedId]
  );

  const value = useMemo(() => ({
    calendars,
    loading,
    selected,
    selectedIds: selectedId ? [selectedId] : [],
    select,
    reload: load,
    create,
    update,
    makeDefault,
    remove,
  }), [calendars, loading, selected, selectedId, select, load, create, update, makeDefault, remove]);

  return <CalendarsContext.Provider value={value}>{children}</CalendarsContext.Provider>;
};

export const useCalendars = (): CalendarsContextType => {
  const context = useContext(CalendarsContext);
  if (!context) {
    throw new Error('useCalendars must be used within a CalendarsProvider');
  }
  return context;
};

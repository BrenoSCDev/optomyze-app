/**
 * QUICKSTART CONTEXT
 *
 * Shared so the sidebar and the panel see the same checklist: the sidebar
 * needs to know whether to show the entry at all, and the panel changes the
 * very state that decides it. Fetching in both places would let the menu keep
 * an item the user had just dismissed.
 *
 * The checklist belongs to the company, not the user, so it is loaded once per
 * session rather than per screen.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Quickstart, QuickstartStep, quickstartService } from '@/services/quickstartApi';
import { useAuth } from './AuthContext';

interface QuickstartContextType {
  quickstart: Quickstart | null;
  loading: boolean;
  /** True while the checklist should occupy its slot at the top of the menu. */
  visible: boolean;
  setStepCompleted: (step: QuickstartStep, completed: boolean) => Promise<void>;
  dismiss: () => Promise<void>;
  /** Puts a dismissed checklist back in the menu, ticked steps intact. */
  restore: () => Promise<void>;
}

const QuickstartContext = createContext<QuickstartContextType | undefined>(undefined);

export const QuickstartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [quickstart, setQuickstart] = useState<Quickstart | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Switching companies or signing out must not leave the previous
      // company's checklist in the menu.
      setQuickstart(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    quickstartService.get()
      .then(data => { if (!cancelled) setQuickstart(data); })
      .catch(() => { if (!cancelled) setQuickstart(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const setStepCompleted = useCallback(async (step: QuickstartStep, completed: boolean) => {
    // Optimistic: ticking a box should feel instant, and the server response
    // replaces this a moment later either way.
    setQuickstart(prev => prev && {
      ...prev,
      completed_steps: completed
        ? prev.steps.filter(s => s === step || prev.completed_steps.includes(s))
        : prev.completed_steps.filter(s => s !== step),
    });

    try {
      setQuickstart(await quickstartService.setStepCompleted(step, completed));
    } catch {
      // Put the truth back if the write failed.
      setQuickstart(await quickstartService.get().catch(() => null));
    }
  }, []);

  const dismiss = useCallback(async () => {
    setQuickstart(await quickstartService.setDismissed(true));
  }, []);

  const restore = useCallback(async () => {
    setQuickstart(await quickstartService.setDismissed(false));
  }, []);

  const visible = !!quickstart && !quickstart.dismissed;

  const value = useMemo(
    () => ({ quickstart, loading, visible, setStepCompleted, dismiss, restore }),
    [quickstart, loading, visible, setStepCompleted, dismiss, restore]
  );

  return (
    <QuickstartContext.Provider value={value}>
      {children}
    </QuickstartContext.Provider>
  );
};

export const useQuickstart = (): QuickstartContextType => {
  const context = useContext(QuickstartContext);
  if (!context) {
    throw new Error('useQuickstart must be used within a QuickstartProvider');
  }
  return context;
};

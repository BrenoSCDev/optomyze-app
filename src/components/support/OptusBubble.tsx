/**
 * OPTUS BUBBLE
 *
 * Floating launcher for the Optus assistant, shown in the corner of every
 * authenticated screen once enabled in Settings > Preferences.
 *
 * The launcher is painted in the sidebar's colours rather than the theme
 * primary. The sidebar rail is dark navy in *both* light and dark mode, so
 * this keeps the bubble reading as part of the app's chrome instead of
 * flipping to a near-white circle in dark mode.
 *
 * Sits lower than a typical launcher (`bottom-2`): funnel and table screens
 * put pagination controls along the bottom of the content area, and at
 * `bottom-5` the bubble covered them. Low keeps it clear of both those and the
 * horizontal scrollbar; the right gutter is deliberately tight so it hugs the
 * edge of the viewport rather than floating over content.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOptus } from '@/contexts/OptusContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import OptusChat from './OptusChat';

const OptusBubble = () => {
  const { enabled } = useOptus();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  // Esc closes the panel, matching every other overlay in the app — unless a
  // dialog is open on top of it (the clear-conversation confirmation), in
  // which case Esc belongs to that dialog and the panel must stay put.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[role="alertdialog"][data-state="open"], [role="dialog"][data-state="open"]')) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Turning the preference off while the panel is open should close it.
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  if (!enabled || !isAuthenticated) return null;

  return createPortal(
    <div className="fixed bottom-2 right-1 z-[80] flex flex-col items-end gap-3 sm:right-2">
      <AnimatePresence>
        {open && (
          <motion.div
            key="optus-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="flex h-[min(44rem,calc(100dvh-6rem))] w-[min(30rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-elevation-xl"
          >
            <OptusChat />
          </motion.div>
        )}
      </AnimatePresence>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? t('optus.bubble.close') : t('optus.bubble.open')}
            aria-expanded={open}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-sidebar text-sidebar-foreground-active border border-sidebar-border shadow-elevation-lg transition-colors duration-fast ease-standard hover:bg-sidebar-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {open ? t('optus.bubble.close') : t('optus.bubble.open')}
        </TooltipContent>
      </Tooltip>
    </div>,
    document.body
  );
};

export default OptusBubble;

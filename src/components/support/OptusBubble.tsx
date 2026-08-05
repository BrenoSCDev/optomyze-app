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
 * Sits low (`bottom-4`) rather than at a typical launcher height: funnel and
 * table screens put pagination controls along the bottom of the content area,
 * and at `bottom-5` the bubble covered them.
 *
 * `right-4` is a floor, not a preference. A scroll gutter is 12px at its
 * widest — the app shell's own scrollbar, or the document scrollbar on the
 * routes that still scroll the page — so anything tighter parks the launcher
 * on top of it. 16px clears the widest gutter with room to spare and keeps the
 * bubble reading as chrome floating over the app rather than as part of it.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOptus } from '@/contexts/OptusContext';
import { isPublicRoute } from '@/lib/publicRoutes';
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

  // A signed-in user opening a booking link in the same browser is still a
  // visitor on that page — internal chrome has no business there.
  if (!enabled || !isAuthenticated || isPublicRoute()) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="optus-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="flex h-[min(44rem,calc(100dvh-6rem))] w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-elevation-xl"
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

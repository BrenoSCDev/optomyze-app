/**
 * WIDGETS SLAB
 *
 * Slide-up full-screen panel that hosts the Widgets hub, so widgets are
 * configured without leaving the Integrations catalog. Each integration card
 * opens it scoped to its own widget type.
 * Matches the pattern used by LeadPreviewModal and FunnelStagesModal.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WidgetsHub from './WidgetsHub';
import { WidgetType } from '../../services/widgetApi';

interface WidgetsSlabProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which widget type this slab manages — set by the integration card. */
  type?: WidgetType;
}

const WidgetsSlab: React.FC<WidgetsSlabProps> = ({ isOpen, onClose, type }) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-overlay backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-[5vh] z-[60] flex flex-col rounded-t-2xl border border-primary/20 bg-background overflow-hidden"
          >
            <div className="flex items-center justify-end p-4 pb-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-dark">
              <WidgetsHub isEmbedded type={type} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default WidgetsSlab;

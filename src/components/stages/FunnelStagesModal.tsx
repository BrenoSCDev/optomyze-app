/**
 * FUNNEL STAGES MODAL
 * 
 * Slide-up full-screen modal wrapper for FunnelStages component.
 * Matches the pattern used by DealPreviewModal and LeadPreviewModal.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FunnelStages from './FunnelStages';

interface FunnelStagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string | null;
}

const FunnelStagesModal: React.FC<FunnelStagesModalProps> = ({ isOpen, onClose, funnelId }) => {
  return (
    <AnimatePresence>
      {isOpen && funnelId && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-[5vh] z-50 flex flex-col rounded-t-2xl border border-primary/20 bg-background overflow-hidden"
          >
            {/* Close button */}
            <div className="flex items-center justify-end p-4 pb-0">
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-dark">
              <FunnelStages
                funnelIdProp={funnelId}
                onBack={onClose}
                isEmbedded
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FunnelStagesModal;

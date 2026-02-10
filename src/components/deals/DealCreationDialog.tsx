/**
 * DEAL CREATION DIALOG
 * 
 * Simple dialog for creating a new deal within a deal funnel.
 */

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface DealCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string;
  stages: any[];
  selectedStageId?: string;
  onDealCreated: () => void;
}

export const DealCreationDialog: React.FC<DealCreationDialogProps> = ({
  isOpen,
  onClose,
  funnelId,
  stages,
  selectedStageId,
  onDealCreated,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    stage_id: '',
    notes: '',
  });

  useEffect(() => {
    if (selectedStageId) {
      setFormData(prev => ({ ...prev, stage_id: selectedStageId }));
    } else if (stages.length > 0) {
      setFormData(prev => ({ ...prev, stage_id: stages[0].id.toString() }));
    }
  }, [stages, selectedStageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.stage_id) {
      toast({ title: 'Validation Error', description: 'Deal name and stage are required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await dealFunnelService.createDeal({
        name: formData.name,
        funnel_id: parseInt(funnelId),
        stage_id: parseInt(formData.stage_id),
        notes: formData.notes || undefined,
      });
      toast({ title: 'Success', description: 'Deal created successfully.' });
      setFormData({ name: '', stage_id: formData.stage_id, notes: '' });
      onDealCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({ title: 'Error', description: 'Failed to create deal.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-deal/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-deal">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Create New Deal</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" disabled={isSubmitting}>
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Deal Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter deal name..."
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white placeholder:text-white/50 focus:outline-none focus:border-deal transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Stage *</label>
              <select
                value={formData.stage_id}
                onChange={(e) => setFormData(prev => ({ ...prev, stage_id: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white focus:outline-none focus:border-deal transition-colors"
                disabled={isSubmitting}
              >
                {sortedStages.map((stage) => (
                  <option key={stage.id} value={stage.id.toString()} className="bg-gray-800">
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white placeholder:text-white/50 focus:outline-none focus:border-deal transition-colors resize-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white hover:bg-deal/10 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-deal text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

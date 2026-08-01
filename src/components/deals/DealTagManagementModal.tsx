/**
 * DEAL TAG MANAGEMENT MODAL
 *
 * Replicates the LeadTagManagementModal but calls the deal tags API endpoint.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MultiSelect from '@/components/ui/multi-select';
import TagBadge from '@/components/tags/TagBadge';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { toast } from 'sonner';
import { Tag } from '@/types/tags';

interface Deal {
  id: string;
  name?: string;
  tags?: Tag[];
  [key: string]: any;
}

interface DealTagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  availableTags: Tag[];
  onTagsUpdated?: (dealId: string, updatedDeal: any) => void;
}

const DealTagManagementModal = ({
  isOpen,
  onClose,
  deal,
  availableTags,
  onTagsUpdated,
}: DealTagManagementModalProps) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deal && isOpen && availableTags.length > 0) {
      const dealTagIds = deal.tags?.map(tag => tag.id) || [];
      const matching = availableTags.filter(t => dealTagIds.includes(t.id));
      setSelectedTags(matching);
    } else if (!isOpen) {
      setSelectedTags([]);
    }
  }, [deal, isOpen, availableTags]);

  const handleApply = async () => {
    if (!deal) return;
    setIsLoading(true);
    try {
      const response = await dealFunnelService.updateDealTags(deal.id, selectedTags.map(tag => tag.id));
      onTagsUpdated?.(deal.id, response.deal || response);
      toast.success('Tags updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update deal tags:', error);
      toast.error('Failed to update tags', {
        description: 'There was an error updating the tags. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-popover backdrop-blur-md rounded-lg border border-border w-full max-w-md mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Manage Tags</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {deal ? deal.name : 'Select tags for this deal'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Select Tags</label>
                <MultiSelect
                  options={availableTags}
                  selected={selectedTags}
                  onChange={(opts) => setSelectedTags(opts as Tag[])}
                  placeholder="Choose tags for this deal..."
                  searchPlaceholder="Search available tags..."
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {selectedTags.length > 0 && (
                <div className="mt-4 p-3 bg-deal/10 rounded-lg border border-deal/20">
                  <p className="text-sm font-medium text-deal mb-2">
                    Selected Tags ({selectedTags.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <TagBadge
                        key={tag.id}
                        tag={tag}
                        removeDisabled={isLoading}
                        onRemove={() => setSelectedTags(prev => prev.filter(t => t.id !== tag.id))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-deal">
                  <div className="animate-spin w-4 h-4 border-2 border-deal border-t-transparent rounded-full" />
                  <span className="text-sm">Updating tags...</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="px-4 py-2 bg-deal text-white rounded-lg hover:bg-deal/80 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : `Apply Tags (${selectedTags.length})`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DealTagManagementModal;

/**
 * TAG MANAGEMENT MODAL COMPONENT
 *
 * Modal for managing tags on leads with multi-select functionality
 */

import { useState, useEffect } from 'react';
import { Tags } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import MultiSelect from '@/components/ui/multi-select';
import TagBadge from '@/components/tags/TagBadge';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';
import { Tag } from '@/types/tags';

interface Lead {
  id: string;
  name: string;
  tags?: Tag[];
  [key: string]: any;
}

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  availableTags: Tag[];
  onTagsUpdated?: (leadId: string, updatedLead: any) => void;
}

const TagManagementModal = ({
  isOpen,
  onClose,
  lead,
  availableTags,
  onTagsUpdated
}: TagManagementModalProps) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize selected tags when modal opens
  useEffect(() => {
    if (lead && isOpen && availableTags.length > 0) {
      const leadTagIds = lead.tags?.map(tag => tag.id) || [];

      // Find matching tags from availableTags based on id comparison
      const matchingTags = availableTags.filter(availableTag =>
        leadTagIds.includes(availableTag.id)
      );

      setSelectedTags(matchingTags);
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedTags([]);
    }
  }, [lead, isOpen, availableTags]);

  const handleTagsChange = (newSelectedTags: Tag[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleApplyTags = async () => {
    if (!lead) return;

    setIsLoading(true);
    try {
      // Send tag IDs to API and get updated lead data back
      const response = await leadService.updateLeadTags(lead.id, selectedTags.map(tag => tag.id));

      // Use the returned lead data from the API response
      const updatedLead = response.lead || response;

      // Update parent component with the complete updated lead data
      if (onTagsUpdated) {
        onTagsUpdated(lead.id, updatedLead);
      }

      toast.success('Tags updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update tags:', error);
      toast.error('Failed to update tags', {
        description: 'There was an error updating the tags. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Manage Tags
          </DialogTitle>
          <DialogDescription>
            {lead ? `Select tags for ${lead.name}` : 'Select tags for this lead'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Tags</Label>
            <MultiSelect
              options={availableTags}
              selected={selectedTags}
              onChange={handleTagsChange}
              placeholder="Choose tags for this lead..."
              searchPlaceholder="Search available tags..."
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Selected Tags Preview */}
          {selectedTags.length > 0 && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyTags}
            disabled={isLoading}
            className="bg-gradient-primary hover:opacity-90 text-white"
          >
            {isLoading ? 'Updating...' : `Apply Tags (${selectedTags.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagManagementModal;

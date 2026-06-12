/**
 * TAG MANAGEMENT MODAL COMPONENT
 *
 * Modal for managing tags on leads with multi-select functionality
 */

import { useState, useEffect } from 'react';
import { X, Tags } from 'lucide-react';
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
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';

interface Tag {
  id: number;
  company_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: string;
  name: string;
  tags?: (string | { id: number; name: string; [key: string]: any })[];
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
      // Get current lead tag names (handle both string and object formats)
      const leadTagNames = lead.tags?.map(tag =>
        typeof tag === 'string' ? tag : tag.name
      ) || [];

      // Find matching tags from availableTags based on name comparison
      const matchingTags = availableTags.filter(availableTag =>
        leadTagNames.includes(availableTag.name)
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
      // Send tags to API and get updated lead data back
      const response = await leadService.updateLeadTags(lead.id, selectedTags);

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
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400 text-xs"
                  >
                    {tag.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
                      }}
                      className="hover:text-purple-900 dark:hover:text-purple-300"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
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

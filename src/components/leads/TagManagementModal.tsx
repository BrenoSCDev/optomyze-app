/**
 * TAG MANAGEMENT MODAL COMPONENT
 * 
 * Modal for managing tags on leads with multi-select functionality
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Tag
} from 'lucide-react';
import MultiSelect from '@/components/ui/multi-select';

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
  tags?: string[];
  [key: string]: any;
}

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  availableTags: Tag[];
}

const TagManagementModal = ({ 
  isOpen, 
  onClose, 
  lead, 
  availableTags 
}: TagManagementModalProps) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Initialize selected tags when modal opens
  useEffect(() => {
    if (lead && isOpen) {
      // For now, just initialize empty - will add current lead tags later
      setSelectedTags([]);
    }
  }, [lead, isOpen]);

  const handleTagsChange = (newSelectedTags: Tag[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleApplyTags = () => {
    // For now, just log and close - will add save functionality later
    console.log('Selected tags:', selectedTags);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black/80 backdrop-blur-md rounded-lg border border-white/10 w-full max-w-md mx-4"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h3 className="text-xl font-semibold text-white">Manage Tags</h3>
              <p className="text-gray-400 text-sm mt-1">
                {lead ? `${lead.name}` : 'Select tags for this lead'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Select Tags
                </label>
                
                <MultiSelect
                  options={availableTags}
                  selected={selectedTags}
                  onChange={handleTagsChange}
                  placeholder="Choose tags for this lead..."
                  searchPlaceholder="Search available tags..."
                  className="w-full"
                />
              </div>
              
              {/* Selected Tags Preview */}
              {selectedTags.length > 0 && (
                <div className="mt-4 p-3 bg-purple-600/10 rounded-lg border border-purple-600/20">
                  <p className="text-sm font-medium text-purple-300 mb-2">
                    Selected Tags ({selectedTags.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 text-xs"
                      >
                        {tag.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
                          }}
                          className="hover:text-purple-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyTags}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Apply Tags ({selectedTags.length})
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TagManagementModal;
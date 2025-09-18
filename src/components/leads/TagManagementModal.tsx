/**
 * TAG MANAGEMENT MODAL COMPONENT
 * 
 * Modal for managing tags on leads with multi-select functionality
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Tag
} from 'lucide-react';

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

  const handleTagToggle = (tag: Tag) => {
    setSelectedTags(prev => {
      const isSelected = prev.find(t => t.id === tag.id);
      if (isSelected) {
        // Remove tag
        return prev.filter(t => t.id !== tag.id);
      } else {
        // Add tag
        return [...prev, tag];
      }
    });
  };

  const isTagSelected = (tag: Tag) => {
    return selectedTags.find(t => t.id === tag.id) !== undefined;
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
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white mb-3">
                Available Tags
              </label>
              
              {/* Tags List */}
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                {availableTags.length > 0 ? (
                  availableTags.map((tag) => (
                    <motion.div
                      key={tag.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTagToggle(tag)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${isTagSelected(tag) 
                          ? 'bg-purple-600/20 border-purple-400/50 text-purple-300' 
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                        }
                        border
                      `}
                    >
                      {/* Checkbox */}
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        ${isTagSelected(tag) 
                          ? 'border-purple-400 bg-purple-600' 
                          : 'border-gray-400'
                        }
                      `}>
                        {isTagSelected(tag) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      {/* Tag Name */}
                      <span className="flex-1 font-medium">
                        {tag.name}
                      </span>
                      
                      {/* Tag Icon */}
                      <Tag className="w-4 h-4 opacity-60" />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No tags available</p>
                    <p className="text-sm">Create tags in settings to get started</p>
                  </div>
                )}
              </div>
              
              {/* Selected Tags Preview */}
              {selectedTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-purple-600/10 rounded-lg border border-purple-600/20"
                >
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
                            handleTagToggle(tag);
                          }}
                          className="hover:text-purple-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </motion.div>
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
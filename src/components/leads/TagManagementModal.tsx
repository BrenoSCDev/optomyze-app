/**
 * TAG MANAGEMENT MODAL
 * 
 * Modal for managing lead tags with multi-select functionality
 */

import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  availableTags: any[];
  onTagsUpdate: (leadId: string, newTags: any[]) => void;
  loading?: boolean;
}

interface MultiSelectTagsProps {
  options: any[];
  selected: any[];
  onChange: (tags: any[]) => void;
  disabled?: boolean;
}

const MultiSelectTags = ({ options, selected, onChange, disabled = false }: MultiSelectTagsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (option: any) => {
    return selected.some(tag => tag.id === option.id);
  };

  const toggleTag = (option: any) => {
    if (disabled) return;
    
    let newSelected;
    if (isSelected(option)) {
      newSelected = selected.filter(tag => tag.id !== option.id);
    } else {
      newSelected = [...selected, option];
    }
    onChange(newSelected);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-all duration-200"
          disabled={disabled}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 max-h-48 overflow-y-auto z-10 shadow-xl">
          {filteredOptions.length > 0 ? (
            <div className="p-2">
              {filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleTag(option)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors
                    ${isSelected(option) 
                      ? 'bg-purple-600/20 text-purple-400' 
                      : 'hover:bg-white/10 text-white'
                    }
                    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded border-2 flex items-center justify-center
                    ${isSelected(option) 
                      ? 'border-purple-400 bg-purple-600' 
                      : 'border-gray-400'
                    }
                  `}>
                    {isSelected(option) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span>{option.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              No tags found
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

let tagUpdateTimeout: NodeJS.Timeout;

const TagManagementModal = ({ 
  isOpen, 
  onClose, 
  lead, 
  availableTags, 
  onTagsUpdate, 
  loading = false 
}: TagManagementModalProps) => {
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  // Initialize selected tags when modal opens or lead changes
  useEffect(() => {
    if (lead && lead.tags) {
      // Convert lead tags to match available tags format
      const currentTags = lead.tags.map((tag: any) => 
        typeof tag === 'string' 
          ? availableTags.find(t => t.name === tag) || { name: tag, id: `temp-${tag}` }
          : tag
      ).filter(Boolean);
      setSelectedTags(currentTags);
    }
  }, [lead, availableTags]);

  const handleTagChange = async (newSelectedTags: any[]) => {
    setSelectedTags(newSelectedTags);
    
    // Debounce the API call
    clearTimeout(tagUpdateTimeout);
    tagUpdateTimeout = setTimeout(async () => {
      await updateLeadTags(newSelectedTags);
    }, 300);
  };

  const updateLeadTags = async (tags: any[]) => {
    if (!lead) return;
    
    try {
      setUpdating(true);
      
      // Update parent component
      onTagsUpdate(lead.id, tags);
      
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
      
      // Revert on error
      if (lead.tags) {
        const revertedTags = lead.tags.map((tag: any) => 
          typeof tag === 'string' 
            ? availableTags.find(t => t.name === tag) || { name: tag, id: `temp-${tag}` }
            : tag
        ).filter(Boolean);
        setSelectedTags(revertedTags);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-black/80 backdrop-blur-md rounded-lg border border-white/10 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h3 className="text-xl font-semibold text-white">Manage Tags</h3>
              <p className="text-gray-400 text-sm mt-1">
                {lead?.name || 'Lead'}
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
                <label className="block text-sm font-medium text-white mb-2">
                  Select Tags
                </label>
                <MultiSelectTags
                  options={availableTags}
                  selected={selectedTags}
                  onChange={handleTagChange}
                  disabled={updating}
                />
              </div>
              
              {/* Current Selection Preview */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Selected Tags ({selectedTags.length})
                </label>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-lg bg-white/5 border border-white/10">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag, index) => (
                      <span
                        key={tag.id || index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 text-xs"
                      >
                        {tag.name}
                        <button
                          onClick={() => {
                            const newTags = selectedTags.filter(t => t.id !== tag.id);
                            handleTagChange(newTags);
                          }}
                          className="hover:text-purple-300 ml-1"
                          disabled={updating}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags selected</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Loading Indicator */}
            {updating && (
              <div className="mt-4 flex items-center gap-2 text-purple-400">
                <div className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full" />
                <span className="text-sm">Updating tags...</span>
              </div>
            )}
          </div>
          
          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              disabled={updating}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TagManagementModal;
/**
 * MULTI-SELECT COMPONENT
 * 
 * A custom multi-select dropdown component with search functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Search, 
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  id: number | string;
  name: string;
  [key: string]: any;
}

interface MultiSelectProps {
  options: Option[];
  selected: Option[];
  onChange: (selected: Option[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  disabled = false,
  className
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if an option is selected
  const isSelected = (option: Option) => {
    return selected.some(item => item.id === option.id);
  };

  // Toggle option selection
  const toggleOption = (option: Option) => {
    if (disabled) return;
    
    if (isSelected(option)) {
      onChange(selected.filter(item => item.id !== option.id));
    } else {
      onChange([...selected, option]);
    }
  };

  // Remove a selected option
  const removeOption = (option: Option) => {
    if (disabled) return;
    onChange(selected.filter(item => item.id !== option.id));
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 text-left bg-black/40 border border-white/20 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400",
          "transition-all duration-200",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-black/50",
          isOpen && "ring-2 ring-purple-400 border-purple-400"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selected.slice(0, 2).map((option) => (
                  <span
                    key={option.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full"
                  >
                    {option.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(option);
                      }}
                      className="hover:text-purple-300"
                      disabled={disabled}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selected.length > 2 && (
                  <span className="text-xs text-gray-400 py-0.5">
                    +{selected.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0",
              isOpen && "transform rotate-180"
            )} 
          />
        </div>
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-lg z-[200] max-h-64 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
              {filteredOptions.length > 0 ? (
                <div className="p-1">
                  {filteredOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleOption(option)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                        isSelected(option) 
                          ? 'bg-purple-600/20 text-purple-400' 
                          : 'hover:bg-white/10 text-white'
                      )}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected(option) 
                          ? 'border-purple-400 bg-purple-600' 
                          : 'border-gray-400'
                      )}>
                        {isSelected(option) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      {/* Option Name */}
                      <span className="flex-1">{option.name}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-sm">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No options found</p>
                  {searchTerm && (
                    <p className="text-xs mt-1">Try adjusting your search</p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Count Footer */}
            {selected.length > 0 && (
              <div className="p-2 border-t border-white/10 bg-purple-600/10">
                <p className="text-xs text-purple-400 text-center">
                  {selected.length} option{selected.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelect;
import React, { useState, useEffect } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputMask from 'react-input-mask';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeadFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  funnelData: any;
  availableTags: any[];
  onFilterApply: (filters: LeadFilter) => void;
  onFilterClear: () => void;
}

interface LeadFilter {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  ddi?: string;
  sourcePlatform?: string;
  stageId?: string;
  tags?: string[];
  assignedTo?: string;
  scoreRange?: [number, number];
  valueRange?: [number, number];
}

const ddiOptions = [
  { value: "", label: "All Countries", country: "Any", flag: "🌍" },
  { value: "+1", label: "+1", country: "United States", flag: "🇺🇸" },
  { value: "+1", label: "+1", country: "Canada", flag: "🇨🇦" },
  { value: "+44", label: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { value: "+353", label: "+353", country: "Ireland", flag: "🇮🇪" },
  { value: "+33", label: "+33", country: "France", flag: "🇫🇷" },
  { value: "+34", label: "+34", country: "Spain", flag: "🇪🇸" },
  { value: "+49", label: "+49", country: "Germany", flag: "🇩🇪" },
  { value: "+41", label: "+41", country: "Switzerland", flag: "🇨🇭" },
  { value: "+351", label: "+351", country: "Portugal", flag: "🇵🇹" },
  { value: "+47", label: "+47", country: "Norway", flag: "🇳🇴" },
  { value: "+39", label: "+39", country: "Italy", flag: "🇮🇹" },
  { value: "+7", label: "+7", country: "Russia", flag: "🇷🇺" },
  { value: "+55", label: "+55", country: "Brazil", flag: "🇧🇷" },
  { value: "+54", label: "+54", country: "Argentina", flag: "🇦🇷" }
];

const phoneMasks = {
  "+1": "(999) 999-9999",
  "+44": "9999 999 9999",
  "+353": "99 999 9999",
  "+33": "99 99 99 99 99",
  "+34": "999 999 999",
  "+49": "999 999 9999",
  "+41": "99 999 99 99",
  "+351": "999 999 999",
  "+47": "999 99 999",
  "+39": "999 999 9999",
  "+7": "999 999-99-99",
  "+55": "(99) 99999-9999",
  "+54": "99 9999-9999"
};

const platformOptions = [
  { value: "", label: "All Platforms", icon: "🌐" },
  { value: "WhatsApp", label: "WhatsApp", icon: "📱" },
  { value: "Facebook", label: "Facebook", icon: "📘" },
  { value: "Instagram", label: "Instagram", icon: "📷" },
  { value: "Telegram", label: "Telegram", icon: "✈️" },
  { value: "SMS", label: "SMS", icon: "💬" },
  { value: "Direct", label: "Direct", icon: "🔗" }
];

export const LeadFilterDialog: React.FC<LeadFilterDialogProps> = ({
  isOpen,
  onClose,
  funnelData,
  availableTags,
  onFilterApply,
  onFilterClear
}) => {
  const { t } = useLanguage();

  const [filters, setFilters] = useState<LeadFilter>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ddi: '',
    sourcePlatform: '',
    stageId: '',
    tags: [],
    assignedTo: '',
    scoreRange: [0, 100],
    valueRange: [0, 10000]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDdiChange = (value: string) => {
    setFilters(prev => ({ ...prev, ddi: value, phone: '' }));
  };

  const handleRangeChange = (name: 'scoreRange' | 'valueRange', index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => {
      const currentRange = prev[name] || [0, 0];
      const newRange = [...currentRange];
      newRange[index] = numValue;
      return { ...prev, [name]: newRange as [number, number] };
    });
  };

  const handleTagToggle = (tagName: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...(prev.tags || []), tagName]
    }));
  };

  const handleApplyFilters = () => {
    // Remove empty values before applying
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) return acc;
        if (key === 'scoreRange' || key === 'valueRange') {
          const [min, max] = value as [number, number];
          if (min === 0 && max === (key === 'scoreRange' ? 100 : 10000)) return acc;
        }
        acc[key] = value;
      }
      return acc;
    }, {} as LeadFilter);

    onFilterApply(cleanFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      ddi: '',
      sourcePlatform: '',
      stageId: '',
      tags: [],
      assignedTo: '',
      scoreRange: [0, 100],
      valueRange: [0, 10000]
    });
    onFilterClear();
  };

  // Get stage options from funnel data
  const stageOptions = funnelData?.funnel?.stages
    ?.filter(stage => stage.is_active)
    ?.sort((a, b) => a.order - b.order)
    ?.map(stage => ({
      value: stage.id.toString(),
      label: stage.name,
      description: stage.description,
      order: stage.order
    })) || [];

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'scoreRange') return value[0] !== 0 || value[1] !== 100;
    if (key === 'valueRange') return value[0] !== 0 || value[1] !== 10000;
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== undefined && value !== null;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Filter Leads</h2>
              {hasActiveFilters && (
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-md">
                  Filters Active
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={filters.firstName}
                      onChange={handleInputChange}
                      placeholder="Filter by first name..."
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={filters.lastName}
                      onChange={handleInputChange}
                      placeholder="Filter by last name..."
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={filters.email}
                    onChange={handleInputChange}
                    placeholder="Filter by email..."
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Country Code
                    </label>
                    <select
                      value={filters.ddi}
                      onChange={(e) => handleDdiChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors"
                    >
                      {ddiOptions.map((option, index) => (
                        <option key={index} value={option.value} className="bg-gray-800">
                          {option.flag} {option.value} ({option.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Phone Number
                    </label>
                    <InputMask
                      mask={filters.ddi && phoneMasks[filters.ddi] ? phoneMasks[filters.ddi] : "999999999999"}
                      value={filters.phone}
                      onChange={handleInputChange}
                      name="phone"
                      placeholder="Filter by phone number..."
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Platform and Stage */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Platform & Stage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Source Platform
                    </label>
                    <select
                      name="sourcePlatform"
                      value={filters.sourcePlatform}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors"
                    >
                      {platformOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Current Stage
                    </label>
                    <select
                      name="stageId"
                      value={filters.stageId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors"
                    >
                      <option value="" className="bg-gray-800">All Stages</option>
                      {stageOptions.map((stage) => (
                        <option key={stage.value} value={stage.value} className="bg-gray-800">
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Score and Value Ranges */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Score & Value Ranges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      AI Score Range (0-100)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.scoreRange?.[0] || 0}
                        onChange={(e) => handleRangeChange('scoreRange', 0, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors"
                        placeholder="Min"
                      />
                      <span className="text-white/50">to</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.scoreRange?.[1] || 100}
                        onChange={(e) => handleRangeChange('scoreRange', 1, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Estimated Value Range ($)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        value={filters.valueRange?.[0] || 0}
                        onChange={(e) => handleRangeChange('valueRange', 0, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors"
                        placeholder="Min"
                      />
                      <span className="text-white/50">to</span>
                      <input
                        type="number"
                        min="0"
                        value={filters.valueRange?.[1] || 10000}
                        onChange={(e) => handleRangeChange('valueRange', 1, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-colors"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {availableTags && availableTags.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      const isSelected = filters.tags?.includes(tagName);
                      return (
                        <button
                          key={tagName}
                          onClick={() => handleTagToggle(tagName)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {tagName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/2">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Filters
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
/**
 * DEAL FILTER DIALOG
 * 
 * Simple filter dialog for deal funnels.
 */

import React, { useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DealFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stages: any[];
  onFilterApply: (filters: any) => void;
  onFilterClear: () => void;
}

export const DealFilterDialog: React.FC<DealFilterDialogProps> = ({
  isOpen,
  onClose,
  stages,
  onFilterApply,
  onFilterClear,
}) => {
  const [filters, setFilters] = useState({
    dealName: '',
    leadName: '',
    stageId: '',
    minValue: '',
    maxValue: '',
  });

  const handleApply = () => {
    const clean: any = {};
    if (filters.dealName) clean.dealName = filters.dealName;
    if (filters.leadName) clean.leadName = filters.leadName;
    if (filters.stageId) clean.stageId = filters.stageId;
    if (filters.minValue) clean.minValue = parseFloat(filters.minValue);
    if (filters.maxValue) clean.maxValue = parseFloat(filters.maxValue);
    onFilterApply(clean);
    onClose();
  };

  const handleClear = () => {
    setFilters({ dealName: '', leadName: '', stageId: '', minValue: '', maxValue: '' });
    onFilterClear();
  };

  const hasActive = Object.values(filters).some(v => v !== '');

  if (!isOpen) return null;

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-deal/20 shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-deal/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-deal">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Filter Deals</h2>
              {hasActive && <span className="px-2 py-1 text-xs bg-deal/20 text-deal rounded-md">Active</span>}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Deal Name</label>
              <input
                type="text"
                value={filters.dealName}
                onChange={(e) => setFilters(prev => ({ ...prev, dealName: e.target.value }))}
                placeholder="Filter by deal name..."
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white placeholder:text-white/50 focus:outline-none focus:border-deal transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Lead Name</label>
              <input
                type="text"
                value={filters.leadName}
                onChange={(e) => setFilters(prev => ({ ...prev, leadName: e.target.value }))}
                placeholder="Filter by lead name..."
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white placeholder:text-white/50 focus:outline-none focus:border-deal transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Stage</label>
              <select
                value={filters.stageId}
                onChange={(e) => setFilters(prev => ({ ...prev, stageId: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white focus:outline-none focus:border-deal transition-colors"
              >
                <option value="" className="bg-gray-800">All Stages</option>
                {sortedStages.map(s => (
                  <option key={s.id} value={s.id.toString()} className="bg-gray-800">{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Min Value</label>
                <input
                  type="number"
                  value={filters.minValue}
                  onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white placeholder:text-white/50 focus:outline-none focus:border-deal transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Max Value</label>
                <input
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                  placeholder="100000"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white placeholder:text-white/50 focus:outline-none focus:border-deal transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleClear} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white hover:bg-deal/10 transition-colors">
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
              <button onClick={handleApply} className="flex-1 px-4 py-3 rounded-lg bg-gradient-deal text-white font-medium hover:opacity-90 transition-opacity">
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

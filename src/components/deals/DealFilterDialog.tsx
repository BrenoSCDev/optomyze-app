/**
 * DEAL FILTER DIALOG
 *
 * Filter dialog for deal funnels, sharing the same modal/form pattern as
 * LeadFilterDialog for a consistent experience across the CRM.
 */

import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';

interface DealFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stages: any[];
  /** Currently applied filters — the dialog reopens showing these. */
  filters?: Partial<DealFilter>;
  onFilterApply: (filters: any) => void;
  onFilterClear: () => void;
}

interface DealFilter {
  dealName: string;
  leadName: string;
  stageId: string;
  minValue: string;
  maxValue: string;
}

const selectClasses = "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

const emptyFilters: DealFilter = {
  dealName: '',
  leadName: '',
  stageId: '',
  minValue: '',
  maxValue: '',
};

export const DealFilterDialog: React.FC<DealFilterDialogProps> = ({
  isOpen,
  onClose,
  stages,
  filters: appliedFilters,
  onFilterApply,
  onFilterClear,
}) => {
  const [filters, setFilters] = useState<DealFilter>(emptyFilters);

  // Reopen showing what is actually applied, so the form never drifts from the
  // board it is filtering.
  useEffect(() => {
    if (isOpen) {
      setFilters({ ...emptyFilters, ...(appliedFilters || {}) });
    }
  }, [isOpen, appliedFilters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Values stay as typed; dealFiltersToParams does the numeric coercion when
    // it builds the query string.
    const cleanFilters: DealFilter = { ...emptyFilters };

    (Object.keys(emptyFilters) as Array<keyof DealFilter>).forEach((key) => {
      if (filters[key]) cleanFilters[key] = filters[key];
    });

    onFilterApply(
      Object.fromEntries(Object.entries(cleanFilters).filter(([, value]) => value !== ''))
    );
    onClose();
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    onFilterClear();
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <Filter className="h-5 w-5 text-white" />
            </div>
            Filter Deals
            {hasActiveFilters && (
              <span className="px-2 py-1 text-xs font-normal bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                Filters Active
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          <div className="space-y-6">
            {/* Deal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-deal-name">Deal Name</Label>
                  <Input
                    id="filter-deal-name"
                    type="text"
                    name="dealName"
                    value={filters.dealName}
                    onChange={handleInputChange}
                    placeholder="Filter by deal name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-lead-name">Lead Name</Label>
                  <Input
                    id="filter-lead-name"
                    type="text"
                    name="leadName"
                    value={filters.leadName}
                    onChange={handleInputChange}
                    placeholder="Filter by lead name..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-stage">Stage</Label>
                <select
                  id="filter-stage"
                  name="stageId"
                  value={filters.stageId}
                  onChange={handleInputChange}
                  className={selectClasses}
                >
                  <option value="">All Stages</option>
                  {sortedStages.map((stage) => (
                    <option key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Value Range */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Value Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-min-value">Min Value</Label>
                  <CurrencyInput
                    id="filter-min-value"
                    value={parseFloat(filters.minValue) || 0}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, minValue: v ? String(v) : '' }))}
                    placeholder="$0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-max-value">Max Value</Label>
                  <CurrencyInput
                    id="filter-max-value"
                    value={parseFloat(filters.maxValue) || 0}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, maxValue: v ? String(v) : '' }))}
                    placeholder="$0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear Filters
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
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
import InputMask from 'react-input-mask';
import { useLanguage } from '@/contexts/LanguageContext';
import { ddiOptions as baseDdiOptions, phoneMasks } from '@/lib/phone';

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
  ...baseDdiOptions
];

const platformOptions = [
  { value: "", label: "All Platforms", icon: "🌐" },
  { value: "WhatsApp", label: "WhatsApp", icon: "📱" },
  { value: "Facebook", label: "Facebook", icon: "📘" },
  { value: "Instagram", label: "Instagram", icon: "📷" },
  { value: "Telegram", label: "Telegram", icon: "✈️" },
  { value: "SMS", label: "SMS", icon: "💬" },
  { value: "Direct", label: "Direct", icon: "🔗" }
];

const selectClasses = "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <Filter className="h-5 w-5 text-white" />
            </div>
            Filter Leads
            {hasActiveFilters && (
              <span className="px-2 py-1 text-xs font-normal bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                Filters Active
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-first-name">First Name</Label>
                  <Input
                    id="filter-first-name"
                    type="text"
                    name="firstName"
                    value={filters.firstName}
                    onChange={handleInputChange}
                    placeholder="Filter by first name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-last-name">Last Name</Label>
                  <Input
                    id="filter-last-name"
                    type="text"
                    name="lastName"
                    value={filters.lastName}
                    onChange={handleInputChange}
                    placeholder="Filter by last name..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-email">Email Address</Label>
                <Input
                  id="filter-email"
                  type="email"
                  name="email"
                  value={filters.email}
                  onChange={handleInputChange}
                  placeholder="Filter by email..."
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-ddi">Country Code</Label>
                  <select
                    id="filter-ddi"
                    value={filters.ddi}
                    onChange={(e) => handleDdiChange(e.target.value)}
                    className={selectClasses}
                  >
                    {ddiOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.flag} {option.label} ({option.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="filter-phone">Phone Number</Label>
                  <InputMask
                    mask={filters.ddi && phoneMasks[filters.ddi] ? phoneMasks[filters.ddi] : "999999999999"}
                    value={filters.phone}
                    onChange={handleInputChange}
                    name="phone"
                    id="filter-phone"
                    placeholder="Filter by phone number..."
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Platform and Stage */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Platform & Stage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-source-platform">Source Platform</Label>
                  <select
                    id="filter-source-platform"
                    name="sourcePlatform"
                    value={filters.sourcePlatform}
                    onChange={handleInputChange}
                    className={selectClasses}
                  >
                    {platformOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-stage">Current Stage</Label>
                  <select
                    id="filter-stage"
                    name="stageId"
                    value={filters.stageId}
                    onChange={handleInputChange}
                    className={selectClasses}
                  >
                    <option value="">All Stages</option>
                    {stageOptions.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Score and Value Ranges */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Score & Value Ranges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Score Range (0-100)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.scoreRange?.[0] || 0}
                      onChange={(e) => handleRangeChange('scoreRange', 0, e.target.value)}
                      placeholder="Min"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.scoreRange?.[1] || 100}
                      onChange={(e) => handleRangeChange('scoreRange', 1, e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Value Range ($)</Label>
                  <div className="flex gap-2 items-center">
                    <CurrencyInput
                      value={filters.valueRange?.[0] || 0}
                      onValueChange={(v) => setFilters(prev => { const r = [...(prev.valueRange || [0, 10000])]; r[0] = v; return { ...prev, valueRange: r as [number, number] }; })}
                      placeholder="$0.00"
                      className="w-full"
                    />
                    <span className="text-muted-foreground">to</span>
                    <CurrencyInput
                      value={filters.valueRange?.[1] || 0}
                      onValueChange={(v) => setFilters(prev => { const r = [...(prev.valueRange || [0, 10000])]; r[1] = v; return { ...prev, valueRange: r as [number, number] }; })}
                      placeholder="$0.00"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {availableTags && availableTags.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const tagName = typeof tag === 'string' ? tag : tag.name;
                    const tagColor = typeof tag === 'string' ? undefined : tag.color;
                    const isSelected = filters.tags?.includes(tagName);
                    return (
                      <Button
                        key={tagName}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="rounded-full gap-1.5"
                        onClick={() => handleTagToggle(tagName)}
                      >
                        {tagColor && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: tagColor }}
                          />
                        )}
                        {tagName}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
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

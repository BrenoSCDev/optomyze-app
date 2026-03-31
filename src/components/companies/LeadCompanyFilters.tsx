/**
 * LEAD COMPANY FILTERS COMPONENT
 * 
 * Filter panel for lead companies
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LeadCompanyFilters as FilterType, COMPANY_STATUSES } from '@/types/leadCompany';

interface LeadCompanyFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  industries: string[];
  cities: string[];
  states: string[];
  countries: string[];
}

export function LeadCompanyFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  industries,
  cities,
  states,
  countries,
}: LeadCompanyFiltersProps) {
  const updateFilter = (key: keyof FilterType, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      industry: '',
      status: '',
      city: '',
      state: '',
      country: '',
      hasLogo: 'all',
    });
  };

  const hasActiveFilters = 
    filters.industry || 
    filters.status || 
    filters.city || 
    filters.state || 
    filters.country || 
    filters.hasLogo !== 'all';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select 
              value={filters.industry || "_all"} 
              onValueChange={(value) => updateFilter('industry', value === "_all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.status || "_all"} 
              onValueChange={(value) => updateFilter('status', value === "_all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                {COMPANY_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Select 
              value={filters.city || "_all"} 
              onValueChange={(value) => updateFilter('city', value === "_all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <Select 
              value={filters.state || "_all"} 
              onValueChange={(value) => updateFilter('state', value === "_all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All states</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Select 
              value={filters.country || "_all"} 
              onValueChange={(value) => updateFilter('country', value === "_all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Has Logo</Label>
            <Select 
              value={filters.hasLogo} 
              onValueChange={(value) => updateFilter('hasLogo', value as 'all' | 'yes' | 'no')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">With logo</SelectItem>
                <SelectItem value="no">Without logo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

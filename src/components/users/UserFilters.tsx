import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Download, Grid3X3, List } from 'lucide-react';
import { UserFilters, ViewMode } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserFiltersProps {
  filters: UserFilters;
  viewMode: ViewMode;
  totalUsers: number;
  onFiltersChange: (filters: UserFilters) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onClearFilters: () => void;
  onExport: () => void;
}

const UserFiltersComponent: React.FC<UserFiltersProps> = ({
  filters,
  viewMode,
  totalUsers,
  onFiltersChange,
  onViewModeChange,
  onClearFilters,
  onExport,
}) => {
  const { t } = useLanguage();

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ ...filters, role: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const hasActiveFilters = filters.search || filters.role !== 'all' || filters.status !== 'all';

  return (
    <div className="space-y-4">
      {/* Main Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('users.filters.search-placeholder')}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg p-1 bg-background">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('users.filters.card-view')}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('table')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('users.filters.table-view')}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            {t('users.filters.export')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {/* Role Filter */}
          <Select value={filters.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('users.filters.role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.filters.all-roles')}</SelectItem>
              <SelectItem value="admin">{t('users.roles.admin') || 'Admin'}</SelectItem>
              <SelectItem value="manager">{t('users.filters.manager')}</SelectItem>
              <SelectItem value="agent">{t('users.roles.agent') || 'Agent'}</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('users.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.filters.all-status')}</SelectItem>
              <SelectItem value="active">{t('users.filters.active')}</SelectItem>
              <SelectItem value="inactive">{t('users.filters.inactive')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4" />
              {t('users.filters.clear')}
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="outline" className="text-sm">
            {totalUsers} {t('users.filters.results')}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default UserFiltersComponent;
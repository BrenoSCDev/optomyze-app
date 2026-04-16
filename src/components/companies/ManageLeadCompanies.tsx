/**
 * MANAGE LEAD COMPANIES PAGE
 * 
 * Main page component for B2B company management in the CRM
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, List, Filter, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { LeadCompanyCard } from './LeadCompanyCard';
import { LeadCompanyTable } from './LeadCompanyTable';
import { LeadCompanyFormModal } from './LeadCompanyFormModal';
import { LeadCompanyViewModal } from './LeadCompanyViewModal';
import { LeadCompanyDeleteDialog } from './LeadCompanyDeleteDialog';
import { LeadCompanyFilters } from './LeadCompanyFilters';
import leadCompanyApi from '@/services/leadCompanyApi';
import { LeadCompany, LeadCompanyFilters as FilterType } from '@/types/leadCompany';
import { useLanguage } from '@/contexts/LanguageContext';

type ViewMode = 'card' | 'table';

export function ManageLeadCompanies() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterType>({
    search: '',
    industry: '',
    status: '',
    city: '',
    state: '',
    country: '',
    hasLogo: 'all',
  });

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<LeadCompany | null>(null);

  // Fetch companies
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['lead-companies'],
    queryFn: leadCompanyApi.getAll,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { formData: any; logo: File | null }) => 
      leadCompanyApi.create({ ...data.formData, logo: data.logo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-companies'] });
      setShowFormModal(false);
      toast.success(t('companies.created-success'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('companies.create-error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; formData: any; logo: File | null }) =>
      leadCompanyApi.update(data.id, { ...data.formData, logo: data.logo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-companies'] });
      setShowFormModal(false);
      setSelectedCompany(null);
      toast.success(t('companies.updated-success'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('companies.update-error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: leadCompanyApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-companies'] });
      setShowDeleteDialog(false);
      setSelectedCompany(null);
      toast.success(t('companies.deleted-success'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('companies.delete-error'));
    },
  });

  // Extract unique filter values from data
  const filterOptions = useMemo(() => {
    const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))] as string[];
    const cities = [...new Set(companies.map(c => c.city).filter(Boolean))] as string[];
    const states = [...new Set(companies.map(c => c.state).filter(Boolean))] as string[];
    const countries = [...new Set(companies.map(c => c.country).filter(Boolean))] as string[];
    return { industries, cities, states, countries };
  }, [companies]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          company.trade_name.toLowerCase().includes(searchLower) ||
          company.legal_name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Industry filter
      if (filters.industry && company.industry !== filters.industry) return false;

      // Status filter
      if (filters.status && company.status !== filters.status) return false;

      // City filter
      if (filters.city && company.city !== filters.city) return false;

      // State filter
      if (filters.state && company.state !== filters.state) return false;

      // Country filter
      if (filters.country && company.country !== filters.country) return false;

      // Has logo filter
      if (filters.hasLogo === 'yes' && !company.logo_path) return false;
      if (filters.hasLogo === 'no' && company.logo_path) return false;

      return true;
    });
  }, [companies, filters]);

  // Handlers
  const handleView = useCallback((company: LeadCompany) => {
    setSelectedCompany(company);
    setShowViewModal(true);
  }, []);

  const handleEdit = useCallback((company: LeadCompany) => {
    setSelectedCompany(company);
    setShowFormModal(true);
  }, []);

  const handleDelete = useCallback((company: LeadCompany) => {
    setSelectedCompany(company);
    setShowDeleteDialog(true);
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedCompany(null);
    setShowFormModal(true);
  }, []);

  const handleFormSubmit = async (formData: any, logo: File | null) => {
    if (selectedCompany) {
      await updateMutation.mutateAsync({ id: selectedCompany.id, formData, logo });
    } else {
      await createMutation.mutateAsync({ formData, logo });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCompany) {
      deleteMutation.mutate(selectedCompany.id);
    }
  };

  const activeFilterCount = [
    filters.industry,
    filters.status,
    filters.city,
    filters.state,
    filters.country,
    filters.hasLogo !== 'all' ? filters.hasLogo : '',
  ].filter(Boolean).length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('companies.load-error')}</h3>
        <p className="text-muted-foreground mb-4">
          {t('companies.load-error-subtitle')}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['lead-companies'] })}>
          {t('companies.try-again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('companies.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('companies.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('companies.filters')}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Create Button */}
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('companies.create')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('companies.search-placeholder')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === 'card' 
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "space-y-2"
        }>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={viewMode === 'card' ? "h-[200px]" : "h-16"} />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] text-center border border-dashed border-border rounded-lg">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {companies.length === 0 ? t('companies.no-companies') : t('companies.no-match')}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            {companies.length === 0 
              ? t('companies.no-companies-subtitle')
              : t('companies.no-match-subtitle')}
          </p>
          {companies.length === 0 && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('companies.create')}
            </Button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCompanies.map((company) => (
            <LeadCompanyCard
              key={company.id}
              company={company}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <LeadCompanyTable
          companies={filteredCompanies}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <LeadCompanyFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        company={selectedCompany}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <LeadCompanyViewModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        company={selectedCompany}
      />

      <LeadCompanyDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        company={selectedCompany}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />

      <LeadCompanyFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={setFilters}
        {...filterOptions}
      />
    </div>
  );
}

/**
 * FUNNELS MANAGEMENT
 *
 * Management workspace for sales and deal funnels:
 * - Underline tabs to switch between Sale and Deal funnels
 * - Dense grid of funnel cards summarizing health and usage at a glance
 * - Inline active/inactive toggle plus View / Manage Stages / Edit / Delete actions
 */

import { useState, useEffect, type ReactNode } from 'react';
import { Plus, Trash2, AlertCircle, Eye, ListTree, Pencil, Users, FileStack } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { funnelService } from '@/services/funnelApi';
import api from '@/services/api';
import { MdCurrencyExchange } from 'react-icons/md';
import { IoFunnelOutline } from 'react-icons/io5';
import FunnelStagesModal from '@/components/stages/FunnelStagesModal';
import { cn } from '@/lib/utils';

interface Funnel {
  id: number;
  company_id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_by: number;
  settings: any;
  type: 'sale' | 'deal';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  nleads: number;
}

interface TemplateFunnel {
  id: number;
  name: string;
  stages: { id: number; name: string; order: number }[];
}

// Icon button + tooltip used for the quick actions on each funnel card
interface ActionButtonProps {
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: ReactNode;
}

const ActionButton = ({ tooltip, onClick, disabled, destructive, children }: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 w-8 text-muted-foreground transition-colors duration-200",
          destructive
            ? "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            : "hover:bg-muted hover:text-foreground"
        )}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
);

// Premium management card for a single funnel
interface FunnelCardProps {
  funnel: Funnel;
  onView: (funnel: Funnel) => void;
  onManageStages: (funnel: Funnel) => void;
  onEdit: (funnel: Funnel) => void;
  onDeleteRequest: (funnel: Funnel) => void;
  onToggleActive: (funnel: Funnel) => void;
  isToggling: boolean;
  isDeleting: boolean;
  t: (key: string) => string;
}

const FunnelCard = ({
  funnel,
  onView,
  onManageStages,
  onEdit,
  onDeleteRequest,
  onToggleActive,
  isToggling,
  isDeleting,
  t,
}: FunnelCardProps) => {
  const TypeIcon = funnel.type === 'deal' ? MdCurrencyExchange : Users;

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-card border border-border/60 rounded-2xl p-4 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
      )}
    >
      {/* Icon + name + status / active toggle */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-background shadow-sm text-primary shrink-0">
            <TypeIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{funnel.name}</h3>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 pt-0.5">
              <Switch
                checked={funnel.is_active}
                onCheckedChange={() => onToggleActive(funnel)}
                disabled={isToggling}
                aria-label={funnel.is_active ? t('funnels.deactivate') : t('funnels.activate')}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>{funnel.is_active ? t('funnels.deactivate') : t('funnels.activate')}</TooltipContent>
        </Tooltip>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <div className="text-lg font-bold text-foreground leading-none">{funnel.nleads}</div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">
            {funnel.type === 'deal' ? t('funnels.deals') : t('funnels.leads')}
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <div className="text-sm font-semibold text-foreground leading-none">
            {funnel.created_at ? new Date(funnel.created_at).toLocaleDateString() : '—'}
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">
            {t('funnels.created')}
          </div>
        </div>
      </div>

      {/* Description */}
      {funnel.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {funnel.description}
        </p>
      )}

      {/* Quick actions */}
      <div className="flex items-center justify-between gap-1 pt-3 mt-auto border-t border-border/60">
        <div className="flex items-center gap-1">
          <ActionButton tooltip={t('funnels.view-funnel')} onClick={() => onView(funnel)}>
            <Eye className="h-4 w-4" />
          </ActionButton>
          <ActionButton tooltip={t('funnels.manage-stages')} onClick={() => onManageStages(funnel)}>
            <ListTree className="h-4 w-4" />
          </ActionButton>
          <ActionButton tooltip={t('funnels.edit-funnel')} onClick={() => onEdit(funnel)}>
            <Pencil className="h-4 w-4" />
          </ActionButton>
        </div>
        <ActionButton
          tooltip={t('funnels.delete')}
          onClick={() => onDeleteRequest(funnel)}
          disabled={isDeleting}
          destructive
        >
          {isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </ActionButton>
      </div>
    </div>
  );
};

// Loading placeholder mirroring the funnel card layout
const SkeletonCard = () => (
  <div className="flex flex-col bg-card border border-border/60 rounded-2xl p-4">
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-6 w-11 rounded-full shrink-0" />
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
    </div>
    <div className="flex items-center justify-between gap-1 pt-3 mt-auto border-t border-border/60">
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
);

const EmptyState = ({ onCreateClick, t }: { onCreateClick: () => void; t: (key: string) => string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
      <IoFunnelOutline className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">{t('funnels.no-funnels')}</h3>
    <p className="text-muted-foreground text-sm max-w-sm mb-6">{t('funnels.no-funnels-subtitle')}</p>
    <Button onClick={onCreateClick}>
      <Plus className="h-4 w-4 mr-2" />
      {t('funnels.create-funnel')}
    </Button>
  </div>
);

const FunnelsDashboard = () => {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [templates, setTemplates] = useState<TemplateFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sale' | 'deal'>('sale');
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [showNewFunnelModal, setShowNewFunnelModal] = useState(false);
  const [showEditFunnelModal, setShowEditFunnelModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Funnel | null>(null);
  const [deletingFunnelId, setDeletingFunnelId] = useState<number | null>(null);
  const [togglingFunnelId, setTogglingFunnelId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', type: 'sale' as 'sale' | 'deal' });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({ name: '', description: '' });
  const [editFormErrors, setEditFormErrors] = useState({ name: '', description: '' });
  const [stagesModalFunnelId, setStagesModalFunnelId] = useState<string | null>(null);

  const { toast } = useToast();
  const { funnels: authFunnels, updateFunnels, updateFunnel: updateFunnelInContext } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFunnels();
    fetchTemplates();
  }, []);

  const fetchFunnels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/funnels');
      setFunnels(response.data);
    } catch (error) {
      console.error('Error fetching funnels:', error);
      if (authFunnels && authFunnels.length > 0) {
        const mappedFunnels = authFunnels.map((funnel: any) => ({
          id: funnel.id,
          company_id: 1,
          name: funnel.name,
          description: `Sales funnel with ${funnel.nleads} leads`,
          is_active: true,
          created_by: 1,
          settings: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          nleads: funnel.nleads || 0
        }));
        setFunnels(mappedFunnels);
      } else {
        toast({
          title: t('common.error'),
          description: t('funnels.error-load'),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/funnels/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const openNewFunnelModal = () => {
    setFormData({ name: '', description: '', type: activeTab });
    setSelectedTemplateId('');
    setFormErrors({ name: '', description: '' });
    setShowNewFunnelModal(true);
  };

  const createFunnel = async () => {
    setFormErrors({ name: '', description: '' });

    const errors = { name: '', description: '' };
    if (!formData.name.trim()) {
      errors.name = t('funnels.name-required');
    }
    const usingTemplate = !!selectedTemplateId;
    if (!usingTemplate && !formData.description.trim()) {
      errors.description = t('funnels.description-required');
    }

    if (errors.name || errors.description) {
      setFormErrors(errors);
      return;
    }

    try {
      setCreating(true);
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || formData.name.trim(),
        type: formData.type,
      };
      if (usingTemplate) {
        payload.model_funnel_id = parseInt(selectedTemplateId, 10);
      }

      const response = await api.post('/api/funnels', payload);

      setFunnels(prev => [...prev, response.data]);

      if (updateFunnels) {
        const updatedGlobalFunnels = [...(authFunnels || []), {
          id: response.data.id,
          name: response.data.name,
          nleads: response.data.nleads || 0,
          is_active: response.data.is_active ?? true,
          type: response.data.type
        }];
        updateFunnels(updatedGlobalFunnels);
      }

      setShowNewFunnelModal(false);

      toast({
        title: t('common.success'),
        description: t('funnels.success-create'),
      });
    } catch (error: any) {
      console.error('Error creating funnel:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('optomyze_auth_token');
        localStorage.removeItem('optomyze_user');
        localStorage.removeItem('optomyze_funnels');
        window.location.href = '/login';
        return;
      }

      if (error.response?.status === 422 && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        setFormErrors({
          name: serverErrors.name?.[0] || '',
          description: serverErrors.description?.[0] || ''
        });
        return;
      }

      const isNetworkError = !error.response;
      toast({
        title: t('common.error'),
        description: isNetworkError
          ? t('funnels.network-error')
          : t('funnels.server-error'),
        variant: "destructive",
        action: isNetworkError ? (
          <Button variant="outline" size="sm" onClick={createFunnel}>
            {t('common.retry')}
          </Button>
        ) : undefined
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteFunnel = async (funnelId: number) => {
    try {
      setDeletingFunnelId(funnelId);
      await api.delete(`/api/funnels/${funnelId}`);

      setFunnels(prev => prev.filter(funnel => funnel.id !== funnelId));

      if (updateFunnels) {
        const updatedGlobalFunnels = (authFunnels || []).filter(f => f.id !== funnelId);
        updateFunnels(updatedGlobalFunnels);
      }

      toast({
        title: t('common.success'),
        description: t('funnels.success-delete'),
      });
    } catch (error) {
      console.error('Error deleting funnel:', error);
      toast({
        title: t('common.error'),
        description: t('funnels.error-delete'),
        variant: "destructive",
      });
    } finally {
      setDeletingFunnelId(null);
    }
  };

  const openEditModal = (funnel: Funnel) => {
    setSelectedFunnel(funnel);
    setEditFormData({
      name: funnel.name,
      description: funnel.description,
    });
    setEditFormErrors({ name: '', description: '' });
    setShowEditFunnelModal(true);
  };

  const updateFunnel = async () => {
    setEditFormErrors({ name: '', description: '' });

    const errors = { name: '', description: '' };
    if (!editFormData.name.trim()) {
      errors.name = t('funnels.name-required');
    }
    if (!editFormData.description.trim()) {
      errors.description = t('funnels.description-required');
    }

    if (errors.name || errors.description) {
      setEditFormErrors(errors);
      return;
    }

    if (!selectedFunnel) return;

    try {
      setUpdating(true);
      const updatedFunnel = await funnelService.updateFunnel(selectedFunnel.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
      });

      setFunnels(prev => prev.map(funnel =>
        funnel.id === selectedFunnel.id ? { ...funnel, ...updatedFunnel } : funnel
      ));

      updateFunnelInContext({ ...selectedFunnel, ...updatedFunnel });

      setShowEditFunnelModal(false);
      setSelectedFunnel(null);

      toast({
        title: t('common.success'),
        description: t('funnels.success-update'),
      });
    } catch (error: any) {
      console.error('Error updating funnel:', error);

      if (error.response?.status === 422 && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        setEditFormErrors({
          name: serverErrors.name?.[0] || '',
          description: serverErrors.description?.[0] || ''
        });
        return;
      }

      toast({
        title: t('common.error'),
        description: t('funnels.error-update'),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Optimistically flips is_active so the toggle feels instant, rolling back on error
  const toggleFunnelActive = async (funnel: Funnel) => {
    const nextActive = !funnel.is_active;

    setFunnels(prev => prev.map(f => f.id === funnel.id ? { ...f, is_active: nextActive } : f));
    setTogglingFunnelId(funnel.id);

    try {
      const updatedFunnel = await funnelService.updateFunnel(funnel.id, { is_active: nextActive });
      updateFunnelInContext({ ...funnel, ...updatedFunnel, is_active: updatedFunnel?.is_active ?? nextActive });
    } catch (error) {
      console.error('Error toggling funnel status:', error);
      setFunnels(prev => prev.map(f => f.id === funnel.id ? { ...f, is_active: funnel.is_active } : f));
      toast({
        title: t('common.error'),
        description: t('funnels.error-update'),
        variant: "destructive",
      });
    } finally {
      setTogglingFunnelId(null);
    }
  };

  const selectedTemplate = templates.find(tpl => tpl.id === parseInt(selectedTemplateId, 10)) ?? null;
  const visibleFunnels = funnels.filter(f => f.type === activeTab);

  const tabOptions: { id: 'sale' | 'deal'; label: string; icon: ReactNode }[] = [
    { id: 'sale', label: t('funnels.sales-funnels'), icon: <Users className="w-4 h-4" /> },
    { id: 'deal', label: t('funnels.deal-funnels'), icon: <MdCurrencyExchange className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
              <IoFunnelOutline className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('funnels.title')}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{t('funnels.subtitle')}</p>
            </div>
          </div>

          <Button onClick={openNewFunnelModal} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'sale' ? t('funnels.new-sale-funnel') : t('funnels.new-deal-funnel')}
          </Button>
        </div>

        {/* Divider */}
        <div className="border-b border-border mb-4" />

        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] border-b border-border mb-6">
          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap pb-3 pt-1 text-[13px] transition-colors duration-200",
                activeTab === tab.id
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground font-medium hover:text-foreground/80"
              )}
            >
              {tab.icon}
              {tab.label}
              <span
                className={cn(
                  "absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-primary transition-opacity duration-200",
                  activeTab === tab.id ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          ))}
        </div>

        {/* Funnel Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : visibleFunnels.length === 0 ? (
          <EmptyState onCreateClick={openNewFunnelModal} t={t} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleFunnels.map((funnel) => (
              <FunnelCard
                key={funnel.id}
                funnel={funnel}
                onView={(f) => navigate(f.type === 'deal' ? `/deals/${f.id}` : `/leads/${f.id}`)}
                onManageStages={(f) => setStagesModalFunnelId(f.id.toString())}
                onEdit={openEditModal}
                onDeleteRequest={setDeleteTarget}
                onToggleActive={toggleFunnelActive}
                isToggling={togglingFunnelId === funnel.id}
                isDeleting={deletingFunnelId === funnel.id}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Funnel Modal */}
      <Dialog open={showNewFunnelModal} onOpenChange={setShowNewFunnelModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('funnels.create-new')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">

            {/* Template selector */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>{t('funnels.from-template')}</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(val) => {
                    setSelectedTemplateId(val === 'none' ? '' : val);
                    setFormErrors({ name: '', description: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('funnels.no-template')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('funnels.no-template')}</SelectItem>
                    {templates.map(tpl => (
                      <SelectItem key={tpl.id} value={String(tpl.id)}>
                        <div className="flex items-center gap-2">
                          <FileStack className="w-3.5 h-3.5 text-muted-foreground" />
                          {tpl.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTemplate && selectedTemplate.stages.length > 0 && (
                  <div className="rounded-md bg-muted/40 border border-border px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-1.5">{t('funnels.template-stages-preview')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.stages.map(s => (
                        <span key={s.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="funnel-name">
                {t('funnels.name')} *
              </Label>
              <Input
                id="funnel-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder={t('funnels.name-placeholder')}
                className={formErrors.name ? 'border-destructive' : ''}
                disabled={creating}
              />
              {formErrors.name && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.name}
                </div>
              )}
            </div>

            {/* Description — hidden when a template is selected */}
            {!selectedTemplateId && (
              <div className="space-y-2">
                <Label htmlFor="funnel-description">
                  {t('funnels.description')} *
                </Label>
                <Textarea
                  id="funnel-description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder={t('funnels.description-placeholder')}
                  className={cn('min-h-[100px]', formErrors.description && 'border-destructive')}
                  disabled={creating}
                />
                {formErrors.description && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.description}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFunnelModal(false);
                setFormData({ name: '', description: '', type: activeTab });
                setSelectedTemplateId('');
                setFormErrors({ name: '', description: '' });
              }}
              disabled={creating}
            >
              {t('funnels.cancel')}
            </Button>
            <Button
              onClick={createFunnel}
              disabled={creating}
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  {t('common.creating')}
                </>
              ) : (
                <>
                  {selectedTemplateId
                    ? <FileStack className="h-4 w-4 mr-2" />
                    : <Plus className="h-4 w-4 mr-2" />
                  }
                  {selectedTemplateId ? t('funnels.create-from-template') : t('common.create')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Funnel Modal */}
      <Dialog open={showEditFunnelModal} onOpenChange={setShowEditFunnelModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('funnels.edit-funnel')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="edit-funnel-name">
                {t('funnels.name')} *
              </Label>
              <Input
                id="edit-funnel-name"
                value={editFormData.name}
                onChange={(e) => {
                  setEditFormData(prev => ({ ...prev, name: e.target.value }));
                  if (editFormErrors.name) setEditFormErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder={t('funnels.name-placeholder')}
                className={editFormErrors.name ? 'border-destructive' : ''}
                disabled={updating}
              />
              {editFormErrors.name && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {editFormErrors.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-funnel-description">
                {t('funnels.description')} *
              </Label>
              <Textarea
                id="edit-funnel-description"
                value={editFormData.description}
                onChange={(e) => {
                  setEditFormData(prev => ({ ...prev, description: e.target.value }));
                  if (editFormErrors.description) setEditFormErrors(prev => ({ ...prev, description: '' }));
                }}
                placeholder={t('funnels.description-placeholder')}
                className={cn('min-h-[100px]', editFormErrors.description && 'border-destructive')}
                disabled={updating}
              />
              {editFormErrors.description && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {editFormErrors.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFunnelModal(false);
                setSelectedFunnel(null);
                setEditFormData({ name: '', description: '' });
                setEditFormErrors({ name: '', description: '' });
              }}
              disabled={updating}
            >
              {t('funnels.cancel')}
            </Button>
            <Button
              onClick={updateFunnel}
              disabled={updating}
            >
              {updating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  {t('common.updating')}
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('common.update')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('funnels.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('funnels.delete-confirm')} '{deleteTarget?.name}'? {t('funnels.delete-warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('funnels.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  deleteFunnel(target.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Funnel Stages Modal */}
      <FunnelStagesModal
        isOpen={!!stagesModalFunnelId}
        onClose={() => setStagesModalFunnelId(null)}
        funnelId={stagesModalFunnelId}
      />
    </div>
  );
};

export default FunnelsDashboard;

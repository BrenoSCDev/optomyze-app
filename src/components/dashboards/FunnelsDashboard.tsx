/**
 * FUNNELS MANAGEMENT DASHBOARD
 *
 * A comprehensive dashboard for managing sales funnels with:
 * - Horizontal card grid layout for displaying all company funnels
 * - Glassmorphism design with futuristic styling
 * - Full CRUD operations (View, Create, Delete)
 * - Responsive design for all screen sizes
 * - API integration with proper error handling
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Filter, AlertCircle, Eye, Cog, ListTree, Users, FileStack, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { funnelService } from '@/services/funnelApi';
import api from '@/services/api';
import { MdCurrencyExchange } from 'react-icons/md';
import FunnelStagesModal from '@/components/stages/FunnelStagesModal';

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

const FunnelsDashboard = () => {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [templates, setTemplates] = useState<TemplateFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sale' | 'deal'>('sale');
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [showNewFunnelModal, setShowNewFunnelModal] = useState(false);
  const [showEditFunnelModal, setShowEditFunnelModal] = useState(false);
  const [deletingFunnelId, setDeletingFunnelId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', type: 'sale' as 'sale' | 'deal' });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [editFormData, setEditFormData] = useState({ name: '', description: '', is_active: true });
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
      is_active: funnel.is_active
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
        is_active: editFormData.is_active
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

  const selectedTemplate = templates.find(t => t.id === parseInt(selectedTemplateId, 10)) ?? null;

  const FunnelCard = ({ funnel }: { funnel: Funnel }) => (
    <Card className="glass-card hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 neon-border group">
      {/* Header with Status and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg shrink-0 transition-colors ${
            funnel.is_active
              ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30'
              : 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30'
          }`}>
            <Filter className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
              {funnel.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge
                variant={funnel.is_active ? "default" : "secondary"}
                className={`text-xs ${
                  funnel.is_active
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {funnel.is_active ? t('funnels.active') : t('funnels.inactive')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 neon-border"
            onClick={() => navigate(`/leads/${funnel.id}`)}
            title="View Funnel"
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 neon-border"
            onClick={() => setStagesModalFunnelId(funnel.id.toString())}
            title="Manage Stages"
          >
            <ListTree className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 neon-border"
            onClick={() => openEditModal(funnel)}
            title="Configure Funnel"
          >
            <Cog className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                disabled={deletingFunnelId === funnel.id}
                onClick={() => setSelectedFunnel(funnel)}
                title="Delete Funnel"
              >
                {deletingFunnelId === funnel.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">{t('funnels.delete')}</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  {t('funnels.delete-confirm')} '{funnel.name}'? {t('funnels.delete-warning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted/20 border-muted/30 hover:bg-muted/30">
                  {t('funnels.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteFunnel(funnel.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {funnel.description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/20 border border-muted/30">
            <div className="text-2xl font-bold text-primary mb-1">
              {funnel.nleads}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {funnel.type === 'deal' ? t('funnels.deals') : t('funnels.leads')}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/20 border border-muted/30">
            <div className="text-sm font-medium text-foreground mb-1">
              {funnel.created_at ? new Date(funnel.created_at).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {t('funnels.created')}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const SkeletonCard = () => (
    <Card className="glass-card p-6">
      <div className="flex items-start justify-between h-full">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </Card>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="p-4 rounded-full bg-primary/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Filter className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{t('funnels.no-funnels')}</h3>
      <p className="text-muted-foreground mb-6">{t('funnels.no-funnels-subtitle')}</p>
      <Button onClick={openNewFunnelModal} className="neon-border">
        <Plus className="h-4 w-4 mr-2" />
        {t('funnels.create-funnel')}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2 futuristic-text">
            {t('funnels.title')}
          </h1>
          <nav className="text-sm text-muted-foreground">
            {t('funnels.breadcrumb')}
          </nav>
        </div>

        <Button className="neon-border w-full sm:w-auto" size="lg" onClick={openNewFunnelModal}>
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'sale' ? t('funnels.new-sale-funnel') : t('funnels.new-deal-funnel')}
        </Button>

        {/* New Funnel Modal */}
        <Dialog open={showNewFunnelModal} onOpenChange={setShowNewFunnelModal}>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground futuristic-text">{t('funnels.create-new')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">

              {/* Template selector */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">{t('funnels.from-template')}</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(val) => {
                      setSelectedTemplateId(val === 'none' ? '' : val);
                      setFormErrors({ name: '', description: '' });
                    }}
                  >
                    <SelectTrigger className="glass-card border-muted/30">
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
                    <div className="rounded-md bg-muted/20 border border-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-1.5">{t('funnels.template-stages-preview')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTemplate.stages.map(s => (
                          <span key={s.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
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
                <Label htmlFor="funnel-name" className="text-foreground">
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
                  className={`glass-card border-muted/30 ${formErrors.name ? 'border-red-500' : ''}`}
                  disabled={creating}
                />
                {formErrors.name && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.name}
                  </div>
                )}
              </div>

              {/* Description — hidden when a template is selected */}
              {!selectedTemplateId && (
                <div className="space-y-2">
                  <Label htmlFor="funnel-description" className="text-foreground">
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
                    className={`glass-card border-muted/30 min-h-[100px] ${formErrors.description ? 'border-red-500' : ''}`}
                    disabled={creating}
                  />
                  {formErrors.description && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
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
                className="bg-muted/20 border-muted/30 hover:bg-muted/30"
                disabled={creating}
              >
                {t('funnels.cancel')}
              </Button>
              <Button
                onClick={createFunnel}
                className="neon-border"
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
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground futuristic-text">
                {t('funnels.edit-funnel')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="edit-funnel-name" className="text-foreground">
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
                  className={`glass-card border-muted/30 ${editFormErrors.name ? 'border-red-500' : ''}`}
                  disabled={updating}
                />
                {editFormErrors.name && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {editFormErrors.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-funnel-description" className="text-foreground">
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
                  className={`glass-card border-muted/30 min-h-[100px] ${editFormErrors.description ? 'border-red-500' : ''}`}
                  disabled={updating}
                />
                {editFormErrors.description && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {editFormErrors.description}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label htmlFor="edit-funnel-active" className="text-foreground">
                    {t('funnels.active-status')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('funnels.active-description')}
                  </p>
                </div>
                <Switch
                  id="edit-funnel-active"
                  checked={editFormData.is_active}
                  onCheckedChange={(checked) =>
                    setEditFormData(prev => ({ ...prev, is_active: checked }))
                  }
                  disabled={updating}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditFunnelModal(false);
                  setSelectedFunnel(null);
                  setEditFormData({ name: '', description: '', is_active: true });
                  setEditFormErrors({ name: '', description: '' });
                }}
                className="bg-muted/20 border-muted/30 hover:bg-muted/30"
                disabled={updating}
              >
                {t('funnels.cancel')}
              </Button>
              <Button
                onClick={updateFunnel}
                className="neon-border"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    {t('common.updating')}
                  </>
                ) : (
                  <>
                    <Cog className="h-4 w-4 mr-2" />
                    {t('common.update')}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Sale and Deal Funnels */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'sale' | 'deal')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="sale" className="gap-2">
            <Users className="w-4 h-4" />
            <span>{t('funnels.sales-funnels')}</span>
          </TabsTrigger>
          <TabsTrigger value="deal" className="gap-2">
            <MdCurrencyExchange className="w-4 h-4" />
            <span>{t('funnels.deal-funnels')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sale" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : funnels.filter(f => f.type === 'sale').length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {funnels.filter(f => f.type === 'sale').map((funnel) => (
                <FunnelCard key={funnel.id} funnel={funnel} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deal" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : funnels.filter(f => f.type === 'deal').length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {funnels.filter(f => f.type === 'deal').map((funnel) => (
                <FunnelCard key={funnel.id} funnel={funnel} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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

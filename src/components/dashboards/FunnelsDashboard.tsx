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
import { Plus, Settings, Trash2, Filter, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';

interface Funnel {
  id: number;
  company_id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_by: number;
  settings: any;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  nleads: number;
}

const FunnelsDashboard = () => {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [showNewFunnelModal, setShowNewFunnelModal] = useState(false);
  const [deletingFunnelId, setDeletingFunnelId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({ name: '', description: '' });
  
  const { toast } = useToast();
  const { funnels: authFunnels, updateFunnels } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFunnels();
  }, []);

  const fetchFunnels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/funnels');
      setFunnels(response.data);
    } catch (error) {
      console.error('Error fetching funnels:', error);
      // Fallback to auth context funnels if API fails
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

  const createFunnel = async () => {
    // Reset form errors
    setFormErrors({ name: '', description: '' });
    
    // Validate form
    const errors = { name: '', description: '' };
    if (!formData.name.trim()) {
      errors.name = t('funnels.name-required');
    }
    if (!formData.description.trim()) {
      errors.description = t('funnels.description-required');
    }
    
    if (errors.name || errors.description) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setCreating(true);
      const response = await api.post('/api/funnels', {
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      
      // Add new funnel to the list
      setFunnels(prev => [...prev, response.data]);
      
      // Update global context for sidebar
      if (updateFunnels) {
        const updatedGlobalFunnels = [...(authFunnels || []), {
          id: response.data.id,
          name: response.data.name,
          nleads: response.data.nleads || 0
        }];
        updateFunnels(updatedGlobalFunnels);
      }
      
      // Reset form and close modal
      setFormData({ name: '', description: '' });
      setShowNewFunnelModal(false);
      
      toast({
        title: t('common.success'),
        description: t('funnels.success-create'),
      });
    } catch (error: any) {
      console.error('Error creating funnel:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        // Authentication error - redirect to login
        localStorage.removeItem('optomyze_auth_token');
        localStorage.removeItem('optomyze_user');
        localStorage.removeItem('optomyze_funnels');
        window.location.href = '/login';
        return;
      }
      
      if (error.response?.status === 422 && error.response?.data?.errors) {
        // Validation errors from server
        const serverErrors = error.response.data.errors;
        setFormErrors({
          name: serverErrors.name?.[0] || '',
          description: serverErrors.description?.[0] || ''
        });
        return;
      }
      
      // Network or server errors
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
      
      // Optimistic update
      setFunnels(prev => prev.filter(funnel => funnel.id !== funnelId));
      
      // Update global context for sidebar
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

  const FunnelCard = ({ funnel }: { funnel: Funnel }) => (
    <Card className="glass-card p-6 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 neon-border group">
      <div className="flex items-start justify-between h-full">
        {/* Left Section - Funnel Icon */}
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 rounded-lg bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
            <Filter className="h-6 w-6" />
          </div>
          
          {/* Center Section - Funnel Information */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
              {funnel.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {funnel.description}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {funnel.nleads} {t('funnels.leads')}
              </Badge>
              {funnel.is_active && (
                <Badge variant="default" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  {t('funnels.active')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 neon-border"
            onClick={() => navigate(`/settings/funnels/${funnel.id}/stages`)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                disabled={deletingFunnelId === funnel.id}
                onClick={() => setSelectedFunnel(funnel)}
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
      <Button 
        onClick={() => setShowNewFunnelModal(true)}
        className="neon-border"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('funnels.create-funnel')}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 futuristic-text">
            {t('funnels.title')}
          </h1>
          <nav className="text-sm text-muted-foreground">
            {t('funnels.breadcrumb')}
          </nav>
        </div>
        
        <Dialog open={showNewFunnelModal} onOpenChange={setShowNewFunnelModal}>
          <DialogTrigger asChild>
            <Button className="neon-border" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {t('funnels.new-funnel')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground futuristic-text">{t('funnels.create-new')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
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
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewFunnelModal(false);
                  setFormData({ name: '', description: '' });
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
                    <Plus className="h-4 w-4 mr-2" />
                    {t('common.create')}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funnels Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : funnels.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funnels.map((funnel) => (
            <FunnelCard key={funnel.id} funnel={funnel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FunnelsDashboard;
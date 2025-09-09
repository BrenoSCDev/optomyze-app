/**
 * FUNNEL STAGES MANAGEMENT PAGE
 * 
 * Configuration page for managing stages within a specific funnel.
 * Accessed via Settings > Funnels > [Funnel Card Settings Icon]
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Trash2, 
  ListTree,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface Stage {
  id: number;
  funnel_id: number;
  name: string;
  description: string;
  order: number;
  type: string;
  is_active: boolean;
  settings: {
    sla_hours: number;
    auto_assign: boolean;
    required_fields: string[];
    notifications_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface Funnel {
  id: number;
  name: string;
  description: string;
}

const FunnelStages = () => {
  const { funnelId } = useParams<{ funnelId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { token } = useAuth();

  const [stages, setStages] = useState<Stage[]>([]);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewStageModal, setShowNewStageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  // Fetch funnel details and stages
  useEffect(() => {
    const fetchData = async () => {
      if (!funnelId || !token) return;

      try {
        setLoading(true);
        
        // Fetch funnel details
        const funnelResponse = await api.get(`/api/funnels/${funnelId}`);
        setFunnel(funnelResponse.data);

        // Fetch stages
        const stagesResponse = await api.get(`/api/funnels/${funnelId}/stages`);
        setStages(stagesResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: t('common.error'),
          description: t('stages.fetch_error'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [funnelId, token, t, toast]);

  // Delete stage handler
  const handleDeleteStage = async () => {
    if (!selectedStage || !funnelId) return;

    try {
      await api.delete(`/api/funnels/${funnelId}/stages/${selectedStage.id}`);
      
      // Optimistic update
      setStages(prev => prev.filter(stage => stage.id !== selectedStage.id));
      
      toast({
        title: t('common.success'),
        description: t('stages.delete_success'),
      });
      
      setShowDeleteModal(false);
      setSelectedStage(null);
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: t('common.error'),
        description: t('stages.delete_error'),
        variant: 'destructive',
      });
    }
  };

  // Loading skeleton
  const StageCardSkeleton = () => (
    <Card className="glass-card animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-muted rounded"></div>
            <div className="w-32 h-5 bg-muted rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-muted rounded"></div>
            <div className="w-8 h-8 bg-muted rounded"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="w-full h-4 bg-muted rounded"></div>
          <div className="w-3/4 h-4 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => navigate('/?section=funnels')}
              className="hover:text-foreground transition-colors"
            >
              {t('nav.settings')}
            </button>
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => navigate('/?section=funnels')}
              className="hover:text-foreground transition-colors"
            >
              {t('nav.funnels')}
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {funnel?.name || t('stages.loading')}
            </span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">
              {t('stages.title')}
            </span>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/?section=funnels')}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {t('stages.title')}
                </h1>
                <p className="text-muted-foreground">
                  {funnel?.name && `Managing stages for ${funnel.name}`}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowNewStageModal(true)}
              className="btn-primary"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('stages.new_stage')}
            </Button>
          </div>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {loading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StageCardSkeleton />
                </motion.div>
              ))
            ) : stages.length === 0 ? (
              // Empty state
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-12 text-center"
              >
                <ListTree className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('stages.empty_title')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t('stages.empty_description')}
                </p>
                <Button
                  onClick={() => setShowNewStageModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('stages.create_first')}
                </Button>
              </motion.div>
            ) : (
              // Stage cards
              stages.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card className="glass-card hover-glow h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <ListTree className="h-5 w-5 text-primary" />
                          <span className="text-lg font-semibold text-foreground truncate">
                            {stage.name}
                          </span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            onClick={() => {
                              // Future: Open stage settings modal
                              toast({
                                title: t('common.coming_soon'),
                                description: t('stages.settings_coming_soon'),
                              });
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                            onClick={() => {
                              setSelectedStage(stage);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {stage.description}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{t('stages.order')}: {stage.order}</span>
                        <span>•</span>
                        <span className={stage.is_active ? 'text-green-400' : 'text-red-400'}>
                          {stage.is_active ? t('stages.active') : t('stages.inactive')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Stage Modal */}
      <Dialog open={showNewStageModal} onOpenChange={setShowNewStageModal}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle>{t('stages.create_title')}</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-muted-foreground">
              {t('stages.create_placeholder')}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewStageModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button className="btn-primary" disabled>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t('stages.delete_title')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-muted-foreground">
              {`Are you sure you want to delete "${selectedStage?.name || ''}"? This action cannot be undone.`}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedStage(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStage}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunnelStages;
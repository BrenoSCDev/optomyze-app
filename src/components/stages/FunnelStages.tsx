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
  ChevronRight,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import StageEditModal from './StageEditModal';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [creating, setCreating] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    type: ''
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  
  // Stage type options
  const stageTypes = [
    { value: 'entry', label: 'Entry' },
    { value: 'normal', label: 'Normal' },
    { value: 'service', label: 'Service' },
    { value: 'proposition', label: 'Proposition' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'conversion', label: 'Conversion' },
    { value: 'lost', label: 'Lost' }
  ];

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
        
        // Mark as initially loaded for animation control
        if (!hasInitiallyLoaded) {
          setHasInitiallyLoaded(true);
        }
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

  // Validate form data
  const validateForm = () => {
    const errors = { name: '', description: '', order: '', type: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = t('stages.name_required');
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = t('stages.description_required');
      isValid = false;
    }

    if (!formData.type) {
      errors.type = t('stages.type_required');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Create new stage
  const handleCreateStage = async () => {
    if (!validateForm() || !funnelId) return;

    try {
      setCreating(true);
      
      const response = await api.post(`/api/funnels/${funnelId}/stages`, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type
      });

      // Add new stage to the list
      setStages(prev => [...prev, response.data]);
      
      // Reset form and close modal
      setFormData({ name: '', description: '', type: '' });
      setFormErrors({ name: '', description: '', type: '' });
      setShowNewStageModal(false);
      
      toast({
        title: t('common.success'),
        description: t('stages.create_success'),
      });
    } catch (error: any) {
      console.error('Error creating stage:', error);
      
      if (error.response?.status === 401) {
        // Authentication error - redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 422) {
        // Validation errors from server
        const serverErrors = error.response.data.errors || {};
        setFormErrors(prev => ({
          ...prev,
          ...serverErrors
        }));
      } else if (error.response?.status >= 500) {
        // Server error
        toast({
          title: t('common.error'),
          description: t('stages.server_error'),
          variant: 'destructive',
        });
      } else if (!error.response) {
        // Network error
        toast({
          title: t('common.error'),
          description: t('stages.network_error'),
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateStage}
            >
              {t('stages.retry')}
            </Button>
          ),
        });
      } else {
        // Generic error
        toast({
          title: t('common.error'),
          description: t('stages.create_error'),
          variant: 'destructive',
        });
      }
    } finally {
      setCreating(false);
    }
  };

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

  // Handle stage update
  const handleStageUpdate = (updatedStage: Stage) => {
    setStages(prev => prev.map(stage => 
      stage.id === updatedStage.id ? updatedStage : stage
    ));
  };

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = stages.findIndex((stage) => stage.id === active.id);
    const newIndex = stages.findIndex((stage) => stage.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const stageToMove = stages[oldIndex];
    const newOrder = stages[newIndex].order;

    // Optimistic update - reorder locally first
    const reorderedStages = arrayMove(stages, oldIndex, newIndex);
    setStages(reorderedStages);
    setReordering(true);

    try {
      // Send API request to move stage
      const response = await api.put(`/api/funnels/${funnelId}/stages/${stageToMove.id}/move`, {
        order: newOrder
      });

      // Update stages with the correct order from backend response
      if (response.data.stages) {
        setStages(response.data.stages);
      }

      // Success toast
      toast({
        title: 'Stage moved successfully',
        description: `${stageToMove.name} has been reordered.`,
      });

    } catch (error) {
      console.error('Error moving stage:', error);
      
      // Revert the optimistic update
      setStages(stages);
      
      toast({
        title: 'Failed to move stage',
        description: 'There was an error moving the stage. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReordering(false);
    }
  };

  // Open edit modal
  const openEditModal = (stage: Stage) => {
    setSelectedStage(stage);
    setShowEditModal(true);
  };

  // Sortable Stage Card Component
  const SortableStageCard = ({ stage, index }: { stage: Stage; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: stage.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={!hasInitiallyLoaded ? { opacity: 0, y: 20 } : false}
        animate={!hasInitiallyLoaded ? { opacity: 1, y: 0 } : {}}
        transition={!hasInitiallyLoaded ? { delay: index * 0.1 } : {}}
        whileHover={{ y: isDragging ? 0 : -5 }}
        className={`group ${isDragging ? 'z-50' : ''}`}
      >
        <Card className={`
          glass-card hover-glow h-full cursor-grab active:cursor-grabbing
          ${isDragging ? 'ring-2 ring-primary shadow-2xl scale-105' : ''} 
          ${reordering ? 'pointer-events-none' : ''}
          transition-all duration-200
        `}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GripVertical 
                    className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-grab" 
                    {...attributes}
                    {...listeners}
                  />
                  <ListTree className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-semibold text-foreground truncate">
                  {stage.name}
                </span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(stage);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
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
    );
  };

  // Drag Overlay Component
  const DragOverlayCard = ({ stage }: { stage: Stage }) => (
    <Card className="glass-card hover-glow h-full ring-2 ring-primary shadow-2xl scale-105 rotate-3">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-primary" />
              <ListTree className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground truncate">
              {stage.name}
            </span>
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
  );

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
              // Stage cards with drag and drop
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stages.map(stage => stage.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stages.map((stage, index) => (
                    <SortableStageCard
                      key={stage.id}
                      stage={stage}
                      index={index}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <DragOverlayCard 
                      stage={stages.find(stage => stage.id === activeId)!} 
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Stage Modal */}
      <Dialog open={showNewStageModal} onOpenChange={setShowNewStageModal}>
        <DialogContent className="glass-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('stages.create_title')}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            {/* Stage Name */}
            <div className="space-y-2">
              <Label htmlFor="stageName">{t('stages.name_label')}</Label>
              <Input
                id="stageName"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) {
                    setFormErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                placeholder={t('stages.name_placeholder')}
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Stage Description */}
            <div className="space-y-2">
              <Label htmlFor="stageDescription">{t('stages.description_label')}</Label>
              <Textarea
                id="stageDescription"
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  if (formErrors.description) {
                    setFormErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                placeholder={t('stages.description_placeholder')}
                className={formErrors.description ? 'border-destructive' : ''}
                rows={3}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>

            {/* Stage Type */}
            <div className="space-y-2">
              <Label htmlFor="stageType">{t('stages.type_label')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, type: value }));
                  if (formErrors.type) {
                    setFormErrors(prev => ({ ...prev, type: '' }));
                  }
                }}
              >
                <SelectTrigger className={`w-full ${formErrors.type ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder={t('stages.type_placeholder')} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {stageTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.type && (
                <p className="text-sm text-destructive">{formErrors.type}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewStageModal(false);
                setFormData({ name: '', description: '', type: '' });
                setFormErrors({ name: '', description: '', type: '' });
              }}
              disabled={creating}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              className="btn-primary" 
              onClick={handleCreateStage}
              disabled={creating}
            >
              {creating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('stages.creating')}
                </div>
              ) : (
                t('common.create')
              )}
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

      {/* Stage Edit Modal */}
      <StageEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStage(null);
        }}
        stage={selectedStage}
        funnelId={funnelId || ''}
        onUpdate={handleStageUpdate}
      />
    </div>
  );
};

export default FunnelStages;
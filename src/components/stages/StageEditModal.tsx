import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import api from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStageTypesForFunnel } from '@/lib/stageTypes';

interface Stage {
  id: number;
  funnel_id: number;
  name: string;
  description: string;
  order: number;
  type: string;
  color: string;
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

const STAGE_COLORS = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#22C55E', label: 'Green' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
  // Second row - more diverse colors
  { value: '#0F172A', label: 'Slate' },
  { value: '#7C2D12', label: 'Brown' },
  { value: '#065F46', label: 'Emerald' },
  { value: '#0E7490', label: 'Teal' },
  { value: '#1E3A8A', label: 'Indigo' },
  { value: '#4C1D95', label: 'Violet' },
  { value: '#831843', label: 'Rose' },
  { value: '#FCD34D', label: 'Amber' },
  { value: '#A3E635', label: 'Lime' },
  { value: '#F472B6', label: 'Fuchsia' },
];

interface StageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: Stage | null;
  funnelId: string;
  funnelType: 'contact' | 'deal';
  onUpdate: (updatedStage: Stage) => void;
}


const StageEditModal: React.FC<StageEditModalProps> = ({
  isOpen,
  onClose,
  stage,
  funnelId,
  funnelType,
  onUpdate
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    color: '#FFFFFF',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    type: ''
  });

  // Stage type options based on funnel type
  const stageTypes = getStageTypesForFunnel(funnelType);

  // Pre-fill form with stage data when modal opens
  useEffect(() => {
    if (stage && isOpen) {
      setFormData({
        name: stage.name || '',
        description: stage.description || '',
        type: stage.type || '',
        color: stage.color || '#FFFFFF',
        is_active: stage.is_active
      });
      setFormErrors({ name: '', description: '', type: '' });
    }
  }, [stage, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        type: '',
        color: '#FFFFFF',
        is_active: true
      });
      setFormErrors({ name: '', description: '', type: '' });
    }
  }, [isOpen]);

  // Validate form
  const validateForm = () => {
    const errors = { name: '', description: '', type: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Stage name is required';
      isValid = false;
    } else if (formData.name.length > 100) {
      errors.name = 'Stage name must be less than 100 characters';
      isValid = false;
    }

    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
      isValid = false;
    }

    if (!formData.type) {
      errors.type = 'Stage type is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !stage) return;

    try {
      setLoading(true);
      
      const response = await api.put(`/api/funnels/${funnelId}/stages/${stage.id}`, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        color: formData.color,
        is_active: formData.is_active
      });

      // Call onUpdate with the updated stage
      onUpdate(response.data);
      
      toast({
        title: 'Success',
        description: 'Stage updated successfully',
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error updating stage:', error);
      
      if (error.response?.status === 422) {
        // Validation errors from server
        const serverErrors = error.response.data.errors || {};
        setFormErrors(prev => ({
          ...prev,
          ...serverErrors
        }));
      } else if (error.response?.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again',
          variant: 'destructive',
        });
        window.location.href = '/login';
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update stage. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stage Name */}
          <div className="space-y-2">
            <Label htmlFor="editStageName">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editStageName"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (formErrors.name) {
                  setFormErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              placeholder="Enter stage name"
              className={formErrors.name ? 'border-destructive' : ''}
              maxLength={100}
              disabled={loading}
            />
            {formErrors.name && (
              <p className="text-sm text-destructive">{formErrors.name}</p>
            )}
          </div>

          {/* Stage Description */}
          <div className="space-y-2">
            <Label htmlFor="editStageDescription">{t('settings.funnels.stage-description')}</Label>
            <Textarea
              id="editStageDescription"
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (formErrors.description) {
                  setFormErrors(prev => ({ ...prev, description: '' }));
                }
              }}
              placeholder={t('settings.funnels.stage-description-placeholder')}
              className={formErrors.description ? 'border-destructive' : ''}
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
            {formErrors.description && (
              <p className="text-sm text-destructive">{formErrors.description}</p>
            )}
          </div>

          {/* Stage Type */}
          <div className="space-y-2">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, type: value }));
                if (formErrors.type) {
                  setFormErrors(prev => ({ ...prev, type: '' }));
                }
              }}
              disabled={loading}
            >
              <SelectTrigger className={formErrors.type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select stage type" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
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

          {/* Stage Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {STAGE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 transition-colors duration-fast ease-standard ${
                    formData.color === color.value 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-border hover:ring-2 hover:ring-ring/40'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="editStageActive">Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable this stage
              </p>
            </div>
            <Switch
              id="editStageActive"
              checked={formData.is_active}
              onCheckedChange={(checked) => {
                setFormData(prev => ({ ...prev, is_active: checked }));
              }}
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Stage'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StageEditModal;
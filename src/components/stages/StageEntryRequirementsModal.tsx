import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import api from '@/services/api';

export interface EntryRequirement {
  id: number;
  stage_id: number;
  require_assigned_owner: boolean;
  require_contact_email: boolean;
  require_phone_number: boolean;
  require_at_least_one_product: boolean;
  require_deal_value: boolean;
  require_recent_activity: boolean;
  created_at: string;
  updated_at: string;
}

interface StageEntryRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: number;
  stageName: string;
  entryRequirement: EntryRequirement | null;
  onUpdate: (entryRequirement: EntryRequirement) => void;
}

type EntryRequirementField = 
  | 'require_assigned_owner'
  | 'require_contact_email'
  | 'require_phone_number'
  | 'require_at_least_one_product'
  | 'require_deal_value'
  | 'require_recent_activity';

const StageEntryRequirementsModal: React.FC<StageEntryRequirementsModalProps> = ({
  isOpen,
  onClose,
  stageId,
  stageName,
  entryRequirement,
  onUpdate
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [localRequirements, setLocalRequirements] = useState<EntryRequirement | null>(null);
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch entry requirements when modal opens (if not passed or null)
  useEffect(() => {
    const fetchEntryRequirements = async () => {
      if (!isOpen || !stageId) return;
      
      // If entryRequirement is provided, use it
      if (entryRequirement) {
        setLocalRequirements(entryRequirement);
        return;
      }

      // Otherwise fetch from API
      setLoading(true);
      try {
        const response = await api.get(`/api/stages/${stageId}/entry-requirements`);
        setLocalRequirements(response.data);
      } catch (error) {
        console.error('Error fetching entry requirements:', error);
        toast({
          title: t('common.error'),
          description: t('stages.entry_requirement_error'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEntryRequirements();
  }, [entryRequirement, isOpen, stageId, t, toast]);

  const handleToggle = async (field: EntryRequirementField, value: boolean) => {
    if (!localRequirements) return;

    setUpdatingField(field);

    try {
      const response = await api.patch(`/api/stages/${stageId}/entry-requirements`, {
        field,
        value
      });

      const updatedRequirement = {
        ...localRequirements,
        [field]: value,
        ...response.data
      };

      setLocalRequirements(updatedRequirement);
      onUpdate(updatedRequirement);

      toast({
        title: t('common.success'),
        description: t('stages.entry_requirement_updated'),
      });
    } catch (error) {
      console.error('Error updating entry requirement:', error);
      toast({
        title: t('common.error'),
        description: t('stages.entry_requirement_error'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingField(null);
    }
  };

  const requirements: { field: EntryRequirementField; labelKey: string }[] = [
    { field: 'require_assigned_owner', labelKey: 'settings.funnels.require-owner' },
    { field: 'require_contact_email', labelKey: 'settings.funnels.require-email' },
    { field: 'require_phone_number', labelKey: 'settings.funnels.require-phone' },
    { field: 'require_at_least_one_product', labelKey: 'settings.funnels.require-product' },
    { field: 'require_deal_value', labelKey: 'settings.funnels.require-deal-value' },
    { field: 'require_recent_activity', labelKey: 'settings.funnels.require-activity' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('stages.configure_entry_requirements')}: {stageName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.funnels.entry-rules-desc')}
          </p>

          {localRequirements ? (
            <div className="space-y-4">
              {requirements.map(({ field, labelKey }) => (
                <div key={field} className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    {t(labelKey)}
                    {updatingField === field && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </Label>
                  <Switch
                    checked={localRequirements[field]}
                    onCheckedChange={(checked) => handleToggle(field, checked)}
                    disabled={updatingField !== null}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StageEntryRequirementsModal;

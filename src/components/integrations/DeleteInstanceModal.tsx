/**
 * DELETE INSTANCE MODAL
 * 
 * Confirmation modal for deleting WhatsApp Evolution API instances
 */

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  created_at: string;
  status?: string;
}

interface DeleteInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
  onInstanceDeleted: (instanceId: number) => void;
}

const DeleteInstanceModal: React.FC<DeleteInstanceModalProps> = ({
  open,
  onOpenChange,
  instance,
  onInstanceDeleted
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!instance) return;

    setLoading(true);

    try {
      const api = (await import('../../services/api')).default;
      await api.delete(`/api/integrations/whatsapp-evo-instances/${instance.id}`);
      
      onInstanceDeleted(instance.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error deleting instance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!instance) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {t('integrations.panel.delete.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('integrations.panel.delete.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Instance Info */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <SiWhatsapp className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{instance.instance_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {instance.status || 'created'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('integrations.panel.delete.warning')}
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('integrations.panel.delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteInstanceModal;

/**
 * DISCONNECT INSTANCE MODAL
 *
 * Confirmation modal for disconnecting a WhatsApp Evolution API instance.
 * Warns that the number will stop receiving leads in the CRM, and offers
 * an optional bulk reassignment of every chat on this instance to another
 * existing instance in the company — so when the same phone number gets
 * reconnected under that new instance, conversations continue uninterrupted.
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Loader2, AlertTriangle } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  status?: string;
}

interface DisconnectOtherInstance {
  id: number;
  label: string;
  status: string;
}

interface DisconnectInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
  onDisconnected: (instanceId: number) => void;
}

const NO_REASSIGN = 'none';

const DisconnectInstanceModal: React.FC<DisconnectInstanceModalProps> = ({
  open,
  onOpenChange,
  instance,
  onDisconnected,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [otherInstances, setOtherInstances] = useState<DisconnectOtherInstance[]>([]);
  const [reassignTo, setReassignTo] = useState(NO_REASSIGN);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !instance) return;
    setReassignTo(NO_REASSIGN);
    setLoadingInfo(true);
    api.get(`/api/integrations/whatsapp-evo-instances/${instance.id}/disconnect-info`)
      .then(({ data }) => {
        setChatCount(data.chat_count ?? 0);
        setOtherInstances(data.other_instances ?? []);
      })
      .catch(() => {
        setChatCount(0);
        setOtherInstances([]);
      })
      .finally(() => setLoadingInfo(false));
  }, [open, instance]);

  const handleConfirm = async () => {
    if (!instance) return;
    setSubmitting(true);
    try {
      const payload = reassignTo !== NO_REASSIGN ? { reassign_to_instance_id: Number(reassignTo) } : {};
      const { data } = await api.post(`/api/integrations/whatsapp-evo-instances/disconnect/${instance.id}`, payload);

      onDisconnected(instance.id);
      onOpenChange(false);

      if (data.reassignment) {
        toast({
          title: t('integrations.panel.disconnect.success-title'),
          description: t('integrations.panel.disconnect.reassigned-description')
            .replace('{count}', String(data.reassignment.moved)),
        });
      } else {
        toast({
          title: t('integrations.panel.disconnect.success-title'),
          description: t('integrations.panel.disconnect.success-description'),
        });
      }
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      toast({
        title: t('integrations.panel.disconnect.error-title'),
        description: t('integrations.panel.disconnect.error-description'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!instance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {t('integrations.panel.disconnect.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <SiWhatsapp className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{instance.instance_name}</p>
                <Badge variant="secondary" className="text-xs mt-1">{instance.status || 'connected'}</Badge>
              </div>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('integrations.panel.disconnect.warning')}
            </AlertDescription>
          </Alert>

          {loadingInfo ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-2">
              <Label>
                {t('integrations.panel.disconnect.reassign-label').replace('{count}', String(chatCount))}
              </Label>
              <Select value={reassignTo} onValueChange={setReassignTo} disabled={otherInstances.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={t('integrations.panel.disconnect.reassign-placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_REASSIGN}>{t('integrations.panel.disconnect.reassign-none')}</SelectItem>
                  {otherInstances.map(opt => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.label} ({opt.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {otherInstances.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('integrations.panel.disconnect.no-other-instances')}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('integrations.panel.disconnect.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisconnectInstanceModal;

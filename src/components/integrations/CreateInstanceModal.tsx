/**
 * CREATE INSTANCE MODAL
 * 
 * Modal for creating new WhatsApp Evolution API instances
 */

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Info } from 'lucide-react';

interface CreateInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstanceCreated: (instance: any) => void;
}

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  open,
  onOpenChange,
  onInstanceCreated
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MAX_LENGTH = 20;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize: remove spaces and limit length
    const sanitized = e.target.value.replace(/\s/g, '').slice(0, MAX_LENGTH);
    setName(sanitized);
    setError('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('integrations.panel.create.error-empty'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const api = (await import('../../services/api')).default;
      const response = await api.post('/api/integrations/whatsapp-evo-instances', {
        name: name
      });
      
      onInstanceCreated(response.data);
      handleClose();
    } catch (err: any) {
      console.error('Error creating instance:', err);
      setError(err.response?.data?.message || t('integrations.panel.create.error-failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('integrations.panel.create.title')}</DialogTitle>
          <DialogDescription>
            {t('integrations.panel.create.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="instance-name">{t('integrations.panel.create.name-label')}</Label>
            <Input
              id="instance-name"
              value={name}
              onChange={handleNameChange}
              placeholder={t('integrations.panel.create.name-placeholder')}
              maxLength={MAX_LENGTH}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/{MAX_LENGTH} {t('common.characters')}
            </p>
          </div>

          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('integrations.panel.create.name-hint')}
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('integrations.panel.create-instance')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInstanceModal;

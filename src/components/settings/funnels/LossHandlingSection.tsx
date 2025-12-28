import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { LossHandlingSettings } from '@/services/funnelSettingsApi';
import { useState } from 'react';

interface Props {
  settings: LossHandlingSettings;
  onUpdate: (settings: LossHandlingSettings) => void;
}

const LossHandlingSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const [newReason, setNewReason] = useState('');

  const update = (key: keyof LossHandlingSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const addReason = () => {
    if (newReason.trim()) {
      update('lossReasons', [...settings.lossReasons, newReason.trim()]);
      setNewReason('');
    }
  };

  const removeReason = (index: number) => {
    update('lossReasons', settings.lossReasons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>{t('settings.funnels.loss-reasons')}</Label>
        <div className="space-y-2">
          {settings.lossReasons.map((reason, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={reason} readOnly className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => removeReason(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder={t('settings.funnels.add-reason-placeholder')}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={addReason}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>{t('settings.funnels.require-loss-reason')}</Label>
        <Switch checked={settings.requireLossReason} onCheckedChange={(v) => update('requireLossReason', v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t('settings.funnels.notify-manager-loss')}</Label>
        <Switch checked={settings.autoNotifyManagerOnLoss} onCheckedChange={(v) => update('autoNotifyManagerOnLoss', v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t('settings.funnels.auto-followup-lead')}</Label>
        <Switch checked={settings.autoCreateFollowUpLead} onCheckedChange={(v) => update('autoCreateFollowUpLead', v)} />
      </div>

      <div className="grid gap-2">
        <Label>{t('settings.funnels.cooldown-days')}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={settings.cooldownDays}
            onChange={(e) => update('cooldownDays', Number(e.target.value))}
            className="w-24"
          />
          <span className="text-muted-foreground">{t('common.days')}</span>
        </div>
      </div>
    </div>
  );
};

export default LossHandlingSection;

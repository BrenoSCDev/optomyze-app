import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { SalesSettings, Automations } from '@/services/settingsApi';

interface Props {
  settings: SalesSettings;
  onUpdate: (updates: Partial<SalesSettings>) => void;
}

const AutomationsSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { automations } = settings;

  const updateAutomations = (updates: Partial<Automations>) => {
    onUpdate({
      automations: { ...automations, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Auto-create Follow-up */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.auto-create-followup')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.auto-create-followup-desc')}</p>
        </div>
        <Switch 
          checked={automations.autoCreateFollowUp} 
          onCheckedChange={(checked) => updateAutomations({ autoCreateFollowUp: checked })}
        />
      </div>

      {/* Idle Deal Alert */}
      <div className="grid gap-2">
        <Label>{t('settings.sales.idle-deal-alert')}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            value={automations.idleDealAlertDays}
            onChange={(e) => updateAutomations({ idleDealAlertDays: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-muted-foreground">{t('common.days')}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.sales.idle-deal-alert-desc')}</p>
      </div>

      {/* Auto-set Expected Close Date */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.auto-expected-close')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.auto-expected-close-desc')}</p>
        </div>
        <Switch 
          checked={automations.autoSetExpectedClose} 
          onCheckedChange={(checked) => updateAutomations({ autoSetExpectedClose: checked })}
        />
      </div>
    </div>
  );
};

export default AutomationsSection;

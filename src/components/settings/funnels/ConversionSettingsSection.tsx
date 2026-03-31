import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ConversionSettings } from '@/services/funnelSettingsApi';

interface Props {
  settings: ConversionSettings;
  onUpdate: (settings: ConversionSettings) => void;
}

const ConversionSettingsSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();

  const update = (key: keyof ConversionSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.funnels.allow-manual-conversion')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.funnels.allow-manual-conversion-desc')}</p>
        </div>
        <Switch checked={settings.allowManualConversion} onCheckedChange={(v) => update('allowManualConversion', v)} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.funnels.copy-activities')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.funnels.copy-activities-desc')}</p>
        </div>
        <Switch checked={settings.copyLeadActivities} onCheckedChange={(v) => update('copyLeadActivities', v)} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.funnels.copy-tags')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.funnels.copy-tags-desc')}</p>
        </div>
        <Switch checked={settings.copyLeadTags} onCheckedChange={(v) => update('copyLeadTags', v)} />
      </div>
    </div>
  );
};

export default ConversionSettingsSection;

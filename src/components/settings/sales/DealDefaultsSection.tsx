import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SalesSettings, DealDefaults, CURRENCIES } from '@/services/settingsApi';

interface Props {
  settings: SalesSettings;
  onUpdate: (updates: Partial<SalesSettings>) => void;
}

const DealDefaultsSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { deal_defaults } = settings;

  const updateDefaults = (updates: Partial<DealDefaults>) => {
    onUpdate({
      deal_defaults: { ...deal_defaults, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Auto-assign Deals */}
      <div className="grid gap-2">
        <Label>{t('settings.sales.auto-assign')}</Label>
        <Select 
          value={deal_defaults.autoAssign} 
          onValueChange={(value: DealDefaults['autoAssign']) => updateDefaults({ autoAssign: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">{t('settings.sales.assign-manual')}</SelectItem>
            <SelectItem value="round-robin">{t('settings.sales.assign-round-robin')}</SelectItem>
            <SelectItem value="by-source">{t('settings.sales.assign-by-source')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t('settings.sales.auto-assign-desc')}</p>
      </div>

      {/* Default Deal Currency */}
      <div className="grid gap-2">
        <Label>{t('settings.sales.default-currency')}</Label>
        <Select 
          value={deal_defaults.defaultCurrency} 
          onValueChange={(value) => updateDefaults({ defaultCurrency: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auto-calculate Deal Value */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.auto-calculate-value')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.auto-calculate-value-desc')}</p>
        </div>
        <Switch 
          checked={deal_defaults.autoCalculateValue} 
          onCheckedChange={(checked) => updateDefaults({ autoCalculateValue: checked })}
        />
      </div>

      {/* Lock Manual Deal Value */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.lock-manual-value')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.lock-manual-value-desc')}</p>
        </div>
        <Switch 
          checked={deal_defaults.lockManualValue} 
          onCheckedChange={(checked) => updateDefaults({ lockManualValue: checked })}
        />
      </div>
    </div>
  );
};

export default DealDefaultsSection;

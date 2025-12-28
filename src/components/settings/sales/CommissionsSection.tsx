import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SalesSettings, Commissions } from '@/services/settingsApi';

interface Props {
  settings: SalesSettings;
  onUpdate: (updates: Partial<SalesSettings>) => void;
}

const CommissionsSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { commissions } = settings;

  const updateCommissions = (updates: Partial<Commissions>) => {
    onUpdate({
      commissions: { ...commissions, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Enable Commissions */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.enable-commissions')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.enable-commissions-desc')}</p>
        </div>
        <Switch 
          checked={commissions.enabled} 
          onCheckedChange={(checked) => updateCommissions({ enabled: checked })}
        />
      </div>

      {commissions.enabled && (
        <div className="space-y-6 ml-4 border-l-2 border-primary/20 pl-4">
          {/* Commission Type */}
          <div className="grid gap-2">
            <Label>{t('settings.sales.commission-type')}</Label>
            <Select 
              value={commissions.type} 
              onValueChange={(value: 'percentage' | 'fixed') => updateCommissions({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">{t('settings.sales.commission-percentage')}</SelectItem>
                <SelectItem value="fixed">{t('settings.sales.commission-fixed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Commission Base */}
          <div className="grid gap-2">
            <Label>{t('settings.sales.commission-base')}</Label>
            <Select 
              value={commissions.base} 
              onValueChange={(value: 'deal-total' | 'product-value') => updateCommissions({ base: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deal-total">{t('settings.sales.commission-deal-total')}</SelectItem>
                <SelectItem value="product-value">{t('settings.sales.commission-product-value')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Commission Rate */}
          <div className="grid gap-2">
            <Label>{t('settings.sales.default-commission-rate')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={commissions.type === 'percentage' ? 100 : undefined}
                value={commissions.defaultRate}
                onChange={(e) => updateCommissions({ defaultRate: Number(e.target.value) })}
                className="w-24"
              />
              {commissions.type === 'percentage' && <span className="text-muted-foreground">%</span>}
            </div>
          </div>

          {/* Allow Per-Product Override */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.sales.allow-per-product-override')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.sales.allow-per-product-override-desc')}</p>
            </div>
            <Switch 
              checked={commissions.allowPerProductOverride} 
              onCheckedChange={(checked) => updateCommissions({ allowPerProductOverride: checked })}
            />
          </div>

          {/* Allow Split Commissions */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.sales.allow-split-commissions')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.sales.allow-split-commissions-desc')}</p>
            </div>
            <Switch 
              checked={commissions.allowSplitCommissions} 
              onCheckedChange={(checked) => updateCommissions({ allowSplitCommissions: checked })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionsSection;

import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductSettings, PricingRules } from '@/services/settingsApi';

interface Props {
  settings: ProductSettings;
  onUpdate: (updates: Partial<ProductSettings>) => void;
}

const PricingRulesSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { pricing_rules } = settings;

  const updatePricingRules = (updates: Partial<PricingRules>) => {
    onUpdate({
      pricing_rules: { ...pricing_rules, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Allow Price Override */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.products.allow-price-override')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.products.allow-price-override-desc')}</p>
        </div>
        <Switch 
          checked={pricing_rules.allowPriceOverride} 
          onCheckedChange={(checked) => updatePricingRules({ allowPriceOverride: checked })}
        />
      </div>

      {/* Maximum Discount */}
      <div className="grid gap-2">
        <Label>{t('settings.products.max-discount')}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            value={pricing_rules.maxDiscountPercent}
            onChange={(e) => updatePricingRules({ maxDiscountPercent: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.products.max-discount-desc')}</p>
      </div>

      {/* Default Discount Type */}
      <div className="grid gap-2">
        <Label>{t('settings.products.default-discount-type')}</Label>
        <Select 
          value={pricing_rules.defaultDiscountType} 
          onValueChange={(value: 'percentage' | 'fixed') => updatePricingRules({ defaultDiscountType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">{t('settings.products.discount-percentage')}</SelectItem>
            <SelectItem value="fixed">{t('settings.products.discount-fixed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Minimum Deal Value */}
      <div className="grid gap-2">
        <Label>{t('settings.products.min-deal-value')}</Label>
        <div className="flex items-center gap-2">
          <CurrencyInput
            value={pricing_rules.minDealValue}
            onValueChange={(v) => updatePricingRules({ minDealValue: v })}
            className="w-40"
            placeholder="$0.00"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.products.min-deal-value-desc')}</p>
      </div>
    </div>
  );
};

export default PricingRulesSection;

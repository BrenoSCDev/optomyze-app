import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductSettings, CURRENCIES } from '@/services/settingsApi';

interface Props {
  settings: ProductSettings;
  onUpdate: (updates: Partial<ProductSettings>) => void;
}

const ProductBehaviorSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Default Product Type */}
      <div className="grid gap-2">
        <Label>{t('settings.products.default-type')}</Label>
        <Select 
          value={settings.default_type} 
          onValueChange={(value: 'service' | 'physical') => onUpdate({ default_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service">{t('settings.products.type-service')}</SelectItem>
            <SelectItem value="physical">{t('settings.products.type-physical')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lock Product Type */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.products.lock-type')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.products.lock-type-desc')}</p>
        </div>
        <Switch 
          checked={settings.lock_type} 
          onCheckedChange={(checked) => onUpdate({ lock_type: checked })}
        />
      </div>

      {/* Default Pricing Model */}
      <div className="grid gap-2">
        <Label>{t('settings.products.default-pricing-model')}</Label>
        <Select 
          value={settings.default_pricing_model} 
          onValueChange={(value: 'fixed' | 'recurring' | 'hourly' | 'per-unit') => onUpdate({ default_pricing_model: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">{t('settings.products.pricing-fixed')}</SelectItem>
            <SelectItem value="recurring">{t('settings.products.pricing-recurring')}</SelectItem>
            <SelectItem value="hourly">{t('settings.products.pricing-hourly')}</SelectItem>
            <SelectItem value="per-unit">{t('settings.products.pricing-per-unit')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Default Currency */}
      <div className="grid gap-2">
        <Label>{t('settings.products.default-currency')}</Label>
        <Select 
          value={settings.default_currency} 
          onValueChange={(value) => onUpdate({ default_currency: value })}
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

      {/* Auto-generate SKU */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.products.auto-sku')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.products.auto-sku-desc')}</p>
        </div>
        <Switch 
          checked={settings.auto_sku} 
          onCheckedChange={(checked) => onUpdate({ auto_sku: checked })}
        />
      </div>

      {/* SKU Format - Only shown when auto-generate is enabled */}
      {settings.auto_sku && (
        <div className="grid gap-2 ml-4 border-l-2 border-primary/20 pl-4">
          <Label>{t('settings.products.sku-format')}</Label>
          <Input 
            value={settings.sku_format}
            onChange={(e) => onUpdate({ sku_format: e.target.value })}
            placeholder="SRV-{0001}"
          />
          <p className="text-xs text-muted-foreground">{t('settings.products.sku-format-hint')}</p>
        </div>
      )}

      {/* Default Product Status */}
      <div className="grid gap-2">
        <Label>{t('settings.products.default-status')}</Label>
        <Select 
          value={settings.default_status} 
          onValueChange={(value: 'active' | 'draft') => onUpdate({ default_status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t('settings.products.status-active')}</SelectItem>
            <SelectItem value="draft">{t('settings.products.status-draft')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductBehaviorSection;

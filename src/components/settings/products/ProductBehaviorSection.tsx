import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductSettings } from '@/services/settingsApi';

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
          onValueChange={(value: 'service' | 'physical' | 'digital') => onUpdate({ default_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service">{t('settings.products.type-service')}</SelectItem>
            <SelectItem value="physical">{t('settings.products.type-physical')}</SelectItem>
            <SelectItem value="digital">{t('settings.products.type-digital')}</SelectItem>
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

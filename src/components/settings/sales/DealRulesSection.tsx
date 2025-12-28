import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SalesSettings, DealRules } from '@/services/settingsApi';

interface Props {
  settings: SalesSettings;
  onUpdate: (updates: Partial<SalesSettings>) => void;
}

const DealRulesSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { deal_rules } = settings;

  const updateRules = (updates: Partial<DealRules>) => {
    onUpdate({
      deal_rules: { ...deal_rules, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Allow Deals Without Products */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.allow-deals-without-products')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.allow-deals-without-products-desc')}</p>
        </div>
        <Switch 
          checked={deal_rules.allowDealsWithoutProducts} 
          onCheckedChange={(checked) => updateRules({ allowDealsWithoutProducts: checked })}
        />
      </div>

      {/* Require Product for Proposal */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.require-product-proposal')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.require-product-proposal-desc')}</p>
        </div>
        <Switch 
          checked={deal_rules.requireProductForProposal} 
          onCheckedChange={(checked) => updateRules({ requireProductForProposal: checked })}
        />
      </div>

      {/* Require Pricing for Negotiation */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.require-pricing-negotiation')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.require-pricing-negotiation-desc')}</p>
        </div>
        <Switch 
          checked={deal_rules.requirePricingForNegotiation} 
          onCheckedChange={(checked) => updateRules({ requirePricingForNegotiation: checked })}
        />
      </div>

      {/* Lock Products After Won */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.lock-products-after-won')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.lock-products-after-won-desc')}</p>
        </div>
        <Switch 
          checked={deal_rules.lockProductsAfterWon} 
          onCheckedChange={(checked) => updateRules({ lockProductsAfterWon: checked })}
        />
      </div>
    </div>
  );
};

export default DealRulesSection;

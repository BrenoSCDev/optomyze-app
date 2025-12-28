import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FunnelStage, StageEntryRules } from '@/services/funnelSettingsApi';

interface Props {
  stage: FunnelStage;
  onUpdate: (rules: StageEntryRules) => void;
}

const StageEntryRulesSection = ({ stage, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { entryRules } = stage;

  const updateRule = (key: keyof StageEntryRules, value: boolean | number | null) => {
    onUpdate({ ...entryRules, [key]: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        {t('settings.funnels.entry-rules-desc')}
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>{t('settings.funnels.require-owner')}</Label>
          <Switch
            checked={entryRules.requireAssignedOwner}
            onCheckedChange={(checked) => updateRule('requireAssignedOwner', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t('settings.funnels.require-company')}</Label>
          <Switch
            checked={entryRules.requireCompanyLinked}
            onCheckedChange={(checked) => updateRule('requireCompanyLinked', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t('settings.funnels.require-email')}</Label>
          <Switch
            checked={entryRules.requireContactEmail}
            onCheckedChange={(checked) => updateRule('requireContactEmail', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t('settings.funnels.require-phone')}</Label>
          <Switch
            checked={entryRules.requirePhoneNumber}
            onCheckedChange={(checked) => updateRule('requirePhoneNumber', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t('settings.funnels.require-product')}</Label>
          <Switch
            checked={entryRules.requireAtLeastOneProduct}
            onCheckedChange={(checked) => updateRule('requireAtLeastOneProduct', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t('settings.funnels.require-deal-value')}</Label>
          <Switch
            checked={entryRules.requireDealValue}
            onCheckedChange={(checked) => updateRule('requireDealValue', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>{t('settings.funnels.require-close-date')}</Label>
          <Switch
            checked={entryRules.requireExpectedCloseDate}
            onCheckedChange={(checked) => updateRule('requireExpectedCloseDate', checked)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('settings.funnels.require-activity')}</Label>
            <Switch
              checked={entryRules.requireLastActivityDays !== null}
              onCheckedChange={(checked) => updateRule('requireLastActivityDays', checked ? 7 : null)}
            />
          </div>
          {entryRules.requireLastActivityDays !== null && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">{t('settings.funnels.within')}</span>
              <Input
                type="number"
                min={1}
                value={entryRules.requireLastActivityDays}
                onChange={(e) => updateRule('requireLastActivityDays', Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">{t('common.days')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageEntryRulesSection;

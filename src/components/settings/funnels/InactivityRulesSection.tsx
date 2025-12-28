import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { InactivityRules } from '@/services/funnelSettingsApi';

interface Props {
  rules: InactivityRules;
  onUpdate: (rules: InactivityRules) => void;
}

const InactivityRulesSection = ({ rules, onUpdate }: Props) => {
  const { t } = useLanguage();

  const update = (key: keyof InactivityRules, value: any) => {
    onUpdate({ ...rules, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label>{t('settings.funnels.idle-lead-days')}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            value={rules.idleLeadAlertDays}
            onChange={(e) => update('idleLeadAlertDays', Number(e.target.value))}
            className="w-24"
          />
          <span className="text-muted-foreground">{t('common.days')}</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>{t('settings.funnels.idle-deal-days')}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            value={rules.idleDealAlertDays}
            onChange={(e) => update('idleDealAlertDays', Number(e.target.value))}
            className="w-24"
          />
          <span className="text-muted-foreground">{t('common.days')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.funnels.auto-move-cold')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.funnels.auto-move-cold-desc')}</p>
        </div>
        <Switch checked={rules.autoMoveToCold} onCheckedChange={(v) => update('autoMoveToCold', v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t('settings.funnels.auto-followup-task')}</Label>
        <Switch checked={rules.autoAssignFollowUpTask} onCheckedChange={(v) => update('autoAssignFollowUpTask', v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t('settings.funnels.notify-owner-idle')}</Label>
        <Switch checked={rules.notifyOwnerOnIdle} onCheckedChange={(v) => update('notifyOwnerOnIdle', v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t('settings.funnels.notify-manager-idle')}</Label>
        <Switch checked={rules.notifyManagerOnIdle} onCheckedChange={(v) => update('notifyManagerOnIdle', v)} />
      </div>
    </div>
  );
};

export default InactivityRulesSection;

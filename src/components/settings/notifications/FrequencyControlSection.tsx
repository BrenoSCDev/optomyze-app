import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FrequencySettings } from '@/services/notificationSettingsApi';

interface Props {
  frequency: FrequencySettings;
  onUpdate: (updates: Partial<FrequencySettings>) => void;
}

export default function FrequencyControlSection({ frequency, onUpdate }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.frequency.description')}
      </p>

      <div className="space-y-4">
        {/* Group Similar */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
          <div>
            <Label className="font-medium">
              {t('settings.notifications.frequency.group-similar')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('settings.notifications.frequency.group-similar-hint')}
            </p>
          </div>
          <Switch
            checked={frequency.groupSimilar}
            onCheckedChange={(checked) => onUpdate({ groupSimilar: checked })}
          />
        </div>

        {/* Max Per Hour */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
          <div>
            <Label className="font-medium">
              {t('settings.notifications.frequency.max-per-hour')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('settings.notifications.frequency.max-per-hour-hint')}
            </p>
          </div>
          <Input
            type="number"
            min={1}
            max={100}
            value={frequency.maxPerHour}
            onChange={(e) => onUpdate({ maxPerHour: parseInt(e.target.value) || 20 })}
            className="w-20 text-center"
          />
        </div>

        {/* Delay Non-Critical */}
        <div className="p-4 rounded-lg border bg-background/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">
                {t('settings.notifications.frequency.delay-non-critical')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.notifications.frequency.delay-non-critical-hint')}
              </p>
            </div>
            <Switch
              checked={frequency.delayNonCritical}
              onCheckedChange={(checked) => onUpdate({ delayNonCritical: checked })}
            />
          </div>

          {frequency.delayNonCritical && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Label className="text-sm text-muted-foreground">
                {t('settings.notifications.frequency.delay-duration')}
              </Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={frequency.delayDuration}
                onChange={(e) => onUpdate({ delayDuration: parseInt(e.target.value) || 15 })}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">
                {t('common.minutes')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

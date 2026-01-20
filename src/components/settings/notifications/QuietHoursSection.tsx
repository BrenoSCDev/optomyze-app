import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { QuietHoursSettings } from '@/services/notificationSettingsApi';
import { Moon, Sun } from 'lucide-react';

interface Props {
  quietHours: QuietHoursSettings;
  onUpdate: (updates: Partial<QuietHoursSettings>) => void;
}

export default function QuietHoursSection({ quietHours, onUpdate }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.quiet-hours.description')}
      </p>

      <div className="space-y-4">
        {/* Enable Quiet Hours */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              quietHours.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <Label className="font-medium">
                {t('settings.notifications.quiet-hours.enable')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.notifications.quiet-hours.enable-hint')}
              </p>
            </div>
          </div>
          <Switch
            checked={quietHours.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
          />
        </div>

        {quietHours.enabled && (
          <>
            {/* Time Range */}
            <div className="p-4 rounded-lg border bg-background/50">
              <Label className="font-medium mb-3 block">
                {t('settings.notifications.quiet-hours.time-range')}
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={quietHours.from || ''}
                    onChange={(e) => onUpdate({ from: e.target.value || null })}
                    className="w-32"
                  />
                </div>
                <span className="text-muted-foreground">{t('common.to')}</span>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={quietHours.to || ''}
                    onChange={(e) => onUpdate({ to: e.target.value || null })}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

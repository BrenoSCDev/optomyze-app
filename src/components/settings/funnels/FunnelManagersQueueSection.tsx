import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ManagersQueueSettings {
  enabled: boolean;
  assignmentMode: 'round-robin' | 'least-loaded' | 'manual';
  maxLeadsPerManager: number;
  autoReassignOnInactivity: boolean;
  inactivityThresholdHours: number;
}

interface Props {
  settings: ManagersQueueSettings;
  onUpdate: (settings: ManagersQueueSettings) => void;
}

const FunnelManagersQueueSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();

  const update = (key: keyof ManagersQueueSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.funnels.managers-queue.enabled')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.funnels.managers-queue.enabled-desc')}</p>
        </div>
        <Switch checked={settings.enabled} onCheckedChange={(v) => update('enabled', v)} />
      </div>

      {settings.enabled && (
        <>
          <div className="grid gap-2">
            <Label>{t('settings.funnels.managers-queue.assignment-mode')}</Label>
            <Select
              value={settings.assignmentMode}
              onValueChange={(value: 'round-robin' | 'least-loaded' | 'manual') => update('assignmentMode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round-robin">{t('settings.funnels.managers-queue.round-robin')}</SelectItem>
                <SelectItem value="least-loaded">{t('settings.funnels.managers-queue.least-loaded')}</SelectItem>
                <SelectItem value="manual">{t('settings.funnels.managers-queue.manual')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t('settings.funnels.managers-queue.max-leads')}</Label>
            <Input
              type="number"
              min={1}
              value={settings.maxLeadsPerManager}
              onChange={(e) => update('maxLeadsPerManager', Number(e.target.value))}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">{t('settings.funnels.managers-queue.max-leads-desc')}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.funnels.managers-queue.auto-reassign')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.funnels.managers-queue.auto-reassign-desc')}</p>
            </div>
            <Switch checked={settings.autoReassignOnInactivity} onCheckedChange={(v) => update('autoReassignOnInactivity', v)} />
          </div>

          {settings.autoReassignOnInactivity && (
            <div className="grid gap-2 ml-4 border-l-2 border-primary/20 pl-4">
              <Label>{t('settings.funnels.managers-queue.inactivity-threshold')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={settings.inactivityThresholdHours}
                  onChange={(e) => update('inactivityThresholdHours', Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">{t('common.hours')}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FunnelManagersQueueSection;

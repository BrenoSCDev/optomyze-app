import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import {
  NotificationEvents,
  NotificationEventConfig,
  NotificationPriority,
} from '@/services/notificationSettingsApi';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Props {
  events: NotificationEvents;
  onUpdate: (eventKey: string, updates: Partial<NotificationEventConfig>) => void;
}

const priorityOptions: NotificationPriority[] = ['low', 'normal', 'high'];

const priorityIcons = {
  low: Info,
  normal: AlertTriangle,
  high: AlertCircle,
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-yellow-500/20 text-yellow-600',
  high: 'bg-destructive/20 text-destructive',
};

export default function NotificationEventsSection({ events, onUpdate }: Props) {
  const { t } = useLanguage();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Convert events object to array for rendering
  const eventEntries = Object.entries(events);

  if (eventEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('settings.notifications.events.no-events')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.events.description')}
      </p>

      <div className="space-y-2">
        {eventEntries.map(([eventKey, eventConfig]) => {
          const PriorityIcon = priorityIcons[eventConfig.priority];
          const isExpanded = expandedEvent === eventKey;

          return (
            <Collapsible
              key={eventKey}
              open={isExpanded}
              onOpenChange={(open) => setExpandedEvent(open ? eventKey : null)}
            >
              <div className={`border rounded-lg transition-colors ${
                eventConfig.enabled ? 'bg-background/50' : 'bg-muted/30'
              }`}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={eventConfig.enabled}
                        onCheckedChange={(checked) => onUpdate(eventKey, { enabled: checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={`font-medium ${!eventConfig.enabled ? 'text-muted-foreground' : ''}`}>
                        {t(`settings.notifications.events.${eventKey}`)}
                      </span>
                      <Badge variant="outline" className={priorityColors[eventConfig.priority]}>
                        <PriorityIcon className="w-3 h-3 mr-1" />
                        {t(`settings.notifications.priority.${eventConfig.priority}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 border-t space-y-4">
                    {/* Priority */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        {t('settings.notifications.events.priority-label')}
                      </Label>
                      <Select
                        value={eventConfig.priority}
                        onValueChange={(value: NotificationPriority) => onUpdate(eventKey, { priority: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {t(`settings.notifications.priority.${priority}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import {
  NotificationEvent,
  NotificationChannel,
  NotificationPriority,
  RecipientType,
  NotificationChannels,
} from '@/services/notificationSettingsApi';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Props {
  events: NotificationEvent[];
  enabledChannels: NotificationChannels;
  onUpdate: (eventId: string, updates: Partial<NotificationEvent>) => void;
}

const channelOptions: NotificationChannel[] = ['email', 'whatsapp', 'slack', 'in_app', 'push'];
const recipientOptions: RecipientType[] = ['deal_owner', 'lead_owner', 'manager', 'admin'];
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

export default function NotificationEventsSection({ events, enabledChannels, onUpdate }: Props) {
  const { t } = useLanguage();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const toggleChannel = (eventId: string, channel: NotificationChannel, currentChannels: NotificationChannel[]) => {
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel];
    onUpdate(eventId, { channels: newChannels });
  };

  const toggleRecipient = (eventId: string, recipient: RecipientType, currentRecipients: RecipientType[]) => {
    const newRecipients = currentRecipients.includes(recipient)
      ? currentRecipients.filter(r => r !== recipient)
      : [...currentRecipients, recipient];
    onUpdate(eventId, { recipients: newRecipients });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.events.description')}
      </p>

      <div className="space-y-2">
        {events.map((event) => {
          const PriorityIcon = priorityIcons[event.priority];
          const isExpanded = expandedEvent === event.id;

          return (
            <Collapsible
              key={event.id}
              open={isExpanded}
              onOpenChange={(open) => setExpandedEvent(open ? event.id : null)}
            >
              <div className={`border rounded-lg transition-colors ${
                event.enabled ? 'bg-background/50' : 'bg-muted/30'
              }`}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={event.enabled}
                        onCheckedChange={(checked) => onUpdate(event.id, { enabled: checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={`font-medium ${!event.enabled ? 'text-muted-foreground' : ''}`}>
                        {t(`settings.notifications.events.${event.event}`)}
                      </span>
                      <Badge variant="outline" className={priorityColors[event.priority]}>
                        <PriorityIcon className="w-3 h-3 mr-1" />
                        {t(`settings.notifications.priority.${event.priority}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {event.channels.map((ch) => (
                          <Badge key={ch} variant="secondary" className="text-xs">
                            {t(`settings.notifications.channels.${ch}`)}
                          </Badge>
                        ))}
                      </div>
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
                    {/* Channels */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        {t('settings.notifications.events.channels-label')}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {channelOptions.map((channel) => (
                          <div key={channel} className="flex items-center gap-2">
                            <Checkbox
                              id={`${event.id}-${channel}`}
                              checked={event.channels.includes(channel)}
                              onCheckedChange={() => toggleChannel(event.id, channel, event.channels)}
                              disabled={!enabledChannels[channel]}
                            />
                            <Label
                              htmlFor={`${event.id}-${channel}`}
                              className={`text-sm ${!enabledChannels[channel] ? 'text-muted-foreground line-through' : ''}`}
                            >
                              {t(`settings.notifications.channels.${channel}`)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recipients */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        {t('settings.notifications.events.recipients-label')}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {recipientOptions.map((recipient) => (
                          <div key={recipient} className="flex items-center gap-2">
                            <Checkbox
                              id={`${event.id}-${recipient}`}
                              checked={event.recipients.includes(recipient)}
                              onCheckedChange={() => toggleRecipient(event.id, recipient, event.recipients)}
                            />
                            <Label htmlFor={`${event.id}-${recipient}`} className="text-sm">
                              {t(`settings.notifications.recipients.${recipient}`)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        {t('settings.notifications.events.priority-label')}
                      </Label>
                      <Select
                        value={event.priority}
                        onValueChange={(value: NotificationPriority) => onUpdate(event.id, { priority: value })}
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

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { NotificationTemplate, NotificationChannel } from '@/services/notificationSettingsApi';
import { Plus, Edit2, Trash2, Mail, MessageCircle, Hash, Bell, Smartphone } from 'lucide-react';

interface Props {
  templates: NotificationTemplate[];
  onUpdate: (templateId: string, updates: Partial<NotificationTemplate>) => void;
  onAdd: (template: Omit<NotificationTemplate, 'id'>) => void;
  onDelete: (templateId: string) => void;
}

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  slack: Hash,
  in_app: Bell,
  push: Smartphone,
};

const channelOptions: NotificationChannel[] = ['email', 'whatsapp', 'slack', 'in_app', 'push'];

export default function NotificationTemplatesSection({ templates, onUpdate, onAdd, onDelete }: Props) {
  const { t } = useLanguage();
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Omit<NotificationTemplate, 'id'>>({
    name: '',
    channel: 'email',
    subject: '',
    body: '',
    variables: [],
  });

  const handleSaveEdit = () => {
    if (editingTemplate) {
      onUpdate(editingTemplate.id, editingTemplate);
      setEditingTemplate(null);
    }
  };

  const handleCreate = () => {
    if (newTemplate.name && newTemplate.body) {
      onAdd({
        ...newTemplate,
        variables: extractVariables(newTemplate.body),
      });
      setNewTemplate({ name: '', channel: 'email', subject: '', body: '', variables: [] });
      setIsCreating(false);
    }
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    return matches ? [...new Set(matches.map(m => m.slice(1, -1)))] : [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('settings.notifications.templates.description')}
        </p>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('settings.notifications.templates.add')}
        </Button>
      </div>

      <div className="grid gap-3">
        {templates.map((template) => {
          const Icon = channelIcons[template.channel];
          return (
            <div
              key={template.id}
              className="p-4 rounded-lg border bg-background/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {t(`settings.notifications.channels.${template.channel}`)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate({ ...template })}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {template.subject && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{t('settings.notifications.templates.subject')}:</span> {template.subject}
                </p>
              )}

              <p className="text-sm text-muted-foreground line-clamp-2">{template.body}</p>

              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {'{' + variable + '}'}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('settings.notifications.templates.edit')}</DialogTitle>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label>{t('settings.notifications.templates.name')}</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>

              <div>
                <Label>{t('settings.notifications.templates.channel')}</Label>
                <Select
                  value={editingTemplate.channel}
                  onValueChange={(value: NotificationChannel) =>
                    setEditingTemplate({ ...editingTemplate, channel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map((ch) => (
                      <SelectItem key={ch} value={ch}>
                        {t(`settings.notifications.channels.${ch}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingTemplate.channel === 'email' && (
                <div>
                  <Label>{t('settings.notifications.templates.subject')}</Label>
                  <Input
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label>{t('settings.notifications.templates.body')}</Label>
                <Textarea
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    body: e.target.value,
                    variables: extractVariables(e.target.value),
                  })}
                  rows={5}
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  {t('settings.notifications.templates.variables-hint')}
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {editingTemplate.variables.map((v) => (
                    <Badge key={v} variant="outline">{'{' + v + '}'}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('settings.notifications.templates.add')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('settings.notifications.templates.name')}</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder={t('settings.notifications.templates.name-placeholder')}
              />
            </div>

            <div>
              <Label>{t('settings.notifications.templates.channel')}</Label>
              <Select
                value={newTemplate.channel}
                onValueChange={(value: NotificationChannel) =>
                  setNewTemplate({ ...newTemplate, channel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channelOptions.map((ch) => (
                    <SelectItem key={ch} value={ch}>
                      {t(`settings.notifications.channels.${ch}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newTemplate.channel === 'email' && (
              <div>
                <Label>{t('settings.notifications.templates.subject')}</Label>
                <Input
                  value={newTemplate.subject || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder={t('settings.notifications.templates.subject-placeholder')}
                />
              </div>
            )}

            <div>
              <Label>{t('settings.notifications.templates.body')}</Label>
              <Textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({
                  ...newTemplate,
                  body: e.target.value,
                  variables: extractVariables(e.target.value),
                })}
                rows={5}
                placeholder={t('settings.notifications.templates.body-placeholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!newTemplate.name || !newTemplate.body}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

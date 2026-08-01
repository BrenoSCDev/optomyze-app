import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { StageAction, ACTION_TYPES } from '@/services/funnelSettingsApi';

interface Props {
  actions: StageAction[];
  onUpdate: (actions: StageAction[]) => void;
}

const emptyAction: Omit<StageAction, 'id'> = {
  type: 'create-task',
  enabled: true,
  order: 1,
  config: {},
};

const StageActionsSection = ({ actions, onUpdate }: Props) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<StageAction | null>(null);
  const [form, setForm] = useState<Omit<StageAction, 'id'>>(emptyAction);

  const handleAdd = () => {
    setEditingAction(null);
    setForm({ ...emptyAction, order: actions.length + 1 });
    setIsDialogOpen(true);
  };

  const handleEdit = (action: StageAction) => {
    setEditingAction(action);
    setForm({
      type: action.type,
      enabled: action.enabled,
      order: action.order,
      config: action.config,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(actions.filter(a => a.id !== id));
  };

  const handleToggleEnabled = (id: string) => {
    onUpdate(actions.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const handleSave = () => {
    if (editingAction) {
      onUpdate(actions.map(a =>
        a.id === editingAction.id ? { ...form, id: editingAction.id } : a
      ));
    } else {
      onUpdate([...actions, { ...form, id: crypto.randomUUID() }]);
    }
    setIsDialogOpen(false);
  };

  const getActionLabel = (type: string) => {
    return ACTION_TYPES.find(a => a.value === type)?.label || type;
  };

  const renderConfigFields = () => {
    switch (form.type) {
      case 'create-task':
        return (
          <>
            <div className="grid gap-2">
              <Label>{t('settings.funnels.task-title')}</Label>
              <Input
                value={form.config.taskTitle || ''}
                onChange={(e) => setForm({ ...form, config: { ...form.config, taskTitle: e.target.value } })}
                placeholder={t('settings.funnels.task-title-placeholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('settings.funnels.due-date-offset')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={form.config.dueDateOffset || 0}
                  onChange={(e) => setForm({ ...form, config: { ...form.config, dueDateOffset: Number(e.target.value) } })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">{t('common.days')}</span>
              </div>
            </div>
          </>
        );
      case 'send-notification':
      case 'assign-owner':
        return (
          <div className="grid gap-2">
            <Label>{t('settings.funnels.user-role')}</Label>
            <Select
              value={form.config.assignTo || 'owner'}
              onValueChange={(value) => setForm({ ...form, config: { ...form.config, assignTo: value } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">{t('settings.funnels.deal-owner')}</SelectItem>
                <SelectItem value="manager">{t('settings.funnels.team-manager')}</SelectItem>
                <SelectItem value="admin">{t('settings.funnels.admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'send-email':
      case 'send-whatsapp':
        return (
          <div className="grid gap-2">
            <Label>{t('settings.funnels.template')}</Label>
            <Input
              value={form.config.templateId || ''}
              onChange={(e) => setForm({ ...form, config: { ...form.config, templateId: e.target.value } })}
              placeholder={t('settings.funnels.template-placeholder')}
            />
          </div>
        );
      case 'add-tag':
        return (
          <div className="grid gap-2">
            <Label>{t('settings.funnels.tag-name')}</Label>
            <Input
              value={form.config.tagName || ''}
              onChange={(e) => setForm({ ...form, config: { ...form.config, tagName: e.target.value } })}
              placeholder={t('settings.funnels.tag-placeholder')}
            />
          </div>
        );
      case 'set-expected-close':
        return (
          <div className="grid gap-2">
            <Label>{t('settings.funnels.days-offset')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={form.config.daysOffset || 0}
                onChange={(e) => setForm({ ...form, config: { ...form.config, daysOffset: Number(e.target.value) } })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">{t('common.days')}</span>
            </div>
          </div>
        );
      case 'update-custom-field':
        return (
          <>
            <div className="grid gap-2">
              <Label>{t('settings.funnels.field-name')}</Label>
              <Input
                value={form.config.fieldName || ''}
                onChange={(e) => setForm({ ...form, config: { ...form.config, fieldName: e.target.value } })}
                placeholder={t('settings.funnels.field-placeholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('settings.funnels.field-value')}</Label>
              <Input
                value={form.config.fieldValue || ''}
                onChange={(e) => setForm({ ...form, config: { ...form.config, fieldValue: e.target.value } })}
                placeholder={t('settings.funnels.value-placeholder')}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.funnels.actions-desc')}</p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          {t('settings.funnels.add-action')}
        </Button>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>{t('settings.funnels.no-actions')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.sort((a, b) => a.order - b.order).map(action => (
            <div
              key={action.id}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                action.enabled ? 'bg-background/50' : 'bg-muted/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                <div>
                  <span className="font-medium">{getActionLabel(action.type)}</span>
                  {action.config.taskTitle && (
                    <p className="text-xs text-muted-foreground">{action.config.taskTitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={action.enabled}
                  onCheckedChange={() => handleToggleEnabled(action.id)}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(action)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(action.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAction ? t('settings.funnels.edit-action') : t('settings.funnels.add-action')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.funnels.action-type')}</Label>
              <Select
                value={form.type}
                onValueChange={(value: StageAction['type']) => setForm({ ...form, type: value, config: {} })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(action => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderConfigFields()}

            <div className="flex items-center justify-between">
              <Label>{t('settings.funnels.enabled')}</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StageActionsSection;

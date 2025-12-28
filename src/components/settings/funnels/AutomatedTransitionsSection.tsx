import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { AutomatedTransition, Funnel, TRIGGER_TYPES } from '@/services/funnelSettingsApi';

interface Props {
  transitions: AutomatedTransition[];
  funnels: Funnel[];
  onUpdate: (transitions: AutomatedTransition[]) => void;
}

const emptyTransition: Omit<AutomatedTransition, 'id'> = {
  trigger: 'lead-created',
  sourceStageId: '',
  targetStageId: '',
  delay: { type: 'immediate', value: 0 },
  enabled: true,
};

const AutomatedTransitionsSection = ({ transitions, funnels, onUpdate }: Props) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransition, setEditingTransition] = useState<AutomatedTransition | null>(null);
  const [form, setForm] = useState<Omit<AutomatedTransition, 'id'>>(emptyTransition);

  // Get all stages from all funnels
  const allStages = funnels.flatMap(f => f.stages.map(s => ({ ...s, funnelName: f.name })));

  const handleAdd = () => {
    setEditingTransition(null);
    setForm(emptyTransition);
    setIsDialogOpen(true);
  };

  const handleEdit = (transition: AutomatedTransition) => {
    setEditingTransition(transition);
    setForm({
      trigger: transition.trigger,
      sourceStageId: transition.sourceStageId,
      targetStageId: transition.targetStageId,
      delay: transition.delay,
      enabled: transition.enabled,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(transitions.filter(t => t.id !== id));
  };

  const handleToggleEnabled = (id: string) => {
    onUpdate(transitions.map(t =>
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const handleSave = () => {
    if (!form.sourceStageId || !form.targetStageId) return;

    if (editingTransition) {
      onUpdate(transitions.map(t =>
        t.id === editingTransition.id ? { ...form, id: editingTransition.id } : t
      ));
    } else {
      onUpdate([...transitions, { ...form, id: crypto.randomUUID() }]);
    }
    setIsDialogOpen(false);
  };

  const getStageName = (stageId: string) => {
    const stage = allStages.find(s => s.id === stageId);
    return stage ? `${stage.name} (${stage.funnelName})` : stageId;
  };

  const getTriggerLabel = (trigger: string) => {
    return TRIGGER_TYPES.find(t => t.value === trigger)?.label || trigger;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.funnels.transitions-desc')}</p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.funnels.add-transition')}
        </Button>
      </div>

      {transitions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>{t('settings.funnels.no-transitions')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transitions.map(transition => (
            <div
              key={transition.id}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                transition.enabled ? 'bg-background/50' : 'bg-muted/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                      {getTriggerLabel(transition.trigger)}
                    </span>
                    <span className="text-sm">
                      {getStageName(transition.sourceStageId)} → {getStageName(transition.targetStageId)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {transition.delay.type === 'immediate'
                      ? t('settings.funnels.delay-immediate')
                      : `${transition.delay.value} ${t(`settings.funnels.delay-${transition.delay.type}`)}`
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={transition.enabled}
                  onCheckedChange={() => handleToggleEnabled(transition.id)}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(transition)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(transition.id)}>
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
              {editingTransition ? t('settings.funnels.edit-transition') : t('settings.funnels.add-transition')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.funnels.trigger')}</Label>
              <Select
                value={form.trigger}
                onValueChange={(value: AutomatedTransition['trigger']) => setForm({ ...form, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(trigger => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.source-stage')}</Label>
              <Select
                value={form.sourceStageId}
                onValueChange={(value) => setForm({ ...form, sourceStageId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.funnels.select-stage')} />
                </SelectTrigger>
                <SelectContent>
                  {allStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} ({stage.funnelName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.target-stage')}</Label>
              <Select
                value={form.targetStageId}
                onValueChange={(value) => setForm({ ...form, targetStageId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.funnels.select-stage')} />
                </SelectTrigger>
                <SelectContent>
                  {allStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} ({stage.funnelName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.delay')}</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={form.delay.type}
                  onValueChange={(value: 'immediate' | 'hours' | 'days') =>
                    setForm({ ...form, delay: { ...form.delay, type: value, value: value === 'immediate' ? 0 : form.delay.value || 1 } })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">{t('settings.funnels.delay-immediate')}</SelectItem>
                    <SelectItem value="hours">{t('settings.funnels.delay-hours')}</SelectItem>
                    <SelectItem value="days">{t('settings.funnels.delay-days')}</SelectItem>
                  </SelectContent>
                </Select>
                {form.delay.type !== 'immediate' && (
                  <Input
                    type="number"
                    min={1}
                    value={form.delay.value}
                    onChange={(e) => setForm({ ...form, delay: { ...form.delay, value: Number(e.target.value) } })}
                    className="w-20"
                  />
                )}
              </div>
            </div>

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
            <Button onClick={handleSave} disabled={!form.sourceStageId || !form.targetStageId}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomatedTransitionsSection;

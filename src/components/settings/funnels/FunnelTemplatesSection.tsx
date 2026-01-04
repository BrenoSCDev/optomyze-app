import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, GripVertical, Settings2, Copy, FileStack, Loader2 } from 'lucide-react';
import { Funnel, FunnelStage, STAGE_COLORS, defaultStageEntryRules } from '@/services/funnelSettingsApi';

interface Props {
  funnels: Funnel[];
  templateFunnels: Funnel[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onAddTemplate: (funnel: Funnel) => Promise<void>;
  onUpdateTemplate: (id: string, updates: Partial<Funnel>) => void;
  onDeleteTemplate: (id: string) => Promise<void>;
  onEditStage: (stage: FunnelStage) => void;
  onCreateFunnelFromTemplate: (templateId: string, newFunnelName?: string) => Promise<void>;
  onAddTemplateStage: (templateId: string, stage: Omit<FunnelStage, 'id'>) => Promise<FunnelStage>;
  onUpdateTemplateStage: (templateId: string, stageId: string, updates: Partial<FunnelStage>) => Promise<void>;
  onDeleteTemplateStage: (templateId: string, stageId: string) => Promise<void>;
}

const emptyFunnel: Omit<Funnel, 'id'> = {
  name: '',
  type: 'model',
  isDefault: false,
  appliesTo: 'both',
  stages: [],
};

const emptyStage: Omit<FunnelStage, 'id'> = {
  name: '',
  type: 'lead',
  order: 1,
  probability: 50,
  color: '#3b82f6',
  isFinalStage: false,
  allowBackward: true,
  entryRules: defaultStageEntryRules,
  actions: [],
};

const FunnelTemplatesSection = ({
  funnels,
  templateFunnels,
  selectedTemplateId,
  onSelectTemplate,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onEditStage,
  onCreateFunnelFromTemplate,
  onAddTemplateStage,
  onUpdateTemplateStage,
  onDeleteTemplateStage,
}: Props) => {
  const { t } = useLanguage();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Funnel | null>(null);
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<Omit<Funnel, 'id'>>(emptyFunnel);
  const [stageForm, setStageForm] = useState<Omit<FunnelStage, 'id'>>(emptyStage);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedTemplate = templateFunnels.find(f => f.id === selectedTemplateId);

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm(emptyFunnel);
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (funnel: Funnel) => {
    setEditingTemplate(funnel);
    setTemplateForm({
      name: funnel.name,
      type: 'model',
      isDefault: funnel.isDefault,
      appliesTo: funnel.appliesTo,
      stages: funnel.stages,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name) return;

    setIsSaving(true);
    try {
      if (editingTemplate) {
        onUpdateTemplate(editingTemplate.id, { ...templateForm, type: 'model' });
      } else {
        const newTemplate: Funnel = {
          ...templateForm,
          id: crypto.randomUUID(),
          type: 'model',
          stages: [],
        };
        await onAddTemplate(newTemplate);
      }
      setIsTemplateDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (templateId: string) => {
    setDeletingTemplateId(templateId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingTemplateId) {
      setIsDeleting(true);
      try {
        await onDeleteTemplate(deletingTemplateId);
      } finally {
        setIsDeleting(false);
      }
    }
    setIsDeleteDialogOpen(false);
    setDeletingTemplateId(null);
  };

  const handleAddStage = () => {
    if (!selectedTemplate) return;
    setEditingStage(null);
    setStageForm({
      ...emptyStage,
      order: selectedTemplate.stages.length + 1,
    });
    setIsStageDialogOpen(true);
  };

  const handleEditStageLocal = (stage: FunnelStage) => {
    setEditingStage(stage);
    setStageForm({
      name: stage.name,
      type: stage.type,
      order: stage.order,
      probability: stage.probability,
      color: stage.color,
      isFinalStage: stage.isFinalStage,
      finalType: stage.finalType,
      allowBackward: stage.allowBackward,
      entryRules: stage.entryRules,
      actions: stage.actions,
    });
    setIsStageDialogOpen(true);
  };

  const handleSaveStage = async () => {
    if (!stageForm.name || !selectedTemplate) return;

    setIsSaving(true);
    try {
      if (editingStage) {
        await onUpdateTemplateStage(selectedTemplate.id, editingStage.id, stageForm);
      } else {
        await onAddTemplateStage(selectedTemplate.id, stageForm);
      }
      setIsStageDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!selectedTemplate) return;
    try {
      await onDeleteTemplateStage(selectedTemplate.id, stageId);
    } catch (error) {
      console.error('Failed to delete stage:', error);
    }
  };

  const handleOpenCreateFromTemplate = () => {
    if (!selectedTemplate) return;
    setNewFunnelName(`${selectedTemplate.name} (Copy)`);
    setIsCreateFromTemplateDialogOpen(true);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newFunnelName) return;
    setIsSaving(true);
    try {
      await onCreateFunnelFromTemplate(selectedTemplate.id, newFunnelName);
      setIsCreateFromTemplateDialogOpen(false);
      setNewFunnelName('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedTemplateId || ''} onValueChange={onSelectTemplate}>
            <SelectTrigger>
              <SelectValue placeholder={t('settings.funnels.select-template')} />
            </SelectTrigger>
            <SelectContent>
              {templateFunnels.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <FileStack className="w-3 h-3 text-muted-foreground" />
                    {template.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleAddTemplate}>
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.funnels.add-template')}
        </Button>
      </div>

      {templateFunnels.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
          {t('settings.funnels.no-templates')}
        </p>
      )}

      {/* Selected Template Details */}
      {selectedTemplate && (
        <div className="border rounded-lg bg-background/50">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <FileStack className="w-5 h-5 text-primary" />
              <span className="font-medium text-lg">{selectedTemplate.name}</span>
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                {t('settings.funnels.template')}
              </span>
              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                {t(`settings.funnels.applies-${selectedTemplate.appliesTo}`)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleOpenCreateFromTemplate}>
                <Copy className="w-4 h-4 mr-1" />
                {t('settings.funnels.create-from-template')}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(selectedTemplate)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(selectedTemplate.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          {/* Stages */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{t('settings.funnels.template-stages')}</h4>
              <Button variant="outline" size="sm" onClick={handleAddStage}>
                <Plus className="w-3 h-3 mr-1" />
                {t('settings.funnels.add-stage')}
              </Button>
            </div>

            {selectedTemplate.stages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
                {t('settings.funnels.no-stages')}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTemplate.stages.sort((a, b) => a.order - b.order).map(stage => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stage.name}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                            {stage.type}
                          </span>
                          {stage.isFinalStage && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              stage.finalType === 'won' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                            }`}>
                              {stage.finalType}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {stage.probability}% • {stage.allowBackward ? t('settings.funnels.backward-allowed') : t('settings.funnels.backward-blocked')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditStage(stage)}
                        title={t('settings.funnels.stage-rules')}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditStageLocal(stage)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteStage(stage.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? t('settings.funnels.edit-template') : t('settings.funnels.add-template')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.funnels.template-name')}</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder={t('settings.funnels.template-name-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.applies-to')}</Label>
              <Select
                value={templateForm.appliesTo}
                onValueChange={(value: Funnel['appliesTo']) => setTemplateForm({ ...templateForm, appliesTo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">{t('settings.funnels.applies-leads')}</SelectItem>
                  <SelectItem value="deals">{t('settings.funnels.applies-deals')}</SelectItem>
                  <SelectItem value="both">{t('settings.funnels.applies-both')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateForm.name || isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStage ? t('settings.funnels.edit-stage') : t('settings.funnels.add-stage')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>{t('settings.funnels.stage-name')}</Label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder={t('settings.funnels.stage-name-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.stage-type')}</Label>
              <Select
                value={stageForm.type}
                onValueChange={(value: 'lead' | 'deal') => setStageForm({ ...stageForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">{t('settings.funnels.type-lead')}</SelectItem>
                  <SelectItem value="deal">{t('settings.funnels.type-deal')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('settings.funnels.stage-order')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={stageForm.order}
                  onChange={(e) => setStageForm({ ...stageForm, order: Number(e.target.value) })}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t('settings.funnels.stage-probability')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={stageForm.probability}
                    onChange={(e) => setStageForm({ ...stageForm, probability: Number(e.target.value) })}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.stage-color')}</Label>
              <div className="flex flex-wrap gap-2">
                {STAGE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      stageForm.color === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setStageForm({ ...stageForm, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.funnels.is-final-stage')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.funnels.is-final-stage-desc')}</p>
              </div>
              <Switch
                checked={stageForm.isFinalStage}
                onCheckedChange={(checked) => setStageForm({
                  ...stageForm,
                  isFinalStage: checked,
                  finalType: checked ? 'won' : undefined,
                })}
              />
            </div>

            {stageForm.isFinalStage && (
              <div className="grid gap-2 ml-4 border-l-2 border-primary/20 pl-4">
                <Label>{t('settings.funnels.final-type')}</Label>
                <Select
                  value={stageForm.finalType || 'won'}
                  onValueChange={(value: 'won' | 'lost') => setStageForm({ ...stageForm, finalType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">{t('settings.funnels.final-won')}</SelectItem>
                    <SelectItem value="lost">{t('settings.funnels.final-lost')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.funnels.allow-backward')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.funnels.allow-backward-desc')}</p>
              </div>
              <Switch
                checked={stageForm.allowBackward}
                onCheckedChange={(checked) => setStageForm({ ...stageForm, allowBackward: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveStage} disabled={!stageForm.name || isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create From Template Dialog */}
      <Dialog open={isCreateFromTemplateDialogOpen} onOpenChange={setIsCreateFromTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.funnels.create-from-template')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t('settings.funnels.create-from-template-desc')}
            </p>
            <div className="grid gap-2">
              <Label>{t('settings.funnels.new-funnel-name')}</Label>
              <Input
                value={newFunnelName}
                onChange={(e) => setNewFunnelName(e.target.value)}
                placeholder={t('settings.funnels.funnel-name-placeholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFromTemplateDialogOpen(false)} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateFromTemplate} disabled={!newFunnelName || isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('settings.funnels.create-funnel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.funnels.delete-template-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.funnels.delete-template-desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FunnelTemplatesSection;

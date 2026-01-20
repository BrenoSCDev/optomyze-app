import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, GripVertical, Settings2, Copy, FileStack, Loader2, Cog } from 'lucide-react';
import { Funnel, FunnelStage, STAGE_COLORS, defaultStageEntryRules, TemplateStageType } from '@/services/funnelSettingsApi';
import StageEntryRequirementsModal, { EntryRequirement } from '@/components/stages/StageEntryRequirementsModal';

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

const TEMPLATE_STAGE_TYPES: { value: TemplateStageType; label: string }[] = [
  { value: 'entry', label: 'Entry' },
  { value: 'normal', label: 'Normal' },
  { value: 'service', label: 'Service' },
  { value: 'proposition', label: 'Proposition' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'lost', label: 'Lost' },
];

const emptyStage: Omit<FunnelStage, 'id'> = {
  name: '',
  description: '',
  type: 'lead',
  templateType: 'normal',
  order: 1,
  probability: 50,
  color: '#ffffff',
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
  const [isEntryRequirementsModalOpen, setIsEntryRequirementsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Funnel | null>(null);
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [entryRequirementsStage, setEntryRequirementsStage] = useState<FunnelStage | null>(null);
  const [stageEntryRequirement, setStageEntryRequirement] = useState<EntryRequirement | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<Omit<Funnel, 'id'>>(emptyFunnel);
  const [stageForm, setStageForm] = useState<Omit<FunnelStage, 'id'>>(emptyStage);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedTemplate = templateFunnels.find(f => f.id === selectedTemplateId);

  // Open entry requirements modal for a stage
  const openEntryRequirementsModal = (stage: FunnelStage) => {
    setEntryRequirementsStage(stage);
    // Convert frontend entryRules to API EntryRequirement format if needed
    // The modal will fetch the actual data from the API using the stage ID
    setStageEntryRequirement(null); // Will be loaded by the modal
    setIsEntryRequirementsModalOpen(true);
  };

  // Handle entry requirement update
  const handleEntryRequirementUpdate = (updatedRequirement: EntryRequirement) => {
    // Update is handled by the modal's API call
    // The stage's entry_requirement will be updated via API
    setStageEntryRequirement(updatedRequirement);
  };

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
      description: stage.description || '',
      type: stage.type,
      templateType: stage.templateType || 'normal',
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
                          <span className="text-xs px-1.5 py-0.5 bg-muted rounded capitalize">
                            {stage.templateType || 'normal'}
                          </span>
                        </div>
                        {stage.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {stage.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEntryRequirementsModal(stage)}
                        title={t('stages.configure_entry_requirements')}
                      >
                        <Cog className="w-4 h-4" />
                      </Button>
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
              <Label>{t('settings.funnels.stage-description')}</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                value={stageForm.description || ''}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                placeholder={t('settings.funnels.stage-description-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.stage-type')}</Label>
              <Select
                value={stageForm.templateType || 'normal'}
                onValueChange={(value: TemplateStageType) => setStageForm({ ...stageForm, templateType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.funnels.select-stage-type')} />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_STAGE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.stage-color')}</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    stageForm.color === '#ffffff' ? 'border-foreground' : 'border-muted'
                  }`}
                  style={{ backgroundColor: '#ffffff' }}
                  onClick={() => setStageForm({ ...stageForm, color: '#ffffff' })}
                />
                {STAGE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      stageForm.color === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setStageForm({ ...stageForm, color })}
                  />
                ))}
              </div>
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

      {/* Entry Requirements Modal */}
      {entryRequirementsStage && (
        <StageEntryRequirementsModal
          isOpen={isEntryRequirementsModalOpen}
          onClose={() => {
            setIsEntryRequirementsModalOpen(false);
            setEntryRequirementsStage(null);
          }}
          stageId={parseInt(entryRequirementsStage.id, 10)}
          stageName={entryRequirementsStage.name}
          entryRequirement={stageEntryRequirement}
          onUpdate={handleEntryRequirementUpdate}
        />
      )}
    </div>
  );
};

export default FunnelTemplatesSection;

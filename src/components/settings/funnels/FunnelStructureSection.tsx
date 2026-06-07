import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Star, GripVertical, Settings2 } from 'lucide-react';
import { Funnel, FunnelStage, STAGE_COLORS, defaultStageEntryRules } from '@/services/funnelSettingsApi';

interface Props {
  funnels: Funnel[];
  selectedFunnelId: string | null;
  onSelectFunnel: (id: string) => void;
  onAddFunnel: (funnel: Funnel) => void;
  onUpdateFunnel: (id: string, updates: Partial<Funnel>) => void;
  onDeleteFunnel: (id: string) => void;
  onSetDefault: (id: string) => void;
  onEditStage: (stage: FunnelStage) => void;
}

const emptyFunnel: Omit<Funnel, 'id'> = {
  name: '',
  type: 'sale',
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

const FunnelStructureSection = ({
  funnels,
  selectedFunnelId,
  onSelectFunnel,
  onAddFunnel,
  onUpdateFunnel,
  onDeleteFunnel,
  onSetDefault,
  onEditStage,
}: Props) => {
  const { t } = useLanguage();
  const [isFunnelDialogOpen, setIsFunnelDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [deletingFunnelId, setDeletingFunnelId] = useState<string | null>(null);
  const [funnelForm, setFunnelForm] = useState<Omit<Funnel, 'id'>>(emptyFunnel);
  const [stageForm, setStageForm] = useState<Omit<FunnelStage, 'id'>>(emptyStage);

  const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);

  const handleAddFunnel = () => {
    setEditingFunnel(null);
    setFunnelForm(emptyFunnel);
    setIsFunnelDialogOpen(true);
  };

  const handleEditFunnel = (funnel: Funnel) => {
    setEditingFunnel(funnel);
    setFunnelForm({
      name: funnel.name,
      type: funnel.type ?? 'sale',
      isDefault: funnel.isDefault,
      appliesTo: funnel.appliesTo,
      stages: funnel.stages,
    });
    setIsFunnelDialogOpen(true);
  };

  const handleSaveFunnel = () => {
    if (!funnelForm.name) return;

    if (editingFunnel) {
      onUpdateFunnel(editingFunnel.id, funnelForm);
    } else {
      const newFunnel: Funnel = {
        ...funnelForm,
        id: crypto.randomUUID(),
        stages: [],
      };
      onAddFunnel(newFunnel);
    }
    setIsFunnelDialogOpen(false);
  };

  const handleDeleteClick = (funnelId: string) => {
    setDeletingFunnelId(funnelId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingFunnelId) {
      onDeleteFunnel(deletingFunnelId);
    }
    setIsDeleteDialogOpen(false);
    setDeletingFunnelId(null);
  };

  const handleAddStage = () => {
    if (!selectedFunnel) return;
    setEditingStage(null);
    setStageForm({
      ...emptyStage,
      order: selectedFunnel.stages.length + 1,
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

  const handleSaveStage = () => {
    if (!stageForm.name || !selectedFunnel) return;

    let updatedStages: FunnelStage[];
    if (editingStage) {
      updatedStages = selectedFunnel.stages.map(s =>
        s.id === editingStage.id ? { ...stageForm, id: editingStage.id } : s
      );
    } else {
      const newStage: FunnelStage = {
        ...stageForm,
        id: crypto.randomUUID(),
      };
      updatedStages = [...selectedFunnel.stages, newStage];
    }

    onUpdateFunnel(selectedFunnel.id, {
      stages: updatedStages.sort((a, b) => a.order - b.order),
    });
    setIsStageDialogOpen(false);
  };

  const handleDeleteStage = (stageId: string) => {
    if (!selectedFunnel) return;
    onUpdateFunnel(selectedFunnel.id, {
      stages: selectedFunnel.stages.filter(s => s.id !== stageId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Funnel Selection */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedFunnelId || ''} onValueChange={onSelectFunnel}>
            <SelectTrigger>
              <SelectValue placeholder={t('settings.funnels.select-funnel')} />
            </SelectTrigger>
            <SelectContent>
              {funnels.map(funnel => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  <div className="flex items-center gap-2">
                    {funnel.name}
                    {funnel.isDefault && <Star className="w-3 h-3 text-primary" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleAddFunnel}>
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.funnels.add-funnel')}
        </Button>
      </div>

      {/* Selected Funnel Details */}
      {selectedFunnel && (
        <div className="border rounded-lg bg-background/50">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="font-medium text-lg">{selectedFunnel.name}</span>
              {selectedFunnel.isDefault && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                  <Star className="w-3 h-3" />
                  {t('settings.funnels.default')}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                {t(`settings.funnels.applies-${selectedFunnel.appliesTo}`)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!selectedFunnel.isDefault && (
                <Button variant="ghost" size="sm" onClick={() => onSetDefault(selectedFunnel.id)}>
                  {t('settings.funnels.set-default')}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleEditFunnel(selectedFunnel)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(selectedFunnel.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          {/* Stages */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{t('settings.funnels.stages')}</h4>
              <Button variant="outline" size="sm" onClick={handleAddStage}>
                <Plus className="w-3 h-3 mr-1" />
                {t('settings.funnels.add-stage')}
              </Button>
            </div>

            {selectedFunnel.stages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
                {t('settings.funnels.no-stages')}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedFunnel.stages.sort((a, b) => a.order - b.order).map(stage => (
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

      {/* Funnel Dialog */}
      <Dialog open={isFunnelDialogOpen} onOpenChange={setIsFunnelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFunnel ? t('settings.funnels.edit-funnel') : t('settings.funnels.add-funnel')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingFunnel && (
              <div className="grid gap-2">
                <Label>{t('funnels.type')}</Label>
                <Select
                  value={funnelForm.type ?? 'sale'}
                  onValueChange={(value: 'sale' | 'deal') => setFunnelForm({ ...funnelForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">{t('funnels.sales-funnels')}</SelectItem>
                    <SelectItem value="deal">{t('funnels.deal-funnels')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>{t('settings.funnels.funnel-name')}</Label>
              <Input
                value={funnelForm.name}
                onChange={(e) => setFunnelForm({ ...funnelForm, name: e.target.value })}
                placeholder={t('settings.funnels.funnel-name-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.funnels.applies-to')}</Label>
              <Select
                value={funnelForm.appliesTo}
                onValueChange={(value: Funnel['appliesTo']) => setFunnelForm({ ...funnelForm, appliesTo: value })}
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

            <div className="flex items-center justify-between">
              <Label>{t('settings.funnels.set-as-default')}</Label>
              <Switch
                checked={funnelForm.isDefault}
                onCheckedChange={(checked) => setFunnelForm({ ...funnelForm, isDefault: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFunnelDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveFunnel} disabled={!funnelForm.name}>
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
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveStage} disabled={!stageForm.name}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.funnels.delete-funnel-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.funnels.delete-funnel-desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FunnelStructureSection;

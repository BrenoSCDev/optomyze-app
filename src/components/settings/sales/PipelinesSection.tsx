import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical, Star } from 'lucide-react';
import { Pipeline, PipelineStage, SalesSettings } from '@/services/settingsApi';

interface Props {
  settings: SalesSettings;
  onUpdate: (updates: Partial<SalesSettings>) => void;
}

const STAGE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

const emptyPipeline: Omit<Pipeline, 'id'> = {
  name: '',
  isDefault: false,
  stages: [],
};

const emptyStage: Omit<PipelineStage, 'id'> = {
  name: '',
  order: 1,
  probability: 50,
  color: '#3b82f6',
};

const PipelinesSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [pipelineForm, setPipelineForm] = useState<Omit<Pipeline, 'id'>>(emptyPipeline);
  const [stageForm, setStageForm] = useState<Omit<PipelineStage, 'id'>>(emptyStage);

  const handleAddPipeline = () => {
    setEditingPipeline(null);
    setPipelineForm(emptyPipeline);
    setIsPipelineDialogOpen(true);
  };

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setPipelineForm({
      name: pipeline.name,
      isDefault: pipeline.isDefault,
      stages: pipeline.stages,
    });
    setIsPipelineDialogOpen(true);
  };

  const handleDeletePipeline = (pipelineId: string) => {
    const updatedPipelines = settings.pipelines.filter(p => p.id !== pipelineId);
    onUpdate({ pipelines: updatedPipelines });
  };

  const handleSavePipeline = () => {
    if (!pipelineForm.name) return;

    let updatedPipelines: Pipeline[];

    if (editingPipeline) {
      updatedPipelines = settings.pipelines.map(p =>
        p.id === editingPipeline.id ? { ...pipelineForm, id: editingPipeline.id } : p
      );
    } else {
      const newPipeline: Pipeline = {
        ...pipelineForm,
        id: crypto.randomUUID(),
      };
      updatedPipelines = [...settings.pipelines, newPipeline];
    }

    // Ensure only one default
    if (pipelineForm.isDefault) {
      updatedPipelines = updatedPipelines.map(p => ({
        ...p,
        isDefault: p.id === (editingPipeline?.id || updatedPipelines[updatedPipelines.length - 1].id),
      }));
    }

    onUpdate({ pipelines: updatedPipelines });
    setIsPipelineDialogOpen(false);
  };

  const handleSetDefault = (pipelineId: string) => {
    const updatedPipelines = settings.pipelines.map(p => ({
      ...p,
      isDefault: p.id === pipelineId,
    }));
    onUpdate({ pipelines: updatedPipelines });
  };

  const handleAddStage = (pipelineId: string) => {
    const pipeline = settings.pipelines.find(p => p.id === pipelineId);
    setCurrentPipelineId(pipelineId);
    setEditingStage(null);
    setStageForm({
      ...emptyStage,
      order: (pipeline?.stages.length || 0) + 1,
    });
    setIsStageDialogOpen(true);
  };

  const handleEditStage = (pipelineId: string, stage: PipelineStage) => {
    setCurrentPipelineId(pipelineId);
    setEditingStage(stage);
    setStageForm({
      name: stage.name,
      order: stage.order,
      probability: stage.probability,
      color: stage.color,
    });
    setIsStageDialogOpen(true);
  };

  const handleDeleteStage = (pipelineId: string, stageId: string) => {
    const updatedPipelines = settings.pipelines.map(p => {
      if (p.id === pipelineId) {
        return {
          ...p,
          stages: p.stages.filter(s => s.id !== stageId),
        };
      }
      return p;
    });
    onUpdate({ pipelines: updatedPipelines });
  };

  const handleSaveStage = () => {
    if (!stageForm.name || !currentPipelineId) return;

    const updatedPipelines = settings.pipelines.map(p => {
      if (p.id === currentPipelineId) {
        let updatedStages: PipelineStage[];
        if (editingStage) {
          updatedStages = p.stages.map(s =>
            s.id === editingStage.id ? { ...stageForm, id: editingStage.id } : s
          );
        } else {
          const newStage: PipelineStage = {
            ...stageForm,
            id: crypto.randomUUID(),
          };
          updatedStages = [...p.stages, newStage];
        }
        return { ...p, stages: updatedStages.sort((a, b) => a.order - b.order) };
      }
      return p;
    });

    onUpdate({ pipelines: updatedPipelines });
    setIsStageDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.sales.pipelines-desc')}</p>
        <Button size="sm" onClick={handleAddPipeline}>
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.sales.add-pipeline')}
        </Button>
      </div>

      {settings.pipelines.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>{t('settings.sales.no-pipelines')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {settings.pipelines.map((pipeline) => (
            <div key={pipeline.id} className="border rounded-lg bg-background/50">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{pipeline.name}</span>
                  {pipeline.isDefault && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                      <Star className="w-3 h-3" />
                      {t('settings.sales.default')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!pipeline.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(pipeline.id)}>
                      {t('settings.sales.set-default')}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEditPipeline(pipeline)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePipeline(pipeline.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{t('settings.sales.stages')}</span>
                  <Button variant="outline" size="sm" onClick={() => handleAddStage(pipeline.id)}>
                    <Plus className="w-3 h-3 mr-1" />
                    {t('settings.sales.add-stage')}
                  </Button>
                </div>

                {pipeline.stages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('settings.sales.no-stages')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pipeline.stages.sort((a, b) => a.order - b.order).map((stage) => (
                      <div
                        key={stage.id}
                        className="flex items-center justify-between p-2 border rounded bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-sm">{stage.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {stage.probability}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditStage(pipeline.id, stage)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteStage(pipeline.id, stage.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Dialog */}
      <Dialog open={isPipelineDialogOpen} onOpenChange={setIsPipelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPipeline ? t('settings.sales.edit-pipeline') : t('settings.sales.add-pipeline')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.sales.pipeline-name')}</Label>
              <Input
                value={pipelineForm.name}
                onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })}
                placeholder={t('settings.sales.pipeline-name-placeholder')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{t('settings.sales.set-as-default')}</Label>
              <Switch
                checked={pipelineForm.isDefault}
                onCheckedChange={(checked) => setPipelineForm({ ...pipelineForm, isDefault: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPipelineDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSavePipeline} disabled={!pipelineForm.name}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStage ? t('settings.sales.edit-stage') : t('settings.sales.add-stage')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.sales.stage-name')}</Label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder={t('settings.sales.stage-name-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.sales.stage-order')}</Label>
              <Input
                type="number"
                min={1}
                value={stageForm.order}
                onChange={(e) => setStageForm({ ...stageForm, order: Number(e.target.value) })}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.sales.stage-probability')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={stageForm.probability}
                  onChange={(e) => setStageForm({ ...stageForm, probability: Number(e.target.value) })}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.sales.stage-color')}</Label>
              <div className="flex flex-wrap gap-2">
                {STAGE_COLORS.map((color) => (
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
    </div>
  );
};

export default PipelinesSection;

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  AppointmentType,
  getAppointmentTypes,
  createAppointmentType,
  updateAppointmentType,
  deleteAppointmentType,
} from '@/services/appointmentTypeApi';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#78716c',
];

const AppointmentTypesSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New type form state
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newColor, setNewColor] = useState('#6366f1');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editColor, setEditColor] = useState('#6366f1');

  const load = async () => {
    try {
      const data = await getAppointmentTypes();
      setTypes(data);
    } catch {
      toast({ title: t('common.error'), description: t('appointments.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await createAppointmentType({
        name: newName.trim(),
        duration_minutes: newDuration,
        color: newColor,
        description: newDescription || undefined,
      });
      setTypes(prev => [...prev, created]);
      setNewName(''); setNewDuration(30); setNewColor('#6366f1'); setNewDescription('');
      setShowAddForm(false);
      toast({ title: t('common.success'), description: t('appointments.type-created') });
    } catch {
      toast({ title: t('common.error'), description: t('appointments.save-error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (type: AppointmentType) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditDuration(type.duration_minutes);
    setEditColor(type.color);
  };

  const handleUpdate = async (id: number) => {
    setSaving(true);
    try {
      const updated = await updateAppointmentType(id, { name: editName, duration_minutes: editDuration, color: editColor });
      setTypes(prev => prev.map(t => t.id === id ? updated : t));
      setEditingId(null);
      toast({ title: t('common.success'), description: t('appointments.type-updated') });
    } catch {
      toast({ title: t('common.error'), description: t('appointments.save-error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (type: AppointmentType) => {
    try {
      const updated = await updateAppointmentType(type.id, { is_active: !type.is_active });
      setTypes(prev => prev.map(t => t.id === type.id ? updated : t));
    } catch {
      toast({ title: t('common.error'), description: t('appointments.save-error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAppointmentType(id);
      setTypes(prev => prev.filter(t => t.id !== id));
      toast({ title: t('common.success'), description: t('appointments.type-deleted') });
    } catch {
      toast({ title: t('common.error'), description: t('appointments.delete-error'), variant: 'destructive' });
    }
  };

  if (loading) return <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* List */}
      <div className="space-y-2">
        {types.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground text-center py-4">{t('appointments.no-types')}</p>
        )}
        {types.map(type => (
          <div key={type.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
            {editingId === type.id ? (
              <>
                <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: editColor }} />
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8 text-sm" />
                <Input type="number" value={editDuration} onChange={e => setEditDuration(Number(e.target.value))} className="w-20 h-8 text-sm" min={5} max={480} />
                <div className="flex gap-1">
                  {PRESET_COLORS.map(c => (
                    <button key={c} className={`w-4 h-4 rounded-full border-2 ${editColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setEditColor(c)} />
                  ))}
                </div>
                <button onClick={() => handleUpdate(type.id)} disabled={saving} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{type.name}</p>
                  {type.description && <p className="text-xs text-muted-foreground">{type.description}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{type.duration_minutes} min</span>
                <Switch checked={type.is_active} onCheckedChange={() => handleToggle(type)} />
                <button onClick={() => startEdit(type)} className="text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(type.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 rounded-lg border border-border bg-background/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('appointments.type-name')}</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('appointments.type-name-placeholder')} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('appointments.duration-minutes')}</Label>
              <Input type="number" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} className="h-8 text-sm" min={5} max={480} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('appointments.type-description')}</Label>
            <Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder={t('appointments.type-description-placeholder')} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('appointments.type-color')}</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-white scale-110' : 'border-transparent'} transition-transform`} style={{ backgroundColor: c }} onClick={() => setNewColor(c)} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !newName.trim()}>{saving ? t('common.saving') : t('common.create')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setNewName(''); }}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />{t('appointments.add-type')}
        </Button>
      )}
    </div>
  );
};

export default AppointmentTypesSection;

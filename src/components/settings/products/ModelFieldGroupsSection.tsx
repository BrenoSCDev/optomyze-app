/**
 * MODEL FIELD GROUPS SECTION
 *
 * Manages model-level custom product field groups — groups that are automatically
 * replicated to every new product when it's created.
 */

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { getFieldGroups, createFieldGroup, updateFieldGroup, deleteFieldGroup, type CustomProductFieldGroup } from '@/services/customProductFieldGroupApi';
import IconPickerDialog, { IconDisplay } from '@/components/products/IconPickerDialog';

const ModelFieldGroupsSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [groups, setGroups] = useState<CustomProductFieldGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomProductFieldGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<CustomProductFieldGroup | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: null as string | null, is_default: true });
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const loadGroups = () => {
    setLoading(true);
    getFieldGroups().then(setGroups).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadGroups(); }, []);

  const openCreate = () => {
    setEditingGroup(null);
    setFormData({ name: '', icon: null, is_default: true });
    setFormOpen(true);
  };

  const openEdit = (g: CustomProductFieldGroup) => {
    setEditingGroup(g);
    setFormData({ name: g.name, icon: g.icon, is_default: g.is_default });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingGroup) {
        const updated = await updateFieldGroup(editingGroup.id, formData);
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        toast({ title: t('common.success'), description: 'Model field group updated.' });
      } else {
        const created = await createFieldGroup({ ...formData, product_id: null });
        setGroups((prev) => [...prev, created]);
        toast({ title: t('common.success'), description: 'Model field group created. It will be added to all new products.' });
      }
      setFormOpen(false);
    } catch {
      toast({ title: t('common.error'), description: 'Failed to save group.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    setSaving(true);
    try {
      await deleteFieldGroup(deletingGroup.id);
      setGroups((prev) => prev.filter((g) => g.id !== deletingGroup.id));
      toast({ title: t('common.success'), description: 'Model field group deleted.' });
      setDeleteOpen(false);
      setDeletingGroup(null);
    } catch {
      toast({ title: t('common.error'), description: 'Failed to delete group.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Model field groups are automatically added to every new product. Assign fields to groups inside the product's Custom Fields tab.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg text-sm">
          No model-level field groups. Create one to automatically add it to all new products.
        </div>
      ) : (
        <div className="grid gap-2">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  {group.icon ? (
                    <IconDisplay iconKey={group.icon} className="h-4 w-4 text-primary" />
                  ) : (
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{group.name}</p>
                  {group.is_default && (
                    <p className="text-xs text-muted-foreground">Default group</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(group)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { setDeletingGroup(group); setDeleteOpen(true); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Model Field Group' : 'New Model Field Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Icon</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-10 h-10 rounded-md border border-border flex items-center justify-center bg-muted/20">
                  {formData.icon ? (
                    <IconDisplay iconKey={formData.icon} className="h-5 w-5 text-primary" />
                  ) : (
                    <Layers className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setIconPickerOpen(true)} disabled={saving}>
                  {formData.icon ? 'Change' : 'Pick Icon'}
                </Button>
                {formData.icon && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData((p) => ({ ...p, icon: null }))} disabled={saving}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Technical Specs, Pricing Details"
                className="mt-2"
                disabled={saving}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingGroup ? t('common.update') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Icon picker */}
      <IconPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        value={formData.icon}
        onChange={(key) => setFormData((p) => ({ ...p, icon: key }))}
      />

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model Field Group</AlertDialogTitle>
            <AlertDialogDescription>
              Delete group <strong>{deletingGroup?.name}</strong>? This will not affect existing products, but new products will no longer have this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive hover:bg-destructive/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModelFieldGroupsSection;

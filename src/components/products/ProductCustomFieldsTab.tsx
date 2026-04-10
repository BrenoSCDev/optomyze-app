/**
 * PRODUCT CUSTOM FIELDS TAB COMPONENT
 * 
 * Manages custom fields for a specific product within the edit product modal
 */

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Layers, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { ProductCustomField } from '@/services/productApi';
import { createCustomProductField, updateCustomProductField, deleteCustomProductField, CustomProductFieldFormData } from '@/services/customProductFieldsApi';
import { getFieldGroups, createFieldGroup, updateFieldGroup, deleteFieldGroup, type CustomProductFieldGroup } from '@/services/customProductFieldGroupApi';
import IconPickerDialog, { IconDisplay } from './IconPickerDialog';

interface ProductCustomFieldsTabProps {
  productId: number;
  fields: ProductCustomField[];
  onFieldsChange: (fields: ProductCustomField[]) => void;
  onFieldModified?: () => void;
}

interface FormData {
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  field_value: string;
  group_id: number | null;
  icon: string | null;
}

interface GroupFormData {
  name: string;
  icon: string | null;
  is_default: boolean;
}

const initialFormData: FormData = {
  field_key: '',
  field_type: 'text',
  field_value: '',
  group_id: null,
  icon: null,
};

const initialGroupForm: GroupFormData = { name: '', icon: null, is_default: false };

const ProductCustomFieldsTab = ({ productId, fields, onFieldsChange, onFieldModified }: ProductCustomFieldsTabProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Field state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<ProductCustomField | null>(null);
  const [deletingField, setDeletingField] = useState<ProductCustomField | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  // Group state
  const [groups, setGroups] = useState<CustomProductFieldGroup[]>([]);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [groupDeleteOpen, setGroupDeleteOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomProductFieldGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<CustomProductFieldGroup | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormData>(initialGroupForm);
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupIconPickerOpen, setGroupIconPickerOpen] = useState(false);

  // Load product-level groups
  useEffect(() => {
    if (!productId) return;
    getFieldGroups(productId).then(setGroups).catch(() => {});
  }, [productId]);

  const handleOpenCreate = () => {
    setEditingField(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (field: ProductCustomField) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      field_type: field.field_type as FormData['field_type'],
      field_value: field.field_value,
      group_id: field.group_id ?? null,
      icon: field.icon ?? null,
    });
    setIsDialogOpen(true);
  };

  // Group handlers
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm(initialGroupForm);
    setGroupFormOpen(true);
  };

  const handleOpenEditGroup = (group: CustomProductFieldGroup) => {
    setEditingGroup(group);
    setGroupForm({ name: group.name, icon: group.icon, is_default: group.is_default });
    setGroupFormOpen(true);
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    setSavingGroup(true);
    try {
      if (editingGroup) {
        const updated = await updateFieldGroup(editingGroup.id, { name: groupForm.name, icon: groupForm.icon, is_default: groupForm.is_default });
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        toast({ title: t('common.success'), description: 'Field group updated.' });
      } else {
        const created = await createFieldGroup({ name: groupForm.name, icon: groupForm.icon, is_default: groupForm.is_default, product_id: productId });
        setGroups((prev) => [...prev, created]);
        toast({ title: t('common.success'), description: 'Field group created.' });
      }
      setGroupFormOpen(false);
    } catch {
      toast({ title: t('common.error'), description: 'Failed to save group.', variant: 'destructive' });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setSavingGroup(true);
    try {
      await deleteFieldGroup(deletingGroup.id);
      setGroups((prev) => prev.filter((g) => g.id !== deletingGroup.id));
      // Ungroup any fields that belonged to this group
      onFieldsChange(fields.map((f) => f.group_id === deletingGroup.id ? { ...f, group_id: null } : f));
      toast({ title: t('common.success'), description: 'Field group deleted.' });
      setGroupDeleteOpen(false);
      setDeletingGroup(null);
    } catch {
      toast({ title: t('common.error'), description: 'Failed to delete group.', variant: 'destructive' });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleOpenDelete = (field: ProductCustomField) => {
    setDeletingField(field);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingField) return;
    setSaving(true);
    try {
      await deleteCustomProductField(deletingField.id);
      const updatedFields = fields.filter(f => f.id !== deletingField.id);
      onFieldsChange(updatedFields);
      onFieldModified?.();
      toast({
        title: t('common.success'),
        description: t('settings.products.field-deleted'),
      });
      setDeleteDialogOpen(false);
      setDeletingField(null);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.products.field-delete-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.field_key.trim()) {
      toast({
        title: t('common.error'),
        description: t('products.custom-fields.key-required'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    const payload: CustomProductFieldFormData = {
      field_key: formData.field_key.trim(),
      field_type: formData.field_type,
      field_value: formData.field_value,
      type: 'product',
      product_id: productId,
      group_id: formData.group_id ?? undefined,
      icon: formData.icon ?? undefined,
    };

    try {
      if (editingField) {
        const updatedField = await updateCustomProductField(editingField.id, payload);
        const updatedFields = fields.map(f => 
          f.id === editingField.id ? { ...updatedField, product_id: productId, type: 'product' as const } : f
        );
        onFieldsChange(updatedFields);
        toast({
          title: t('common.success'),
          description: t('settings.products.field-updated'),
        });
      } else {
        const newField = await createCustomProductField(payload);
        onFieldsChange([...fields, { ...newField, product_id: productId, type: 'product' as const }]);
        onFieldModified?.();
        toast({
          title: t('common.success'),
          description: t('settings.products.field-created'),
        });
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingField(null);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: editingField 
          ? t('settings.products.field-update-error')
          : t('settings.products.field-create-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      text: t('settings.products.field-type-text'),
      number: t('settings.products.field-type-number'),
      select: t('settings.products.field-type-select'),
      boolean: t('settings.products.field-type-boolean'),
      date: t('settings.products.field-type-date'),
    };
    return typeLabels[type] || type;
  };

  // Group fields by group_id for rendering
  const ungroupedFields = fields.filter((f) => !f.group_id);
  const groupedFields = groups.map((group) => ({
    group,
    fields: fields.filter((f) => f.group_id === group.id),
  }));

  const renderField = (field: ProductCustomField) => (
    <div
      key={field.id}
      className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          {field.icon ? (
            <IconDisplay iconKey={field.icon} className="h-4 w-4 text-primary" />
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 flex-1 min-w-0">
          <div>
            <p className="text-xs text-muted-foreground">{t('settings.products.field-key')}</p>
            <p className="text-sm font-medium text-foreground truncate">{field.field_key}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('settings.products.field-type')}</p>
            <p className="text-sm text-foreground">{getFieldTypeLabel(field.field_type)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('settings.products.field-value')}</p>
            <p className="text-sm text-foreground truncate">{field.field_value || '-'}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(field)} className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(field)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Field Groups Section ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Field Groups
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Group custom fields into logical sections (e.g. "Technical Specs", "Pricing Details").
            </p>
          </div>
          <Button onClick={handleOpenCreateGroup} size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            New Group
          </Button>
        </div>

        {/* Grouped fields */}
        {groupedFields.map(({ group, fields: gFields }) => (
          <div key={group.id} className="border border-border rounded-lg overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                {group.icon ? (
                  <IconDisplay iconKey={group.icon} className="h-4 w-4 text-primary" />
                ) : (
                  <Layers className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{group.name}</span>
                {group.is_default && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Default</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  title="Add field to group"
                  onClick={() => { setFormData((p) => ({ ...initialFormData, group_id: group.id })); setEditingField(null); setIsDialogOpen(true); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleOpenEditGroup(group)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setDeletingGroup(group); setGroupDeleteOpen(true); }} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {gFields.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No fields in this group yet.</p>
              ) : (
                gFields.map(renderField)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Ungrouped Fields Section ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-foreground">{t('products.custom-fields.title')}</h4>
            <p className="text-xs text-muted-foreground mt-1">{t('products.custom-fields.description')}</p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('settings.products.add-field')}
          </Button>
        </div>

        {ungroupedFields.length === 0 && groupedFields.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            <p>{t('products.custom-fields.no-fields')}</p>
          </div>
        ) : ungroupedFields.length === 0 ? null : (
          <div className="grid gap-3">
            {ungroupedFields.map(renderField)}
          </div>
        )}
      </div>

      {/* ── Field Create/Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? t('settings.products.edit-field') : t('settings.products.add-field')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Icon picker */}
            <div>
              <Label>Icon</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-10 h-10 rounded-md border border-border flex items-center justify-center bg-muted/20">
                  {formData.icon ? (
                    <IconDisplay iconKey={formData.icon} className="h-5 w-5 text-primary" />
                  ) : (
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setIconPickerOpen(true)} disabled={saving}>
                  {formData.icon ? 'Change Icon' : 'Pick Icon'}
                </Button>
                {formData.icon && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData((p) => ({ ...p, icon: null }))} disabled={saving}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="field-key">{t('settings.products.field-key')}</Label>
              <Input
                id="field-key"
                value={formData.field_key}
                onChange={(e) => setFormData(prev => ({ ...prev, field_key: e.target.value }))}
                placeholder={t('settings.products.field-key-placeholder')}
                className="mt-2"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="field-type">{t('settings.products.field-type')}</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value: FormData['field_type']) =>
                  setFormData(prev => ({ ...prev, field_type: value }))
                }
                disabled={saving || !!editingField}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t('settings.products.field-type-text')}</SelectItem>
                  <SelectItem value="number">{t('settings.products.field-type-number')}</SelectItem>
                  <SelectItem value="select">{t('settings.products.field-type-select')}</SelectItem>
                  <SelectItem value="boolean">{t('settings.products.field-type-boolean')}</SelectItem>
                  <SelectItem value="date">{t('settings.products.field-type-date')}</SelectItem>
                </SelectContent>
              </Select>
              {editingField && (
                <p className="text-xs text-muted-foreground mt-1">{t('products.custom-fields.type-readonly')}</p>
              )}
            </div>
            <div>
              <Label htmlFor="field-value">{t('settings.products.field-value')}</Label>
              <Input
                id="field-value"
                value={formData.field_value}
                onChange={(e) => setFormData(prev => ({ ...prev, field_value: e.target.value }))}
                placeholder={t('settings.products.field-value-placeholder')}
                className="mt-2"
                disabled={saving}
              />
            </div>

            {/* Group assignment */}
            {groups.length > 0 && (
              <div>
                <Label>Group (optional)</Label>
                <Select
                  value={formData.group_id ? String(formData.group_id) : 'none'}
                  onValueChange={(val) => setFormData((p) => ({ ...p, group_id: val === 'none' ? null : Number(val) }))}
                  disabled={saving}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.saving')}
                  </div>
                ) : (
                  editingField ? t('common.update') : t('common.create')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Icon picker for fields */}
      <IconPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        value={formData.icon}
        onChange={(key) => setFormData((p) => ({ ...p, icon: key }))}
      />

      {/* ── Group Create/Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={groupFormOpen} onOpenChange={setGroupFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Field Group' : 'New Field Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitGroup} className="space-y-4">
            {/* Group icon */}
            <div>
              <Label>Icon</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-10 h-10 rounded-md border border-border flex items-center justify-center bg-muted/20">
                  {groupForm.icon ? (
                    <IconDisplay iconKey={groupForm.icon} className="h-5 w-5 text-primary" />
                  ) : (
                    <Layers className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setGroupIconPickerOpen(true)} disabled={savingGroup}>
                  {groupForm.icon ? 'Change' : 'Pick Icon'}
                </Button>
                {groupForm.icon && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setGroupForm((p) => ({ ...p, icon: null }))} disabled={savingGroup}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Name *</Label>
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Technical Specs"
                className="mt-2"
                disabled={savingGroup}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupFormOpen(false)} disabled={savingGroup}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={savingGroup || !groupForm.name.trim()}>
                {savingGroup ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingGroup ? t('common.update') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Icon picker for groups */}
      <IconPickerDialog
        open={groupIconPickerOpen}
        onOpenChange={setGroupIconPickerOpen}
        value={groupForm.icon}
        onChange={(key) => setGroupForm((p) => ({ ...p, icon: key }))}
      />

      {/* ── Field Delete Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.products.delete-field-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.products.delete-field-description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={saving} className="bg-destructive hover:bg-destructive/90">
              {saving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.deleting')}
                </div>
              ) : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Group Delete Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={groupDeleteOpen} onOpenChange={setGroupDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field Group</AlertDialogTitle>
            <AlertDialogDescription>
              Delete group <strong>{deletingGroup?.name}</strong>? Its fields will become ungrouped but will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingGroup}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} disabled={savingGroup} className="bg-destructive hover:bg-destructive/90">
              {savingGroup ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductCustomFieldsTab;

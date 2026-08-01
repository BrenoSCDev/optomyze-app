import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Smile, Layers } from 'lucide-react';
import { CustomProductField, CustomProductFieldFormData } from '@/services/customProductFieldsApi';
import { getProducts, Product } from '@/services/productApi';
import { getFieldGroups, type CustomProductFieldGroup } from '@/services/customProductFieldGroupApi';
import IconPickerDialog, { IconDisplay } from '@/components/products/IconPickerDialog';

interface Props {
  fields: CustomProductField[];
  saving: boolean;
  onAdd: (data: CustomProductFieldFormData) => Promise<CustomProductField>;
  onEdit: (id: number, data: CustomProductFieldFormData) => Promise<CustomProductField>;
  onDelete: (id: number) => Promise<void>;
}

interface FormData {
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  field_value: string;
  type: 'model' | 'product';
  product_id: number | null;
  group_id: number | null;
  icon: string | null;
}

const emptyFormData: FormData = {
  field_key: '',
  field_type: 'text',
  field_value: '',
  type: 'model',
  product_id: null,
  group_id: null,
  icon: null,
};

const CustomFieldsSection = ({ fields, saving, onAdd, onEdit, onDelete }: Props) => {
  const { t } = useLanguage();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomProductField | null>(null);
  const [deletingField, setDeletingField] = useState<CustomProductField | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modelGroups, setModelGroups] = useState<CustomProductFieldGroup[]>([]);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  // Load products and model-level groups
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await getProducts({ is_active: true, per_page: 100 });
        setProducts(response.data || []);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    const loadGroups = async () => {
      try {
        const groups = await getFieldGroups(); // no productId → model-level groups
        setModelGroups(groups);
      } catch (error) {
        console.error('Failed to load model field groups:', error);
      }
    };
    loadProducts();
    loadGroups();
  }, []);

  const handleAdd = () => {
    setEditingField(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (field: CustomProductField) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      field_type: field.field_type,
      field_value: field.field_value,
      type: field.type,
      product_id: field.product_id,
      group_id: field.group_id ?? null,
      icon: field.icon ?? null,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (field: CustomProductField) => {
    setDeletingField(field);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingField) return;
    try {
      await onDelete(deletingField.id);
      setDeleteDialogOpen(false);
      setDeletingField(null);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleSave = async () => {
    if (!formData.field_key) return;

    const payload: CustomProductFieldFormData = {
      field_key: formData.field_key,
      field_type: formData.field_type,
      field_value: formData.field_value,
      type: formData.type,
      product_id: formData.type === 'product' ? formData.product_id : null,
      group_id: formData.type === 'model' ? formData.group_id : null,
      icon: formData.icon ?? undefined,
    };

    try {
      if (editingField) {
        await onEdit(editingField.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return t('settings.products.field-type-text');
      case 'number': return t('settings.products.field-type-number');
      case 'select': return t('settings.products.field-type-select');
      case 'boolean': return t('settings.products.field-type-boolean');
      case 'date': return t('settings.products.field-type-date');
      default: return type;
    }
  };

  const getScopeLabel = (type: 'model' | 'product') => {
    return type === 'model' 
      ? t('settings.products.scope-model') 
      : t('settings.products.scope-product');
  };

  const getProductName = (productId: number | null) => {
    if (!productId) return null;
    const product = products.find(p => p.id === productId);
    return product?.name || `Product #${productId}`;
  };

  const getGroupName = (groupId: number | null | undefined) => {
    if (!groupId) return null;
    const group = modelGroups.find(g => g.id === groupId);
    return group?.name || `Group #${groupId}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.products.custom-fields-desc')}</p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          {t('settings.products.add-field')}
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>{t('settings.products.no-custom-fields')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div 
              key={field.id}
              className="p-4 border rounded-lg bg-background/50 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {field.icon && <IconDisplay iconKey={field.icon} className="h-4 w-4 text-primary shrink-0" />}
                  <div className="font-medium text-foreground">{field.field_key}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(field)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(field)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.products.field-type')}:</span>
                  <span className="text-foreground">{getTypeLabel(field.field_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.products.field-value')}:</span>
                  <span className="text-foreground truncate max-w-[120px]">{field.field_value || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.products.field-scope')}:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    field.type === 'model' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-secondary/20 text-secondary-foreground'
                  }`}>
                    {getScopeLabel(field.type)}
                  </span>
                </div>
                {field.type === 'product' && field.product_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('settings.products.product')}:</span>
                    <span className="text-foreground truncate max-w-[120px]">{getProductName(field.product_id)}</span>
                  </div>
                )}
                {field.type === 'model' && field.group_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Group:
                    </span>
                    <span className="text-foreground truncate max-w-[120px]">{getGroupName(field.group_id)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? t('settings.products.edit-field') : t('settings.products.add-field')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.products.field-key')}</Label>
              <Input
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder={t('settings.products.field-key-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.products.field-type')}</Label>
              <Select 
                value={formData.field_type} 
                onValueChange={(value: FormData['field_type']) => setFormData({ ...formData, field_type: value })}
              >
                <SelectTrigger>
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
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.products.field-value')}</Label>
              <Input
                value={formData.field_value}
                onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
                placeholder={t('settings.products.field-value-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.products.field-scope')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'model' | 'product') => setFormData({
                  ...formData,
                  type: value,
                  product_id: value === 'model' ? null : formData.product_id,
                  group_id: value === 'product' ? null : formData.group_id,
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="model">{t('settings.products.scope-model')}</SelectItem>
                  <SelectItem value="product">{t('settings.products.scope-product')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group assignment — only for model-level fields */}
            {formData.type === 'model' && modelGroups.length > 0 && (
              <div className="grid gap-2">
                <Label className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> Field Group <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Select
                  value={formData.group_id?.toString() || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, group_id: value === 'none' ? null : parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {modelGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This field will be placed inside the group when added to new products.
                </p>
              </div>
            )}

            {formData.type === 'product' && (
              <div className="grid gap-2">
                <Label>{t('settings.products.select-product')}</Label>
                <Select
                  value={formData.product_id?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value ? parseInt(value) : null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? t('common.loading') : t('settings.products.select-product-placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Icon */}
            <div className="grid gap-2">
              <Label>Icon (optional)</Label>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md border border-border flex items-center justify-center bg-muted/20">
                  {formData.icon ? (
                    <IconDisplay iconKey={formData.icon} className="h-4 w-4 text-primary" />
                  ) : (
                    <Smile className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setIconPickerOpen(true)}>
                  {formData.icon ? 'Change' : 'Pick Icon'}
                </Button>
                {formData.icon && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData((p) => ({ ...p, icon: null }))}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!formData.field_key || saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Icon Picker */}
      <IconPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        value={formData.icon}
        onChange={(key) => setFormData((p) => ({ ...p, icon: key }))}
      />

      {/* Delete Confirmation Dialog */}
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
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomFieldsSection;

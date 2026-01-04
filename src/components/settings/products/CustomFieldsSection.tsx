import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useCustomProductFields } from '@/hooks/useCustomProductFields';
import { CustomProductField, CustomProductFieldFormData } from '@/services/customProductFieldsApi';
import { getProducts, Product } from '@/services/productApi';

interface FormData {
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  field_value: string;
  type: 'model' | 'product';
  product_id: number | null;
}

const emptyFormData: FormData = {
  field_key: '',
  field_type: 'text',
  field_value: '',
  type: 'model',
  product_id: null,
};

const CustomFieldsSection = () => {
  const { t } = useLanguage();
  const { fields, loading, saving, addField, editField, removeField } = useCustomProductFields();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomProductField | null>(null);
  const [deletingField, setDeletingField] = useState<CustomProductField | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load products for the product selector
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
    loadProducts();
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
      await removeField(deletingField.id);
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
    };

    try {
      if (editingField) {
        await editField(editingField.id, payload);
      } else {
        await addField(payload);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.products.custom-fields-desc')}</p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
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
                <div className="font-medium text-foreground">{field.field_key}</div>
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
                  product_id: value === 'model' ? null : formData.product_id
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

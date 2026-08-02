/**
 * MANAGE PRODUCT CATEGORIES
 *
 * Full CRUD for product categories. Each category can be assigned a color for visual distinction.
 */

import { useState, useEffect, useCallback } from 'react';
import { Tags, Plus, Pencil, Trash2, Loader2, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  type ProductCategory,
} from '@/services/productCategoryApi';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#06b6d4',
];

interface FormData {
  name: string;
  description: string;
  color: string;
}

const defaultForm: FormData = { name: '', description: '', color: '#6366f1' };

interface ManageProductCategoriesProps {
  /** Rendered inside the CRM Panel, which supplies its own heading. */
  embedded?: boolean;
}

const ManageProductCategories = ({ embedded = false }: ManageProductCategoriesProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setCategories(await getProductCategories());
    } catch {
      toast({ title: t('common.error'), description: t('product-categories.fetch-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    setFormData(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description ?? '', color: cat.color ?? '#6366f1' });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        const updated = await updateProductCategory(editingCategory.id, formData);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: t('common.success'), description: t('product-categories.updated-successfully') });
      } else {
        const created = await createProductCategory(formData);
        setCategories((prev) => [...prev, created]);
        toast({ title: t('common.success'), description: t('product-categories.created-successfully') });
      }
      setFormOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('product-categories.save-error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (cat: ProductCategory) => {
    setDeletingCategory(cat);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await deleteProductCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      toast({ title: t('common.success'), description: t('product-categories.deleted-successfully') });
      setDeleteOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('product-categories.delete-error'), variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeletingCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {embedded ? <div /> : (
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('product-categories.breadcrumb')}</p>
            <h1 className="text-2xl font-bold text-foreground">{t('product-categories.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('product-categories.description')}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('product-categories.new-category')}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Grid */}
      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card p-5 hover:border-primary/50 transition-colors duration-base ease-standard hover:shadow-lg hover:shadow-primary/10"
            >
              {/* Color swatch + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: cat.color ?? '#6366f1' }}
                >
                  <Tags className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {cat.products_count ?? 0} {t('product-categories.products-count')}
                  </p>
                </div>
              </div>

              {cat.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{cat.description}</p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50">
                <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openDelete(cat)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && categories.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="p-4 rounded-full bg-primary/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Tags className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('product-categories.no-categories')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('product-categories.no-categories-description')}
          </p>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('product-categories.create-first')}
          </Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('product-categories.edit-category') : t('product-categories.new-category')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cat-name">{t('product-categories.name-label')}</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder={t('product-categories.name-placeholder')}
                className="mt-2"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">{t('product-categories.description-label')}</Label>
              <Textarea
                id="cat-desc"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder={t('product-categories.description-placeholder')}
                className="mt-2 resize-none"
                rows={3}
                disabled={saving}
              />
            </div>
            <div>
              <Label>{t('product-categories.color-label')}</Label>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full transition-shadow duration-fast ease-standard ${formData.color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                  className="w-7 h-7 rounded-full border-none cursor-pointer bg-transparent"
                  title={t('product-categories.custom-color')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingCategory ? t('common.update') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('product-categories.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('product-categories.delete-confirm').replace('{name}', deletingCategory?.name ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageProductCategories;

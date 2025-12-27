/**
 * PRODUCT FORM MODAL COMPONENT
 * 
 * Modal for creating and editing products with image management
 */

import { useState, useEffect } from 'react';
import { Package, Briefcase, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { createProduct, updateProduct, type Product, type ProductFormData } from '@/services/productApi';
import { useToast } from '@/hooks/use-toast';
import ProductImageGallery from './ProductImageGallery';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

const ProductFormModal = ({ isOpen, onClose, product, onSuccess }: ProductFormModalProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isEdit = !!product;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    base_price: '',
    type: 'product',
    category: '',
    is_active: true,
  });

  // Product ID for image management (either from editing or just created)
  const productIdForImages = product?.id || createdProductId;

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        base_price: product.base_price,
        type: product.type,
        category: product.category || '',
        is_active: product.is_active,
      });
      setCreatedProductId(null);
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        base_price: '',
        type: 'product',
        category: '',
        is_active: true,
      });
      setCreatedProductId(null);
    }
    setError(null);
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        base_price: parseFloat(String(formData.base_price)) || 0,
      };

      if (isEdit && product) {
        await updateProduct(product.id, submitData);
        toast({
          title: t('common.success'),
          description: t('products.updated-successfully'),
        });
        onSuccess();
        onClose();
      } else {
        const response = await createProduct(submitData);
        const newProductId = response.data?.id;
        
        if (newProductId) {
          setCreatedProductId(newProductId);
          toast({
            title: t('common.success'),
            description: t('products.created-successfully'),
          });
          // Don't close modal - show image upload section
        } else {
          toast({
            title: t('common.success'),
            description: t('products.created-successfully'),
          });
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        setError(errorMessages);
      } else {
        setError(t('products.save-error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseComplete = () => {
    if (createdProductId) {
      onSuccess(); // Refresh the list since we created a product
    }
    setCreatedProductId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseComplete}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>
            {createdProductId 
              ? t('products.images.manage-title')
              : isEdit 
                ? t('products.edit-product') 
                : t('products.create-product')
            }
          </DialogTitle>
        </DialogHeader>

        {/* Show image management if product exists or was just created */}
        {productIdForImages && isEdit ? (
          <div className="space-y-6">
            {/* Product Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-4 bg-destructive/20 border border-destructive/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Product Type */}
              <div>
                <Label className="mb-2 block">
                  {t('products.type-label')} <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'product' }))}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.type === 'product'
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Package className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">{t('products.physical-product')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'service' }))}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.type === 'service'
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Briefcase className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">{t('products.service')}</div>
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <Label htmlFor="name">
                  {t('products.name-label')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={255}
                  disabled={loading}
                  placeholder={t('products.name-placeholder')}
                  className="mt-2"
                />
              </div>

              {/* SKU & Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <Label htmlFor="sku">
                    {t('products.sku-label')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    required
                    disabled={loading}
                    placeholder={t('products.sku-placeholder')}
                    className="mt-2 uppercase"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('products.sku-hint')}</p>
                </div>

                {/* Base Price */}
                <div>
                  <Label htmlFor="base_price">
                    {t('products.price-label')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                      required
                      disabled={loading}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">{t('products.category-label')}</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  disabled={loading}
                  placeholder={t('products.category-placeholder')}
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">{t('products.description-label')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={loading}
                  rows={4}
                  placeholder={t('products.description-placeholder')}
                  className="mt-2 resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                <div>
                  <h4 className="text-foreground font-medium mb-1">{t('products.status-label')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? t('products.status-active-hint') : t('products.status-inactive-hint')}
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  disabled={loading}
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseComplete}
                  disabled={loading}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('common.updating')}
                    </div>
                  ) : (
                    t('common.update')
                  )}
                </Button>
              </div>
            </form>

            <Separator />

            {/* Image Gallery */}
            <ProductImageGallery productId={productIdForImages} onImageChange={onSuccess} />
          </div>
        ) : createdProductId ? (
          /* Product just created - show image upload section */
          <div className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                {t('products.created-now-add-images')}
              </p>
            </div>

            <ProductImageGallery productId={createdProductId} onImageChange={onSuccess} />

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleCloseComplete}>
                {t('products.finish')}
              </Button>
            </div>
          </div>
        ) : (
          /* Create form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/20 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Product Type */}
            <div>
              <Label className="mb-2 block">
                {t('products.type-label')} <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'product' }))}
                  className={`p-4 rounded-lg border transition-all ${
                    formData.type === 'product'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <Package className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{t('products.physical-product')}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'service' }))}
                  className={`p-4 rounded-lg border transition-all ${
                    formData.type === 'service'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <Briefcase className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{t('products.service')}</div>
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <Label htmlFor="name">
                {t('products.name-label')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                maxLength={255}
                disabled={loading}
                placeholder={t('products.name-placeholder')}
                className="mt-2"
              />
            </div>

            {/* SKU & Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU */}
              <div>
                <Label htmlFor="sku">
                  {t('products.sku-label')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  required
                  disabled={loading}
                  placeholder={t('products.sku-placeholder')}
                  className="mt-2 uppercase"
                />
                <p className="text-xs text-muted-foreground mt-1">{t('products.sku-hint')}</p>
              </div>

              {/* Base Price */}
              <div>
                <Label htmlFor="base_price">
                  {t('products.price-label')} <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                    required
                    disabled={loading}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">{t('products.category-label')}</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                disabled={loading}
                placeholder={t('products.category-placeholder')}
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t('products.description-label')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
                rows={4}
                placeholder={t('products.description-placeholder')}
                className="mt-2 resize-none"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
              <div>
                <h4 className="text-foreground font-medium mb-1">{t('products.status-label')}</h4>
                <p className="text-sm text-muted-foreground">
                  {formData.is_active ? t('products.status-active-hint') : t('products.status-inactive-hint')}
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                disabled={loading}
              />
            </div>

            {/* Info about images */}
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                {t('products.images.add-after-create')}
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseComplete}
                disabled={loading}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.creating')}
                  </div>
                ) : (
                  t('common.create')
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;

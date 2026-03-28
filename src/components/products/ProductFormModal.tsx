/**
 * PRODUCT FORM MODAL COMPONENT
 * 
 * Modal for creating and editing products with tab-based layout
 */

import { useState, useEffect } from 'react';
import { Package, Briefcase, MonitorDown, AlertCircle, Loader2, ImageIcon, Settings2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { createProduct, updateProduct, type Product, type ProductFormData, type ProductCustomField } from '@/services/productApi';
import { useToast } from '@/hooks/use-toast';
import ProductImageGallery from './ProductImageGallery';
import ProductCustomFieldsTab from './ProductCustomFieldsTab';

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
  const [activeTab, setActiveTab] = useState('data');
  const [customFields, setCustomFields] = useState<ProductCustomField[]>([]);
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
      setCustomFields(product.fields || []);
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
      setCustomFields([]);
      setCreatedProductId(null);
    }
    setError(null);
    setActiveTab('data');
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
        const newProduct = response.data;
        const newProductId = newProduct?.id;
        
        if (newProductId) {
          setCreatedProductId(newProductId);
          // Set custom fields from response (backend replicates model-level fields)
          setCustomFields(newProduct.fields || []);
          setActiveTab('images');
          toast({
            title: t('common.success'),
            description: t('products.created-successfully'),
          });
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
      onSuccess();
    }
    setCreatedProductId(null);
    onClose();
  };

  // Form content - inlined to prevent focus loss on re-render
  const renderFormContent = (isCreateMode = false) => (
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
        <div className="grid grid-cols-3 gap-3">
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
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'digital' }))}
            className={`p-4 rounded-lg border transition-all ${
              formData.type === 'digital'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <MonitorDown className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">{t('products.digital-product')}</div>
          </button>
        </div>
      </div>

      {/* Product Name */}
      <div>
        <Label htmlFor="product-name">
          {t('products.name-label')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="product-name"
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
          <Label htmlFor="product-sku">
            {t('products.sku-label')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product-sku"
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
          <Label htmlFor="product-price">
            {t('products.price-label')} <span className="text-destructive">*</span>
          </Label>
          <div className="mt-2">
            <CurrencyInput
              id="product-price"
              value={parseFloat(String(formData.base_price)) || 0}
              onValueChange={(v) => setFormData(prev => ({ ...prev, base_price: String(v) }))}
              disabled={loading}
              placeholder="$0.00"
            />
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="product-category">{t('products.category-label')}</Label>
        <Input
          id="product-category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          disabled={loading}
          placeholder={t('products.category-placeholder')}
          className="mt-2"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="product-description">{t('products.description-label')}</Label>
        <Textarea
          id="product-description"
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

      {/* Info about images (only for create mode) */}
      {isCreateMode && (
        <div className="p-4 bg-muted/20 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            {t('products.images.add-after-create')}
          </p>
        </div>
      )}

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
              {isEdit ? t('common.updating') : t('common.creating')}
            </div>
          ) : (
            isEdit ? t('common.update') : t('common.create')
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseComplete}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {createdProductId 
              ? t('products.images.manage-title')
              : isEdit 
                ? t('products.edit-product') 
                : t('products.create-product')
            }
          </DialogTitle>
        </DialogHeader>

        {/* Edit Mode with Tabs */}
        {productIdForImages && isEdit ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="data" className="gap-2">
                <Package className="w-4 h-4" />
                {t('products.tabs.data')}
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                {t('products.tabs.images')}
              </TabsTrigger>
              <TabsTrigger value="custom-fields" className="gap-2">
                <Settings2 className="w-4 h-4" />
                {t('products.tabs.custom-fields')}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto scrollbar-thin mt-4">
              <TabsContent value="data" className="m-0" forceMount hidden={activeTab !== 'data'}>
                {renderFormContent()}
              </TabsContent>

              <TabsContent value="images" className="m-0" forceMount hidden={activeTab !== 'images'}>
                <ProductImageGallery productId={productIdForImages} onImageChange={onSuccess} />
              </TabsContent>

              <TabsContent value="custom-fields" className="m-0" forceMount hidden={activeTab !== 'custom-fields'}>
                <ProductCustomFieldsTab
                  productId={productIdForImages}
                  fields={customFields}
                  onFieldsChange={setCustomFields}
                  onFieldModified={onSuccess}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : createdProductId ? (
          /* Product just created - show image upload and custom fields with tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="data" className="gap-2" disabled>
                <Package className="w-4 h-4" />
                {t('products.tabs.data')}
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                {t('products.tabs.images')}
              </TabsTrigger>
              <TabsTrigger value="custom-fields" className="gap-2">
                <Settings2 className="w-4 h-4" />
                {t('products.tabs.custom-fields')}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto scrollbar-thin mt-4">
              <TabsContent value="images" className="m-0 space-y-6">
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
              </TabsContent>

              <TabsContent value="custom-fields" className="m-0 space-y-6">
                <ProductCustomFieldsTab
                  productId={createdProductId}
                  fields={customFields}
                  onFieldsChange={setCustomFields}
                  onFieldModified={onSuccess}
                />

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button onClick={handleCloseComplete}>
                    {t('products.finish')}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          /* Create form - no tabs */
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {renderFormContent(true)}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;

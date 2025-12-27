import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { getProducts, Product } from '@/services/productApi';
import CustomFieldsManager from './CustomFieldsManager';

const ProductFieldsSettings = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProducts({ per_page: 100, is_active: true });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="space-y-2">
        <Label>{t('settings.customFields.selectProductLabel')}</Label>
        <Select
          value={selectedProductId?.toString() || ''}
          onValueChange={(value) => setSelectedProductId(value ? parseInt(value) : null)}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder={t('settings.customFields.selectProductPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {products.map(product => (
              <SelectItem key={product.id} value={product.id.toString()}>
                {product.name} ({product.sku})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Fields Manager */}
      {selectedProductId && (
        <div className="border-t pt-4">
          <CustomFieldsManager productId={selectedProductId} />
        </div>
      )}

      {!selectedProductId && products.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('settings.customFields.selectProductHint')}
        </p>
      )}

      {products.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">{t('settings.customFields.noProducts')}</p>
        </div>
      )}
    </div>
  );
};

export default ProductFieldsSettings;

/**
 * MANAGE PRODUCTS COMPONENT
 * 
 * Product management interface for the CRM
 */

import { Package, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

const ManageProducts = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            {t('products.breadcrumb')}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {t('products.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('products.description')}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('products.new-product')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('products.search-placeholder')}
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      <div className="glass-card p-12 text-center">
        <div className="p-4 rounded-full bg-primary/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('products.no-products')}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {t('products.no-products-description')}
        </p>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('products.create-first')}
        </Button>
      </div>
    </div>
  );
};

export default ManageProducts;

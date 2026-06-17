/**
 * MANAGE PRODUCTS COMPONENT
 * 
 * Product management interface for the CRM with full CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Loader2, RefreshCw, Star, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  getProducts,
  deleteProduct,
  toggleProductActive,
  toggleProductFavorite,
  archiveProduct,
  unarchiveProduct,
  type Product,
  type ProductFilters,
} from '@/services/productApi';
import ProductCard from './ProductCard';
import ProductFormModal from './ProductFormModal';
import ProductDeleteDialog from './ProductDeleteDialog';

const ManageProducts = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    is_active: null,
    is_favorite: null,
    archived: null,
    type: null,
    category_id: null,
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
    page: 1,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });

  // Search debounce
  const [searchInput, setSearchInput] = useState('');

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProducts(filters);
      setProducts(response.data);
      setPagination({
        current_page: response.current_page,
        per_page: response.per_page,
        total: response.total,
        last_page: response.last_page,
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('products.fetch-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, t, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handlers
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowCreateModal(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteProduct(productToDelete.id);
      toast({
        title: t('common.success'),
        description: t('products.deleted-successfully'),
      });
      fetchProducts();
    } catch (err: any) {
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('products.delete-error'),
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
      setProductToDelete(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await toggleProductActive(product.id);
      toast({
        title: t('common.success'),
        description: product.is_active
          ? t('products.deactivated-successfully')
          : t('products.activated-successfully'),
      });
      fetchProducts();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('products.toggle-error'),
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    try {
      await toggleProductFavorite(product.id);
      toast({
        title: t('common.success'),
        description: product.is_favorite ? t('products.favorite-removed') : t('products.favorite-added'),
      });
      fetchProducts();
    } catch {
      toast({ title: t('common.error'), description: t('products.favorite-toggle-error'), variant: 'destructive' });
    }
  };

  const handleArchive = async (product: Product) => {
    try {
      await archiveProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast({ title: t('common.success'), description: t('products.archive-success').replace('{name}', product.name) });
    } catch {
      toast({ title: t('common.error'), description: t('products.archive-error'), variant: 'destructive' });
    }
  };

  const handleUnarchive = async (product: Product) => {
    try {
      await unarchiveProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast({ title: t('common.success'), description: t('products.unarchive-success').replace('{name}', product.name) });
    } catch {
      toast({ title: t('common.error'), description: t('products.unarchive-error'), variant: 'destructive' });
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedProduct(null);
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? null : value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            {t('products.new-product')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('products.search-placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.is_active === null ? 'all' : String(filters.is_active)}
          onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? null : value === 'true')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('products.filter-status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.all-status')}</SelectItem>
            <SelectItem value="true">{t('products.active')}</SelectItem>
            <SelectItem value="false">{t('products.inactive')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('products.filter-type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.all-types')}</SelectItem>
            <SelectItem value="product">{t('products.type-product')}</SelectItem>
            <SelectItem value="service">{t('products.type-service')}</SelectItem>
          </SelectContent>
        </Select>


        {/* Favorites toggle */}
        <Button
          variant={filters.is_favorite ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => handleFilterChange('is_favorite', filters.is_favorite ? null : true)}
        >
          <Star className={`h-4 w-4 ${filters.is_favorite ? 'fill-current' : ''}`} />
          {t('products.filter-favorites')}
        </Button>

        {/* Archived toggle */}
        <Button
          variant={filters.archived ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => handleFilterChange('archived', filters.archived ? null : true)}
        >
          <Archive className="h-4 w-4" />
          {t('products.filter-archived')}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onToggleFavorite={handleToggleFavorite}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {t('products.showing')} {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} {t('products.of')} {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                >
                  {t('products.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {pagination.current_page} / {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  {t('products.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="p-4 rounded-full bg-primary/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {filters.search ? t('products.no-results') : t('products.no-products')}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {filters.search ? t('products.no-results-description') : t('products.no-products-description')}
          </p>
          {!filters.search && (
            <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              {t('products.create-first')}
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ProductFormModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />

      {/* Delete Confirmation Dialog */}
      <ProductDeleteDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ManageProducts;

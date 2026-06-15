/**
 * PRODUCT CARD COMPONENT
 * 
 * Displays a single product in a card format with actions and primary image
 */

import { useState, useEffect } from 'react';
import { Package, Briefcase, Edit, Trash2, Settings2, Star, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Product } from '@/services/productApi';
import { getProductImages, getPrimaryImageUrl } from '@/services/productImageApi';
import { PrivateImage } from '@/components/ui/PrivateImage';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onUnarchive?: (product: Product) => void;
}

const ProductCard = ({ product, onEdit, onDelete, onToggleActive, onToggleFavorite, onArchive, onUnarchive }: ProductCardProps) => {
  const { t } = useLanguage();
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    const fetchPrimaryImage = async () => {
      try {
        setLoadingImage(true);
        const images = await getProductImages(product.id);
        const url = getPrimaryImageUrl(images);
        setPrimaryImageUrl(url !== '/placeholder.svg' ? url : null);
      } catch (error) {
        // Silently fail - will show icon instead
        setPrimaryImageUrl(null);
      } finally {
        setLoadingImage(false);
      }
    };

    fetchPrimaryImage();
  }, [product.id]);

  const formatPrice = (price: number) => {
    return parseFloat(String(price)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="glass-card p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative">
      {/* Favorite star */}
      {onToggleFavorite && (
        <button
          onClick={() => onToggleFavorite(product)}
          className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted/50 transition-colors"
          title={product.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            className={`h-4 w-4 transition-colors ${
              product.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
            }`}
          />
        </button>
      )}

      {/* Product Image or Icon */}
      <div className="flex items-center justify-center w-full aspect-square max-h-32 mx-auto mb-4 rounded-lg bg-muted/30 overflow-hidden">
      {loadingImage ? (
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : primaryImageUrl ? (
          <PrivateImage
            path={primaryImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : product.type === 'service' ? (
          <Briefcase className="w-12 h-12 text-primary" />
        ) : (
          <Package className="w-12 h-12 text-primary" />
        )}
      </div>

      {/* Product Name & SKU */}
      <h3 className="text-lg font-semibold text-foreground text-center mb-1 truncate">
        {product.name}
      </h3>
      <p className="text-muted-foreground text-sm text-center mb-3">
        SKU: {product.sku}
      </p>

      {/* Product Description */}
      <p className="text-muted-foreground text-sm text-center mb-4 line-clamp-2 min-h-[40px]">
        {product.description || t('products.no-description')}
      </p>

      {/* Price & Type */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
        <div>
          <p className="text-xs text-muted-foreground">{t('products.price')}</p>
          <p className="text-lg font-bold text-green-400">
            ${formatPrice(product.base_price)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          product.type === 'service' 
            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
            : 'bg-primary/20 text-primary border border-primary/30'
        }`}>
          {product.type === 'service' ? t('products.type-service') : t('products.type-product')}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-end mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          product.is_active
            ? 'bg-green-600/20 text-green-400'
            : 'bg-red-600/20 text-red-400'
        }`}>
          {product.is_active ? t('products.active') : t('products.inactive')}
        </span>
      </div>

      {/* Categories */}
      {product.categories && product.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {product.categories.map((cat) => (
            <span
              key={cat.id}
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: cat.color ?? '#6366f1' }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {/* Custom Fields Count */}
      <div className="flex items-center gap-2 mb-4 py-2 px-3 bg-muted/20 rounded-lg">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {t('products.custom-fields.count')}: {product.fields?.length || 0}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {!product.is_archived && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(product)}
            className={`flex-1 text-xs ${
              product.is_active
                ? 'border-red-600/30 text-red-400 hover:bg-red-600/20'
                : 'border-green-600/30 text-green-400 hover:bg-green-600/20'
            }`}
          >
            {product.is_active ? t('products.deactivate') : t('products.activate')}
          </Button>
        )}
        {product.is_archived && onUnarchive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUnarchive(product)}
            className="flex-1 text-xs border-green-600/30 text-green-400 hover:bg-green-600/20"
          >
            Unarchive
          </Button>
        )}
        {!product.is_archived && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(product)}
            className="border-primary/30 text-primary hover:bg-primary/20"
            title={t('products.edit')}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        {!product.is_archived && onArchive && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onArchive(product)}
            className="border-orange-600/30 text-orange-400 hover:bg-orange-600/20"
            title="Archive product"
          >
            <Archive className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(product)}
          className="border-red-600/30 text-red-400 hover:bg-red-600/20"
          title={t('products.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;

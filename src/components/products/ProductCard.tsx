/**
 * PRODUCT CARD COMPONENT
 *
 * Displays a single product in a card format with actions and primary image
 */

import { useState, useEffect } from 'react';
import { Package, Briefcase, Pencil, Trash2, Star, Archive, ArchiveRestore, MoreVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
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
  const { formatCurrency } = useCurrency();
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPrimaryImage = async () => {
      try {
        setLoadingImage(true);
        const images = await getProductImages(product.id);
        const url = getPrimaryImageUrl(images);
        if (!cancelled) setPrimaryImageUrl(url !== '/placeholder.svg' ? url : null);
      } catch {
        if (!cancelled) setPrimaryImageUrl(null);
      } finally {
        if (!cancelled) setLoadingImage(false);
      }
    };

    fetchPrimaryImage();
    return () => { cancelled = true; };
  }, [product.id]);

  const formatPrice = (price: number) => formatCurrency(parseFloat(String(price)) || 0);

  const TypeIcon = product.type === 'service' ? Briefcase : Package;

  return (
    <div className="group rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-foreground/20">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-muted/40">
        {loadingImage ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : primaryImageUrl ? (
          <PrivateImage
            path={primaryImageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <TypeIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {product.is_archived && (
          <span className="absolute left-2 top-2 rounded-md border border-border bg-background/90 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {t('products.archived')}
          </span>
        )}

        {/* Quick actions */}
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(product)}
              className="rounded-md border border-border bg-background/90 p-1.5 transition-colors hover:bg-background"
              title={product.is_favorite ? t('products.remove-favorite') : t('products.add-favorite')}
            >
              <Star className={`h-3.5 w-3.5 ${product.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            </button>
          )}
          {!product.is_archived && (
            <button
              onClick={() => onEdit(product)}
              className="rounded-md border border-border bg-background/90 p-1.5 transition-colors hover:bg-background"
              title={t('products.edit')}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-md border border-border bg-background/90 p-1.5 transition-colors hover:bg-background"
                title={t('products.more-options')}
              >
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!product.is_archived && onArchive && (
                <DropdownMenuItem onClick={() => onArchive(product)}>
                  <Archive className="mr-2 h-4 w-4" />
                  {t('products.archive')}
                </DropdownMenuItem>
              )}
              {product.is_archived && onUnarchive && (
                <DropdownMenuItem onClick={() => onUnarchive(product)}>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  {t('products.unarchive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('products.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {product.sku}
            <span className="mx-1.5">·</span>
            {product.type === 'service' ? t('products.type-service') : t('products.type-product')}
          </p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
          {product.description || t('products.no-description')}
        </p>

        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {product.categories.slice(0, 2).map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color ?? '#6366f1' }} />
                {cat.name}
              </span>
            ))}
            {product.categories.length > 2 && (
              <span className="text-xs text-muted-foreground">+{product.categories.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-base font-semibold text-foreground">
            {formatPrice(product.base_price)}
          </p>
          {!product.is_archived && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {product.is_active ? t('products.active') : t('products.inactive')}
              </span>
              <Switch
                checked={product.is_active}
                onCheckedChange={() => onToggleActive(product)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

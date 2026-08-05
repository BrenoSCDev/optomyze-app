/**
 * PRODUCT MESSAGE COMPONENT
 *
 * Renders a WhatsApp Business catalog item: its photo, name, price and
 * description.
 *
 * The image is whatever the backend managed to store — the full catalog photo
 * when Evolution decrypted it, otherwise the inline thumbnail WhatsApp sends
 * with the message. Both arrive here as an ordinary private file path, so the
 * card does not care which it got; it only handles having none.
 */

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import { cn } from '@/lib/utils';

export interface ProductDetails {
  product_id?: string;
  title?: string;
  description?: string;
  currency?: string;
  price?: number;
  sale_price?: number;
  image_count?: number;
  retailer_id?: string;
  url?: string;
  business_owner_jid?: string;
}

interface ProductMessageProps {
  product: ProductDetails;
  /** Stored image path, full photo or thumbnail — the card treats both alike. */
  mediaPath?: string | null;
  /** Falls back to the message text when the catalog item had no title. */
  fallbackTitle?: string | null;
  isOutgoing: boolean;
}

/**
 * Price with its own currency.
 *
 * Catalog items are not required to carry one — the reported payload had only
 * a currency code — so an item with no price simply shows none rather than a
 * misleading zero.
 */
const formatPrice = (amount?: number, currency?: string): string | null => {
  if (amount === undefined || amount === null) return null;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    // An unknown currency code must not take the whole card down with it.
    return `${currency ?? ''} ${amount.toFixed(2)}`.trim();
  }
};

const ProductMessage: React.FC<ProductMessageProps> = ({
  product, mediaPath, fallbackTitle, isOutgoing,
}) => {
  const { t } = useLanguage();
  const imageUrl = usePrivateFile(mediaPath ?? undefined);

  const title = product.title || fallbackTitle || t('chat.inbox.product');
  const price = formatPrice(product.price, product.currency);
  const salePrice = formatPrice(product.sale_price, product.currency);

  return (
    <div
      className={cn(
        'w-[15rem] overflow-hidden rounded-lg border',
        isOutgoing ? 'border-white/25 bg-white/10' : 'border-border bg-background/60'
      )}
    >
      <div className="relative flex aspect-square items-center justify-center bg-muted/40">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        )}

        {/* Catalog entries often hold several photos while the message carries
            one, so the count says the rest exist rather than implying this is
            all of it. */}
        {(product.image_count ?? 0) > 1 && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            +{(product.image_count as number) - 1}
          </span>
        )}
      </div>

      <div className="space-y-1 p-2.5">
        <p className={cn('flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide',
          isOutgoing ? 'text-blue-100' : 'text-muted-foreground')}>
          <ShoppingBag className="h-3 w-3" />
          {t('chat.inbox.product')}
        </p>

        <p className={cn('text-sm font-medium leading-snug break-words',
          isOutgoing ? 'text-white' : 'text-foreground')}>
          {title}
        </p>

        {(salePrice || price) && (
          <p className="flex items-baseline gap-1.5 text-sm">
            <span className={cn('font-semibold', isOutgoing ? 'text-white' : 'text-foreground')}>
              {salePrice ?? price}
            </span>
            {/* Both shown only when the item is actually discounted. */}
            {salePrice && price && (
              <span className={cn('text-xs line-through',
                isOutgoing ? 'text-blue-100' : 'text-muted-foreground')}>
                {price}
              </span>
            )}
          </p>
        )}

        {product.description && (
          <p className={cn('text-xs leading-snug break-words line-clamp-3',
            isOutgoing ? 'text-blue-100' : 'text-muted-foreground')}>
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductMessage;

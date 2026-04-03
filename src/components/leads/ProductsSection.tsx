/**
 * PRODUCTS SECTION
 * 
 * Displays products of interest linked to a lead with selection capability
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Plus, ImageOff, ShoppingCart } from 'lucide-react';
import { PrivateImage } from '@/components/ui/PrivateImage';

export interface LeadProduct {
  id: number;
  name: string;
  type: string;
  base_price: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  primary_image?: {
    id: number;
    product_id: number;
    url: string;
  } | null;
}

interface ProductsSectionProps {
  products: LeadProduct[];
  onAddProducts?: () => void;
  onStartPurchase?: (selectedProducts: LeadProduct[]) => void;
}

const ProductsSection = ({ products, onAddProducts, onStartPurchase }: ProductsSectionProps) => {
  const { t } = useLanguage();
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getImageUrl = (product: LeadProduct): string | null => {
    return product.primary_image?.url || null;
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleStartPurchase = () => {
    if (onStartPurchase) {
      const selected = products.filter(p => selectedProductIds.has(p.id));
      onStartPurchase(selected);
      setSelectedProductIds(new Set());
    }
  };

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          {t('lead-details.products-of-interest')}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleStartPurchase}
            size="sm"
            className="bg-primary hover:bg-primary/80"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('sale.start-purchase')}
          </Button>
          <Button
            onClick={onAddProducts} 
            variant="outline" 
            size="sm"
            className="glass-card"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('lead-details.add-products')}
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('lead-details.no-products-linked')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              formatPrice={formatPrice} 
              getImageUrl={getImageUrl}
              isSelected={selectedProductIds.has(product.id)}
              onToggleSelect={() => toggleProductSelection(product.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

interface ProductCardProps {
  product: LeadProduct;
  formatPrice: (value: number) => string;
  getImageUrl: (product: LeadProduct) => string | null;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const ProductCard = ({ product, formatPrice, getImageUrl, isSelected, onToggleSelect }: ProductCardProps) => {
  const { t } = useLanguage();
  const imageUrl = getImageUrl(product);
  const showQuantityDetails = product.quantity > 1;

  return (
    <div 
      className={`relative bg-muted/50 border rounded-lg overflow-hidden hover:bg-muted transition-colors cursor-pointer ${
        isSelected ? 'border-primary bg-primary/10' : 'border-border'
      }`}
      onClick={onToggleSelect}
    >
      {/* Checkbox Overlay */}
      <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="bg-muted border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Product Image */}
      <div className="aspect-video w-full bg-muted flex items-center justify-center relative overflow-hidden">
        {imageUrl ? (
          <PrivateImage
            path={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff className="w-8 h-8 text-muted-foreground/50" />
        )}
        {/* Fallback icon container */}
        <div className="absolute inset-0 hidden fallback-active:flex items-center justify-center">
          <ImageOff className="w-8 h-8 text-muted-foreground/50" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-foreground font-medium text-sm line-clamp-2">{product.name}</h4>
          <Badge variant="secondary" className="text-xs shrink-0 capitalize">
            {product.type}
          </Badge>
        </div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{t('lead-details.total-price')}</span>
            <span className="text-primary font-semibold">{formatPrice(product.total_price)}</span>
          </div>

          {showQuantityDetails && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{t('lead-details.unit-price')}</span>
                <span className="text-foreground/70 text-sm">{formatPrice(product.unit_price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{t('lead-details.quantity')}</span>
                <span className="text-foreground/70 text-sm">x{product.quantity}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsSection;

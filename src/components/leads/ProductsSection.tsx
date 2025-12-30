/**
 * PRODUCTS SECTION
 * 
 * Displays products of interest linked to a lead
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, ImageOff } from 'lucide-react';

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
}

const ProductsSection = ({ products, onAddProducts }: ProductsSectionProps) => {
  const { t } = useLanguage();

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getImageUrl = (product: LeadProduct): string | null => {
    if (!product.primary_image?.url) return null;
    
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = product.primary_image.url;
    
    // If already absolute URL, return as is
    if (url.startsWith('http')) return url;
    
    // Otherwise, prepend base URL
    return `${baseUrl}${url}`;
  };

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          {t('lead-details.products-of-interest')}
        </h3>
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

      {products.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">{t('lead-details.no-products-linked')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} formatPrice={formatPrice} getImageUrl={getImageUrl} />
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
}

const ProductCard = ({ product, formatPrice, getImageUrl }: ProductCardProps) => {
  const { t } = useLanguage();
  const imageUrl = getImageUrl(product);
  const showQuantityDetails = product.quantity > 1;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-colors">
      {/* Product Image */}
      <div className="aspect-video w-full bg-gray-800 flex items-center justify-center relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.classList.add('fallback-active');
            }}
          />
        ) : (
          <ImageOff className="w-8 h-8 text-gray-500" />
        )}
        {/* Fallback icon container */}
        <div className="absolute inset-0 hidden fallback-active:flex items-center justify-center">
          <ImageOff className="w-8 h-8 text-gray-500" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-white font-medium text-sm line-clamp-2">{product.name}</h4>
          <Badge variant="secondary" className="text-xs shrink-0 capitalize">
            {product.type}
          </Badge>
        </div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">{t('lead-details.total-price')}</span>
            <span className="text-primary font-semibold">{formatPrice(product.total_price)}</span>
          </div>

          {showQuantityDetails && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">{t('lead-details.unit-price')}</span>
                <span className="text-gray-300 text-sm">{formatPrice(product.unit_price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">{t('lead-details.quantity')}</span>
                <span className="text-gray-300 text-sm">x{product.quantity}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsSection;

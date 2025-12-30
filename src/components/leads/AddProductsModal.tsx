/**
 * ADD PRODUCTS MODAL
 * 
 * Modal for adding products to a lead with quantity support
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Package, Loader2, Minus, Plus, Search } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export interface CompanyProduct {
  id: number;
  name: string;
}

interface SelectedProduct {
  id: number;
  quantity: number;
}

interface AddProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  products: CompanyProduct[];
  onProductsAdded: () => void;
}

const AddProductsModal = ({ 
  isOpen, 
  onClose, 
  leadId, 
  products, 
  onProductsAdded 
}: AddProductsModalProps) => {
  const { t } = useLanguage();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isProductSelected = (productId: number): boolean => {
    return selectedProducts.some(p => p.id === productId);
  };

  const getProductQuantity = (productId: number): number => {
    const product = selectedProducts.find(p => p.id === productId);
    return product?.quantity || 1;
  };

  const toggleProduct = (productId: number) => {
    if (isProductSelected(productId)) {
      setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      setSelectedProducts(prev => [...prev, { id: productId, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, quantity: newQuantity } : p)
    );
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) return;

    setIsLoading(true);
    try {
      await api.post(`/api/leads/${leadId}/products`, {
        products: selectedProducts
      });
      
      toast.success(t('lead-details.products-added-success'));
      onProductsAdded();
      handleClose();
    } catch (error: any) {
      console.error('Error adding products:', error);
      toast.error(error.response?.data?.message || t('lead-details.products-added-error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProducts([]);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          className="relative bg-gray-900 border border-white/10 rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">
                {t('lead-details.add-products')}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('lead-details.search-products')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Products List */}
          <ScrollArea className="max-h-[300px]">
            <div className="p-4 space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {t('lead-details.no-products-available')}
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = isProductSelected(product.id);
                  const quantity = getProductQuantity(product.id);
                  
                  return (
                    <div 
                      key={product.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProduct(product.id)}
                          className="border-white/30"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-white font-medium truncate block">
                            {product.name}
                          </span>
                        </div>
                        
                        {/* Quantity Controls - Only show when selected */}
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 border-white/20"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              disabled={quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                              className="w-14 h-7 text-center bg-white/5 border-white/20 text-sm"
                              min={1}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 border-white/20"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Selected Count */}
          {selectedProducts.length > 0 && (
            <div className="px-4 py-2 border-t border-white/10 bg-white/5">
              <span className="text-sm text-gray-400">
                {t('lead-details.selected-products-count').replace('{count}', selectedProducts.length.toString())}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('lead-details.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedProducts.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('lead-details.adding')}
                </>
              ) : (
                t('lead-details.add-products-confirm')
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddProductsModal;

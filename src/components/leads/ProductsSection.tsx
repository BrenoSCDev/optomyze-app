/**
 * PRODUCTS SECTION
 *
 * Manages the lead's products of interest.
 * Backend no longer ships products with the lead payload — instead, this
 * section provides a search-driven multi-select that resolves products via
 * the global product search endpoint and associates them with the lead.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Package, Plus, ImageOff, ShoppingCart, Search, Loader2, X,
  Minus, Check,
} from 'lucide-react';
import { PrivateImage } from '@/components/ui/PrivateImage';
import { searchProducts, addProductsToLead, updateLeadProductQuantity, removeProductFromLead, ProductSearchResult } from '@/services/leadProductSearchApi';
import { toast } from 'sonner';

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
  leadId: number;
  products: LeadProduct[];
  onProductsChanged: () => void;
  onStartPurchase?: (selectedProducts: LeadProduct[]) => void;
}

const ProductsSection = ({ leadId, products, onProductsChanged, onStartPurchase }: ProductsSectionProps) => {
  const { t } = useLanguage();
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);

  const { currencyCode: companyCurrency } = useCurrency();
  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrency,
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
      className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
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
          {onStartPurchase && (
            <Button
              onClick={handleStartPurchase}
              size="sm"
              className="bg-primary hover:bg-primary/80"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {t('sale.start-purchase')}
            </Button>
          )}
          <Button
            onClick={() => setSearchOpen(true)}
            variant="outline"
            size="sm"
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

      <ProductSearchPanel
        leadId={leadId}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        linkedProducts={products.map(p => ({ id: p.id, name: p.name, quantity: p.quantity }))}
        onProductsAdded={() => {
          setSearchOpen(false);
          onProductsChanged();
        }}
        onLinkedChanged={onProductsChanged}
      />
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
      className={`relative bg-muted/40 border rounded-lg overflow-hidden hover:bg-muted transition-colors cursor-pointer ${
        isSelected ? 'border-primary bg-primary/10' : 'border-border'
      }`}
      onClick={onToggleSelect}
    >
      <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="bg-background border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

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
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-foreground font-medium text-sm line-clamp-2">{product.name}</h4>
          <Badge variant="secondary" className="text-xs shrink-0 capitalize">
            {product.type}
          </Badge>
        </div>

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

interface LinkedProductLite {
  id: number;
  name: string;
  quantity: number;
}

interface ProductSearchPanelProps {
  leadId: number;
  open: boolean;
  onClose: () => void;
  linkedProducts: LinkedProductLite[];
  onProductsAdded: () => void;
  onLinkedChanged: () => void;
}

interface SelectedItem {
  id: number;
  name: string;
  base_price: number;
  quantity: number;
}

const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({
  leadId, open, onClose, linkedProducts, onProductsAdded, onLinkedChanged,
}) => {
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Local override for linked qty so the user sees instant feedback before submit
  const [linkedQtyOverrides, setLinkedQtyOverrides] = useState<Record<number, number>>({});
  // Linked product IDs the user marked for removal in this session (only applied on submit)
  const [removedLinkedIds, setRemovedLinkedIds] = useState<Set<number>>(new Set());
  const debounceRef = useRef<number | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelected([]);
      setLinkedQtyOverrides({});
      setRemovedLinkedIds(new Set());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchProducts(query.trim());
        setResults(data);
      } catch (e) {
        console.error('Product search failed', e);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const isSelected = (id: number) => selected.some(s => s.id === id);
  const findLinked = (id: number) => linkedProducts.find(l => l.id === id);
  const isAlreadyLinked = (id: number) => !!findLinked(id);
  const isRemoved = (id: number) => removedLinkedIds.has(id);
  const linkedQtyOf = (id: number) =>
    linkedQtyOverrides[id] ?? findLinked(id)?.quantity ?? 1;

  const toggleSelect = (product: ProductSearchResult) => {
    if (isAlreadyLinked(product.id) && !isRemoved(product.id)) return;
    // If user previously marked the linked product for removal, clicking again undoes it
    if (isAlreadyLinked(product.id) && isRemoved(product.id)) {
      setRemovedLinkedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      return;
    }
    setSelected(prev => {
      if (prev.some(s => s.id === product.id)) {
        return prev.filter(s => s.id !== product.id);
      }
      return [...prev, { id: product.id, name: product.name, base_price: product.base_price, quantity: 1 }];
    });
  };

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) return;
    setSelected(prev => prev.map(s => s.id === id ? { ...s, quantity: qty } : s));
  };

  const removeSelected = (id: number) => {
    setSelected(prev => prev.filter(s => s.id !== id));
  };

  // Linked-product local edits (no backend call until submit)
  const handleLinkedQtyChange = (productId: number, nextQty: number) => {
    if (nextQty < 1) return;
    setLinkedQtyOverrides(prev => ({ ...prev, [productId]: nextQty }));
  };

  const handleLinkedRemove = (productId: number) => {
    setRemovedLinkedIds(prev => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
    // Also clear any local qty override for this id
    setLinkedQtyOverrides(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Detect whether anything changed vs the original linked list
  const hasChanges = useMemo(() => {
    if (selected.length > 0) return true;
    if (removedLinkedIds.size > 0) return true;
    return Object.entries(linkedQtyOverrides).some(([id, qty]) => {
      const original = linkedProducts.find(l => l.id === Number(id));
      return original && original.quantity !== qty;
    });
  }, [selected, removedLinkedIds, linkedQtyOverrides, linkedProducts]);

  const handleSubmit = async () => {
    if (!hasChanges) return;
    setSubmitting(true);
    try {
      // Build the full desired list: kept linked (with overridden qty) + newly selected
      const keptLinked = linkedProducts
        .filter(l => !removedLinkedIds.has(l.id))
        .map(l => ({ id: l.id, quantity: linkedQtyOverrides[l.id] ?? l.quantity }));
      const payload = [
        ...keptLinked,
        ...selected.map(s => ({ id: s.id, quantity: s.quantity })),
      ];
      await addProductsToLead(leadId, payload);
      toast.success(t('lead-details.products-added-success'));
      onProductsAdded();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || t('lead-details.products-added-error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl rounded-xl border border-border bg-card text-card-foreground shadow-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                {t('lead-details.product-search-title')}
              </h4>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('lead-details.product-search-placeholder')}
                className="pl-9"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-background">
              {query.trim().length < 2 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  {t('lead-details.product-search-hint')}
                </p>
              ) : results.length === 0 && !searching ? (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  {t('lead-details.product-search-empty')}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((r) => {
                    const linked = isAlreadyLinked(r.id);
                    const checked = isSelected(r.id);
                    const linkedQty = linkedQtyOf(r.id);
                    const isPending = pendingLinkedId === r.id;
                    return (
                      <li
                        key={r.id}
                        className={`flex items-center gap-3 p-2.5 ${
                          linked ? 'bg-muted/30' : 'hover:bg-muted/60 cursor-pointer'
                        }`}
                        onClick={() => !linked && toggleSelect(r)}
                      >
                        {!linked && (
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleSelect(r)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {linked && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            <Check className="w-3 h-3 mr-1" />
                            {t('lead-details.product-already-linked')}
                          </Badge>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(r.base_price)}
                          </p>
                        </div>
                        {linked && (
                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button" variant="outline" size="icon" className="h-7 w-7"
                              onClick={() => handleLinkedQtyChange(r.id, linkedQty - 1)}
                              disabled={isPending || linkedQty <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={linkedQty}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 1;
                                setLinkedQtyOverrides(prev => ({ ...prev, [r.id]: v }));
                              }}
                              onBlur={(e) => {
                                const v = parseInt(e.target.value) || 1;
                                if (v !== (findLinked(r.id)?.quantity ?? 1)) {
                                  handleLinkedQtyChange(r.id, v);
                                }
                              }}
                              className="w-14 h-7 text-center text-sm"
                              disabled={isPending}
                            />
                            <Button
                              type="button" variant="outline" size="icon" className="h-7 w-7"
                              onClick={() => handleLinkedQtyChange(r.id, linkedQty + 1)}
                              disabled={isPending}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => handleLinkedRemove(r.id)}
                              disabled={isPending}
                              title={t('common.delete')}
                            >
                              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Selected list with quantity */}
            {selected.length > 0 && (
              <div className="rounded-md border border-border bg-background p-2 space-y-2 max-h-56 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground px-1">
                  {t('lead-details.selected-products-count').replace('{count}', selected.length.toString())}
                </p>
                {selected.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-muted/40">
                    <span className="flex-1 text-sm text-foreground truncate">{s.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button" variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => updateQty(s.id, s.quantity - 1)}
                        disabled={s.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={s.quantity}
                        onChange={(e) => updateQty(s.id, parseInt(e.target.value) || 1)}
                        className="w-14 h-7 text-center text-sm"
                      />
                      <Button
                        type="button" variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => updateQty(s.id, s.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => removeSelected(s.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={selected.length === 0 || submitting}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('lead-details.adding')}</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" />{t('lead-details.add-products-confirm')}</>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ProductsSection;

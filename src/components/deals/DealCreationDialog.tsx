/**
 * DEAL CREATION DIALOG (Enhanced)
 * 
 * Full deal creation from Deal Funnel view with:
 * - Lead search with products of interest
 * - Product search & attach
 * - Charges & discounts
 * - Dynamic calculation
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Search, Loader2, Package, Calculator, DollarSign, Tag, Briefcase, FileText, Percent, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { saleService, CreateSalePayload } from '@/services/saleApi';
import { getSettings, defaultSettings } from '@/services/settingsApi';
import {
  searchLeadsWithProducts,
  searchProducts,
  addProductsToLead,
  LeadWithProducts,
  LeadProduct,
  ProductSearchResult,
} from '@/services/leadProductSearchApi';

type PricingModel = 'product' | 'commission' | 'hybrid';
type ChargeType = 'percentage' | 'fixed';

interface ChargeItem {
  id: string;
  name: string;
  type: ChargeType;
  value: number;
}

interface DealCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string;
  stages: any[];
  selectedStageId?: string;
  onDealCreated: () => void;
}

export const DealCreationDialog: React.FC<DealCreationDialogProps> = ({
  isOpen,
  onClose,
  funnelId,
  stages,
  selectedStageId,
  onDealCreated,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const salesSettingsRef = useRef(defaultSettings.sales_settings);
  const pricingRulesRef = useRef(defaultSettings.product_settings.pricing_rules);
  useEffect(() => {
    getSettings().then(s => {
      salesSettingsRef.current = s.sales_settings;
      pricingRulesRef.current = s.product_settings.pricing_rules;
    });
  }, []);

  // Lead search
  const [leadQuery, setLeadQuery] = useState('');
  const [leadResults, setLeadResults] = useState<LeadWithProducts[]>([]);
  const [isSearchingLeads, setIsSearchingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadWithProducts | null>(null);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const leadSearchRef = useRef<HTMLDivElement>(null);
  const leadSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Product search
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const productSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Form state
  const [dealName, setDealName] = useState('');
  const [stageId, setStageId] = useState('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('product');
  const [commissionType, setCommissionType] = useState<ChargeType>('percentage');
  const [commissionValue, setCommissionValue] = useState<number>(0);
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [discounts, setDiscounts] = useState<ChargeItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualValue, setManualValue] = useState<number>(0);

  // Set stage from props
  useEffect(() => {
    if (selectedStageId) {
      setStageId(selectedStageId);
    } else if (stages.length > 0) {
      setStageId(stages[0].id.toString());
    }
  }, [stages, selectedStageId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (leadSearchRef.current && !leadSearchRef.current.contains(e.target as Node)) {
        setShowLeadDropdown(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Lead search debounce
  const handleLeadSearch = useCallback((query: string) => {
    setLeadQuery(query);
    if (leadSearchTimer.current) clearTimeout(leadSearchTimer.current);
    if (query.length < 2) { setLeadResults([]); setShowLeadDropdown(false); return; }
    setIsSearchingLeads(true);
    leadSearchTimer.current = setTimeout(async () => {
      try {
        const results = await searchLeadsWithProducts(query);
        setLeadResults(results);
        setShowLeadDropdown(true);
      } catch { setLeadResults([]); }
      finally { setIsSearchingLeads(false); }
    }, 400);
  }, []);

  const handleSelectLead = (lead: LeadWithProducts) => {
    setSelectedLead(lead);
    setLeadQuery(`${lead.first_name} ${lead.last_name}`);
    setShowLeadDropdown(false);
  };

  // Product search debounce
  const handleProductSearch = useCallback((query: string) => {
    setProductQuery(query);
    if (productSearchTimer.current) clearTimeout(productSearchTimer.current);
    if (query.length < 2) { setProductResults([]); setShowProductDropdown(false); return; }
    setIsSearchingProducts(true);
    productSearchTimer.current = setTimeout(async () => {
      try {
        const results = await searchProducts(query);
        // Filter out already selected products
        const existingIds = new Set(selectedLead?.products.map(p => p.id) || []);
        setProductResults(results.filter(p => !existingIds.has(p.id)));
        setShowProductDropdown(true);
      } catch { setProductResults([]); }
      finally { setIsSearchingProducts(false); }
    }, 400);
  }, [selectedLead]);

  const handleRemoveProduct = async (productId: number) => {
    if (!selectedLead) return;
    setIsAddingProduct(true);
    try {
      const remainingProducts = selectedLead.products
        .filter(p => p.id !== productId)
        .map(p => ({ id: p.id, quantity: parseInt(String(p.pivot.quantity)) || 1 }));
      await addProductsToLead(selectedLead.id, remainingProducts);
      setSelectedLead(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== productId) } : prev);
      toast({ title: 'Product removed', description: 'Product removed from lead.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove product.', variant: 'destructive' });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleAddProduct = async (product: ProductSearchResult) => {
    if (!selectedLead) return;
    setIsAddingProduct(true);
    try {
      // Attach product to lead via backend
      const existingProducts = selectedLead.products.map(p => ({ id: p.id, quantity: parseInt(String(p.pivot.quantity)) || 1 }));
      await addProductsToLead(selectedLead.id, [...existingProducts, { id: product.id, quantity: 1 }]);

      // Update local state
      const newProduct: LeadProduct = {
        id: product.id,
        name: product.name,
        pivot: {
          lead_id: selectedLead.id,
          product_id: product.id,
          quantity: 1,
          unit_price: product.base_price.toString(),
          total_price: product.base_price.toString(),
        }
      };
      setSelectedLead(prev => prev ? { ...prev, products: [...prev.products, newProduct] } : prev);
      setProductQuery('');
      setShowProductDropdown(false);
      toast({ title: 'Product added', description: `${product.name} added to lead.` });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to add product.', variant: 'destructive' });
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Products from selected lead
  const leadProducts = selectedLead?.products || [];

  // Calculations
  const productsSubtotal = useMemo(() => {
    if (leadProducts.length === 0 && pricingModel === 'product') return manualValue;
    return leadProducts.reduce((sum, p) => sum + parseFloat(p.pivot.total_price || '0'), 0);
  }, [leadProducts, manualValue, pricingModel]);

  const commissionSubtotal = useMemo(() => {
    if (pricingModel === 'product') return 0;
    if (commissionType === 'fixed') return commissionValue;
    return (productsSubtotal * commissionValue) / 100;
  }, [pricingModel, commissionType, commissionValue, productsSubtotal]);

  const baseSubtotal = useMemo(() => {
    if (pricingModel === 'product') return productsSubtotal;
    if (pricingModel === 'commission') return commissionSubtotal;
    return productsSubtotal + commissionSubtotal;
  }, [pricingModel, productsSubtotal, commissionSubtotal]);

  const chargesTotal = useMemo(() => {
    return charges.reduce((sum, c) => {
      if (c.type === 'fixed') return sum + c.value;
      return sum + (baseSubtotal * c.value) / 100;
    }, 0);
  }, [charges, baseSubtotal]);

  const discountsTotal = useMemo(() => {
    return discounts.reduce((sum, d) => {
      if (d.type === 'fixed') return sum + d.value;
      return sum + (baseSubtotal * d.value) / 100;
    }, 0);
  }, [discounts, baseSubtotal]);

  const finalTotal = Math.max(0, baseSubtotal + chargesTotal - discountsTotal);

  const formatPrice = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Charges/Discounts CRUD
  const addCharge = () => setCharges([...charges, { id: generateId(), name: '', type: 'percentage', value: 0 }]);
  const updateCharge = (id: string, field: keyof ChargeItem, value: string | number) => setCharges(charges.map(c => c.id === id ? { ...c, [field]: value } : c));
  const removeCharge = (id: string) => setCharges(charges.filter(c => c.id !== id));
  const addDiscount = () => setDiscounts([...discounts, { id: generateId(), name: '', type: pricingRulesRef.current.defaultDiscountType, value: 0 }]);
  const updateDiscount = (id: string, field: keyof ChargeItem, value: string | number) => setDiscounts(discounts.map(d => d.id === id ? { ...d, [field]: value } : d));
  const removeDiscount = (id: string) => setDiscounts(discounts.filter(d => d.id !== id));

  const resetForm = () => {
    setLeadQuery(''); setLeadResults([]); setSelectedLead(null);
    setProductQuery(''); setProductResults([]);
    setDealName(''); setStageId(selectedStageId || (stages[0]?.id.toString() ?? ''));
    setPricingModel('product'); setCommissionType('percentage'); setCommissionValue(0);
    setCharges([]); setDiscounts([]); setNotes(''); setManualValue(0);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!selectedLead) { toast({ title: 'Validation', description: 'Please select a lead.', variant: 'destructive' }); return; }
    if (!dealName.trim()) { toast({ title: 'Validation', description: 'Deal name is required.', variant: 'destructive' }); return; }
    if (!stageId) { toast({ title: 'Validation', description: 'Please select a stage.', variant: 'destructive' }); return; }
    if ((pricingModel === 'commission' || pricingModel === 'hybrid') && commissionValue <= 0) {
      toast({ title: 'Validation', description: 'Commission value is required.', variant: 'destructive' }); return;
    }

    const ss = salesSettingsRef.current;
    const pr = pricingRulesRef.current;
    if (!ss.deal_rules.allowDealsWithoutProducts && leadProducts.length === 0 && pricingModel === 'product') {
      toast({ title: t('common.error'), description: t('sale.no-products-selected'), variant: 'destructive' }); return;
    }
    if (pr.minDealValue > 0 && finalTotal < pr.minDealValue) {
      toast({ title: t('common.error'), description: `${t('sale.deal-value')} min: ${pr.minDealValue}`, variant: 'destructive' }); return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateSalePayload = {
        pricing_model: pricingModel,
        product_ids: leadProducts.map(p => p.id),
        funnel_id: Number(funnelId),
        stage_id: Number(stageId),
        name: dealName.trim(),
      };

      if (leadProducts.length === 0 && pricingModel === 'product' && manualValue > 0) {
        payload.manual_value = manualValue;
      }
      if (pricingModel === 'commission' || pricingModel === 'hybrid') {
        payload.commission_type = commissionType;
        payload.commission_value = commissionValue;
        payload.reference_value = productsSubtotal;
      }
      if (charges.length > 0) {
        payload.charges = charges.filter(c => c.name.trim() && c.value > 0).map(c => ({ name: c.name, type: c.type, value: c.value }));
      }
      if (discounts.length > 0) {
        payload.discounts = discounts.filter(d => d.name.trim() && d.value > 0).map(d => ({ name: d.name, type: d.type, value: d.value }));
      }
      if (notes.trim()) payload.notes = notes.trim();

      await saleService.createSale(selectedLead.id, payload);
      toast({ title: 'Success', description: 'Deal created successfully.' });
      resetForm();
      onDealCreated();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to create deal.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const showCommissionSection = pricingModel === 'commission' || pricingModel === 'hybrid';
  const maxDiscountPercent = pricingRulesRef.current.maxDiscountPercent;
  const allowPriceOverride = pricingRulesRef.current.allowPriceOverride;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-900 border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-deal/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-deal">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Create New Deal</h2>
            </div>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" disabled={isSubmitting}>
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-deal/50 scrollbar-track-white/5">
            <div className="space-y-6">

              {/* 1. Lead Search */}
              <div className="space-y-3">
                <Label className="text-white font-medium flex items-center gap-2">
                  <User className="w-4 h-4" /> Lead *
                </Label>
                <div ref={leadSearchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={leadQuery}
                      onChange={(e) => handleLeadSearch(e.target.value)}
                      onFocus={() => leadResults.length > 0 && setShowLeadDropdown(true)}
                      placeholder="Search lead by name..."
                      className="pl-9 bg-white/5 border-deal/20 text-white placeholder:text-white/40"
                      disabled={isSubmitting}
                    />
                    {isSearchingLeads && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-deal animate-spin" />}
                  </div>
                  {showLeadDropdown && leadResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {leadResults.map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span className="text-white text-sm">{lead.first_name} {lead.last_name}</span>
                          <span className="text-xs text-white/40">{lead.products.length} product(s)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedLead && (
                  <div className="flex items-center gap-2 p-2 bg-deal/10 border border-deal/20 rounded-lg">
                    <User className="w-4 h-4 text-deal" />
                    <span className="text-sm text-white">{selectedLead.first_name} {selectedLead.last_name}</span>
                    <button onClick={() => { setSelectedLead(null); setLeadQuery(''); }} className="ml-auto text-white/40 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Deal Info */}
              <div className="space-y-3">
                <Label className="text-white font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Deal Information
                </Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Deal Name *</Label>
                    <Input value={dealName} onChange={e => setDealName(e.target.value)} placeholder="Enter deal name..."
                      className="bg-white/5 border-deal/20 text-white placeholder:text-white/40" disabled={isSubmitting} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Stage *</Label>
                    <Select value={stageId} onValueChange={setStageId} disabled={isSubmitting}>
                      <SelectTrigger className="bg-white/5 border-deal/20 text-white">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/10">
                        {sortedStages.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()} className="text-white hover:bg-gray-700">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 3. Products of Interest */}
              {selectedLead && (
                <div className="space-y-3">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Products
                  </Label>

                  {leadProducts.length > 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="text-left p-3 text-gray-400 font-medium">Product</th>
                            <th className="text-center p-3 text-gray-400 font-medium">Qty</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Unit Price</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Total</th>
                            <th className="w-10 p-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadProducts.map(p => (
                            <tr key={p.id} className="border-t border-white/5">
                              <td className="p-3 text-white">{p.name}</td>
                              <td className="p-3 text-center text-gray-300">{p.pivot.quantity}</td>
                              <td className="p-3 text-right text-gray-300">{formatPrice(parseFloat(p.pivot.unit_price))}</td>
                              <td className="p-3 text-right text-deal font-medium">{formatPrice(parseFloat(p.pivot.total_price))}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleRemoveProduct(p.id)}
                                  disabled={isSubmitting || isAddingProduct}
                                  className="text-white/30 hover:text-rose-400 transition-colors disabled:opacity-50"
                                  title="Remove product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-white/5">
                          <tr>
                            <td colSpan={4} className="p-3 text-right text-gray-400 font-medium">Subtotal</td>
                            <td className="p-3 text-right text-white font-semibold">{formatPrice(productsSubtotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 italic">No products of interest. You can add one below or enter the deal value manually.</p>
                      {pricingModel === 'product' && (
                        <div className="space-y-1">
                          <Label className="text-gray-400 text-sm">Deal Value</Label>
                          <CurrencyInput
                            value={manualValue}
                            onValueChange={setManualValue}
                            placeholder="$0.00"
                            className="bg-white/5 border-deal/20 text-white placeholder:text-white/40"
                            disabled={isSubmitting || !allowPriceOverride}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Product Search */}
                  <div ref={productSearchRef} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        value={productQuery}
                        onChange={(e) => handleProductSearch(e.target.value)}
                        onFocus={() => productResults.length > 0 && setShowProductDropdown(true)}
                        placeholder="Search product to add..."
                        className="pl-9 bg-white/5 border-deal/20 text-white placeholder:text-white/40"
                        disabled={isSubmitting || isAddingProduct}
                      />
                      {(isSearchingProducts || isAddingProduct) && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-deal animate-spin" />}
                    </div>
                    {showProductDropdown && productResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {productResults.map(product => (
                          <button
                            key={product.id}
                            onClick={() => handleAddProduct(product)}
                            className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-between"
                            disabled={isAddingProduct}
                          >
                            <span className="text-white text-sm">{product.name}</span>
                            <span className="text-xs text-white/40">{formatPrice(product.base_price)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Pricing Model */}
              {selectedLead && (
                <div className="space-y-3">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Pricing Model
                  </Label>
                  <RadioGroup value={pricingModel} onValueChange={v => setPricingModel(v as PricingModel)} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="product" id="dm-product" className="border-white/30" />
                      <Label htmlFor="dm-product" className="cursor-pointer text-gray-300">Product</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="commission" id="dm-commission" className="border-white/30" />
                      <Label htmlFor="dm-commission" className="cursor-pointer text-gray-300">Commission</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hybrid" id="dm-hybrid" className="border-white/30" />
                      <Label htmlFor="dm-hybrid" className="cursor-pointer text-gray-300">Hybrid</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* 4b. Commission Section */}
              {selectedLead && showCommissionSection && (
                <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <Percent className="w-4 h-4" /> Commission
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-sm">Type</Label>
                      <Select value={commissionType} onValueChange={v => setCommissionType(v as ChargeType)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/10">
                          <SelectItem value="percentage" className="text-white hover:bg-gray-700">%</SelectItem>
                          <SelectItem value="fixed" className="text-white hover:bg-gray-700">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-sm">Value</Label>
                      {commissionType === 'fixed' ? (
                        <CurrencyInput
                          value={commissionValue}
                          onValueChange={setCommissionValue}
                          placeholder="$0.00"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      ) : (
                        <Input type="number" min={0} max={100} step={0.01}
                          value={commissionValue} onChange={e => setCommissionValue(Number(e.target.value))}
                          className="bg-white/5 border-white/10 text-white" placeholder="5" />
                      )}
                    </div>
                    {commissionType === 'percentage' && (
                      <div className="space-y-2">
                        <Label className="text-gray-400 text-sm">Reference</Label>
                        <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm">
                          {formatPrice(productsSubtotal)}
                        </div>
                      </div>
                    )}
                  </div>
                  {commissionSubtotal > 0 && (
                    <div className="flex justify-end text-sm">
                      <span className="text-gray-400">Commission subtotal:</span>
                      <span className="ml-2 text-deal font-medium">{formatPrice(commissionSubtotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Charges */}
              {selectedLead && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Additional Charges
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCharge} className="deal-glass-card text-xs border-deal/20">
                      <Plus className="w-3 h-3 mr-1" /> Add Charge
                    </Button>
                  </div>
                  {charges.length > 0 ? (
                    <div className="space-y-2">
                      {charges.map(charge => (
                        <div key={charge.id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                          <Input placeholder="Name" value={charge.name} onChange={e => updateCharge(charge.id, 'name', e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white text-sm" />
                          <Select value={charge.type} onValueChange={v => updateCharge(charge.id, 'type', v)}>
                            <SelectTrigger className="w-28 bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-gray-800 border-white/10">
                              <SelectItem value="percentage" className="text-white hover:bg-gray-700">%</SelectItem>
                              <SelectItem value="fixed" className="text-white hover:bg-gray-700">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          {charge.type === 'fixed' ? (
                            <CurrencyInput value={charge.value} onValueChange={v => updateCharge(charge.id, 'value', v)}
                              placeholder="$0.00" className="w-24 bg-white/5 border-white/10 text-white text-sm" />
                          ) : (
                            <Input type="number" min={0} max={100} step={0.01} value={charge.value}
                              onChange={e => updateCharge(charge.id, 'value', Number(e.target.value))}
                              className="w-24 bg-white/5 border-white/10 text-white text-sm" placeholder="0" />
                          )}
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeCharge(charge.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No additional charges.</p>
                  )}
                </div>
              )}

              {/* 6. Discounts */}
              {selectedLead && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-medium flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Discounts
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addDiscount} className="deal-glass-card text-xs border-deal/20">
                      <Plus className="w-3 h-3 mr-1" /> Add Discount
                    </Button>
                  </div>
                  {discounts.length > 0 ? (
                    <div className="space-y-2">
                      {discounts.map(discount => (
                        <div key={discount.id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                          <Input placeholder="Name" value={discount.name} onChange={e => updateDiscount(discount.id, 'name', e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white text-sm" />
                          <Select value={discount.type} onValueChange={v => updateDiscount(discount.id, 'type', v)}>
                            <SelectTrigger className="w-28 bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-gray-800 border-white/10">
                              <SelectItem value="percentage" className="text-white hover:bg-gray-700">%</SelectItem>
                              <SelectItem value="fixed" className="text-white hover:bg-gray-700">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          {discount.type === 'fixed' ? (
                            <CurrencyInput value={discount.value} onValueChange={v => updateDiscount(discount.id, 'value', v)}
                              placeholder="$0.00" className="w-24 bg-white/5 border-white/10 text-white text-sm" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <Input type="number" min={0} max={maxDiscountPercent} step={0.01} value={discount.value}
                                onChange={e => updateDiscount(discount.id, 'value', Math.min(Number(e.target.value), maxDiscountPercent))}
                                className="w-16 bg-white/5 border-white/10 text-white text-sm" placeholder="0" />
                              <span className="text-xs text-white/40 whitespace-nowrap">/ {maxDiscountPercent}%</span>
                            </div>
                          )}
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeDiscount(discount.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No discounts.</p>
                  )}
                </div>
              )}

              {/* 7. Notes */}
              {selectedLead && (
                <div className="space-y-2">
                  <Label className="text-white font-medium">Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."
                    className="bg-white/5 border-deal/20 text-white placeholder:text-white/40 resize-none" rows={3} disabled={isSubmitting} />
                </div>
              )}

              {/* 8. Calculation Summary */}
              {selectedLead && (
                <div className="p-4 bg-deal/10 border border-deal/20 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="text-white">{formatPrice(baseSubtotal)}</span>
                  </div>
                  {chargesTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Charges</span>
                      <span className="text-emerald-400">+{formatPrice(chargesTotal)}</span>
                    </div>
                  )}
                  {discountsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Discounts</span>
                      <span className="text-rose-400">-{formatPrice(discountsTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-deal/20">
                    <span className="text-white">Final Total</span>
                    <span className="text-deal">{formatPrice(finalTotal)}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic mt-2">Preview — final values calculated by the server.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-deal/20 shrink-0">
            <button type="button" onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-deal/20 text-white hover:bg-deal/10 transition-colors"
              disabled={isSubmitting}>
              Cancel
            </button>
            <button type="button" onClick={handleSubmit}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-deal text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isSubmitting || !selectedLead}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Briefcase className="w-4 h-4" /> Create Deal</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

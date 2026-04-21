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
import { createPortal } from 'react-dom';
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

export interface EditDeal {
  id: number;
  name: string;
  notes?: string | null;
  stage_id: number;
  pricing_model: string;
  commission_type?: string | null;
  commission_value?: number | null;
  reference_value?: number | null;
  lead?: { id: number; first_name: string; last_name: string } | null;
  lead_id?: number;
  items?: Array<{ product_id: number; product_name?: string; name?: string; quantity: number; unit_price: number; total_price: number }>;
  charges?: Array<{ name: string; type: 'percentage' | 'fixed'; value: number }>;
  discounts?: Array<{ name: string; type: 'percentage' | 'fixed'; value: number }>;
  subtotal?: number;
}
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
  editDeal?: EditDeal | null;
  onDealUpdated?: () => void;
}

export const DealCreationDialog: React.FC<DealCreationDialogProps> = ({
  isOpen,
  onClose,
  funnelId,
  stages,
  selectedStageId,
  onDealCreated,
  editDeal,
  onDealUpdated,
}) => {
  const isEditMode = !!editDeal;
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

  // Set stage from props or editDeal
  useEffect(() => {
    if (editDeal) {
      setStageId(editDeal.stage_id.toString());
      setDealName(editDeal.name || '');
      setNotes(editDeal.notes || '');
      setPricingModel((editDeal.pricing_model as PricingModel) || 'product');
      setCommissionType((editDeal.commission_type as ChargeType) || 'percentage');
      setCommissionValue(editDeal.commission_value ?? 0);
      setCharges(
        (editDeal.charges || []).map(c => ({ id: generateId(), name: c.name, type: c.type, value: c.value }))
      );
      setDiscounts(
        (editDeal.discounts || []).map(d => ({ id: generateId(), name: d.name, type: d.type, value: d.value }))
      );
      // Set a mock selectedLead so product/pricing sections render
      if (editDeal.lead) {
        const mockLead = {
          id: editDeal.lead.id,
          first_name: editDeal.lead.first_name,
          last_name: editDeal.lead.last_name,
          products: (editDeal.items || []).map(item => ({
            id: item.product_id,
            name: item.product_name || item.name || '',
            pivot: {
              lead_id: editDeal.lead!.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price.toString(),
              total_price: item.total_price.toString(),
            },
          })),
        } as LeadWithProducts;
        setSelectedLead(mockLead);
        setLeadQuery(`${editDeal.lead.first_name} ${editDeal.lead.last_name}`);
      }
    } else if (selectedStageId) {
      setStageId(selectedStageId);
    } else if (stages.length > 0) {
      setStageId(stages[0].id.toString());
    }
  }, [stages, selectedStageId, editDeal]);

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

  const handleClose = () => { if (!isEditMode) resetForm(); onClose(); };

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
      if (isEditMode && editDeal) {
        const updatePayload: Partial<Omit<CreateSalePayload, 'funnel_id'>> = {
          name: dealName.trim(),
          stage_id: Number(stageId),
          pricing_model: pricingModel,
          notes: notes.trim() || undefined,
          charges: charges.filter(c => c.name.trim() && c.value > 0).map(c => ({ name: c.name, type: c.type, value: c.value })),
          discounts: discounts.filter(d => d.name.trim() && d.value > 0).map(d => ({ name: d.name, type: d.type, value: d.value })),
        };
        if (pricingModel === 'commission' || pricingModel === 'hybrid') {
          updatePayload.commission_type = commissionType;
          updatePayload.commission_value = commissionValue;
          updatePayload.reference_value = productsSubtotal;
        }
        await saleService.updateSale(editDeal.id, updatePayload);
        toast({ title: 'Success', description: 'Deal updated successfully.' });
        onDealUpdated?.();
        onClose();
      } else {
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
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || (isEditMode ? 'Failed to update deal.' : 'Failed to create deal.'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const showCommissionSection = pricingModel === 'commission' || pricingModel === 'hybrid';
  const maxDiscountPercent = pricingRulesRef.current.maxDiscountPercent;
  const allowPriceOverride = pricingRulesRef.current.allowPriceOverride;

  const modalTree = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/20 p-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-deal p-2">
                  <Briefcase className="h-5 w-5 text-deal-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{isEditMode ? 'Edit Deal' : 'Create New Deal'}</h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-dark">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium text-foreground">
                    <User className="h-4 w-4" /> Lead {!isEditMode && '*'}
                  </Label>
                  {isEditMode ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                      <User className="h-4 w-4 text-deal" />
                      <span className="text-sm text-foreground">{editDeal?.lead ? `${editDeal.lead.first_name} ${editDeal.lead.last_name}` : 'Unknown Lead'}</span>
                      <span className="ml-auto text-xs text-muted-foreground">locked</span>
                    </div>
                  ) : (
                    <>
                      <div ref={leadSearchRef} className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={leadQuery}
                            onChange={(e) => handleLeadSearch(e.target.value)}
                            onFocus={() => leadResults.length > 0 && setShowLeadDropdown(true)}
                            placeholder="Search lead by name..."
                            className="border-input bg-background pl-9 text-foreground placeholder:text-muted-foreground"
                            disabled={isSubmitting}
                          />
                          {isSearchingLeads && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-deal" />}
                        </div>
                        {showLeadDropdown && leadResults.length > 0 && (
                          <div className="absolute z-[80] mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
                            {leadResults.map((lead) => (
                              <button
                                key={lead.id}
                                onClick={() => handleSelectLead(lead)}
                                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted"
                              >
                                <span className="text-sm text-popover-foreground">{lead.first_name} {lead.last_name}</span>
                                <span className="text-xs text-muted-foreground">{lead.products.length} product(s)</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedLead && (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                          <User className="h-4 w-4 text-deal" />
                          <span className="text-sm text-foreground">{selectedLead.first_name} {selectedLead.last_name}</span>
                          <button onClick={() => { setSelectedLead(null); setLeadQuery(''); }} className="ml-auto text-muted-foreground transition-colors hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium text-foreground">
                    <Briefcase className="h-4 w-4" /> Deal Information
                  </Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Deal Name *</Label>
                      <Input
                        value={dealName}
                        onChange={(e) => setDealName(e.target.value)}
                        placeholder="Enter deal name..."
                        className="border-input bg-background text-foreground placeholder:text-muted-foreground"
                        disabled={isSubmitting}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Stage *</Label>
                      <Select value={stageId} onValueChange={setStageId} disabled={isSubmitting}>
                        <SelectTrigger className="border-input bg-background text-foreground">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent className="z-[80]">
                          {sortedStages.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {selectedLead && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 font-medium text-foreground">
                      <FileText className="h-4 w-4" /> Products
                    </Label>

                    {leadProducts.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="p-3 text-left font-medium text-muted-foreground">Product</th>
                              <th className="p-3 text-center font-medium text-muted-foreground">Qty</th>
                              <th className="p-3 text-right font-medium text-muted-foreground">Unit Price</th>
                              <th className="p-3 text-right font-medium text-muted-foreground">Total</th>
                              <th className="w-10 p-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {leadProducts.map((p) => (
                              <tr key={p.id} className="border-t border-border/70">
                                <td className="p-3 text-foreground">{p.name}</td>
                                <td className="p-3 text-center text-muted-foreground">{p.pivot.quantity}</td>
                                <td className="p-3 text-right text-muted-foreground">{formatPrice(parseFloat(p.pivot.unit_price))}</td>
                                <td className="p-3 text-right font-medium text-deal">{formatPrice(parseFloat(p.pivot.total_price))}</td>
                                {!isEditMode && (
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => handleRemoveProduct(p.id)}
                                      disabled={isSubmitting || isAddingProduct}
                                      className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                                      title="Remove product"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted/40">
                            <tr>
                              <td colSpan={4} className="p-3 text-right font-medium text-muted-foreground">Subtotal</td>
                              <td className="p-3 text-right font-semibold text-foreground">{formatPrice(productsSubtotal)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm italic text-muted-foreground">No products of interest. You can add one below or enter the deal value manually.</p>
                        {pricingModel === 'product' && (
                          <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">Deal Value</Label>
                            <CurrencyInput
                              value={manualValue}
                              onValueChange={setManualValue}
                              placeholder="$0.00"
                              className="border-input bg-background text-foreground placeholder:text-muted-foreground"
                              disabled={isSubmitting || !allowPriceOverride}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {!isEditMode && (
                      <div ref={productSearchRef} className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={productQuery}
                            onChange={(e) => handleProductSearch(e.target.value)}
                            onFocus={() => productResults.length > 0 && setShowProductDropdown(true)}
                            placeholder="Search product to add..."
                            className="border-input bg-background pl-9 text-foreground placeholder:text-muted-foreground"
                            disabled={isSubmitting || isAddingProduct}
                          />
                          {(isSearchingProducts || isAddingProduct) && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-deal" />}
                        </div>
                        {showProductDropdown && productResults.length > 0 && (
                          <div className="absolute z-[80] mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
                            {productResults.map((product) => (
                              <button
                                key={product.id}
                                onClick={() => handleAddProduct(product)}
                                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted"
                                disabled={isAddingProduct}
                              >
                                <span className="text-sm text-popover-foreground">{product.name}</span>
                                <span className="text-xs text-muted-foreground">{formatPrice(product.base_price)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedLead && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 font-medium text-foreground">
                      <Calculator className="h-4 w-4" /> Pricing Model
                    </Label>
                    <RadioGroup value={pricingModel} onValueChange={(v) => setPricingModel(v as PricingModel)} className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="product" id="dm-product" className="border-border" />
                        <Label htmlFor="dm-product" className="cursor-pointer text-muted-foreground">Product</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="commission" id="dm-commission" className="border-border" />
                        <Label htmlFor="dm-commission" className="cursor-pointer text-muted-foreground">Commission</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hybrid" id="dm-hybrid" className="border-border" />
                        <Label htmlFor="dm-hybrid" className="cursor-pointer text-muted-foreground">Hybrid</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {selectedLead && showCommissionSection && (
                  <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                    <Label className="flex items-center gap-2 font-medium text-foreground">
                      <Percent className="h-4 w-4" /> Commission
                    </Label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Type</Label>
                        <Select value={commissionType} onValueChange={(v) => setCommissionType(v as ChargeType)}>
                          <SelectTrigger className="border-input bg-background text-foreground"><SelectValue /></SelectTrigger>
                          <SelectContent className="z-[80]">
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Value</Label>
                        {commissionType === 'fixed' ? (
                          <CurrencyInput value={commissionValue} onValueChange={setCommissionValue} placeholder="$0.00" className="border-input bg-background text-foreground" />
                        ) : (
                          <Input type="number" min={0} max={100} step={0.01} value={commissionValue} onChange={(e) => setCommissionValue(Number(e.target.value))} className="border-input bg-background text-foreground" placeholder="5" />
                        )}
                      </div>
                      {commissionType === 'percentage' && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Reference</Label>
                          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                            {formatPrice(productsSubtotal)}
                          </div>
                        </div>
                      )}
                    </div>
                    {commissionSubtotal > 0 && (
                      <div className="flex justify-end text-sm">
                        <span className="text-muted-foreground">Commission subtotal:</span>
                        <span className="ml-2 font-medium text-deal">{formatPrice(commissionSubtotal)}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedLead && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 font-medium text-foreground">
                        <DollarSign className="h-4 w-4" /> Additional Charges
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCharge} className="border-deal/20 bg-background text-foreground hover:bg-deal/10">
                        <Plus className="mr-1 h-3 w-3" /> Add Charge
                      </Button>
                    </div>
                    {charges.length > 0 ? (
                      <div className="space-y-2">
                        {charges.map((charge) => (
                          <div key={charge.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                            <Input placeholder="Name" value={charge.name} onChange={(e) => updateCharge(charge.id, 'name', e.target.value)} className="flex-1 border-input bg-background text-foreground text-sm" />
                            <Select value={charge.type} onValueChange={(v) => updateCharge(charge.id, 'type', v)}>
                              <SelectTrigger className="w-28 border-input bg-background text-foreground text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent className="z-[80]">
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                            {charge.type === 'fixed' ? (
                              <CurrencyInput value={charge.value} onValueChange={(v) => updateCharge(charge.id, 'value', v)} placeholder="$0.00" className="w-24 border-input bg-background text-foreground text-sm" />
                            ) : (
                              <Input type="number" min={0} max={100} step={0.01} value={charge.value} onChange={(e) => updateCharge(charge.id, 'value', Number(e.target.value))} className="w-24 border-input bg-background text-foreground text-sm" placeholder="0" />
                            )}
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCharge(charge.id)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No additional charges.</p>
                    )}
                  </div>
                )}

                {selectedLead && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 font-medium text-foreground">
                        <Tag className="h-4 w-4" /> Discounts
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addDiscount} className="border-deal/20 bg-background text-foreground hover:bg-deal/10">
                        <Plus className="mr-1 h-3 w-3" /> Add Discount
                      </Button>
                    </div>
                    {discounts.length > 0 ? (
                      <div className="space-y-2">
                        {discounts.map((discount) => (
                          <div key={discount.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                            <Input placeholder="Name" value={discount.name} onChange={(e) => updateDiscount(discount.id, 'name', e.target.value)} className="flex-1 border-input bg-background text-foreground text-sm" />
                            <Select value={discount.type} onValueChange={(v) => updateDiscount(discount.id, 'type', v)}>
                              <SelectTrigger className="w-28 border-input bg-background text-foreground text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent className="z-[80]">
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                            {discount.type === 'fixed' ? (
                              <CurrencyInput value={discount.value} onValueChange={(v) => updateDiscount(discount.id, 'value', v)} placeholder="$0.00" className="w-24 border-input bg-background text-foreground text-sm" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <Input type="number" min={0} max={maxDiscountPercent} step={0.01} value={discount.value} onChange={(e) => updateDiscount(discount.id, 'value', Math.min(Number(e.target.value), maxDiscountPercent))} className="w-16 border-input bg-background text-foreground text-sm" placeholder="0" />
                                <span className="whitespace-nowrap text-xs text-muted-foreground">/ {maxDiscountPercent}%</span>
                              </div>
                            )}
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDiscount(discount.id)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No discounts.</p>
                    )}
                  </div>
                )}

                {selectedLead && (
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="resize-none border-input bg-background text-foreground placeholder:text-muted-foreground" rows={3} disabled={isSubmitting} />
                  </div>
                )}

                {selectedLead && (
                  <div className="space-y-2 rounded-lg border border-deal/20 bg-deal/10 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatPrice(baseSubtotal)}</span>
                    </div>
                    {chargesTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Charges</span>
                        <span className="text-emerald-500">+{formatPrice(chargesTotal)}</span>
                      </div>
                    )}
                    {discountsTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discounts</span>
                        <span className="text-destructive">-{formatPrice(discountsTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-deal/20 pt-2 text-lg font-semibold">
                      <span className="text-foreground">Final Total</span>
                      <span className="text-deal">{formatPrice(finalTotal)}</span>
                    </div>
                    <p className="mt-2 text-xs italic text-muted-foreground">Preview — final values calculated by the server.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-border bg-muted/20 p-6 shrink-0">
              <button type="button" onClick={handleClose} className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-foreground transition-colors hover:bg-muted" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-deal px-4 py-3 font-medium text-deal-foreground transition-opacity hover:opacity-90 disabled:opacity-50" disabled={isSubmitting || (!isEditMode && !selectedLead)}>
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {isEditMode ? 'Saving...' : 'Creating...'}</>
                  : <><Briefcase className="h-4 w-4" /> {isEditMode ? 'Save Changes' : 'Create Deal'}</>
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(modalTree, document.body);
};

/**
 * START PURCHASE MODAL
 * 
 * Modal for creating a new sale from selected products
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Package, Calculator, FileText, DollarSign, Percent, Tag } from 'lucide-react';
import { LeadProduct } from './ProductsSection';
import { saleService, SaleCharge, CreateSalePayload } from '@/services/saleApi';
import { getSettings, defaultSettings } from '@/services/settingsApi';
import { Briefcase } from 'lucide-react';

type PricingModel = 'product' | 'commission' | 'hybrid';
type ChargeType = 'percentage' | 'fixed';

interface Charge {
  id: string;
  name: string;
  type: ChargeType;
  value: number;
}

interface DealFunnelStage {
  id: number;
  funnel_id: number;
  name: string;
  order: number;
}

interface DealFunnel {
  id: number;
  name: string;
  stages: DealFunnelStage[];
}

interface StartPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  selectedProducts: LeadProduct[];
  dealFunnels: DealFunnel[];
  onSaleCreated: () => void;
}

const StartPurchaseModal = ({ 
  isOpen, 
  onClose, 
  leadId, 
  selectedProducts,
  dealFunnels,
  onSaleCreated 
}: StartPurchaseModalProps) => {
  const { t } = useLanguage();

  const salesSettingsRef = useRef(defaultSettings.sales_settings);
  const pricingRulesRef = useRef(defaultSettings.product_settings.pricing_rules);
  useEffect(() => {
    getSettings().then(s => {
      salesSettingsRef.current = s.sales_settings;
      pricingRulesRef.current = s.product_settings.pricing_rules;
    });
  }, []);

  // Form state
  const [pricingModel, setPricingModel] = useState<PricingModel>('product');
  const [commissionType, setCommissionType] = useState<ChargeType>('percentage');
  const [commissionValue, setCommissionValue] = useState<number>(0);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [discounts, setDiscounts] = useState<Charge[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealName, setDealName] = useState('');
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [manualValue, setManualValue] = useState<number>(0);

  // Get stages for selected funnel
  const selectedFunnel = useMemo(() => {
    if (!selectedFunnelId) return null;
    return dealFunnels.find(f => f.id.toString() === selectedFunnelId) || null;
  }, [selectedFunnelId, dealFunnels]);

  const availableStages = useMemo(() => {
    if (!selectedFunnel) return [];
    return [...selectedFunnel.stages].sort((a, b) => a.order - b.order);
  }, [selectedFunnel]);

  // Generate unique ID for charges
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Reset form when modal closes
  const handleClose = () => {
    setPricingModel('product');
    setCommissionType('percentage');
    setCommissionValue(0);
    setCharges([]);
    setDiscounts([]);
    setNotes('');
    setDealName('');
    setSelectedFunnelId('');
    setSelectedStageId('');
    setManualValue(0);
    onClose();
  };

  // Reset stage when funnel changes
  const handleFunnelChange = (funnelId: string) => {
    setSelectedFunnelId(funnelId);
    setSelectedStageId('');
  };

  // Calculate products subtotal (use manual value when no products selected)
  const productsSubtotal = useMemo(() => {
    if (selectedProducts.length === 0 && pricingModel === 'product') return manualValue;
    return selectedProducts.reduce((sum, p) => sum + p.total_price, 0);
  }, [selectedProducts, manualValue, pricingModel]);

  // Calculate commission subtotal (reference value is always products subtotal)
  const commissionSubtotal = useMemo(() => {
    if (pricingModel === 'product') return 0;
    if (commissionType === 'fixed') return commissionValue;
    return (productsSubtotal * commissionValue) / 100;
  }, [pricingModel, commissionType, commissionValue, productsSubtotal]);

  // Calculate base subtotal (products + commission)
  const baseSubtotal = useMemo(() => {
    if (pricingModel === 'product') return productsSubtotal;
    if (pricingModel === 'commission') return commissionSubtotal;
    return productsSubtotal + commissionSubtotal;
  }, [pricingModel, productsSubtotal, commissionSubtotal]);

  // Calculate charges total
  const chargesTotal = useMemo(() => {
    return charges.reduce((sum, charge) => {
      if (charge.type === 'fixed') return sum + charge.value;
      return sum + (baseSubtotal * charge.value) / 100;
    }, 0);
  }, [charges, baseSubtotal]);

  // Calculate discounts total
  const discountsTotal = useMemo(() => {
    return discounts.reduce((sum, discount) => {
      if (discount.type === 'fixed') return sum + discount.value;
      return sum + (baseSubtotal * discount.value) / 100;
    }, 0);
  }, [discounts, baseSubtotal]);

  // Calculate final total (never below zero)
  const finalTotal = Math.max(0, baseSubtotal + chargesTotal - discountsTotal);

  // Format currency
  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Add new charge
  const addCharge = () => {
    setCharges([...charges, { id: generateId(), name: '', type: 'percentage', value: 0 }]);
  };

  // Update charge
  const updateCharge = (id: string, field: keyof Charge, value: string | number) => {
    setCharges(charges.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Remove charge
  const removeCharge = (id: string) => {
    setCharges(charges.filter(c => c.id !== id));
  };

  // Add new discount
  const addDiscount = () => {
    setDiscounts([...discounts, { id: generateId(), name: '', type: pricingRulesRef.current.defaultDiscountType, value: 0 }]);
  };

  // Update discount
  const updateDiscount = (id: string, field: keyof Charge, value: string | number) => {
    setDiscounts(discounts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  // Remove discount
  const removeDiscount = (id: string) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate deal info
    if (!dealName.trim()) {
      toast.error(t('sale.validation.name-required'));
      return;
    }
    if (!selectedFunnelId) {
      toast.error(t('sale.validation.funnel-required'));
      return;
    }
    if (!selectedStageId) {
      toast.error(t('sale.validation.stage-required'));
      return;
    }

    // Validation
    if ((pricingModel === 'commission' || pricingModel === 'hybrid') && commissionValue <= 0) {
      toast.error(t('sale.validation.commission-required'));
      return;
    }

    const ss = salesSettingsRef.current;
    const pr = pricingRulesRef.current;
    if (!ss.deal_rules.allowDealsWithoutProducts && selectedProducts.length === 0 && pricingModel === 'product') {
      toast.error(t('sale.no-products-selected'));
      return;
    }
    if (pr.minDealValue > 0 && finalTotal < pr.minDealValue) {
      toast.error(`${t('sale.deal-value')} min: ${pr.minDealValue}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateSalePayload = {
        pricing_model: pricingModel,
        product_ids: selectedProducts.map(p => p.id),
        funnel_id: Number(selectedFunnelId),
        stage_id: Number(selectedStageId),
        name: dealName.trim(),
      };

      if (selectedProducts.length === 0 && pricingModel === 'product' && manualValue > 0) {
        payload.manual_value = manualValue;
      }

      // Add commission fields if applicable
      if (pricingModel === 'commission' || pricingModel === 'hybrid') {
        payload.commission_type = commissionType;
        payload.commission_value = commissionValue;
        payload.reference_value = productsSubtotal;
      }

      // Add charges if any
      if (charges.length > 0) {
        payload.charges = charges
          .filter(c => c.name.trim() && c.value > 0)
          .map(c => ({
            name: c.name,
            type: c.type,
            value: c.value
          }));
      }

      // Add discounts if any
      if (discounts.length > 0) {
        payload.discounts = discounts
          .filter(d => d.name.trim() && d.value > 0)
          .map(d => ({
            name: d.name,
            type: d.type,
            value: d.value
          }));
      }

      // Add notes if any
      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      await saleService.createSale(leadId, payload);
      
      toast.success(t('sale.created-success'));
      onSaleCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast.error(error.response?.data?.message || t('sale.created-error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showCommissionSection = pricingModel === 'commission' || pricingModel === 'hybrid';
  const maxDiscountPercent = pricingRulesRef.current.maxDiscountPercent;
  const allowPriceOverride = pricingRulesRef.current.allowPriceOverride;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-white/10 text-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="w-5 h-5 text-primary" />
            {t('sale.deal-modal-title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-white/5">
          <div className="space-y-6 pb-4 pr-2">
            {/* 0. Deal Information */}
            <div className="space-y-4">
              <Label className="text-white font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {t('sale.deal-information')}
              </Label>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">{t('sale.deal-name')} *</Label>
                  <Input
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    placeholder={t('sale.deal-name-placeholder')}
                    className="bg-white/5 border-white/10 text-white"
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">{t('sale.deal-funnel')} *</Label>
                    <Select value={selectedFunnelId} onValueChange={handleFunnelChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder={t('sale.select-funnel')} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/10">
                        {dealFunnels.map((funnel) => (
                          <SelectItem key={funnel.id} value={funnel.id.toString()} className="text-white hover:bg-gray-700">
                            {funnel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">{t('sale.deal-stage')} *</Label>
                    <Select 
                      value={selectedStageId} 
                      onValueChange={setSelectedStageId}
                      disabled={!selectedFunnelId}
                    >
                      <SelectTrigger className={`bg-white/5 border-white/10 text-white ${!selectedFunnelId ? 'opacity-50' : ''}`}>
                        <SelectValue placeholder={selectedFunnelId ? t('sale.select-stage') : t('sale.select-funnel-first')} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/10">
                        {availableStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id.toString()} className="text-white hover:bg-gray-700">
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Selected Products Summary */}
            <div className="space-y-3">
              <Label className="text-white font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('sale.selected-products')}
              </Label>
              {selectedProducts.length > 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-3 text-gray-400 font-medium">{t('sale.product-name')}</th>
                        <th className="text-center p-3 text-gray-400 font-medium">{t('sale.qty')}</th>
                        <th className="text-right p-3 text-gray-400 font-medium">{t('sale.unit-price')}</th>
                        <th className="text-right p-3 text-gray-400 font-medium">{t('sale.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((product) => (
                        <tr key={product.id} className="border-t border-white/5">
                          <td className="p-3 text-white">{product.name}</td>
                          <td className="p-3 text-center text-gray-300">{product.quantity}</td>
                          <td className="p-3 text-right text-gray-300">{formatPrice(product.unit_price)}</td>
                          <td className="p-3 text-right text-primary font-medium">{formatPrice(product.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-white/5">
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-gray-400 font-medium">{t('sale.products-subtotal')}</td>
                        <td className="p-3 text-right text-white font-semibold">{formatPrice(productsSubtotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 italic">{t('sale.no-products-selected')}</p>
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-sm">{t('sale.deal-value')}</Label>
                    <CurrencyInput
                      value={manualValue}
                      onValueChange={setManualValue}
                      placeholder="$0.00"
                      className="bg-white/5 border-white/10 text-white"
                      disabled={!allowPriceOverride}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Pricing Model Selection */}
            <div className="space-y-3">
              <Label className="text-white font-medium flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                {t('sale.pricing-model')}
              </Label>
              <RadioGroup
                value={pricingModel}
                onValueChange={(value) => setPricingModel(value as PricingModel)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="product" id="product" className="border-white/30" />
                  <Label htmlFor="product" className="cursor-pointer text-gray-300">{t('sale.pricing-product')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="commission" id="commission" className="border-white/30" />
                  <Label htmlFor="commission" className="cursor-pointer text-gray-300">{t('sale.pricing-commission')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" className="border-white/30" />
                  <Label htmlFor="hybrid" className="cursor-pointer text-gray-300">{t('sale.pricing-hybrid')}</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 3. Commission Section (Conditional) */}
            {showCommissionSection && (
              <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                <Label className="text-white font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  {t('sale.commission-section')}
                </Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">{t('sale.commission-type')}</Label>
                    <Select value={commissionType} onValueChange={(v) => setCommissionType(v as ChargeType)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/10">
                        <SelectItem value="percentage" className="text-white hover:bg-gray-700">{t('sale.type-percentage')}</SelectItem>
                        <SelectItem value="fixed" className="text-white hover:bg-gray-700">{t('sale.type-fixed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">{t('sale.commission-value')}</Label>
                    {commissionType === 'fixed' ? (
                      <CurrencyInput
                        value={commissionValue}
                        onValueChange={setCommissionValue}
                        placeholder="$0.00"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={commissionValue}
                        onChange={(e) => setCommissionValue(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="5"
                      />
                    )}
                  </div>

                  {commissionType === 'percentage' && (
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-sm">{t('sale.reference-value')}</Label>
                      <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                        {formatPrice(productsSubtotal)}
                      </div>
                      <p className="text-xs text-gray-500">{t('sale.reference-value-hint')}</p>
                    </div>
                  )}
                </div>

                {commissionSubtotal > 0 && (
                  <div className="flex justify-end text-sm">
                    <span className="text-gray-400">{t('sale.commission-subtotal')}:</span>
                    <span className="ml-2 text-primary font-medium">{formatPrice(commissionSubtotal)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. Additional Charges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t('sale.additional-charges')}
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addCharge}
                  className="glass-card text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('sale.add-charge')}
                </Button>
              </div>

              {charges.length > 0 && (
                <div className="space-y-2">
                  {charges.map((charge) => (
                    <div key={charge.id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <Input
                        placeholder={t('sale.charge-name')}
                        value={charge.name}
                        onChange={(e) => updateCharge(charge.id, 'name', e.target.value)}
                        className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                      />
                      <Select value={charge.type} onValueChange={(v) => updateCharge(charge.id, 'type', v)}>
                        <SelectTrigger className="w-28 bg-white/5 border-white/10 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/10">
                          <SelectItem value="percentage" className="text-white hover:bg-gray-700">%</SelectItem>
                          <SelectItem value="fixed" className="text-white hover:bg-gray-700">{t('sale.type-fixed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {charge.type === 'fixed' ? (
                        <CurrencyInput
                          value={charge.value}
                          onValueChange={(v) => updateCharge(charge.id, 'value', v)}
                          placeholder="$0.00"
                          className="w-24 bg-white/5 border-white/10 text-white text-sm"
                        />
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={charge.value}
                          onChange={(e) => updateCharge(charge.id, 'value', Number(e.target.value))}
                          className="w-24 bg-white/5 border-white/10 text-white text-sm"
                          placeholder="0"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCharge(charge.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {charges.length === 0 && (
                <p className="text-sm text-gray-500 italic">{t('sale.no-charges')}</p>
              )}
            </div>

            {/* 4b. Discounts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {t('sale.discounts')}
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addDiscount}
                  className="glass-card text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('sale.add-discount')}
                </Button>
              </div>

              {discounts.length > 0 && (
                <div className="space-y-2">
                  {discounts.map((discount) => (
                    <div key={discount.id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <Input
                        placeholder={t('sale.discount-name')}
                        value={discount.name}
                        onChange={(e) => updateDiscount(discount.id, 'name', e.target.value)}
                        className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                      />
                      <Select value={discount.type} onValueChange={(v) => updateDiscount(discount.id, 'type', v)}>
                        <SelectTrigger className="w-28 bg-white/5 border-white/10 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/10">
                          <SelectItem value="percentage" className="text-white hover:bg-gray-700">%</SelectItem>
                          <SelectItem value="fixed" className="text-white hover:bg-gray-700">{t('sale.type-fixed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {discount.type === 'fixed' ? (
                        <CurrencyInput
                          value={discount.value}
                          onValueChange={(v) => updateDiscount(discount.id, 'value', v)}
                          placeholder="$0.00"
                          className="w-24 bg-white/5 border-white/10 text-white text-sm"
                        />
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <Input
                            type="number"
                            min={0}
                            max={maxDiscountPercent}
                            step={0.01}
                            value={discount.value}
                            onChange={(e) => updateDiscount(discount.id, 'value', Math.min(Number(e.target.value), maxDiscountPercent))}
                            className="w-24 bg-white/5 border-white/10 text-white text-sm"
                            placeholder="0"
                          />
                          <span className="text-xs text-white/40">max {maxDiscountPercent}%</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDiscount(discount.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {discounts.length === 0 && (
                <p className="text-sm text-gray-500 italic">{t('sale.no-discounts')}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-white font-medium">{t('sale.notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('sale.notes-placeholder')}
                className="bg-white/5 border-white/10 text-white resize-none"
                rows={3}
              />
            </div>

            {/* 5. Live Calculation Section */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{t('sale.subtotal')}</span>
                <span className="text-white">{formatPrice(baseSubtotal)}</span>
              </div>
              {chargesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{t('sale.charges-total')}</span>
                  <span className="text-green-400">+{formatPrice(chargesTotal)}</span>
                </div>
              )}
              {discountsTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{t('sale.discounts-total')}</span>
                  <span className="text-red-400">-{formatPrice(discountsTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-primary/20">
                <span className="text-white">{t('sale.final-total')}</span>
                <span className="text-primary">{formatPrice(finalTotal)}</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-2">{t('sale.preview-note')}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 border-t border-white/10 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="glass-card">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/80"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('sale.creating')}
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4 mr-2" />
                {t('sale.create-deal')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartPurchaseModal;

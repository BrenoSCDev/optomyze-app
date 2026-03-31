/**
 * CREATE QUOTE MODAL
 * 
 * Modal for creating ERP quotes with products from the ERP system
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, FileText, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ERPProduct, ERPUnit, QuoteItem, QuoteStatus, ERPBudgetResponse } from '@/types/erp';
import { erpService } from '@/services/erpApi';
import { cn } from '@/lib/utils';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  customerName: string;
  leadEmail?: string;
  leadPhone?: string;
  onQuoteCreated?: (quote: ERPBudgetResponse) => void;
}

const QUOTE_STATUSES: QuoteStatus[] = ['draft', 'sent', 'approved', 'rejected'];

// Currency formatting helper
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Parse currency input to number
const parseCurrencyInput = (value: string): number => {
  // Remove all non-numeric characters except comma
  const cleaned = value.replace(/[^\d]/g, '');
  // Convert to number with decimals (last 2 digits are cents)
  if (!cleaned) return 0;
  return parseInt(cleaned, 10) / 100;
};

// Format number for currency input display
const formatCurrencyInput = (value: number): string => {
  if (value === 0) return '';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CreateQuoteModal = ({ 
  isOpen, 
  onClose, 
  leadId, 
  customerName,
  leadEmail = '',
  leadPhone = '',
  onQuoteCreated 
}: CreateQuoteModalProps) => {
  const { t } = useLanguage();
  
  // Data state
  const [products, setProducts] = useState<ERPProduct[]>([]);
  const [units, setUnits] = useState<ERPUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [unitId, setUnitId] = useState<string>('');
  const [status, setStatus] = useState<QuoteStatus>('draft');
  const [discount, setDiscount] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Fetch ERP data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchERPData();
    }
  }, [isOpen]);

  const fetchERPData = async () => {
    setLoading(true);
    try {
      const response = await erpService.getProductsAndUnits();
      setProducts(response.products.data || []);
      setUnits(response.units.data || []);
    } catch (error) {
      console.error('Error fetching ERP data:', error);
      toast.error(t('quote.load-error'));
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setUnitId('');
    setStatus('draft');
    setDiscount(0);
    setDiscountInput('');
    setNotes('');
    setValidUntil(undefined);
    setQuoteItems([]);
    onClose();
  };

  // Add new quote item
  const addQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      {
        id: generateId(),
        product_id: 0,
        product_name: '',
        product_sku: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
      },
    ]);
  };

  // Update quote item
  const updateQuoteItem = (id: string, field: keyof QuoteItem, value: any) => {
    setQuoteItems(quoteItems.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      // If product changed, update product details
      if (field === 'product_id') {
        const product = products.find(p => p.id === Number(value));
        if (product) {
          updatedItem.product_name = product.name;
          updatedItem.product_sku = product.sku;
          updatedItem.unit_price = product.base_price;
          updatedItem.total = updatedItem.quantity * product.base_price;
        }
      }

      // Recalculate total when quantity or unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
      }

      return updatedItem;
    }));
  };

  // Handle unit price input with currency mask
  const handleUnitPriceChange = (id: string, inputValue: string) => {
    const numericValue = parseCurrencyInput(inputValue);
    updateQuoteItem(id, 'unit_price', numericValue);
  };

  // Remove quote item
  const removeQuoteItem = (id: string) => {
    setQuoteItems(quoteItems.filter(item => item.id !== id));
  };

  // Handle discount input with currency mask
  const handleDiscountChange = (inputValue: string) => {
    const numericValue = parseCurrencyInput(inputValue);
    setDiscount(numericValue);
    setDiscountInput(formatCurrencyInput(numericValue));
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => sum + item.total, 0);
  }, [quoteItems]);

  // Calculate total
  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Validate form
  const isValid = useMemo(() => {
    return quoteItems.length > 0 && 
           quoteItems.every(item => item.product_id > 0 && item.quantity > 0);
  }, [quoteItems]);

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid) {
      toast.error(t('quote.validation-error'));
      return;
    }

    if (!unitId) {
      toast.error(t('quote.unit-required'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Prepare the ERP budget request
      const erpBudgetRequest = {
        company_id: 1, // This could come from user context if needed
        name: customerName,
        email: leadEmail,
        phone: leadPhone,
        unit_id: Number(unitId),
        status,
        discount,
        valid_until: validUntil ? format(validUntil, 'yyyy-MM-dd') : null,
        notes,
        items: quoteItems.map(item => ({
          product_id: item.product_id,
          description: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      // Step 2: Send quote to ERP
      const erpResponse = await erpService.createBudget(erpBudgetRequest);
      
      // Step 3: Link ERP budget to lead in CRM
      await erpService.linkBudgetToLead(leadId, erpResponse.id);
      
      toast.success(t('quote.created-success'));
      onQuoteCreated?.(erpResponse);
      handleClose();
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast.error(error.response?.data?.message || t('quote.created-error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl bg-gray-900 border-white/10 text-white max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-primary" />
            {t('quote.title')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex min-h-0">
            {/* Left Column - Quote Details */}
            <div className="w-[320px] border-r border-white/10 p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
              <h3 className="text-sm font-medium text-gray-400">{t('quote.details')}</h3>

              {/* Customer */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">{t('quote.customer')}</Label>
                <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2.5 text-white">
                  {customerName}
                </div>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">{t('quote.unit')}</Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder={t('quote.select-unit')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10">
                    {units.map(unit => (
                      <SelectItem 
                        key={unit.id} 
                        value={String(unit.id)} 
                        className="text-white hover:bg-white/10"
                      >
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valid Until */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">{t('quote.valid-until')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10',
                        !validUntil && 'text-gray-500'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validUntil ? format(validUntil, 'dd/MM/yyyy') : t('quote.select-date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-white/10" align="start">
                    <Calendar
                      mode="single"
                      selected={validUntil}
                      onSelect={setValidUntil}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">{t('quote.status')}</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10">
                    {QUOTE_STATUSES.map(s => (
                      <SelectItem 
                        key={s} 
                        value={s} 
                        className="text-white hover:bg-white/10"
                      >
                        {t(`quote.status-${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">{t('quote.notes')}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('quote.notes-placeholder')}
                  className="bg-white/5 border-white/10 text-white resize-none min-h-[100px]"
                />
              </div>
            </div>

            {/* Right Column - Quote Items */}
            <div className="flex-1 flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">{t('quote.items')}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuoteItem}
                  className="glass-card text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('quote.add-product')}
                </Button>
              </div>

              {/* Items Table */}
              <div className="flex-1 overflow-hidden">
                <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden h-full flex flex-col">
                  {/* Table Header */}
                  <div className="grid grid-cols-[2fr_80px_120px_100px_40px] gap-2 px-4 py-3 bg-white/5 text-sm font-medium text-gray-400 border-b border-white/10">
                    <div>{t('quote.product')}</div>
                    <div className="text-center">{t('quote.quantity')}</div>
                    <div className="text-right">{t('quote.unit-price')}</div>
                    <div className="text-right">{t('quote.total')}</div>
                    <div></div>
                  </div>

                  {/* Table Body */}
                  <ScrollArea className="flex-1">
                    {quoteItems.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-gray-500">
                        {t('quote.no-items')}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {quoteItems.map(item => (
                          <div 
                            key={item.id} 
                            className="grid grid-cols-[2fr_80px_120px_100px_40px] gap-2 px-4 py-3 items-center hover:bg-white/5 transition-colors"
                          >
                            {/* Product Select */}
                            <Select
                              value={item.product_id ? String(item.product_id) : ''}
                              onValueChange={(v) => updateQuoteItem(item.id, 'product_id', Number(v))}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder={t('quote.select-product')} />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-white/10 max-h-[200px]">
                                {products.filter(p => p.is_active).map(product => (
                                  <SelectItem 
                                    key={product.id} 
                                    value={String(product.id)} 
                                    className="text-white hover:bg-white/10"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-xs text-gray-400">{product.sku}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Quantity */}
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateQuoteItem(item.id, 'quantity', Number(e.target.value) || 1)}
                              className="bg-white/5 border-white/10 text-white text-center"
                            />

                            {/* Unit Price with currency mask */}
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                              <Input
                                type="text"
                                value={formatCurrencyInput(item.unit_price)}
                                onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                                className="bg-white/5 border-white/10 text-white text-right pl-9"
                                placeholder="0,00"
                              />
                            </div>

                            {/* Total */}
                            <div className="text-right text-white font-medium">
                              {formatCurrency(item.total)}
                            </div>

                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuoteItem(item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Summary Section */}
                  <div className="border-t border-white/10 p-4 space-y-3 bg-white/5">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{t('quote.subtotal')}</span>
                      <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Discount */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{t('quote.discount')}</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                        <Input
                          type="text"
                          value={discountInput}
                          onChange={(e) => handleDiscountChange(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-right pl-9 h-9"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-white font-semibold">{t('quote.final-total')}</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-white/10 bg-gray-900/50">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSubmitting} 
            className="glass-card"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isValid || loading}
            className="bg-white text-black hover:bg-gray-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('quote.create')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuoteModal;

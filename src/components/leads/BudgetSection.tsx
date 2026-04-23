/**
 * BUDGET SECTION
 * 
 * Displays budget creation and list for ERP module companies
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, ExternalLink, Download, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ERPBudgetResponse, QuoteStatus } from '@/types/erp';
import { erpService } from '@/services/erpApi';
import CreateQuoteModal from './CreateQuoteModal';
import { ERP_URL, ERP_FRONTEND_URL } from '@/lib/constants';

interface BudgetSectionProps {
  leadId: number;
  customerName: string;
  leadEmail?: string;
  leadPhone?: string;
  erpBudgetIds?: number[];
}

// Currency formatting helper (locale-agnostic, uses provided currency code)
const buildFormatCurrency = (currencyCode: string) => (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(numValue);
};

// Status badge colors
const getStatusBadge = (status: QuoteStatus, t: (key: string) => string) => {
  const statusConfig: Record<QuoteStatus, { bg: string; text: string }> = {
    draft: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
    sent: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
  };
  
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <Badge className={`${config.bg} ${config.text} border-0`}>
      {t(`quote.status-${status}`)}
    </Badge>
  );
};

const BudgetSection = ({ leadId, customerName, leadEmail = '', leadPhone = '', erpBudgetIds = [] }: BudgetSectionProps) => {
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();
  const formatCurrency = buildFormatCurrency(companyCurrency);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [budgets, setBudgets] = useState<ERPBudgetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBudget, setExpandedBudget] = useState<number | null>(null);

  // Fetch budgets from ERP on mount if lead has erp_budgets_ids
  useEffect(() => {
    fetchBudgets();
  }, [leadId, erpBudgetIds]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      
      // If lead has ERP budget IDs, fetch directly from ERP
      if (erpBudgetIds && erpBudgetIds.length > 0) {
        const erpBudgets = await erpService.getBudgetsByIds(erpBudgetIds);
        setBudgets(erpBudgets);
      } else {
        // Fallback to CRM endpoint
        const response = await erpService.getLeadBudgets(leadId);
        const erpBudgets = response.map((item: any) => item.erp_budget_data || item);
        setBudgets(erpBudgets);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteCreated = (quote: ERPBudgetResponse) => {
    // Add the new quote to the list
    setBudgets(prev => [quote, ...prev]);
  };

  const handleViewInERP = (budgetId: number) => {
    window.open(`${ERP_FRONTEND_URL}/quotes`, '_blank');
  };

  const handleDownloadPDF = (budgetId: number) => {
    window.open(`${ERP_URL}/api/v1/budgets/${budgetId}/pdf`, '_blank');
  };

  return (
    <>
      <motion.div 
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('lead-details.budget')}
            {budgets.length > 0 && (
              <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">
                {budgets.length}
              </Badge>
            )}
          </h3>
          <Button 
            onClick={() => setQuoteModalOpen(true)} 
            size="sm"
            className="bg-primary hover:bg-primary/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('lead-details.create-budget')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">{t('lead-details.no-budgets')}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div 
                  key={budget.id}
                  className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
                >
                  {/* Budget Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedBudget(expandedBudget === budget.id ? null : budget.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          {t('quote.title')} #{budget.id}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {format(new Date(budget.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      {getStatusBadge(budget.status, t)}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-primary font-bold text-lg">
                        {formatCurrency(budget.total)}
                      </span>
                      <Eye className={`w-4 h-4 text-gray-400 transition-transform ${expandedBudget === budget.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedBudget === budget.id && (
                    <div className="border-t border-white/10 p-4">
                      {/* Items Table */}
                      <div className="mb-4">
                        <div className="grid grid-cols-[2fr_80px_100px_100px] gap-2 px-3 py-2 bg-white/5 rounded-t-md text-xs font-medium text-gray-400">
                          <div>{t('quote.product')}</div>
                          <div className="text-center">{t('quote.quantity')}</div>
                          <div className="text-right">{t('quote.unit-price')}</div>
                          <div className="text-right">{t('quote.total')}</div>
                        </div>
                        <div className="divide-y divide-white/5">
                          {budget.items.map((item, index) => (
                            <div 
                              key={index} 
                              className="grid grid-cols-[2fr_80px_100px_100px] gap-2 px-3 py-2.5 text-sm"
                            >
                              <div className="text-white">{item.description}</div>
                              <div className="text-center text-gray-300">{item.quantity}</div>
                              <div className="text-right text-gray-300">{formatCurrency(item.unit_price)}</div>
                              <div className="text-right text-white font-medium">{formatCurrency(item.total)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="flex justify-between items-center border-t border-white/10 pt-3 mb-4">
                        <div className="text-sm text-gray-400">
                          {budget.discount && parseFloat(budget.discount) > 0 && (
                            <span>{t('quote.discount')}: -{formatCurrency(budget.discount)}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 text-sm mr-2">{t('quote.final-total')}:</span>
                          <span className="text-xl font-bold text-primary">{formatCurrency(budget.total)}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {budget.notes && (
                        <div className="mb-4 p-3 bg-white/5 rounded-md">
                          <span className="text-xs text-gray-400 block mb-1">{t('quote.notes')}:</span>
                          <p className="text-sm text-gray-300">{budget.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInERP(budget.id)}
                          className="glass-card text-sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t('quote.view-in-erp')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(budget.id)}
                          className="glass-card text-sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t('quote.download-pdf')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </motion.div>

      <CreateQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        leadId={leadId}
        customerName={customerName}
        leadEmail={leadEmail}
        leadPhone={leadPhone}
        onQuoteCreated={handleQuoteCreated}
      />
    </>
  );
};

export default BudgetSection;

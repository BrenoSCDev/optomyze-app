/**
 * PURCHASE HISTORY SECTION
 * 
 * Displays sales history for a lead with products, charges, and documents
 */

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Package, 
  Receipt, 
  FileText, 
  Upload, 
  Edit, 
  ChevronDown, 
  ChevronUp,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SaleProduct {
  id: number;
  product_id: number;
  product_name?: string;
  name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SaleCharge {
  id: number;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  calculated_amount: number;
}

interface SaleDocument {
  id: number;
  name: string;
  url?: string;
  created_at: string;
}

interface SaleUser {
  id: number;
  name: string;
  email: string;
}

export interface Sale {
  id: number;
  lead_id: number;
  status: 'pending' | 'sent' | 'closed' | 'lost';
  subtotal: number;
  total_value: number;
  currency: string;
  created_at: string;
  updated_at?: string;
  user?: SaleUser;
  items?: SaleProduct[];
  charges?: SaleCharge[];
  documents?: SaleDocument[];
}

interface PurchaseHistorySectionProps {
  sales: Sale[];
}

const PurchaseHistorySection: React.FC<PurchaseHistorySectionProps> = ({ sales }) => {
  const { t } = useLanguage();
  
  const sortedSales = [...sales].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sortedSales.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">{t('lead-details.no-purchases')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedSales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
};

const SaleCard: React.FC<{ sale: Sale }> = ({ sale }) => {
  const { t } = useLanguage();
  const [productsOpen, setProductsOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
  
  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      'sent': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      'closed': 'bg-green-600/20 text-green-400 border-green-600/30',
      'lost': 'bg-red-600/20 text-red-400 border-red-600/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-600/20 text-gray-400 border-gray-600/30';
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency || 'USD' 
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const totalCharges = sale.charges?.reduce((sum, c) => sum + (c.calculated_amount || 0), 0) || 0;
  const items = sale.items || [];
  const charges = sale.charges || [];
  const documents = sale.documents || [];

  return (
    <motion.div 
      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors border border-white/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {t('lead-details.order')} #{sale.id}
              </span>
              <Badge className={`text-xs font-medium border ${getStatusColor(sale.status)}`}>
                {t(`lead-details.sale-status.${sale.status}`)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(sale.created_at)}
              </span>
              {sale.user && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {sale.user.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-white/5 rounded-lg">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{t('lead-details.subtotal')}</p>
          <p className="text-white font-medium">{formatCurrency(sale.subtotal || 0, sale.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{t('lead-details.charges')}</p>
          <p className="text-white font-medium">{formatCurrency(totalCharges, sale.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{t('lead-details.total')}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(sale.total_value || 0, sale.currency)}</p>
        </div>
      </div>

      {/* Products Section */}
      <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 text-gray-300">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('lead-details.products')} ({items.length})
              </span>
            </div>
            {productsOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                  <div className="flex-1">
                    <span className="text-white">{item.product_name || item.name || `Product #${item.product_id}`}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span>x{item.quantity}</span>
                    <span>{formatCurrency(item.unit_price, sale.currency)}</span>
                    <span className="text-white font-medium">{formatCurrency(item.total_price, sale.currency)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm p-2">{t('lead-details.no-products')}</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Charges Section */}
      {charges.length > 0 && (
        <Collapsible open={chargesOpen} onOpenChange={setChargesOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors mt-2">
              <div className="flex items-center gap-2 text-gray-300">
                <Receipt className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t('lead-details.additional-charges')} ({charges.length})
                </span>
              </div>
              {chargesOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {charges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{charge.name}</span>
                    <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                      {charge.type === 'percentage' ? `${charge.value}%` : t('lead-details.fixed')}
                    </Badge>
                  </div>
                  <span className="text-white font-medium">{formatCurrency(charge.calculated_amount, sale.currency)}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Documents Section */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-gray-300 mb-2">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">{t('lead-details.documents')}</span>
        </div>
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                <span className="text-white">{doc.name}</span>
                <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">{t('lead-details.no-documents-uploaded')}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
        <Button 
          variant="outline" 
          size="sm" 
          className="glass-card text-xs"
          onClick={() => {/* TODO: Implement upload */}}
        >
          <Upload className="w-3 h-3 mr-1" />
          {t('lead-details.upload-document')}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="glass-card text-xs opacity-50 cursor-not-allowed"
          disabled
        >
          <Edit className="w-3 h-3 mr-1" />
          {t('lead-details.edit-sale')}
        </Button>
        <span className="text-xs text-gray-500 ml-2">{t('lead-details.coming-soon')}</span>
      </div>
    </motion.div>
  );
};

export default PurchaseHistorySection;

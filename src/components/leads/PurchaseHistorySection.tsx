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
  Trash2,
  Loader2,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import SaleDocumentUploadModal from './SaleDocumentUploadModal';

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
  created_at?: string;
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
  charges_total: number;
  final_total: number;
  currency: string;
  created_at: string;
  updated_at?: string;
  user?: SaleUser;
  items?: SaleProduct[];
  charges?: SaleCharge[];
  docs?: SaleDocument[];
  documents?: SaleDocument[];
}

interface PurchaseHistorySectionProps {
  sales: Sale[];
  onSaleDeleted?: (saleId: number) => void;
  onSaleUpdated?: (saleId: number, updatedSale: Partial<Sale>) => void;
}

const PurchaseHistorySection: React.FC<PurchaseHistorySectionProps> = ({ 
  sales, 
  onSaleDeleted,
  onSaleUpdated 
}) => {
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
        <SaleCard 
          key={sale.id} 
          sale={sale} 
          onDeleted={onSaleDeleted}
          onUpdated={onSaleUpdated}
        />
      ))}
    </div>
  );
};

interface SaleCardProps {
  sale: Sale;
  onDeleted?: (saleId: number) => void;
  onUpdated?: (saleId: number, updatedSale: Partial<Sale>) => void;
}

const SaleCard: React.FC<SaleCardProps> = ({ sale, onDeleted, onUpdated }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [productsOpen, setProductsOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<SaleDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [localDocs, setLocalDocs] = useState<SaleDocument[]>(sale.docs || sale.documents || []);
  
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/sales/${sale.id}`);
      toast({
        title: t('lead-details.delete-sale-success'),
        description: t('lead-details.delete-sale-success-description'),
      });
      onDeleted?.(sale.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete sale:', error);
      toast({
        title: t('lead-details.delete-sale-error'),
        description: t('lead-details.delete-sale-error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDocumentUploaded = (doc: { id: number; name: string; url: string }) => {
    const newDoc: SaleDocument = {
      id: doc.id,
      name: doc.name,
      url: doc.url,
      created_at: new Date().toISOString(),
    };
    setLocalDocs(prev => [...prev, newDoc]);
    onUpdated?.(sale.id, { docs: [...localDocs, newDoc] });
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    
    setIsDeletingDoc(true);
    try {
      await api.delete(`/api/sales/docs/${docToDelete.id}`);
      toast({
        title: t('lead-details.delete-document-success'),
        description: t('lead-details.delete-document-success-description'),
      });
      const updatedDocs = localDocs.filter(d => d.id !== docToDelete.id);
      setLocalDocs(updatedDocs);
      onUpdated?.(sale.id, { docs: updatedDocs });
      setDeleteDocDialogOpen(false);
      setDocToDelete(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: t('lead-details.delete-document-error'),
        description: t('lead-details.delete-document-error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const openDocumentDeleteDialog = (doc: SaleDocument) => {
    setDocToDelete(doc);
    setDeleteDocDialogOpen(true);
  };

  const handleDownloadDocument = (doc: SaleDocument) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const totalCharges = sale.charges_total || 0;
  const items = sale.items || [];
  const charges = sale.charges || [];

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
          <p className="text-lg font-bold text-primary">{formatCurrency(sale.final_total || 0, sale.currency)}</p>
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-gray-300">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t('lead-details.documents')} ({localDocs.length})
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => setUploadModalOpen(true)}
          >
            <Upload className="w-3 h-3 mr-1" />
            {t('lead-details.upload')}
          </Button>
        </div>
        {localDocs.length > 0 ? (
          <div className="space-y-2">
            {localDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm group">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-white truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {doc.created_at && (
                    <span className="text-xs text-gray-400 mr-2 hidden sm:inline">
                      {formatDate(doc.created_at)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-primary hover:bg-primary/10"
                    onClick={() => handleDownloadDocument(doc)}
                    title={t('lead-details.download-document')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openDocumentDeleteDialog(doc)}
                    title={t('lead-details.delete-document')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
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
          onClick={() => setUploadModalOpen(true)}
        >
          <Upload className="w-3 h-3 mr-1" />
          {t('lead-details.upload-document')}
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="glass-card h-8 w-8"
          disabled
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="glass-card h-8 w-8 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Upload Modal */}
      <SaleDocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        saleId={sale.id}
        onDocumentUploaded={handleDocumentUploaded}
      />

      {/* Delete Sale Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lead-details.delete-sale-title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('lead-details.delete-sale-confirmation')}</p>
              <p className="text-yellow-500 font-medium">
                {t('lead-details.delete-sale-billing-warning')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={deleteDocDialogOpen} onOpenChange={setDeleteDocDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lead-details.delete-document-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lead-details.delete-document-confirmation')}
              {docToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  "{docToDelete.name}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDoc}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={isDeletingDoc}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDoc ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PurchaseHistorySection;

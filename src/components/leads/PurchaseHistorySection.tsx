/**
 * PURCHASE HISTORY SECTION
 * 
 * Displays sales history for a lead with products, charges, and documents
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  X,
  File,
  CheckCircle,
  XCircle,
  CircleDot,
  GitBranch
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import api from '@/services/api';
import { getStorageUrl } from '@/lib/constants';
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

interface SaleDiscount {
  id: number;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  calculated_amount: number;
}

interface SaleDocument {
  id: number;
  name: string;
  filename?: string;
  storage_path?: string;
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
  name?: string;
  status: 'pending' | 'sent' | 'closed' | 'lost';
  subtotal: number;
  total_value: number;
  charges_total: number;
  discounts_total: number;
  final_total: number;
  currency: string;
  created_at: string;
  updated_at?: string;
  notes?: string;
  user?: SaleUser;
  items?: SaleProduct[];
  charges?: SaleCharge[];
  discounts?: SaleDiscount[];
  docs?: SaleDocument[];
  documents?: SaleDocument[];
  funnel?: {
    id: number;
    name: string;
  };
  stage?: {
    id: number;
    name: string;
    color: string;
  };
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
        <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">{t('lead-details.no-purchases')}</p>
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currencyCode: companyCurrency } = useCurrency();
  const [productsOpen, setProductsOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<SaleDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [localDocs, setLocalDocs] = useState<SaleDocument[]>(sale.docs || sale.documents || []);
  const [previewDoc, setPreviewDoc] = useState<SaleDocument | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localStatus, setLocalStatus] = useState(sale.status);
  
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

  const getDocPath = (doc: SaleDocument) => {
    return doc.storage_path || doc.url || '';
  };

  const getDocName = (doc: SaleDocument) => {
    return doc.filename || doc.name || 'Document';
  };

  const getFileExtension = (path: string) => {
    return path?.split('.').pop()?.toLowerCase() || '';
  };

  const isPreviewSupported = (path: string) => {
    const ext = getFileExtension(path);
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isImageFile = (path: string) => {
    const ext = getFileExtension(path);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const getFileIcon = (path: string) => {
    const ext = getFileExtension(path);
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    return <File className="w-4 h-4 text-gray-400 flex-shrink-0" />;
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
      filename: doc.name,
      storage_path: doc.url,
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

  const handlePreviewDocument = (doc: SaleDocument) => {
    setPreviewDoc(doc);
  };

  const handleCloseDeal = async () => {
    setIsUpdatingStatus(true);
    try {
      await api.put(`/api/sales/${sale.id}/status`, { status: 'closed' });
      setLocalStatus('closed');
      onUpdated?.(sale.id, { status: 'closed' });
      toast({
        title: t('lead-details.close-deal-success'),
        description: t('lead-details.close-deal-success-description'),
      });
      setCloseDialogOpen(false);
    } catch (error) {
      console.error('Failed to close deal:', error);
      toast({
        title: t('lead-details.close-deal-error'),
        description: t('lead-details.close-deal-error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkAsLost = async () => {
    setIsUpdatingStatus(true);
    try {
      await api.put(`/api/sales/${sale.id}/status`, { status: 'lost' });
      setLocalStatus('lost');
      onUpdated?.(sale.id, { status: 'lost' });
      toast({
        title: t('lead-details.mark-lost-success'),
        description: t('lead-details.mark-lost-success-description'),
      });
      setLostDialogOpen(false);
    } catch (error) {
      console.error('Failed to mark deal as lost:', error);
      toast({
        title: t('lead-details.mark-lost-error'),
        description: t('lead-details.mark-lost-error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const canUpdateStatus = localStatus === 'pending' || localStatus === 'sent';

  const handleDownloadDocument = (doc: SaleDocument) => {
    const path = getDocPath(doc);
    if (path) {
      const url = getStorageUrl(path);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = getDocName(doc);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const totalCharges = sale.charges_total || 0;
  const totalDiscounts = sale.discounts_total || 0;
  const items = sale.items || [];
  const charges = sale.charges || [];
  const discounts = sale.discounts || [];

  return (
    <motion.div 
      className="bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors border border-border"
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-foreground font-medium">
                {sale.name || `${t('lead-details.order')} #${sale.id}`}
              </span>
              {sale.stage && (
                <Badge 
                  className="text-xs font-medium border flex items-center gap-1"
                  style={{ 
                    backgroundColor: `${sale.stage.color}20`,
                    color: sale.stage.color,
                    borderColor: `${sale.stage.color}50`
                  }}
                >
                  <CircleDot className="w-3 h-3" />
                  {sale.stage.name}
                </Badge>
              )}
              {sale.funnel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/deals/${sale.funnel!.id}`);
                  }}
                  className="text-xs text-primary flex items-center gap-1 transition-colors cursor-pointer underline hover:text-primary/80"
                  title={`Go to funnel: ${sale.funnel.name}`}
                >
                  <GitBranch className="w-3 h-3" />
                  {sale.funnel.name}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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

      {/* Notes */}
      {sale.notes && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('lead-details.notes')}</p>
          <p className="text-foreground/70 text-sm">{sale.notes}</p>
        </div>
      )}

      {/* Financial Summary */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('lead-details.charges')}</span>
          <span className="text-green-500 font-medium">+{formatCurrency(totalCharges, sale.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('lead-details.discounts')}</span>
          <span className="text-red-500 font-medium">-{formatCurrency(totalDiscounts, sale.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('lead-details.subtotal')}</span>
          <span className="text-foreground font-medium">{formatCurrency(sale.subtotal || 0, sale.currency)}</span>
        </div>
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="text-muted-foreground font-medium">{t('lead-details.total')}</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(sale.final_total || 0, sale.currency)}</span>
        </div>
      </div>

      {/* Products Section */}
      <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 text-foreground/70">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('lead-details.products')} ({items.length})
              </span>
            </div>
            {productsOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                  <div className="flex-1">
                    <span className="text-foreground">{item.product_name || item.name || `Product #${item.product_id}`}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>x{item.quantity}</span>
                    <span>{formatCurrency(item.unit_price, sale.currency)}</span>
                    <span className="text-foreground font-medium">{formatCurrency(item.total_price, sale.currency)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm p-2">{t('lead-details.no-products')}</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Charges Section */}
      {charges.length > 0 && (
        <Collapsible open={chargesOpen} onOpenChange={setChargesOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors mt-2">
              <div className="flex items-center gap-2 text-foreground/70">
                <Receipt className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t('lead-details.additional-charges')} ({charges.length})
                </span>
              </div>
              {chargesOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {charges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{charge.name}</span>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {charge.type === 'percentage' ? `${charge.value}%` : t('lead-details.fixed')}
                    </Badge>
                  </div>
                  <span className="text-foreground font-medium">{formatCurrency(charge.calculated_amount, sale.currency)}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Discounts Section */}
      {discounts.length > 0 && (
        <Collapsible open={discountsOpen} onOpenChange={setDiscountsOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors mt-2">
              <div className="flex items-center gap-2 text-foreground/70">
                <Receipt className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t('lead-details.discounts-section')} ({discounts.length})
                </span>
              </div>
              {discountsOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {discounts.map((discount) => (
                <div key={discount.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{discount.name}</span>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {discount.type === 'percentage' ? `${discount.value}%` : t('lead-details.fixed')}
                    </Badge>
                  </div>
                  <span className="text-red-500 font-medium">-{formatCurrency(discount.calculated_amount, sale.currency)}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Documents Section */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-foreground/70">
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
              <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm group">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon(getDocPath(doc))}
                  <span className="text-foreground truncate">{getDocName(doc)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {doc.created_at && (
                    <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">
                      {formatDate(doc.created_at)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => handlePreviewDocument(doc)}
                    title={t('lead-details.preview-document')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
          <p className="text-muted-foreground text-sm">{t('lead-details.no-documents-uploaded')}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border flex-wrap">
        {canUpdateStatus && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass-card text-xs text-green-400 border-green-600/30 hover:bg-green-600/20 hover:text-green-300"
              onClick={() => setCloseDialogOpen(true)}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              {t('lead-details.close-deal')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass-card text-xs text-red-400 border-red-600/30 hover:bg-red-600/20 hover:text-red-300"
              onClick={() => setLostDialogOpen(true)}
            >
              <XCircle className="w-3 h-3 mr-1" />
              {t('lead-details.mark-as-lost')}
            </Button>
          </>
        )}
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

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-gray-900 border-white/10 p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white truncate pr-4">
                {previewDoc && getDocName(previewDoc)}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => previewDoc && handleDownloadDocument(previewDoc)}
                  size="sm" 
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('documents.download')}
                </Button>
                <Button 
                  onClick={() => setPreviewDoc(null)}
                  size="sm" 
                  variant="ghost"
                  className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('documents.close')}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            {previewDoc && isPreviewSupported(getDocPath(previewDoc)) ? (
              isImageFile(getDocPath(previewDoc)) ? (
                <div className="flex items-center justify-center">
                  <img 
                    src={getStorageUrl(getDocPath(previewDoc))} 
                    alt={getDocName(previewDoc)}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <iframe
                  src={getStorageUrl(getDocPath(previewDoc))}
                  className="w-full h-[70vh] rounded-lg bg-white"
                  title={getDocName(previewDoc)}
                />
              )
            ) : (
              <div className="text-center py-16">
                <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">{t('documents.preview-not-available')}</p>
                <p className="text-gray-500 text-sm mb-6">
                  {t('documents.download-to-view')}
                </p>
                <Button 
                  onClick={() => previewDoc && handleDownloadDocument(previewDoc)}
                  className="bg-primary hover:bg-primary/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('documents.download-file')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                  "{getDocName(docToDelete)}"
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

      {/* Close Deal Confirmation Dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lead-details.close-deal-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lead-details.close-deal-confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseDeal}
              disabled={isUpdatingStatus}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('lead-details.close-deal')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Lost Confirmation Dialog */}
      <AlertDialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lead-details.mark-lost-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lead-details.mark-lost-confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsLost}
              disabled={isUpdatingStatus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('lead-details.mark-as-lost')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PurchaseHistorySection;

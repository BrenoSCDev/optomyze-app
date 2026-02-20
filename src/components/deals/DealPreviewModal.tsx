/**
 * DEAL PREVIEW MODAL
 * 
 * Full-screen CRM-style deal preview with slide-up animation.
 * Fetches fresh data from /api/sales/{saleId} on open.
 * Supports document upload/view and edit stub.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Edit, Loader2, User, Mail, Phone, Calendar,
  DollarSign, Package, TrendingUp, TrendingDown,
  FileText, Upload, Download, Eye, Trash2, File,
  CircleDot, GitBranch, Clock, AlertCircle,
  PlusCircle, ArrowRightLeft, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';
import { getStorageUrl } from '@/lib/constants';
import SaleDocumentUploadModal from '@/components/leads/SaleDocumentUploadModal';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DealPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string | null;
}

const DealPreviewModal: React.FC<DealPreviewModalProps> = ({ isOpen, onClose, dealId }) => {
  const { t } = useLanguage();
  const [sale, setSale] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<any>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && dealId) {
      fetchDealData(dealId);
    }
    if (!isOpen) {
      setSale(null);
      setUsers([]);
      setError(null);
    }
  }, [isOpen, dealId]);

  const fetchDealData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/sales/${id}`);
      const data = response.data;
      setSale(data.sale);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching deal:', err);
      setError('Failed to load deal data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'lost': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'pending': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default: return 'bg-deal/15 text-deal border-deal/30';
    }
  };

  const isImageFile = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isPreviewSupported = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const handleDocumentUploaded = (doc: { id: number; name: string; url: string }) => {
    setSale((prev: any) => prev ? {
      ...prev,
      docs: [...(prev.docs || []), {
        id: doc.id,
        sale_id: prev.id,
        filename: doc.name,
        storage_path: doc.url,
        created_at: new Date().toISOString(),
      }],
    } : prev);
  };

  const handleDeleteDoc = async () => {
    if (!confirmDeleteDoc) return;
    setDeletingDocId(confirmDeleteDoc.id);
    try {
      await api.delete(`/api/sales/docs/${confirmDeleteDoc.id}`);
      setSale((prev: any) => prev ? {
        ...prev,
        docs: (prev.docs || []).filter((d: any) => d.id !== confirmDeleteDoc.id),
      } : prev);
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingDocId(null);
      setConfirmDeleteDoc(null);
    }
  };

  const handleDownloadDoc = (doc: any) => {
    const url = getStorageUrl(doc.storage_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const currency = sale?.currency || 'USD';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-[5vh] z-50 flex flex-col rounded-t-2xl border border-deal/20 bg-background overflow-hidden"
            >
              {/* Loading State */}
              {loading && (
                <div className="flex-1 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-60 w-full" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-60 w-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                    <p className="text-muted-foreground">{error}</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={onClose}>Close</Button>
                      <Button onClick={() => dealId && fetchDealData(dealId)}>Retry</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {sale && !loading && !error && (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between p-6 pb-4 border-b border-deal/10">
                    <div className="flex items-start gap-4 min-w-0">
                      <Avatar className="h-12 w-12 shrink-0 rounded-full">
                        <AvatarFallback className="bg-deal/20 text-deal text-lg font-semibold rounded-full">
                          {getInitials(sale.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h2 className="text-2xl font-bold text-foreground truncate">{sale.name}</h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`${getStatusColor(sale.status)} capitalize`}>
                            {sale.status}
                          </Badge>
                          {sale.stage && (
                            <Badge
                              className="text-xs border flex items-center gap-1"
                              style={{
                                backgroundColor: `${sale.stage.color}15`,
                                color: sale.stage.color,
                                borderColor: `${sale.stage.color}40`,
                              }}
                            >
                              <CircleDot className="w-3 h-3" />
                              {sale.stage.name}
                            </Badge>
                          )}
                          {sale.funnel && (
                            <Badge variant="secondary" className="text-xs bg-deal/10 text-deal/80 border-deal/20 flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {sale.funnel.name}
                            </Badge>
                          )}
                          {sale.user && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              {sale.user.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-deal/20 text-deal hover:bg-deal/10"
                        onClick={() => toast.info('Edit functionality coming soon')}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 scrollbar-dark">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - 2/3 */}
                      <div className="lg:col-span-2 space-y-5">
                        {/* Lead Information */}
                        {sale.lead && (
                          <div className="deal-glass-card p-5 hover:scale-100">
                            <h3 className="text-sm font-semibold text-deal uppercase tracking-wider mb-3 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Lead Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Name</p>
                                  <p className="text-sm font-medium text-foreground">
                                    {sale.lead.first_name} {sale.lead.last_name || ''}
                                  </p>
                                </div>
                                {sale.lead.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-deal/60" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Email</p>
                                      <p className="text-sm text-foreground">{sale.lead.email}</p>
                                    </div>
                                  </div>
                                )}
                                {sale.lead.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-deal/60" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Phone</p>
                                      <p className="text-sm text-foreground">{sale.lead.phone}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3">
                                {sale.lead.job_title && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Job Title</p>
                                    <p className="text-sm text-foreground">{sale.lead.job_title}</p>
                                  </div>
                                )}
                                {sale.lead.funnel && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Sales Funnel</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="secondary" className="text-xs bg-deal/10 text-deal/80 border-deal/20">
                                        {sale.lead.funnel.name}
                                      </Badge>
                                      {sale.lead.stage && (
                                        <Badge
                                          className="text-xs border"
                                          style={{
                                            backgroundColor: `${sale.lead.stage.color}15`,
                                            color: sale.lead.stage.color,
                                            borderColor: `${sale.lead.stage.color}40`,
                                          }}
                                        >
                                          {sale.lead.stage.name}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Products / Items */}
                        {sale.items && sale.items.length > 0 && (
                          <div className="deal-glass-card p-5 hover:scale-100">
                            <h3 className="text-sm font-semibold text-deal uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Products ({sale.items.length})
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-deal/10">
                                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Product</th>
                                    <th className="text-center py-2 text-xs text-muted-foreground font-medium">Qty</th>
                                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Unit Price</th>
                                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.items.map((item: any) => (
                                    <tr key={item.id} className="border-b border-deal/5">
                                      <td className="py-2.5 text-foreground">{item.product_name}</td>
                                      <td className="py-2.5 text-center text-muted-foreground">{item.quantity}</td>
                                      <td className="py-2.5 text-right text-muted-foreground">{formatCurrency(item.unit_price, currency)}</td>
                                      <td className="py-2.5 text-right font-medium text-foreground">{formatCurrency(item.total_price, currency)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Financial Summary */}
                        <div className="deal-glass-card p-5 hover:scale-100">
                          <h3 className="text-sm font-semibold text-deal uppercase tracking-wider mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Financial Summary
                          </h3>
                          <div className="space-y-2.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="text-foreground">{formatCurrency(sale.subtotal, currency)}</span>
                            </div>

                            {/* Charges */}
                            {sale.charges && sale.charges.length > 0 && (
                              <>
                                {sale.charges.map((charge: any) => (
                                  <div key={charge.id} className="flex justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                                      {charge.name} ({charge.type === 'percentage' ? `${charge.value}%` : 'Fixed'})
                                    </span>
                                    <span className="text-emerald-400">+{formatCurrency(charge.calculated_amount, currency)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm border-t border-deal/10 pt-1">
                                  <span className="text-muted-foreground font-medium">Total Charges</span>
                                  <span className="text-emerald-400 font-medium">+{formatCurrency(sale.charges_total, currency)}</span>
                                </div>
                              </>
                            )}

                            {/* Discounts */}
                            {sale.discounts && sale.discounts.length > 0 && (
                              <>
                                {sale.discounts.map((discount: any) => (
                                  <div key={discount.id} className="flex justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                      <TrendingDown className="h-3 w-3 text-rose-400" />
                                      {discount.name} ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})
                                    </span>
                                    <span className="text-rose-400">-{formatCurrency(discount.calculated_amount, currency)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm border-t border-deal/10 pt-1">
                                  <span className="text-muted-foreground font-medium">Total Discounts</span>
                                  <span className="text-rose-400 font-medium">-{formatCurrency(sale.discount_total, currency)}</span>
                                </div>
                              </>
                            )}

                            {/* Final Total */}
                            <div className="flex justify-between items-center pt-3 border-t border-deal/20">
                              <span className="text-foreground font-semibold text-base">Final Total</span>
                              <Badge className="bg-deal/15 text-deal border-deal/30 text-lg font-bold px-4 py-1">
                                {formatCurrency(sale.final_total, currency)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Deal Details */}
                        <div className="deal-glass-card p-5 hover:scale-100">
                          <h3 className="text-sm font-semibold text-deal uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Deal Details
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Pricing Model</p>
                              <p className="text-foreground capitalize mt-0.5">{sale.pricing_model}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Currency</p>
                              <p className="text-foreground mt-0.5">{currency}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Created</p>
                              <p className="text-foreground mt-0.5">{formatDate(sale.created_at)}</p>
                            </div>
                            {sale.closed_at && (
                              <div>
                                <p className="text-xs text-muted-foreground">Closed</p>
                                <p className="text-foreground mt-0.5">{formatDate(sale.closed_at)}</p>
                              </div>
                            )}
                            {sale.lost_at && (
                              <div>
                                <p className="text-xs text-muted-foreground">Lost</p>
                                <p className="text-foreground mt-0.5">{formatDate(sale.lost_at)}</p>
                              </div>
                            )}
                            {sale.commission_type && (
                              <div>
                                <p className="text-xs text-muted-foreground">Commission</p>
                                <p className="text-foreground mt-0.5">
                                  {sale.commission_type === 'percentage' ? `${sale.commission_value}%` : formatCurrency(sale.commission_value || 0, currency)}
                                </p>
                              </div>
                            )}
                          </div>
                          {sale.notes && (
                            <div className="mt-4 p-3 rounded-lg bg-deal/5 border border-deal/10">
                              <p className="text-xs text-muted-foreground mb-1">Notes</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{sale.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Activity Log */}
                        {sale.transactions && sale.transactions.length > 0 && (
                          <div className="deal-glass-card p-5 hover:scale-100">
                            <h3 className="text-sm font-semibold text-deal uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Activity Log ({sale.transactions.length})
                            </h3>
                            <div className="space-y-0">
                              {[...sale.transactions].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((tx: any, idx: number) => {
                                const isLast = idx === sale.transactions.length - 1;
                                const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
                                  creation: { icon: <PlusCircle className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
                                  stage_change: { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: 'text-sky-400' },
                                };
                                const { icon, color } = iconMap[tx.type] || { icon: <Activity className="h-3.5 w-3.5" />, color: 'text-deal' };

                                return (
                                  <div key={tx.id} className="flex gap-3">
                                    {/* Timeline line + dot */}
                                    <div className="flex flex-col items-center">
                                      <div className={`mt-1 p-1 rounded-full bg-background border border-deal/20 ${color}`}>
                                        {icon}
                                      </div>
                                      {!isLast && <div className="w-px flex-1 bg-deal/10 my-1" />}
                                    </div>
                                    {/* Content */}
                                    <div className={`pb-4 min-w-0 ${isLast ? '' : ''}`}>
                                      <p className="text-sm text-foreground">{tx.description}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {formatDateTime(tx.created_at)}
                                        {tx.source && <span className="ml-1.5 capitalize">· {tx.source}</span>}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - 1/3 */}
                      <div className="space-y-5">
                        {/* Quick Stats */}
                        <div className="deal-glass-card p-5 hover:scale-100">
                          <h3 className="text-sm font-semibold text-deal uppercase tracking-wider mb-3">
                            Quick Overview
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-deal/5 border border-deal/10">
                              <span className="text-xs text-muted-foreground">Total Value</span>
                              <span className="text-lg font-bold text-deal">{formatCurrency(sale.final_total, currency)}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-deal/5 border border-deal/10">
                              <span className="text-xs text-muted-foreground">Items</span>
                              <span className="text-sm font-semibold text-foreground">{sale.items?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-deal/5 border border-deal/10">
                              <span className="text-xs text-muted-foreground">Documents</span>
                              <span className="text-sm font-semibold text-foreground">{sale.docs?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-deal/5 border border-deal/10">
                              <span className="text-xs text-muted-foreground">Created</span>
                              <span className="text-sm text-foreground">{formatDate(sale.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="deal-glass-card p-5 hover:scale-100">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-deal uppercase tracking-wider flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Documents
                            </h3>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs border-deal/20 text-deal hover:bg-deal/10"
                              onClick={() => setUploadModalOpen(true)}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Upload
                            </Button>
                          </div>

                          {(!sale.docs || sale.docs.length === 0) ? (
                            <div className="text-center py-6">
                              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">No documents yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {sale.docs.map((doc: any) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-deal/5 border border-deal/10 hover:bg-deal/10 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 rounded bg-deal/10">
                                      <FileText className="w-3.5 h-3.5 text-deal" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-foreground truncate">{doc.filename}</p>
                                      <p className="text-[10px] text-muted-foreground">{formatDate(doc.created_at)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isPreviewSupported(doc.filename) && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setPreviewDoc(doc)}>
                                        <Eye className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleDownloadDoc(doc)}>
                                      <Download className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                                      onClick={() => setConfirmDeleteDoc(doc)}
                                      disabled={deletingDocId === doc.id}
                                    >
                                      {deletingDocId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assigned User */}
                        {sale.user && (
                          <div className="deal-glass-card p-5 hover:scale-100">
                            <h3 className="text-sm font-semibold text-deal uppercase tracking-wider mb-3 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Assigned To
                            </h3>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 rounded-full">
                                <AvatarFallback className="bg-deal/20 text-deal text-sm font-semibold rounded-full">
                                  {getInitials(sale.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground">{sale.user.name}</p>
                                <p className="text-xs text-muted-foreground">{sale.user.email}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      {sale && (
        <SaleDocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          saleId={sale.id}
          onDocumentUploaded={handleDocumentUploaded}
        />
      )}

      {/* Document Preview */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-background border-deal/20 p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="p-4 border-b border-deal/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-foreground truncate pr-4">{previewDoc?.filename}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button onClick={() => previewDoc && handleDownloadDoc(previewDoc)} size="sm" variant="outline" className="border-deal/20">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button onClick={() => setPreviewDoc(null)} size="sm" variant="ghost">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            {previewDoc && isPreviewSupported(previewDoc.filename) ? (
              isImageFile(previewDoc.filename) ? (
                <div className="flex items-center justify-center">
                  <img src={getStorageUrl(previewDoc.storage_path)} alt={previewDoc.filename} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                </div>
              ) : (
                <iframe src={getStorageUrl(previewDoc.storage_path)} className="w-full h-[70vh] rounded-lg bg-white" title={previewDoc.filename} />
              )
            ) : (
              <div className="text-center py-16">
                <File className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                <Button onClick={() => previewDoc && handleDownloadDoc(previewDoc)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteDoc} onOpenChange={() => setConfirmDeleteDoc(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{confirmDeleteDoc?.filename}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoc} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DealPreviewModal;

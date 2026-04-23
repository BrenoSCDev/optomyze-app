/**
 * LEAD PREVIEW MODAL
 * 
 * Full-screen CRM-style lead preview with slide-up animation.
 * Fetches fresh data from /api/leads/{leadId} on open.
 * Reuses existing LeadDetail sub-components.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Edit, Loader2, User, Mail, Phone, Calendar,
  AlertCircle, ArrowRightLeft, UserCheck, Trash2,
  MoreVertical, Building2, ShoppingBag, Activity,
  ArrowRight, RefreshCw, FileText, ArrowLeft, ChevronRight, PlusCircle, PackageCheck, ListTodo, XCircle,
} from 'lucide-react';
import { VscSourceControl } from 'react-icons/vsc';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType } from '@/types/user';
import api from '@/services/api';
import { API_STORAGE_URL } from '@/lib/constants';
import { leadService } from '@/services/leadApi';

import LeadDetailTabs from './LeadDetailTabs';
import FunnelProgress from './FunnelProgress';
import ProductsSection, { LeadProduct } from './ProductsSection';
import BudgetSection from './BudgetSection';
import PurchaseHistorySection, { Sale } from './PurchaseHistorySection';
import TaskCreationModal from './TaskCreationModal';
import TaskDeleteDialog from './TaskDeleteDialog';
import DocumentUploadModal from './DocumentUploadModal';
import AssignUserModal, { CompanyUser } from './AssignUserModal';

import StartPurchaseModal from './StartPurchaseModal';
import LeadEditModal from './LeadEditModal';
import { Task } from '@/services/taskApi';
import { LeadDocument } from '@/services/documentApi';
import { Observation } from '@/services/observationApi';

interface LeadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
  onLeadDeleted?: () => void;
}

const LeadPreviewModal: React.FC<LeadPreviewModalProps> = ({ isOpen, onClose, leadId, onLeadDeleted }) => {
  const { t } = useLanguage();
  const { user } = useAuth() as { user: UserType | null; token: string };

  const [leadData, setLeadData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
  
  const [startPurchaseModalOpen, setStartPurchaseModalOpen] = useState(false);
  const [selectedProductsForPurchase, setSelectedProductsForPurchase] = useState<LeadProduct[]>([]);
  const [isDeletingLead, setIsDeletingLead] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadData(leadId);
    }
    if (!isOpen) {
      setLeadData(null);
      setError(null);
    }
  }, [isOpen, leadId]);

  const fetchLeadData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/leads/${id}`);
      const data = response.data;
      const lead = data.lead || data;
      setLeadData({
        lead,
        transactions: data.transactions || lead.transactions || [],
        tasks: data.tasks || lead.tasks || [],
        docs: lead.docs || [],
        users: data.users || [],
        products: data.products || [],
        companies: data.companies || [],
        dealFunnels: data.dealFunnels || [],
      });
    } catch (err: any) {
      console.error('Error fetching lead:', err);
      setError('Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-600', medium: 'bg-yellow-600', high: 'bg-orange-600', urgent: 'bg-red-600',
    };
    return colors[priority] || 'bg-muted';
  };

  // Handlers mirroring LeadDetail page
  const handleTaskCreated = (newTask: Task, transaction?: any) => {
    setLeadData((prev: any) => prev ? {
      ...prev,
      tasks: [newTask, ...prev.tasks],
      transactions: transaction ? [transaction, ...prev.transactions] : prev.transactions,
    } : prev);
  };
  const handleTaskUpdated = (updatedTask: Task) => {
    setLeadData((prev: any) => prev ? { ...prev, tasks: prev.tasks.map((t: Task) => t.id === updatedTask.id ? updatedTask : t) } : prev);
    setEditingTask(null);
  };
  const handleTaskDeleted = (taskId: number) => {
    setLeadData((prev: any) => prev ? { ...prev, tasks: prev.tasks.filter((t: Task) => t.id !== taskId) } : prev);
    setDeletingTask(null);
  };
  const handleDocumentUploaded = (newDoc: LeadDocument) => {
    setLeadData((prev: any) => prev ? { ...prev, docs: [newDoc, ...prev.docs] } : prev);
  };
  const handleDocumentDeleted = (docId: number) => {
    setLeadData((prev: any) => prev ? { ...prev, docs: prev.docs.filter((d: LeadDocument) => d.id !== docId) } : prev);
  };
  const handleSaleDeleted = (saleId: number) => {
    setLeadData((prev: any) => prev ? {
      ...prev, lead: { ...prev.lead, sales: prev.lead.sales?.filter((s: Sale) => s.id !== saleId) || [] },
    } : prev);
  };
  const handleObservationCreated = (obs: Observation) => {
    setLeadData((prev: any) => prev ? {
      ...prev, lead: { ...prev.lead, observations: [obs, ...(prev.lead.observations || [])] },
    } : prev);
  };
  const handleObservationUpdated = (obs: Observation) => {
    setLeadData((prev: any) => prev ? {
      ...prev, lead: { ...prev.lead, observations: prev.lead.observations?.map((o: Observation) => o.id === obs.id ? obs : o) || [] },
    } : prev);
  };
  const handleObservationDeleted = (obsId: number) => {
    setLeadData((prev: any) => prev ? {
      ...prev, lead: { ...prev.lead, observations: prev.lead.observations?.filter((o: Observation) => o.id !== obsId) || [] },
    } : prev);
  };
  const handleUserAssigned = (userId: number, userName: string, userEmail: string) => {
    setLeadData((prev: any) => prev ? {
      ...prev, lead: { ...prev.lead, assigned_user: { id: userId, name: userName, email: userEmail } },
    } : prev);
  };
  const handleStartPurchase = (selectedProducts: LeadProduct[]) => {
    setSelectedProductsForPurchase(selectedProducts);
    setStartPurchaseModalOpen(true);
  };
  const handleDeleteLead = async () => {
    if (!leadId) return;
    try {
      setIsDeletingLead(true);
      await leadService.deleteLead(leadId);
      toast.success(t('lead-details.delete-lead-success'));
      setDeleteDialogOpen(false);
      onClose();
      onLeadDeleted?.();
    } catch {
      toast.error(t('lead-details.delete-lead-error'));
    } finally {
      setIsDeletingLead(false);
    }
  };

  const erpBudgetIds = useMemo<number[]>(() => {
    const raw = leadData?.lead?.erp_budgets_ids;
    if (!raw) return [];
    const normalize = (arr: any): number[] =>
      (Array.isArray(arr) ? arr : []).map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id));
    if (Array.isArray(raw)) return normalize(raw);
    if (typeof raw === 'string') { try { return normalize(JSON.parse(raw)); } catch { return []; } }
    return [];
  }, [leadData?.lead?.erp_budgets_ids]);

  const lead = leadData?.lead;

  const modalTree = (
    <AnimatePresence>
      {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-[5vh] z-[60] flex flex-col rounded-t-2xl border border-primary/20 bg-background overflow-hidden"
            >
              {/* Loading */}
              {loading && (
                <div className="flex-1 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
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

              {/* Error */}
              {error && !loading && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                    <p className="text-muted-foreground">{error}</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={onClose}>Close</Button>
                      <Button onClick={() => leadId && fetchLeadData(leadId)}>Retry</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {lead && !loading && !error && (
                <>
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 sm:p-6 pb-4 border-b border-primary/10">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary text-base sm:text-lg font-bold">
                          {getInitials(lead.first_name, lead.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-2xl font-bold text-foreground break-words">
                          {lead.first_name} {lead.last_name}
                        </h2>

                        {/* Company & Job Title */}
                        {(lead.lead_company || lead.job_title) && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {lead.lead_company && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                {lead.lead_company.logo_path ? (
                                  <img src={`${API_STORAGE_URL}/${lead.lead_company.logo_path}`} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                                ) : (
                                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                                )}
                                <span className="text-sm text-foreground font-medium truncate">{lead.lead_company.legal_name}</span>
                              </div>
                            )}
                            {lead.lead_company && lead.job_title && <span className="text-muted-foreground hidden sm:inline">•</span>}
                            {lead.job_title && <span className="text-sm text-muted-foreground truncate">{lead.job_title}</span>}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge className={`text-xs font-medium border ${lead.is_active ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30'}`}>
                            {lead.is_active ? t('lead-details.active') : t('lead-details.inactive')}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(lead.priority)}`} />
                            <span className="text-xs text-muted-foreground capitalize">{lead.priority}</span>
                          </div>
                          {lead.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-0 max-w-full">
                              <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{lead.email}</span>
                            </span>
                          )}
                          {lead.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" /> {lead.ddi} {lead.phone}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">#{lead.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-end sm:self-start flex-wrap justify-end">
                      <Button
                        variant="outline" size="sm"
                        className="border-primary/20 text-primary hover:bg-primary/10 hidden sm:inline-flex"
                        onClick={() => setEditModalOpen(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t('lead-details.edit-lead')}
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        className="border-primary/20 text-primary hover:bg-primary/10 sm:hidden h-8 w-8"
                        onClick={() => setEditModalOpen(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border-border z-[80]">
                          <DropdownMenuItem onClick={() => setAssignUserModalOpen(true)} className="cursor-pointer">
                            <UserCheck className="w-4 h-4 mr-2" />
                            {t('lead-details.assign-user')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('lead-details.delete-lead')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 scrollbar-dark">
                    {/* Funnel Progress */}
                    {lead.stage && <FunnelProgress stage={lead.stage} />}

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                      {/* Left Column */}
                      <div className="lg:col-span-2 space-y-6 min-w-0">
                        <LeadDetailTabs
                          lead={lead}
                          tasks={leadData.tasks || []}
                          documents={leadData.docs || []}
                          observations={lead.observations || []}
                          onCreateTask={() => setTaskModalOpen(true)}
                          onEditTask={(task: Task) => { setEditingTask(task); setTaskModalOpen(true); }}
                          onDeleteTask={(task: Task) => setDeletingTask(task)}
                          onUploadDocument={() => setDocumentModalOpen(true)}
                          onDocumentDeleted={handleDocumentDeleted}
                          onObservationCreated={handleObservationCreated}
                          onObservationUpdated={handleObservationUpdated}
                          onObservationDeleted={handleObservationDeleted}
                        />

                        {user?.company?.product_module === 'ERP' ? (
                          <BudgetSection
                            leadId={lead.id}
                            customerName={`${lead.first_name} ${lead.last_name}`}
                            leadEmail={lead.email}
                            leadPhone={lead.phone}
                            erpBudgetIds={erpBudgetIds}
                          />
                        ) : (
                          <ProductsSection
                            leadId={lead.id}
                            products={lead.products || []}
                            onProductsChanged={() => leadId && fetchLeadData(leadId)}
                            onStartPurchase={handleStartPurchase}
                          />
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6 min-w-0">
                        <motion.div
                          className="glass-card p-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Tabs defaultValue="activity" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-muted/50 mb-4">
                              <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                                <Activity className="w-3.5 h-3.5 mr-1.5" />
                                {t('lead-details.activity-timeline')}
                              </TabsTrigger>
                              <TabsTrigger value="purchases" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                                {t('lead-details.purchase-history')}
                                {(lead.sales?.length || 0) > 0 && (
                                  <Badge className="ml-1 bg-primary/20 text-primary border-primary/30 text-xs">
                                    {lead.sales?.length}
                                  </Badge>
                                )}
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="activity" className="mt-0">
                              <ActivityTimeline transactions={leadData.transactions} />
                            </TabsContent>

                            <TabsContent value="purchases" className="mt-0">
                              <PurchaseHistorySection sales={lead.sales || []} onSaleDeleted={handleSaleDeleted} />
                            </TabsContent>
                          </Tabs>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
    </AnimatePresence>
  );

  return (
    <>
      {typeof document !== 'undefined' && createPortal(modalTree, document.body)}

      {/* Sub-modals */}
      {lead && (
        <>
          <LeadEditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            lead={lead}
            companies={leadData?.companies || []}
            onUpdate={() => leadId && fetchLeadData(leadId)}
          />
          <TaskCreationModal
            isOpen={taskModalOpen}
            onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
            leadId={lead.id}
            onTaskCreated={handleTaskCreated}
            editTask={editingTask}
            onTaskUpdated={handleTaskUpdated}
          />
          <TaskDeleteDialog
            isOpen={!!deletingTask}
            onClose={() => setDeletingTask(null)}
            task={deletingTask}
            onTaskDeleted={handleTaskDeleted}
          />
          <DocumentUploadModal
            isOpen={documentModalOpen}
            onClose={() => setDocumentModalOpen(false)}
            leadId={lead.id}
            onDocumentUploaded={handleDocumentUploaded}
          />
          <AssignUserModal
            isOpen={assignUserModalOpen}
            onClose={() => setAssignUserModalOpen(false)}
            leadId={lead.id}
            users={leadData?.users || []}
            currentAssignedUserId={lead.assigned_user?.id}
            onUserAssigned={handleUserAssigned}
          />
          <StartPurchaseModal
            isOpen={startPurchaseModalOpen}
            onClose={() => setStartPurchaseModalOpen(false)}
            leadId={lead.id}
            selectedProducts={selectedProductsForPurchase}
            dealFunnels={leadData?.dealFunnels || []}
            onSaleCreated={() => leadId && fetchLeadData(leadId)}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border z-[80]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lead-details.delete-lead-title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('lead-details.delete-lead-confirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLead}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeletingLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingLead ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.deleting')}</> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Inline Activity Timeline (matches LeadDetail page)
const ActivityTimeline = ({ transactions }: { transactions: any[] }) => {
  const { t } = useLanguage();
  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      stage_change: <ArrowRight className="w-4 h-4" />,
      status_change: <RefreshCw className="w-4 h-4" />,
      note_added: <FileText className="w-4 h-4" />,
      contact_attempt: <Phone className="w-4 h-4" />,
      email_sent: <Mail className="w-4 h-4" />,
      creation: <PlusCircle className="w-4 h-4" />,
      product_update: <PackageCheck className="w-4 h-4" />,
      task: <ListTodo className="w-4 h-4" />,
      whatsapp_chat: <FaWhatsapp className="w-4 h-4" />,
      lost: <XCircle className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };
  const getColor = (type: string) => {
    const colors: Record<string, string> = {
      stage_change: 'bg-blue-600', status_change: 'bg-yellow-600',
      note_added: 'bg-green-600', contact_attempt: 'bg-purple-600', email_sent: 'bg-orange-600',
      creation: 'bg-emerald-600', product_update: 'bg-cyan-600', task: 'bg-indigo-600',
      whatsapp_chat: 'bg-green-600', lost: 'bg-red-600',
    };
    return colors[type] || 'bg-muted';
  };

  if (!transactions.length) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">{t('lead-details.no-activity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx, i) => (
        <div key={tx.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full ${getColor(tx.type)} flex items-center justify-center text-white`}>
              {getIcon(tx.type)}
            </div>
            {i < transactions.length - 1 && <div className="w-px h-8 bg-border mt-2" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-foreground font-medium text-sm capitalize">{tx.type.replace('_', ' ')}</h4>
                <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-muted-foreground text-sm">{tx.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadPreviewModal;

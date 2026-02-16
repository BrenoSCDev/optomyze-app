/**
 * LEAD DETAIL PAGE
 * 
 * Comprehensive lead detail page with transaction history and editing capabilities
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User as UserType } from '@/types/user';
import api from '@/services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronRight, 
  Edit, 
  MoreVertical, 
  Globe, 
  Tag, 
  MessageSquare, 
  DollarSign, 
  Hash, 
  RefreshCw, 
  Brain, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Activity, 
  FileText, 
  Phone, 
  Mail, 
  X,
  Loader2,
  AlertCircle,
  User,
  Copy,
  UserCheck,
  ArrowRightLeft,
  ShoppingBag,
   Building2,
   PlusCircle,
   PackageCheck,
   ListTodo
} from 'lucide-react';
import { API_STORAGE_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { leadService } from '@/services/leadApi';
import { Trash2 } from 'lucide-react';
import { VscSourceControl } from "react-icons/vsc";

import TaskCreationModal from '@/components/leads/TaskCreationModal';
import TaskDeleteDialog from '@/components/leads/TaskDeleteDialog';
import DocumentUploadModal from '@/components/leads/DocumentUploadModal';
import AssignUserModal, { CompanyUser } from '@/components/leads/AssignUserModal';
import { LeadProduct } from '@/components/leads/ProductsSection';
import ProductsSection from '@/components/leads/ProductsSection';
import BudgetSection from '@/components/leads/BudgetSection';
import AddProductsModal from '@/components/leads/AddProductsModal';
import PurchaseHistorySection, { Sale } from '@/components/leads/PurchaseHistorySection';
import StartPurchaseModal from '@/components/leads/StartPurchaseModal';
import LeadDetailTabs from '@/components/leads/LeadDetailTabs';
import FunnelProgress from '@/components/leads/FunnelProgress';
import { LeadWhatsAppChat } from '@/components/leads/LeadChatSection';
import { Task } from '@/services/taskApi';
import { LeadDocument } from '@/services/documentApi';
import { Observation } from '@/services/observationApi';

interface Transaction {
  id: number;
  lead_id: number;
  type: string;
  action: string;
  description: string;
  from_stage_id: number;
  to_stage_id: number;
  source: string;
  is_automated: boolean;
  created_at: string;
}


interface AssignedUser {
  id: number;
  name: string;
  email: string;
}

interface FunnelStage {
  id: number;
  funnel_id: number;
  name: string;
  order: number;
}

interface Funnel {
  id: number;
  name: string;
  stages: FunnelStage[];
}

interface Stage {
  id: number;
  name: string;
  funnel_id: number;
  order: number;
  funnel?: Funnel;
}

interface LeadCompanyInfo {
  id: number;
  legal_name: string;
  industry?: string | null;
  logo_path?: string | null;
}

interface CompanyOption {
  id: number;
  legal_name: string;
}

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ddi: string;
  source_platform: string;
  source_type: string;
  is_active: boolean;
  priority: string;
  value_estimated: number;
  currency: string;
  ai_score: number;
  language: string;
  external_id: string;
  sync_enabled: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  // Company association
  job_title?: string | null;
  lead_company?: LeadCompanyInfo | null;
  // Address fields
  address_line_1?: string | null;
  address_line_2?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  postal_code?: string | null;
  country?: string | null;
  // Relations
  assigned_user?: AssignedUser | null;
  transactions?: Transaction[];
  tasks?: Task[];
  docs?: LeadDocument[];
  products?: LeadProduct[];
  sales?: Sale[];
  observations?: Observation[];
  whats_app_evo_chat?: LeadWhatsAppChat | null;
  tags?: { id: number; name: string; color?: string }[];
  stage?: Stage | null;
}

interface CompanyProduct {
  id: number;
  name: string;
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

interface LeadData {
  lead: Lead;
  transactions: Transaction[];
  tasks: Task[];
  docs: LeadDocument[];
  users: CompanyUser[];
  products: CompanyProduct[];
  companies: CompanyOption[];
  dealFunnels: DealFunnel[];
}

const LeadDetailPage = () => {
  const { leadId, funnelId } = useParams<{ leadId: string; funnelId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth() as { token: string; user: UserType | null };
  const { t } = useLanguage();
  
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
  const [addProductsModalOpen, setAddProductsModalOpen] = useState(false);
  const [startPurchaseModalOpen, setStartPurchaseModalOpen] = useState(false);
  const [selectedProductsForPurchase, setSelectedProductsForPurchase] = useState<LeadProduct[]>([]);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  const fetchLeadData = async () => {
    if (!leadId || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/leads/${leadId}`);
      const data = response.data;
      
      // Handle both structures: transactions/tasks inside lead object or at root level
      const lead = data.lead || data;
      const transactions = data.transactions || lead.transactions || [];
      const tasks = data.tasks || lead.tasks || [];
      const docs = lead.docs || [];
      const users = data.users || [];
      const companyProducts = data.products || [];
      
      const companies = data.companies || [];
      const dealFunnels = data.dealFunnels || [];
      
      setLeadData({
        lead,
        transactions,
        tasks,
        docs,
        users,
        products: companyProducts,
        companies,
        dealFunnels
      });
      
    } catch (err: any) {
      console.error('Error fetching lead data:', err);
      setError(err.response?.data?.message || t('lead-details.load-error'));
      toast.error(t('lead-details.load-error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId, token]);

  const handleBack = () => {
    if (funnelId) {
      navigate(`/leads/${funnelId}`);
    } else {
      navigate('/');
    }
  };

  const handleDeleteLead = async () => {
    if (!leadId) return;
    
    try {
      setIsDeletingLead(true);
      await leadService.deleteLead(leadId);
      toast.success(t('lead-details.delete-lead-success'));
      handleBack();
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      toast.error(t('lead-details.delete-lead-error'));
    } finally {
      setIsDeletingLead(false);
    }
  };

  const handleTaskCreated = (newTask: Task, transaction?: any) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: [newTask, ...prev.tasks],
        transactions: transaction ? [transaction, ...prev.transactions] : prev.transactions,
      };
    });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      };
    });
    setEditingTask(null);
  };

  const handleTaskDeleted = (taskId: number) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      };
    });
    setDeletingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDocumentUploaded = (newDocument: LeadDocument) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        docs: [newDocument, ...prev.docs]
      };
    });
  };

  const handleDocumentDeleted = (documentId: number) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        docs: prev.docs.filter(d => d.id !== documentId)
      };
    });
  };

  const handleSaleDeleted = (saleId: number) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lead: {
          ...prev.lead,
          sales: prev.lead.sales?.filter(s => s.id !== saleId) || []
        }
      };
    });
  };

  const handleObservationCreated = (observation: Observation) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lead: {
          ...prev.lead,
          observations: [observation, ...(prev.lead.observations || [])]
        }
      };
    });
  };

  const handleObservationUpdated = (updatedObservation: Observation) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lead: {
          ...prev.lead,
          observations: prev.lead.observations?.map(o => 
            o.id === updatedObservation.id ? updatedObservation : o
          ) || []
        }
      };
    });
  };

  const handleObservationDeleted = (observationId: number) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lead: {
          ...prev.lead,
          observations: prev.lead.observations?.filter(o => o.id !== observationId) || []
        }
      };
    });
  };

  const handleUserAssigned = (userId: number, userName: string, userEmail: string) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lead: {
          ...prev.lead,
          assigned_user: { id: userId, name: userName, email: userEmail }
        }
      };
    });
  };

  const handleStartPurchase = (selectedProducts: LeadProduct[]) => {
    setSelectedProductsForPurchase(selectedProducts);
    setStartPurchaseModalOpen(true);
  };

  // Parse erp_budgets_ids (could be string like "[5]" or array)
  const erpBudgetIds = React.useMemo<number[]>(() => {
    const raw = (leadData?.lead as any)?.erp_budgets_ids;

    if (!raw) return [];

    const normalizeArray = (arr: any): number[] =>
      (Array.isArray(arr) ? arr : [])
        .map((id: any) => (typeof id === 'string' ? Number(id) : id))
        .filter((id: any): id is number => typeof id === 'number' && Number.isFinite(id));

    if (Array.isArray(raw)) return normalizeArray(raw);

    if (typeof raw === 'string') {
      try {
        return normalizeArray(JSON.parse(raw));
      } catch {
        return [];
      }
    }

    return [];
  }, [(leadData?.lead as any)?.erp_budgets_ids]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t('lead-details.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !leadData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{t('lead-details.not-found')}</h3>
          <p className="text-gray-400 mb-6">{error || t('lead-details.not-found-description')}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('lead-details.go-back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <LeadDetailHeader 
          lead={leadData.lead} 
          onEdit={() => setEditModalOpen(true)}
          onBack={handleBack}
          onAssignUser={() => setAssignUserModalOpen(true)}
          onDeleteLead={handleDeleteLead}
          isDeleting={isDeletingLead}
        />

        {/* Funnel Progress */}
        {leadData.lead.stage && (
          <FunnelProgress stage={leadData.lead.stage} />
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Tabbed Lead Information */}
          <div className="lg:col-span-2 space-y-6">
            <LeadDetailTabs
              lead={leadData.lead}
              tasks={leadData.tasks || []}
              documents={leadData.docs || []}
              observations={leadData.lead.observations || []}
              onCreateTask={() => setTaskModalOpen(true)}
              onEditTask={handleEditTask}
              onDeleteTask={(task) => setDeletingTask(task)}
              onUploadDocument={() => setDocumentModalOpen(true)}
              onDocumentDeleted={handleDocumentDeleted}
              onObservationCreated={handleObservationCreated}
              onObservationUpdated={handleObservationUpdated}
              onObservationDeleted={handleObservationDeleted}
            />
            
            {/* Products Section or Budget Section based on company module */}
            {user?.company?.product_module === 'ERP' ? (
              <BudgetSection 
                leadId={leadData.lead.id} 
                customerName={`${leadData.lead.first_name} ${leadData.lead.last_name}`}
                leadEmail={leadData.lead.email}
                leadPhone={leadData.lead.phone}
                erpBudgetIds={erpBudgetIds}
              />
            ) : (
              <ProductsSection 
                products={leadData.lead.products || []}
                onAddProducts={() => setAddProductsModalOpen(true)}
                onStartPurchase={handleStartPurchase}
              />
            )}
          </div>
          
          {/* Right Column - Activity & Purchase History */}
          <div className="space-y-6">
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 mb-4">
                  <TabsTrigger 
                    value="activity" 
                    className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    {t('lead-details.activity-timeline')}
                    {leadData.transactions.length > 0 && (
                      <Badge className="ml-1 bg-primary/20 text-primary border-primary/30 text-xs">
                        {leadData.transactions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="purchases" 
                    className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                    {t('lead-details.purchase-history')}
                    {(leadData.lead.sales?.length || 0) > 0 && (
                      <Badge className="ml-1 bg-primary/20 text-primary border-primary/30 text-xs">
                        {leadData.lead.sales?.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="activity" className="mt-0">
                  <ScrollArea className="max-h-[500px]" scrollbarVariant="dark">
                    <ActivityTimelineContent transactions={leadData.transactions} />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="purchases" className="mt-0">
                  <ScrollArea className="max-h-[500px]" scrollbarVariant="dark">
                    <PurchaseHistorySection 
                      sales={leadData.lead.sales || []} 
                      onSaleDeleted={handleSaleDeleted}
                    />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
        
        {/* Edit Modal */}
        <LeadEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          lead={leadData.lead}
          companies={leadData.companies}
          onUpdate={fetchLeadData}
        />


        {/* Task Creation/Edit Modal */}
        <TaskCreationModal
          isOpen={taskModalOpen}
          onClose={handleCloseTaskModal}
          leadId={leadData.lead.id}
          onTaskCreated={handleTaskCreated}
          editTask={editingTask}
          onTaskUpdated={handleTaskUpdated}
        />

        {/* Task Delete Dialog */}
        <TaskDeleteDialog
          isOpen={!!deletingTask}
          onClose={() => setDeletingTask(null)}
          task={deletingTask}
          onTaskDeleted={handleTaskDeleted}
        />

        {/* Document Upload Modal */}
        <DocumentUploadModal
          isOpen={documentModalOpen}
          onClose={() => setDocumentModalOpen(false)}
          leadId={leadData.lead.id}
          onDocumentUploaded={handleDocumentUploaded}
        />

        {/* Assign User Modal */}
        <AssignUserModal
          isOpen={assignUserModalOpen}
          onClose={() => setAssignUserModalOpen(false)}
          leadId={leadData.lead.id}
          users={leadData.users || []}
          currentAssignedUserId={leadData.lead.assigned_user?.id}
          onUserAssigned={handleUserAssigned}
        />

        {/* Add Products Modal */}
        <AddProductsModal
          isOpen={addProductsModalOpen}
          onClose={() => setAddProductsModalOpen(false)}
          leadId={leadData.lead.id}
          products={leadData.products || []}
          leadProducts={leadData.lead.products?.map(p => ({ id: p.id, quantity: p.quantity })) || []}
          onProductsAdded={fetchLeadData}
        />

        {/* Start Purchase Modal */}
        <StartPurchaseModal
          isOpen={startPurchaseModalOpen}
          onClose={() => setStartPurchaseModalOpen(false)}
          leadId={leadData.lead.id}
          selectedProducts={selectedProductsForPurchase}
          dealFunnels={leadData.dealFunnels}
          onSaleCreated={fetchLeadData}
        />
      </div>
    </div>
  );
};

// Lead Detail Header Component
const LeadDetailHeader = ({ 
  lead, 
  onEdit, 
  onBack, 
  onAssignUser,
  onDeleteLead,
  isDeleting
}: { 
  lead: Lead; 
  onEdit: () => void; 
  onBack: () => void; 
  onAssignUser: () => void;
  onDeleteLead: () => void;
  isDeleting: boolean;
}) => {
  const { t } = useLanguage();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-600',
      'medium': 'bg-yellow-600', 
      'high': 'bg-orange-600',
      'urgent': 'bg-red-600'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-600';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <motion.div 
      className="mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
        <button 
          onClick={onBack} 
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('lead-details.back')}
        </button>
        <ChevronRight className="w-4 h-4" />
        <span>{t('lead-details.breadcrumb')}</span>
      </div>
      
      {/* Main Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                {getInitials(lead.first_name, lead.last_name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Lead Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {lead.first_name} {lead.last_name}
              </h1>
              
              {/* Company & Job Title */}
              {(lead.lead_company || lead.job_title) && (
                <div className="flex items-center gap-2 mb-2">
                  {lead.lead_company && (
                    <div className="flex items-center gap-2">
                      {lead.lead_company.logo_path ? (
                        <img 
                          src={`${API_STORAGE_URL}/${lead.lead_company.logo_path}`}
                          alt={lead.lead_company.legal_name}
                          className="w-5 h-5 rounded object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                          <Building2 className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <span className="text-white font-medium">{lead.lead_company.legal_name}</span>
                    </div>
                  )}
                  {lead.lead_company && lead.job_title && (
                    <span className="text-gray-500">•</span>
                  )}
                  {lead.job_title && (
                    <span className="text-gray-400">{lead.job_title}</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {lead.email && (
                  <>
                    <span className="text-gray-400">{lead.email}</span>
                    <span className="text-gray-400">•</span>
                  </>
                )}
                <span className="text-gray-400">{lead.ddi} {lead.phone}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`text-xs font-medium border ${lead.is_active ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30'}`}>
                  {lead.is_active ? t('lead-details.active') : t('lead-details.inactive')}
                </Badge>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(lead.priority)}`}></div>
                  <span className="text-gray-400 text-sm capitalize">{lead.priority} {t('lead-details.priority')}</span>
                </div>
                <span className="text-gray-400 text-sm">#{lead.id}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={onEdit} className="bg-primary hover:bg-primary/80">
              <Edit className="w-4 h-4 mr-2" />
              {t('lead-details.edit-lead')}
            </Button>
            
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="glass-card">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-white/10 z-50">
                <DropdownMenuItem 
                  onClick={() => {}}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  {t('lead-details.move-stage')}
                </DropdownMenuItem>
              <DropdownMenuItem 
                  onClick={onAssignUser}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {t('lead-details.assign-user')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-400 hover:bg-red-500/20 focus:bg-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('lead-details.delete-lead')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Delete Lead Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lead-details.delete-lead-title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('lead-details.delete-lead-confirmation')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteLead();
                setDeleteDialogOpen(false);
              }}
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
    </motion.div>
  );
};

// Activity Timeline Content Component (used inside tabs)
const ActivityTimelineContent = ({ transactions }: { transactions: Transaction[] }) => {
  const { t } = useLanguage();
  
  const getTransactionIcon = (type: string) => {
    const icons = {
      'stage_change': <ArrowRight className="w-4 h-4" />,
      'status_change': <RefreshCw className="w-4 h-4" />,
      'note_added': <FileText className="w-4 h-4" />,
      'contact_attempt': <Phone className="w-4 h-4" />,
      'email_sent': <Mail className="w-4 h-4" />,
      'creation': <PlusCircle className="w-4 h-4" />,
      'product_update': <PackageCheck className="w-4 h-4" />,
      'task': <ListTodo className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />;
  };

  const getTransactionColor = (type: string) => {
    const colors = {
      'stage_change': 'bg-blue-600',
      'status_change': 'bg-yellow-600', 
      'note_added': 'bg-green-600',
      'contact_attempt': 'bg-purple-600',
      'email_sent': 'bg-orange-600',
      'creation': 'bg-emerald-600',
      'product_update': 'bg-cyan-600',
      'task': 'bg-indigo-600'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ` ${t('lead-details.at')} ` + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="space-y-4">
      {transactions.length > 0 ? (
        transactions.map((transaction, index) => (
          <div key={transaction.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full ${getTransactionColor(transaction.type)} flex items-center justify-center text-white`}>
                {getTransactionIcon(transaction.type)}
              </div>
              {index < transactions.length - 1 && (
                <div className="w-px h-8 bg-white/10 mt-2"></div>
              )}
            </div>
            
            <div className="flex-1 pb-8">
              <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium capitalize">
                    {transaction.type.replace('_', ' ')}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {formatDate(transaction.created_at)}
                  </span>
                </div>
                
                <p className="text-gray-400 text-sm mb-2">
                  {transaction.description}
                </p>
                
                {transaction.type === 'stage_change' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded">
                      {t('lead-details.stage')} {transaction.from_stage_id}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                      {t('lead-details.stage')} {transaction.to_stage_id}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{t('lead-details.source')}: {transaction.source}</span>
                  {transaction.is_automated && (
                    <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 px-2 py-1">
                      {t('lead-details.automated')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">{t('lead-details.no-activity')}</p>
        </div>
      )}
    </div>
  );
};

// Lead Edit Modal - imported from component file
import LeadEditModal from '@/components/leads/LeadEditModal';

export default LeadDetailPage;
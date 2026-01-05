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
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VscSourceControl } from "react-icons/vsc";
import ReportsModal from '@/components/leads/ReportsModal';
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

interface Agent {
  id: number;
  company_id: number;
  n8n_integration_id: number;
  workflow_id: string;
  workflow_name: string;
  platform: string;
  agent_name: string;
  description: string | null;
  configuration: string;
  webhook_data: string | null;
  status: string;
  last_execution_at: string | null;
  last_execution_result: string | null;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

interface Report {
  id: number;
  lead_id: number;
  n8n_agent_id: number;
  platform: string;
  content: string;
  created_at: string;
  updated_at: string;
  agent: Agent;
}

interface AssignedUser {
  id: number;
  name: string;
  email: string;
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
  status: string;
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
  assigned_user?: AssignedUser | null;
  transactions?: Transaction[];
  reports?: Report[];
  tasks?: Task[];
  docs?: LeadDocument[];
  products?: LeadProduct[];
  sales?: Sale[];
  observations?: Observation[];
  whats_app_evo_chat?: LeadWhatsAppChat | null;
}

interface CompanyProduct {
  id: number;
  name: string;
}

interface LeadData {
  lead: Lead;
  transactions: Transaction[];
  reports: Report[];
  tasks: Task[];
  docs: LeadDocument[];
  users: CompanyUser[];
  products: CompanyProduct[];
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
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
  const [addProductsModalOpen, setAddProductsModalOpen] = useState(false);
  const [startPurchaseModalOpen, setStartPurchaseModalOpen] = useState(false);
  const [selectedProductsForPurchase, setSelectedProductsForPurchase] = useState<LeadProduct[]>([]);

  const fetchLeadData = async () => {
    if (!leadId || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/leads/${leadId}`);
      const data = response.data;
      
      // Handle both structures: transactions/reports/tasks inside lead object or at root level
      const lead = data.lead || data;
      const transactions = data.transactions || lead.transactions || [];
      const reports = data.reports || lead.reports || [];
      const tasks = data.tasks || lead.tasks || [];
      const docs = lead.docs || [];
      const users = data.users || [];
      const companyProducts = data.products || [];
      
      setLeadData({
        lead,
        transactions,
        reports,
        tasks,
        docs,
        users,
        products: companyProducts
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

  const handleTaskCreated = (newTask: Task) => {
    setLeadData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: [newTask, ...prev.tasks]
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
          onViewReports={() => setReportsModalOpen(true)}
          reportsCount={leadData.reports?.length || 0}
          onAssignUser={() => setAssignUserModalOpen(true)}
        />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                erpBudgetIds={(leadData.lead as any).erp_budgets_ids || []}
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
                  <ActivityTimelineContent transactions={leadData.transactions} />
                </TabsContent>
                
                <TabsContent value="purchases" className="mt-0">
                  <PurchaseHistorySection 
                    sales={leadData.lead.sales || []} 
                    onSaleDeleted={handleSaleDeleted}
                  />
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
          onUpdate={fetchLeadData}
        />

        {/* Reports Modal */}
        <ReportsModal
          isOpen={reportsModalOpen}
          onClose={() => setReportsModalOpen(false)}
          reports={leadData.reports || []}
          leadName={`${leadData.lead.first_name} ${leadData.lead.last_name}`}
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
  onViewReports, 
  reportsCount,
  onAssignUser
}: { 
  lead: Lead; 
  onEdit: () => void; 
  onBack: () => void; 
  onViewReports: () => void;
  reportsCount: number;
  onAssignUser: () => void;
}) => {
  const { t } = useLanguage();
  
  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      'contacted': 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      'qualified': 'bg-green-600/20 text-green-400 border-green-600/30',
      'converted': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
      'lost': 'bg-red-600/20 text-red-400 border-red-600/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-600/20 text-gray-400 border-gray-600/30';
  };

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
      className="mb-8"
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
                <Badge className={`text-xs font-medium border ${getStatusColor(lead.status)}`}>
                  {lead.status}
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
            <Button onClick={onViewReports} variant="outline" className="glass-card">
              <FileText className="w-4 h-4 mr-2" />
              {t('lead-details.see-reports')}
              {reportsCount > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">
                  {reportsCount}
                </Badge>
              )}
            </Button>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
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
      'email_sent': <Mail className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />;
  };

  const getTransactionColor = (type: string) => {
    const colors = {
      'stage_change': 'bg-blue-600',
      'status_change': 'bg-yellow-600', 
      'note_added': 'bg-green-600',
      'contact_attempt': 'bg-purple-600',
      'email_sent': 'bg-orange-600'
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

// Lead Edit Modal Component
const LeadEditModal = ({ isOpen, onClose, lead, onUpdate }: { 
  isOpen: boolean; 
  onClose: () => void; 
  lead: Lead; 
  onUpdate: () => void; 
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ddi: '+55',
    source_platform: 'Direct',
    value_estimated: '',
    currency: 'USD',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (lead && isOpen) {
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        ddi: lead.ddi || '+55',
        source_platform: lead.source_platform || 'Direct',
        value_estimated: lead.value_estimated?.toString() || '',
        currency: lead.currency || 'USD',
        notes: lead.notes || ''
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.put(`/api/leads/${lead.id}`, formData);
      
      toast.success(t('lead-details.update-success'));
      onUpdate();
      onClose();
      
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast.error(t('lead-details.update-error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-white">{t('lead-details.edit-modal-title')}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('lead-details.first-name')}
                value={formData.first_name}
                onChange={(value) => setFormData(prev => ({...prev, first_name: value}))}
                required
              />
              <FormField
                label={t('lead-details.last-name')}
                value={formData.last_name}
                onChange={(value) => setFormData(prev => ({...prev, last_name: value}))}
                required
              />
              <FormField
                label={t('lead-details.email')}
                type="email"
                value={formData.email}
                onChange={(value) => setFormData(prev => ({...prev, email: value}))}
              />
              <FormField
                label={t('lead-details.phone')}
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({...prev, phone: value}))}
              />
            </div>
            
            {/* Additional Fields */}
            <FormField
              label={t('lead-details.notes')}
              type="textarea"
              value={formData.notes}
              onChange={(value) => setFormData(prev => ({...prev, notes: value}))}
              rows={4}
            />
          </div>
          
          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              {t('lead-details.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/80"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('lead-details.saving')}
                </>
              ) : (
                t('lead-details.save-changes')
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Form Field Component
const FormField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  rows = 1 
}: { 
  label: string; 
  type?: string; 
  value: string; 
  onChange: (value: string) => void; 
  required?: boolean; 
  rows?: number; 
}) => {
  const Component = type === 'textarea' ? 'textarea' : 'input';
  
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <Component
        type={type !== 'textarea' ? type : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={type === 'textarea' ? rows : undefined}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-primary focus:outline-none resize-none"
      />
    </div>
  );
};

export default LeadDetailPage;
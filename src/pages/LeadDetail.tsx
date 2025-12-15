/**
 * LEAD DETAIL PAGE
 * 
 * Comprehensive lead detail page with transaction history and editing capabilities
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VscSourceControl } from "react-icons/vsc";
import ReportsModal from '@/components/leads/ReportsModal';
import TasksSection from '@/components/leads/TasksSection';
import TaskCreationModal from '@/components/leads/TaskCreationModal';
import TaskDeleteDialog from '@/components/leads/TaskDeleteDialog';
import { Task } from '@/services/taskApi';

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
  estimated_value: number;
  currency: string;
  ai_score: number;
  language: string;
  external_id: string;
  sync_enabled: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  transactions?: Transaction[];
  reports?: Report[];
  tasks?: Task[];
}

interface LeadData {
  lead: Lead;
  transactions: Transaction[];
  reports: Report[];
  tasks: Task[];
}

const LeadDetailPage = () => {
  const { leadId, funnelId } = useParams<{ leadId: string; funnelId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

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
      
      setLeadData({
        lead,
        transactions,
        reports,
        tasks
      });
      
    } catch (err: any) {
      console.error('Error fetching lead data:', err);
      setError(err.response?.data?.message || 'Failed to load lead data');
      toast.error('Failed to load lead data');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading lead details...</span>
        </div>
      </div>
    );
  }

  if (error || !leadData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Lead Not Found</h3>
          <p className="text-gray-400 mb-6">{error || 'The requested lead could not be found.'}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
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
        />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Information */}
          <div className="lg:col-span-2 space-y-6">
            <LeadInfoSection lead={leadData.lead} />
            <LeadMetricsSection lead={leadData.lead} />
            <LeadContactSection lead={leadData.lead} />
            <TasksSection 
              tasks={leadData.tasks || []} 
              onCreateTask={() => setTaskModalOpen(true)}
              onEditTask={handleEditTask}
              onDeleteTask={(task) => setDeletingTask(task)}
            />
          </div>
          
          {/* Right Column - Activity Timeline */}
          <div className="space-y-6">
            <LeadActivityTimeline transactions={leadData.transactions} />
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
  reportsCount 
}: { 
  lead: Lead; 
  onEdit: () => void; 
  onBack: () => void; 
  onViewReports: () => void;
  reportsCount: number;
}) => {
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
          Back
        </button>
        <ChevronRight className="w-4 h-4" />
        <span>Lead Details</span>
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
                  <span className="text-gray-400 text-sm capitalize">{lead.priority} priority</span>
                </div>
                <span className="text-gray-400 text-sm">#{lead.id}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={onViewReports} variant="outline" className="glass-card">
              <FileText className="w-4 h-4 mr-2" />
              See Reports
              {reportsCount > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">
                  {reportsCount}
                </Badge>
              )}
            </Button>
            <Button onClick={onEdit} className="bg-primary hover:bg-primary/80">
              <Edit className="w-4 h-4 mr-2" />
              Edit Lead
            </Button>
            <Button variant="outline" size="icon" className="glass-card">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Lead Info Section Component
const LeadInfoSection = ({ lead }: { lead: Lead }) => {
  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="text-xl font-semibold text-white mb-4">Lead Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoItem label="Source Platform" value={lead.source_platform} icon={<Globe className="w-4 h-4" />} />
        <InfoItem label="Source Type" value={lead.source_type} icon={<VscSourceControl className="w-4 h-4" />} />
        <InfoItem label="Language" value={lead.language?.toUpperCase()} icon={<MessageSquare className="w-4 h-4" />} />
        <InfoItem label="Currency" value={lead.currency} icon={<DollarSign className="w-4 h-4" />} />
        <InfoItem label="External ID" value={lead.external_id || 'Not set'} icon={<Hash className="w-4 h-4" />} />
        <InfoItem label="Sync Enabled" value={lead.sync_enabled ? 'Yes' : 'No'} icon={<RefreshCw className="w-4 h-4" />} />
      </div>
      
      {lead.notes && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-white font-medium mb-2">Notes</h4>
          <p className="text-gray-400 text-sm leading-relaxed">{lead.notes}</p>
        </div>
      )}
    </motion.div>
  );
};

// Info Item Component
const InfoItem = ({ label, value, icon }: { label: string; value: string | undefined; icon: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-primary/20 text-primary">
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-white font-medium">{value || 'Not set'}</p>
    </div>
  </div>
);

// Lead Metrics Section Component
const LeadMetricsSection = ({ lead }: { lead: Lead }) => {
  const getDaysActive = () => {
    const created = new Date(lead.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-xl font-semibold text-white mb-4">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="AI Score"
          value={lead.ai_score ? `${lead.ai_score}%` : 'Not scored'}
          icon={<Brain className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          label="Estimated Value"
          value={lead.estimated_value ? `${lead.currency} ${parseFloat(lead.estimated_value.toString()).toLocaleString()}` : 'Not set'}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          label="Days Active"
          value={getDaysActive().toString()}
          icon={<Calendar className="w-5 h-5" />}
          color="blue"
        />
      </div>
    </motion.div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => {
  const colorClasses = {
    purple: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    green: 'bg-green-600/20 text-green-400 border-green-600/30',
    blue: 'bg-blue-600/20 text-blue-400 border-blue-600/30'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
};

// Lead Contact Section Component
const LeadContactSection = ({ lead }: { lead: Lead }) => {
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Email</p>
              <p className="text-white font-medium">{lead.email || 'Not provided'}</p>
            </div>
          </div>
          {lead.email && (
            <button
              onClick={() => copyToClipboard(lead.email, 'Email')}
              className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
              title="Copy email"
            >
              <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Phone</p>
              <p className="text-white font-medium">{lead.ddi} {lead.phone}</p>
            </div>
          </div>
          {lead.phone && (
            <button
              onClick={() => copyToClipboard(`${lead.ddi} ${lead.phone}`, 'Phone')}
              className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
              title="Copy phone"
            >
              <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Full Name</p>
              <p className="text-white font-medium">{lead.first_name} {lead.last_name}</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(`${lead.first_name} ${lead.last_name}`, 'Name')}
            className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
            title="Copy name"
          >
            <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Activity Timeline Component
const LeadActivityTimeline = ({ transactions }: { transactions: Transaction[] }) => {
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
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-xl font-semibold text-white mb-6">Activity Timeline</h3>
      
      <div className="space-y-4">
        {transactions.length > 0 ? (
          transactions.map((transaction, index) => (
            <div key={transaction.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${getTransactionColor(transaction.type)} flex items-center justify-center text-white`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                {index < transactions.length - 1 && (
                  <div className="w-px h-8 bg-white/10 mt-2"></div>
                )}
              </div>
              
              {/* Transaction Content */}
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
                  
                  {/* Additional Details */}
                  {transaction.type === 'stage_change' && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded">
                        Stage {transaction.from_stage_id}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                        Stage {transaction.to_stage_id}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>Source: {transaction.source}</span>
                    {transaction.is_automated && (
                      <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 px-2 py-1">
                        Automated
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
            <p className="text-gray-400">No activity recorded yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Lead Edit Modal Component
const LeadEditModal = ({ isOpen, onClose, lead, onUpdate }: { 
  isOpen: boolean; 
  onClose: () => void; 
  lead: Lead; 
  onUpdate: () => void; 
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ddi: '+55',
    source_platform: 'Direct',
    estimated_value: '',
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
        estimated_value: lead.estimated_value?.toString() || '',
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
      
      toast.success('Lead updated successfully');
      onUpdate();
      onClose();
      
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
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
            <h3 className="text-xl font-semibold text-white">Edit Lead</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                value={formData.first_name}
                onChange={(value) => setFormData(prev => ({...prev, first_name: value}))}
                required
              />
              <FormField
                label="Last Name"
                value={formData.last_name}
                onChange={(value) => setFormData(prev => ({...prev, last_name: value}))}
                required
              />
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData(prev => ({...prev, email: value}))}
              />
              <FormField
                label="Phone"
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({...prev, phone: value}))}
              />
            </div>
            
            {/* Additional Fields */}
            <FormField
              label="Notes"
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/80"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
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
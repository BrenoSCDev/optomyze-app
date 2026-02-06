/**
 * LEAD DETAIL TABS
 * 
 * Unified tabbed component for Lead Details page
 * Groups Lead Info, Contact, Tasks, Documents, and Products sections
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Info, 
  Phone, 
  ListTodo, 
  FileText,
  StickyNote,
  FileSignature,
  MessageCircle,
  Globe,
  MessageSquare,
  DollarSign,
  Hash,
  RefreshCw,
  User,
  Mail,
  Copy,
  Brain,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import { VscSourceControl } from "react-icons/vsc";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Task } from '@/services/taskApi';
import { LeadDocument } from '@/services/documentApi';
import TasksSection from './TasksSection';
import DocumentsSection from './DocumentsSection';
import ObservationsSection from './ObservationsSection';
import { Observation } from '@/services/observationApi';
import { LeadProduct } from './ProductsSection';
import LeadChatSection, { LeadWhatsAppChat, LeadWhatsAppMessage } from './LeadChatSection';

interface AssignedUser {
  id: number;
  name: string;
  email: string;
}

interface LeadCompanyInfo {
  id: number;
  legal_name: string;
  industry?: string | null;
  logo_path?: string | null;
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
  products?: LeadProduct[];
  observations?: Observation[];
  whats_app_evo_chat?: LeadWhatsAppChat | null;
}

interface LeadDetailTabsProps {
  lead: Lead;
  tasks: Task[];
  documents: LeadDocument[];
  observations: Observation[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onUploadDocument: () => void;
  onDocumentDeleted: (documentId: number) => void;
  onObservationCreated: (observation: Observation) => void;
  onObservationUpdated: (observation: Observation) => void;
  onObservationDeleted: (observationId: number) => void;
}

const LeadDetailTabs: React.FC<LeadDetailTabsProps> = ({
  lead,
  tasks,
  documents,
  observations,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onUploadDocument,
  onDocumentDeleted,
  onObservationCreated,
  onObservationUpdated,
  onObservationDeleted
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('info');
  
  // Local state for chat messages to avoid page refresh
  const [chatMessages, setChatMessages] = useState<LeadWhatsAppMessage[]>(
    lead.whats_app_evo_chat?.messages || []
  );

  // Build chat object with local messages state
  const chatWithLocalMessages: LeadWhatsAppChat | null = lead.whats_app_evo_chat 
    ? { ...lead.whats_app_evo_chat, messages: chatMessages }
    : null;

  const handleChatMessageSent = (message: LeadWhatsAppMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-white/5 p-1 mb-6">
          <TabsTrigger 
            value="info" 
            className="flex-1 min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
          >
            <Info className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('lead-details.tabs.info')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="flex-1 min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
          >
            <ListTodo className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('lead-details.tabs.tasks')}</span>
            {tasks.length > 0 && (
              <Badge className="ml-1.5 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                {tasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="flex-1 min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('lead-details.tabs.documents-short')}</span>
            {documents.length > 0 && (
              <Badge className="ml-1.5 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="observations" 
            className="flex-1 min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
          >
            <StickyNote className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('lead-details.tabs.observations')}</span>
            {observations.length > 0 && (
              <Badge className="ml-1.5 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                {observations.length}
              </Badge>
            )}
          </TabsTrigger>
          {/* Contracts Tab - COMMENTED OUT: Feature to be implemented later */}
          {/* <TabsTrigger 
            value="contracts" 
            className="flex-1 min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
          >
            <FileSignature className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('lead-details.tabs.contracts')}</span>
          </TabsTrigger> */}
          <TabsTrigger 
            value="chat" 
            className="flex-1 min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('lead-details.tabs.chat')}</span>
            {chatMessages.length > 0 && (
              <Badge className="ml-1.5 bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                {chatMessages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Lead Information Tab */}
        <TabsContent value="info" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LeadInfoContent lead={lead} />
          <div className="mt-6 pt-6 border-t border-white/10">
            <LeadContactContent lead={lead} />
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <TasksSectionContent
            tasks={tasks}
            onCreateTask={onCreateTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <DocumentsSectionContent
            documents={documents}
            onUploadClick={onUploadDocument}
            onDocumentDeleted={onDocumentDeleted}
          />
        </TabsContent>

        {/* Observations Tab */}
        <TabsContent value="observations" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <ObservationsSection
            observations={observations}
            leadId={lead.id}
            onObservationCreated={onObservationCreated}
            onObservationUpdated={onObservationUpdated}
            onObservationDeleted={onObservationDeleted}
          />
        </TabsContent>

        {/* Contracts Tab - COMMENTED OUT: Feature to be implemented later */}
        {/* <TabsContent value="contracts" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <ContractsContent />
        </TabsContent> */}

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LeadChatSection 
            chat={chatWithLocalMessages} 
            leadId={lead.id}
            onMessageSent={handleChatMessageSent}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

// Info Item Component
const InfoItem = ({ label, value, icon, notSet }: { label: string; value: string | undefined; icon: React.ReactNode; notSet: string }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-primary/20 text-primary">
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-white font-medium">{value || notSet}</p>
    </div>
  </div>
);

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

// Lead Info Content
const LeadInfoContent = ({ lead }: { lead: Lead }) => {
  const { t } = useLanguage();
  
  const getDaysActive = () => {
    const created = new Date(lead.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Build full address string
  const buildFullAddress = () => {
    const parts = [
      lead.address_line_1,
      lead.address_line_2,
      lead.neighborhood,
      lead.city,
      lead.state_code || lead.state,
      lead.postal_code,
      lead.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const fullAddress = buildFullAddress();
  const hasAddressData = lead.address_line_1 || lead.city || lead.country;

  return (
    <div className="space-y-6">
      {/* General Information */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">{t('lead-details.general-information')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem label={t('lead-details.source-platform')} value={lead.source_platform} icon={<Globe className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          <InfoItem label={t('lead-details.source-type')} value={lead.source_type} icon={<VscSourceControl className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          <InfoItem label={t('lead-details.language')} value={lead.language?.toUpperCase()} icon={<MessageSquare className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          <InfoItem label={t('lead-details.currency')} value={lead.currency} icon={<DollarSign className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          <InfoItem label={t('lead-details.external-id')} value={lead.external_id || t('lead-details.not-set')} icon={<Hash className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          {/* <InfoItem label={t('lead-details.sync-enabled')} value={lead.sync_enabled ? t('lead-details.yes') : t('lead-details.no')} icon={<RefreshCw className="w-4 h-4" />} notSet={t('lead-details.not-set')} /> */}
          <InfoItem 
            label={t('lead-details.assigned-user')} 
            value={lead.assigned_user ? lead.assigned_user.name : undefined} 
            icon={<User className="w-4 h-4" />} 
            notSet={t('lead-details.unassigned')} 
          />
        </div>
      </div>

      {/* Address Section */}
      {hasAddressData && (
        <div className="pt-6 border-t border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">{t('lead-details.address')}</h4>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <MapPin className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              {lead.address_line_1 && (
                <p className="text-white font-medium">{lead.address_line_1}</p>
              )}
              {lead.address_line_2 && (
                <p className="text-gray-400 text-sm">{lead.address_line_2}</p>
              )}
              <p className="text-gray-400 text-sm mt-1">
                {[
                  lead.neighborhood,
                  lead.city,
                  lead.state_code || lead.state,
                  lead.postal_code
                ].filter(Boolean).join(', ')}
              </p>
              {lead.country && (
                <p className="text-gray-400 text-sm">{lead.country}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <div className="pt-6 border-t border-white/10">
          <h4 className="text-white font-medium mb-2">{t('lead-details.notes')}</h4>
          <p className="text-gray-400 text-sm leading-relaxed">{lead.notes}</p>
        </div>
      )}

      {/* Metrics */}
      <div className="pt-6 border-t border-white/10">
        <h4 className="text-lg font-semibold text-white mb-4">{t('lead-details.performance-metrics')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label={t('lead-details.ai-score')}
            value={lead.ai_score ? `${lead.ai_score}%` : t('lead-details.not-scored')}
            icon={<Brain className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            label={t('lead-details.estimated-value')}
            value={lead.value_estimated ? new Intl.NumberFormat('en-US', { style: 'currency', currency: lead.currency || 'USD' }).format(lead.value_estimated) : t('lead-details.not-set')}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            label={t('lead-details.days-active')}
            value={getDaysActive().toString()}
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
};

// Lead Contact Content
const LeadContactContent = ({ lead }: { lead: Lead }) => {
  const { t } = useLanguage();
  
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t('lead-details.copied')}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('lead-details.email')}</p>
            <p className="text-white font-medium">{lead.email || t('lead-details.not-provided')}</p>
          </div>
        </div>
        {lead.email && (
          <button
            onClick={() => copyToClipboard(lead.email, t('lead-details.email'))}
            className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
            title={`${t('common.copy')} ${t('lead-details.email').toLowerCase()}`}
          >
            <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Phone className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('lead-details.phone')}</p>
            <p className="text-white font-medium">{lead.ddi} {lead.phone}</p>
          </div>
        </div>
        {lead.phone && (
          <button
            onClick={() => copyToClipboard(`${lead.ddi} ${lead.phone}`, t('lead-details.phone'))}
            className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
            title={`${t('common.copy')} ${t('lead-details.phone').toLowerCase()}`}
          >
            <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <User className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('lead-details.full-name')}</p>
            <p className="text-white font-medium">{lead.first_name} {lead.last_name}</p>
          </div>
        </div>
        <button
          onClick={() => copyToClipboard(`${lead.first_name} ${lead.last_name}`, t('lead-details.full-name'))}
          className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
          title={`${t('common.copy')} ${t('lead-details.full-name').toLowerCase()}`}
        >
          <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>
    </div>
  );
};

// Tasks Section Content (wrapper without card styling)
interface TasksSectionContentProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const TasksSectionContent: React.FC<TasksSectionContentProps> = ({
  tasks,
  onCreateTask,
  onEditTask,
  onDeleteTask
}) => {
  const { t } = useLanguage();

  return (
    <TasksSection
      tasks={tasks}
      onCreateTask={onCreateTask}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
    />
  );
};

// Documents Section Content (wrapper without card styling)
interface DocumentsSectionContentProps {
  documents: LeadDocument[];
  onUploadClick: () => void;
  onDocumentDeleted: (documentId: number) => void;
}

const DocumentsSectionContent: React.FC<DocumentsSectionContentProps> = ({
  documents,
  onUploadClick,
  onDocumentDeleted
}) => {
  return (
    <DocumentsSection
      documents={documents}
      onUploadClick={onUploadClick}
      onDocumentDeleted={onDocumentDeleted}
    />
  );
};


// Contracts Content (placeholder) - COMMENTED OUT: Feature to be implemented later
// const ContractsContent: React.FC = () => {
//   const { t } = useLanguage();
//   
//   return (
//     <div className="text-center py-12">
//       <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
//         <FileSignature className="w-8 h-8 text-blue-500/60" />
//       </div>
//       <h4 className="text-white font-medium mb-2">{t('lead-details.tabs.contracts-empty')}</h4>
//       <p className="text-gray-400 text-sm">{t('lead-details.tabs.contracts-empty-desc')}</p>
//     </div>
//   );
// };

export default LeadDetailTabs;

/**
 * LEAD DETAIL TABS
 * 
 * Unified tabbed component for Lead Details page
 * Groups Lead Info, Contact, Tasks, Documents, and Products sections
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Info,
  Phone,
  ListTodo,
  FileText,
  StickyNote,
  FileSignature,
  MessageCircle,
  DollarSign,
  Hash,
  RefreshCw,
  User,
  Mail,
  Copy,
  Brain,
  TrendingUp,
  Calendar,
  MapPin,
  Settings2,
} from 'lucide-react';
import { VscSourceControl } from "react-icons/vsc";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LeadDocument } from '@/services/documentApi';
import LeadTasksPanel from './LeadTasksPanel';
import DocumentsSection from './DocumentsSection';
import NotesThread from '@/components/notes/NotesThread';
import { Observation } from '@/services/observationApi';
import { LeadProduct } from './ProductsSection';
import LeadChatSection, { LeadInboxChat, LeadInboxMessage } from './LeadChatSection';
import LeadCustomFieldsTab from './LeadCustomFieldsTab';
import LeadAppointmentsTab from './LeadAppointmentsTab';
import { formatPhoneNumber } from '@/lib/phone';
import { formatEnumLabel } from '@/lib/format';
import SourcePlatformIcon from './SourcePlatformIcon';
import UserAvatar from '@/components/ui/user-avatar';
import ClickableUser from '@/components/users/ClickableUser';
import { leadDisplayName } from '@/lib/leadName';

interface AssignedUser {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  profile_pic?: string | null;
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
  whatsapp_inbox_chat?: LeadInboxChat | null;
  inbox_chats?: LeadInboxChat[] | null;
  timezone?: string | null;
}

interface LeadDetailTabsProps {
  lead: Lead;
  documents: LeadDocument[];
  observations: Observation[];
  onUploadDocument: () => void;
  onDocumentDeleted: (documentId: number) => void;
  onObservationCreated: (observation: Observation) => void;
  onObservationUpdated: (observation: Observation) => void;
  onObservationDeleted: (observationId: number) => void;
  /** Tab to open on; defaults to 'info'. */
  initialTab?: string;
}

const LeadDetailTabs: React.FC<LeadDetailTabsProps> = ({
  initialTab,
  lead,
  documents,
  observations,
  onUploadDocument,
  onDocumentDeleted,
  onObservationCreated,
  onObservationUpdated,
  onObservationDeleted
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab ?? 'info');

  // Most recently active inbox chat for this lead, across all channels
  // (WhatsApp, Instagram, Messenger, ...)
  const primaryChat = useMemo<LeadInboxChat | null>(() => {
    const chatsList = lead.inbox_chats || [];
    if (chatsList.length === 0) return null;
    return [...chatsList].sort((a, b) =>
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    )[0];
  }, [lead.inbox_chats]);

  // Track messages sent during this session to keep the chat tab badge live
  const [sentCount, setSentCount] = useState(0);
  const handleChatMessageSent = (_message: LeadInboxMessage) => {
    setSentCount(prev => prev + 1);
  };
  const chatMessageCount = (primaryChat?.messages?.length || 0) + sentCount;

  return (
    <motion.div 
      className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 mb-6">
          <TabsTrigger 
            value="info" 
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <Info className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.info')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <ListTodo className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.tasks')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <FileText className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.documents-short')}</span>
            {documents.length > 0 && (
              <Badge className="hidden sm:inline-flex ml-1 sm:ml-1.5 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="observations" 
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <StickyNote className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.observations')}</span>
            {observations.length > 0 && (
              <Badge className="hidden sm:inline-flex ml-1 sm:ml-1.5 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                {observations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="appointments"
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <Calendar className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.appointments')}</span>
          </TabsTrigger>
          {/* Contracts Tab - COMMENTED OUT: Feature to be implemented later */}
          {/* <TabsTrigger
            value="contracts"
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <FileSignature className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.contracts')}</span>
          </TabsTrigger> */}
          <TabsTrigger
            value="custom-fields"
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <Settings2 className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.custom-fields') || 'Fields'}</span>
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-1 min-w-[44px] sm:min-w-[80px] text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-colors duration-fast ease-standard"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('lead-details.tabs.chat')}</span>
            {chatMessageCount > 0 && (
              <Badge className="hidden sm:inline-flex ml-1 sm:ml-1.5 bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                {chatMessageCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Lead Information Tab */}
        <TabsContent value="info" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LeadInfoContent lead={lead} />
          <div className="mt-6 pt-6 border-t border-border">
            <LeadContactContent lead={lead} />
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LeadTasksPanel leadId={lead.id} />
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
          {/* Threaded notes, shared with the deal view so both behave the
              same and a change lands in both. */}
          <NotesThread type="lead" id={lead.id} />
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LeadAppointmentsTab leadId={lead.id} leadTimezone={lead.timezone} />
        </TabsContent>

        {/* Contracts Tab - COMMENTED OUT: Feature to be implemented later */}
        {/* <TabsContent value="contracts" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <ContractsContent />
        </TabsContent> */}

        {/* Custom Fields Tab */}
        <TabsContent value="custom-fields" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LeadCustomFieldsTab leadId={lead.id} />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LeadChatSection
            chat={primaryChat}
            leadId={lead.id}
            leadPhone={lead.phone}
            onMessageSent={handleChatMessageSent}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

// Info Item Component
const InfoItem = ({ label, value, icon, notSet, customIcon }: { label: string; value: string | undefined; icon?: React.ReactNode; notSet: string; customIcon?: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    {customIcon ?? (
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-foreground shrink-0">
        {icon}
      </div>
    )}
    <div>
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="text-foreground font-medium">{value || notSet}</p>
    </div>
  </div>
);

// Assigned User Card Component
const AssignedUserCard = ({ user }: { user?: AssignedUser | null }) => {
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-border bg-muted/30">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t('lead-details.no-assigned-user')}</p>
      </div>
    );
  }

  const roleKey = user.role ? `users.roles.${user.role}` : '';
  const roleLabel = user.role ? (t(roleKey) !== roleKey ? t(roleKey) : formatEnumLabel(user.role)) : null;

  return (
    <ClickableUser userId={user.id} className="w-full">
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors w-full">
        <UserAvatar name={user.name} profilePicPath={user.profile_pic} className="w-12 h-12 text-base shrink-0" />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-foreground font-semibold truncate">{user.name}</p>
            {roleLabel && (
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border shrink-0">
                {roleLabel}
              </span>
            )}
          </div>
          {user.email && <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>}
        </div>
      </div>
    </ClickableUser>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-muted/50 p-4">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
        {icon}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <p className="text-lg font-bold text-foreground">{value}</p>
  </div>
);

// Lead Info Content
const LeadInfoContent = ({ lead }: { lead: Lead }) => {
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();
  
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
        <h4 className="text-lg font-semibold text-foreground mb-4">{t('lead-details.general-information')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            label={t('lead-details.source-platform')}
            value={formatEnumLabel(lead.source_platform)}
            notSet={t('lead-details.not-set')}
            customIcon={
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted shrink-0">
                <SourcePlatformIcon source={lead.source_platform} />
              </div>
            }
          />
          <InfoItem label={t('lead-details.source-type')} value={formatEnumLabel(lead.source_type)} icon={<VscSourceControl className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          <InfoItem label={t('lead-details.currency')} value={lead.currency} icon={<DollarSign className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          <InfoItem label={t('lead-details.external-id')} value={lead.external_id || t('lead-details.not-set')} icon={<Hash className="w-4 h-4" />} notSet={t('lead-details.not-set')} />
          {/* <InfoItem label={t('lead-details.sync-enabled')} value={lead.sync_enabled ? t('lead-details.yes') : t('lead-details.no')} icon={<RefreshCw className="w-4 h-4" />} notSet={t('lead-details.not-set')} /> */}
        </div>
      </div>

      {/* Assigned User */}
      <div className="pt-6 border-t border-border">
        <h4 className="text-lg font-semibold text-foreground mb-4">{t('lead-details.assigned-user')}</h4>
        <AssignedUserCard user={lead.assigned_user} />
      </div>

      {/* Address Section */}
      {hasAddressData && (
        <div className="pt-6 border-t border-border">
          <h4 className="text-lg font-semibold text-foreground mb-4">{t('lead-details.address')}</h4>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              {lead.address_line_1 && (
                <p className="text-foreground font-medium">{lead.address_line_1}</p>
              )}
              {lead.address_line_2 && (
                <p className="text-muted-foreground text-sm">{lead.address_line_2}</p>
              )}
              <p className="text-muted-foreground text-sm mt-1">
                {[
                  lead.neighborhood,
                  lead.city,
                  lead.state_code || lead.state,
                  lead.postal_code
                ].filter(Boolean).join(', ')}
              </p>
              {lead.country && (
                <p className="text-muted-foreground text-sm">{lead.country}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <div className="pt-6 border-t border-border">
          <h4 className="text-foreground font-medium mb-2">{t('lead-details.notes')}</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">{lead.notes}</p>
        </div>
      )}

      {/* Metrics */}
      <div className="pt-6 border-t border-border">
        <h4 className="text-lg font-semibold text-foreground mb-4">{t('lead-details.performance-metrics')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label={t('lead-details.ai-score')}
            value={lead.ai_score ? `${lead.ai_score}%` : t('lead-details.not-scored')}
            icon={<Brain className="w-4 h-4" />}
          />
          <MetricCard
            label={t('lead-details.estimated-value')}
            value={lead.value_estimated ? new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(lead.value_estimated) : t('lead-details.not-set')}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            label={t('lead-details.days-active')}
            value={getDaysActive().toString()}
            icon={<Calendar className="w-4 h-4" />}
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
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('lead-details.email')}</p>
            <p className="text-foreground font-medium">{lead.email || t('lead-details.not-provided')}</p>
          </div>
        </div>
        {lead.email && (
          <button
            onClick={() => copyToClipboard(lead.email, t('lead-details.email'))}
            className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-colors duration-fast ease-standard"
            title={`${t('common.copy')} ${t('lead-details.email').toLowerCase()}`}
          >
            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('lead-details.phone')}</p>
            <p className="text-foreground font-medium">{lead.phone ? formatPhoneNumber(lead.phone) : t('lead-details.no-phone-informed')}</p>
          </div>
        </div>
        {lead.phone && (
          <button
            onClick={() => copyToClipboard(lead.phone, t('lead-details.phone'))}
            className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-colors duration-fast ease-standard"
            title={`${t('common.copy')} ${t('lead-details.phone').toLowerCase()}`}
          >
            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('lead-details.full-name')}</p>
            <p className="text-foreground font-medium">{lead.first_name} {lead.last_name}</p>
          </div>
        </div>
        <button
          onClick={() => copyToClipboard(leadDisplayName(lead), t('lead-details.full-name'))}
          className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-colors duration-fast ease-standard"
          title={`${t('common.copy')} ${t('lead-details.full-name').toLowerCase()}`}
        >
          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
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

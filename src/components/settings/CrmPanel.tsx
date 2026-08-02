import { Suspense, lazy, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import OptoIcon from '@/assets/opto-icon.png';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bell, Package, DollarSign, Settings, List, Tag, Zap, Shield, XCircle, Mail, Users, BarChart3, Moon, FileStack, CalendarDays, MessageSquare, ListChecks, Send, MessageSquareText } from 'lucide-react';
import { IoFunnelOutline } from 'react-icons/io5';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSettingsPanel } from '@/hooks/useSettingsPanel';
import { useFunnelSettings } from '@/hooks/useFunnelSettings';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useConversationSettings } from '@/hooks/useConversationSettings';
import { useCustomProductFields } from '@/hooks/useCustomProductFields';
import { useLeadCustomFields } from '@/hooks/useLeadCustomFields';
import { FunnelStage } from '@/services/funnelSettingsApi';

/*
 * Management screens that used to be their own menu destinations and now live
 * inside this panel. Lazy so the panel does not pull three large screens into
 * its chunk when most visits only touch a settings toggle.
 */
const FunnelsDashboard        = lazy(() => import('@/components/dashboards/FunnelsDashboard'));
const TagsDashboard           = lazy(() => import('@/components/dashboards/TagsDashboard'));
const ManageProductCategories = lazy(() => import('@/components/products/ManageProductCategories'));

/** Guards the `?tab=` deep link against a stale or hand-typed value. */
const VALID_TABS = ['notifications', 'conversations', 'funnels', 'products', 'sales', 'appointments', 'tags'];

const PanelFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Product Settings
import ProductBehaviorSection from './products/ProductBehaviorSection';
import CustomFieldsSection from './products/CustomFieldsSection';
import ModelFieldGroupsSection from './products/ModelFieldGroupsSection';
import PricingRulesSection from './products/PricingRulesSection';

// Sales Settings
import DealRulesSection from './sales/DealRulesSection';

// Funnel Settings
import FunnelTemplatesSection from './funnels/FunnelTemplatesSection';
import LeadCustomFieldsSection from './funnels/LeadCustomFieldsSection';
import StageEntryRulesSection from './funnels/StageEntryRulesSection';
import StageActionsSection from './funnels/StageActionsSection';
import FunnelManagersQueueSection from './funnels/FunnelManagersQueueSection';
import LossHandlingSection from './funnels/LossHandlingSection';

// Appointment Settings
import AppointmentTypesSection from './appointments/AppointmentTypesSection';

// Notification Settings
import {
  NotificationChannelsSection,
  DefaultRecipientsSection,
  NotificationEventsSection,
  FrequencyControlSection,
  QuietHoursSection,
  NotificationTemplatesSection,
  NotificationPreviewSection,
} from './notifications';

// Conversation Settings
import {
  WelcomeMessagesSection,
  ClosingReasonsSection,
  ClosingMessagesSection,
  AutomaticClosingMessagesSection,
} from './conversations';

const CrmPanel = () => {
  const { t } = useLanguage();
  /*
   * Deep-linkable: `?section=crm-panel&tab=funnels` opens straight onto a tab.
   * Screens that used to be their own destinations (funnel management, tags,
   * product categories) live in here now, so links to them need a way to land
   * on the right tab rather than the default one.
   */
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const requested = new URLSearchParams(location.search).get('tab');
    return requested && VALID_TABS.includes(requested) ? requested : 'notifications';
  });
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  const {
    settings,
    loading,
    saving,
    notificationSettings: initialNotificationSettings,
    conversationSettings: initialConversationSettings,
    updateProductSettings,
    updateSalesSettings,
    hasProductChanges,
    hasSalesChanges,
    saveProductSettings,
    saveSalesSettings,
    resetProductSettings,
    resetSalesSettings,
  } = useSettingsPanel();

  const {
    settings: funnelSettings,
    loading: funnelLoading,
    saving: funnelSaving,
    regularFunnels,
    selectedFunnelId,
    selectedFunnel,
    setSelectedFunnelId,
    templateFunnels,
    selectedTemplateId,
    selectedTemplate,
    setSelectedTemplateId,
    addTemplate: addFunnelTemplate,
    deleteTemplate: deleteFunnelTemplate,
    addTemplateStage,
    updateTemplateStage,
    deleteTemplateStage,
    createFunnelFromTemplate,
    hasChanges: hasFunnelChanges,
    updateSettings: updateFunnelSettings,
    updateFunnel,
    addFunnel,
    deleteFunnel,
    setDefaultFunnel,
    saveSettings: saveFunnelSettings,
    resetChanges: resetFunnelChanges,
  } = useFunnelSettings();

  const {
    settings: notificationSettings,
    isActivated: notificationActivated,
    loading: notificationLoading,
    activating: notificationActivating,
    activate: activateNotifications,
    updateChannels,
    updateDefaultRecipients,
    updateEvent,
    updateQuietHours,
  } = useNotificationSettings({ initialData: initialNotificationSettings });

  const {
    settings: conversationSettings,
    isActivated: conversationActivated,
    activating: conversationActivating,
    activate: activateConversations,
    patchSettings: patchConversationSettingsHook,
  } = useConversationSettings({ initialData: initialConversationSettings });

  const {
    fields: customProductFields,
    loading: customFieldsLoading,
    saving: customFieldsSaving,
    addField: addCustomField,
    editField: editCustomField,
    removeField: removeCustomField,
  } = useCustomProductFields();

  const {
    fields: customLeadFields,
    loading: leadFieldsLoading,
    saving: leadFieldsSaving,
    addField: addLeadField,
    editField: editLeadField,
    removeField: removeLeadField,
  } = useLeadCustomFields();

  const handleEditStage = (stage: FunnelStage) => {
    setEditingStage(stage);
    setStageDialogOpen(true);
  };

  const handleUpdateStageRules = (rules: FunnelStage['entryRules']) => {
    if (!editingStage) return;
    
    // Find which funnel contains this stage (could be regular or template)
    const targetFunnel = [...regularFunnels, ...templateFunnels].find(f =>
      f.stages.some(s => s.id === editingStage.id)
    );
    
    if (!targetFunnel) return;
    
    const updatedStages = targetFunnel.stages.map(s =>
      s.id === editingStage.id ? { ...s, entryRules: rules } : s
    );
    updateFunnel(targetFunnel.id, { stages: updatedStages });
    setEditingStage({ ...editingStage, entryRules: rules });
  };

  const handleUpdateStageActions = (actions: FunnelStage['actions']) => {
    if (!editingStage) return;
    
    // Find which funnel contains this stage (could be regular or template)
    const targetFunnel = [...regularFunnels, ...templateFunnels].find(f =>
      f.stages.some(s => s.id === editingStage.id)
    );
    
    if (!targetFunnel) return;
    
    const updatedStages = targetFunnel.stages.map(s =>
      s.id === editingStage.id ? { ...s, actions } : s
    );
    updateFunnel(targetFunnel.id, { stages: updatedStages });
    setEditingStage({ ...editingStage, actions });
  };

  if (loading || funnelLoading || notificationLoading || customFieldsLoading || leadFieldsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img src={OptoIcon} alt="Optomyze" className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('settings.crm-panel.title')}</h1>
          <p className="text-muted-foreground">{t('settings.crm-panel.description')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.conversations')}</span>
          </TabsTrigger>
          <TabsTrigger value="funnels" className="gap-2">
            <IoFunnelOutline className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.funnels')}</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.products')}</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.sales')}</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.appointments')}</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.tags')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('settings.crm-panel.notifications.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.crm-panel.notifications.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Activation State */}
            {!notificationActivated ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-medium mb-2">
                  {t('settings.notifications.not-activated-title')}
                </h4>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  {t('settings.notifications.not-activated-description')}
                </p>
                <Button onClick={activateNotifications} disabled={notificationActivating}>
                  {notificationActivating ? t('common.activating') : t('settings.notifications.activate')}
                </Button>
              </div>
            ) : notificationSettings && (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {/* Channels */}
                <AccordionItem value="channels" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.notifications.channels.title')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <NotificationChannelsSection
                        channels={notificationSettings.channels}
                        onUpdate={updateChannels}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Default Recipients */}
                <AccordionItem value="recipients" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.notifications.recipients.title')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <DefaultRecipientsSection
                        recipients={notificationSettings.defaultRecipients}
                        onUpdate={updateDefaultRecipients}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Event Rules */}
                <AccordionItem value="events" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.notifications.events.title')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <NotificationEventsSection
                        events={notificationSettings.events}
                        onUpdate={updateEvent}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Quiet Hours */}
                <AccordionItem value="quiet-hours" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Moon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.notifications.quiet-hours.title')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <QuietHoursSection
                        quietHours={notificationSettings.quietHours}
                        onUpdate={updateQuietHours}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            )}
          </div>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('settings.crm-panel.conversations.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.crm-panel.conversations.description')}
                  </p>
                </div>
              </div>
            </div>

            {!conversationActivated ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-medium mb-2">
                  {t('settings.conversations.not-activated-title')}
                </h4>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  {t('settings.conversations.not-activated-description')}
                </p>
                <Button onClick={activateConversations} disabled={conversationActivating}>
                  {conversationActivating ? t('common.activating') : t('settings.conversations.activate')}
                </Button>
              </div>
            ) : conversationSettings && (
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="welcome-messages" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Send className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.conversations.welcome.title')}
                      </span>
                      <Switch
                        checked={conversationSettings.welcome_messages_enabled}
                        onCheckedChange={(checked) => patchConversationSettingsHook({ welcome_messages_enabled: checked })}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2"
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <WelcomeMessagesSection />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="closing-reasons" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ListChecks className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.conversations.closing-reasons.title')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <ClosingReasonsSection />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="closing-messages" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquareText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.conversations.closing-messages.title')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <ClosingMessagesSection />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="auto-closing-messages" className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {t('settings.conversations.auto-closing.title')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="py-4 px-2 border-t">
                      <AutomaticClosingMessagesSection
                        enabled={conversationSettings.closing_messages_enabled}
                        onToggle={(checked) => patchConversationSettingsHook({ closing_messages_enabled: checked })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </TabsContent>

        {/* Funnels Tab */}
        <TabsContent value="funnels" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <IoFunnelOutline className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('settings.crm-panel.funnels.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.crm-panel.funnels.description')}
                  </p>
                </div>
              </div>
              {hasFunnelChanges() && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFunnelChanges} disabled={funnelSaving}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={saveFunnelSettings} disabled={funnelSaving}>
                    {funnelSaving ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              )}
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Funnel management — first, because it is where funnels are
                  actually created and edited; everything below it configures
                  how funnels behave. */}
              <AccordionItem value="funnel-management" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <IoFunnelOutline className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.crm-panel.funnel-management')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 border-t">
                    <Suspense fallback={<PanelFallback />}>
                      <FunnelsDashboard embedded />
                    </Suspense>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Funnel Templates */}
              <AccordionItem value="funnel-templates" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileStack className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.funnels.templates')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <FunnelTemplatesSection
                      funnels={regularFunnels}
                      templateFunnels={templateFunnels}
                      selectedTemplateId={selectedTemplateId}
                      onSelectTemplate={setSelectedTemplateId}
                      onAddTemplate={addFunnelTemplate}
                      onUpdateTemplate={updateFunnel}
                      onDeleteTemplate={deleteFunnelTemplate}
                      onCreateFunnelFromTemplate={createFunnelFromTemplate}
                      onAddTemplateStage={addTemplateStage}
                      onUpdateTemplateStage={updateTemplateStage}
                      onDeleteTemplateStage={deleteTemplateStage}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Lead Assignment Queues */}
              <AccordionItem value="managers-queue" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.funnels.managers-queue.title')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <FunnelManagersQueueSection />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Loss Handling */}
              <AccordionItem value="loss-handling" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.funnels.loss-handling')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <LossHandlingSection />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Lead Custom Fields */}
              <AccordionItem value="lead-custom-fields" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <List className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.leads.custom-fields-title') || 'Lead Custom Fields'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <LeadCustomFieldsSection
                      fields={customLeadFields}
                      saving={leadFieldsSaving}
                      onAdd={addLeadField}
                      onEdit={editLeadField}
                      onDelete={removeLeadField}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Stage Rules & Actions Dialog */}
          <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStage?.name} - {t('settings.funnels.stage-config')}
                </DialogTitle>
              </DialogHeader>

              {editingStage && (
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="entry-rules" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <span className="font-medium">{t('settings.funnels.entry-rules')}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="py-3 border-t">
                        <StageEntryRulesSection
                          stage={editingStage}
                          onUpdate={handleUpdateStageRules}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="stage-actions" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <span className="font-medium">{t('settings.funnels.stage-actions')}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="py-3 border-t">
                        <StageActionsSection
                          actions={editingStage.actions}
                          onUpdate={handleUpdateStageActions}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('settings.crm-panel.products.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.crm-panel.products.description')}
                  </p>
                </div>
              </div>
              {hasProductChanges() && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetProductSettings} disabled={saving}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={saveProductSettings} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              )}
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Categories, moved out of the Products menu — they are set up
                  once and then referenced, which is configuration, not a
                  destination people navigate to. */}
              <AccordionItem value="product-categories" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.crm-panel.product-categories')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 border-t">
                    <Suspense fallback={<PanelFallback />}>
                      <ManageProductCategories embedded />
                    </Suspense>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="default-behavior" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.products.default-behavior')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <ProductBehaviorSection 
                      settings={settings.product_settings} 
                      onUpdate={updateProductSettings} 
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="custom-fields" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <List className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.products.custom-fields')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <CustomFieldsSection
                      fields={customProductFields}
                      saving={customFieldsSaving}
                      onAdd={addCustomField}
                      onEdit={editCustomField}
                      onDelete={removeCustomField}
                    />
                    <div className="mt-8 pt-8 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        Model Field Groups
                      </h4>
                      <ModelFieldGroupsSection />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('settings.crm-panel.sales.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.crm-panel.sales.description')}
                  </p>
                </div>
              </div>
              {(hasSalesChanges() || hasProductChanges()) && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { resetSalesSettings(); resetProductSettings(); }} disabled={saving}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={saveSalesSettings} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              )}
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="deal-rules" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <List className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.sales.deal-rules')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <DealRulesSection settings={settings.sales_settings} onUpdate={updateSalesSettings} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pricing-rules" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.products.pricing-rules')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <PricingRulesSection 
                      settings={settings.product_settings} 
                      onUpdate={updateProductSettings} 
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('settings.appointments.types-title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appointments.types-description')}
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="appointment-types" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.appointments.types-title')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <AppointmentTypesSection />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>

        {/* Tags Tab — tags span leads, deals and tasks, so they sit on their
            own rather than under any one of the entity tabs. */}
        <TabsContent value="tags" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('settings.crm-panel.tabs.tags')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.crm-panel.tags-description')}
                </p>
              </div>
            </div>

            <Suspense fallback={<PanelFallback />}>
              <TagsDashboard embedded />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmPanel;

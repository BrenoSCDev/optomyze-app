import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import OptoIcon from '@/assets/opto-icon.png';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bell, Package, DollarSign, Settings, List, Tag, Zap, Shield, Clock, XCircle, ArrowRightLeft, CheckSquare, Mail, Users, BarChart3, Moon, FileText, Send, FileStack } from 'lucide-react';
import { IoFunnelOutline } from 'react-icons/io5';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSettingsPanel } from '@/hooks/useSettingsPanel';
import { useFunnelSettings } from '@/hooks/useFunnelSettings';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useCustomProductFields } from '@/hooks/useCustomProductFields';
import { FunnelStage } from '@/services/funnelSettingsApi';

// Product Settings
import ProductBehaviorSection from './products/ProductBehaviorSection';
import CustomFieldsSection from './products/CustomFieldsSection';
import PricingRulesSection from './products/PricingRulesSection';

// Sales Settings
import PipelinesSection from './sales/PipelinesSection';
import DealDefaultsSection from './sales/DealDefaultsSection';
import DealRulesSection from './sales/DealRulesSection';
import CommissionsSection from './sales/CommissionsSection';
// import NotificationsSection from './sales/NotificationsSection'; // Moved to global Notifications tab
import AutomationsSection from './sales/AutomationsSection';
import PermissionsSection from './sales/PermissionsSection';

// Funnel Settings
import FunnelStructureSection from './funnels/FunnelStructureSection';
import FunnelTemplatesSection from './funnels/FunnelTemplatesSection';
import StageEntryRulesSection from './funnels/StageEntryRulesSection';
import AutomatedTransitionsSection from './funnels/AutomatedTransitionsSection';
import StageActionsSection from './funnels/StageActionsSection';
import InactivityRulesSection from './funnels/InactivityRulesSection';
import LossHandlingSection from './funnels/LossHandlingSection';
import ConversionSettingsSection from './funnels/ConversionSettingsSection';

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

const CrmPanel = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('notifications');
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  const {
    settings,
    loading,
    saving,
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
    loading: notificationLoading,
    saving: notificationSaving,
    hasChanges: hasNotificationChanges,
    updateChannels,
    updateDefaultRecipients,
    updateEvent,
    updateFrequency,
    updateQuietHours,
    updateTemplate,
    addTemplate,
    deleteTemplate,
    saveSettings: saveNotificationSettings,
    resetChanges: resetNotificationChanges,
  } = useNotificationSettings();

  const {
    fields: customProductFields,
    loading: customFieldsLoading,
    saving: customFieldsSaving,
    addField: addCustomField,
    editField: editCustomField,
    removeField: removeCustomField,
  } = useCustomProductFields();

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

  if (loading || funnelLoading || notificationLoading || customFieldsLoading) {
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
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.crm-panel.tabs.notifications')}</span>
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
              {hasNotificationChanges() && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetNotificationChanges} disabled={notificationSaving}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={saveNotificationSettings} disabled={notificationSaving}>
                    {notificationSaving ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              )}
            </div>

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
                      enabledChannels={notificationSettings.channels}
                      onUpdate={updateEvent}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Frequency Control - Coming Soon */}
              {/* <AccordionItem value="frequency" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.notifications.frequency.title')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <FrequencyControlSection
                      frequency={notificationSettings.frequency}
                      onUpdate={updateFrequency}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem> */}

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

              {/* Templates - Coming Soon */}
              {/* <AccordionItem value="templates" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.notifications.templates.title')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <NotificationTemplatesSection
                      templates={notificationSettings.templates}
                      onUpdate={updateTemplate}
                      onAdd={addTemplate}
                      onDelete={deleteTemplate}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem> */}

              {/* Preview & Test */}
              <AccordionItem value="preview" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Send className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.notifications.preview.title')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <NotificationPreviewSection
                      events={notificationSettings.events}
                      templates={notificationSettings.templates}
                      enabledChannels={notificationSettings.channels}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
                      onEditStage={handleEditStage}
                      onCreateFunnelFromTemplate={createFunnelFromTemplate}
                      onAddTemplateStage={addTemplateStage}
                      onUpdateTemplateStage={updateTemplateStage}
                      onDeleteTemplateStage={deleteTemplateStage}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Automated Transitions */}
              <AccordionItem value="transitions" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <ArrowRightLeft className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.funnels.auto-transitions')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <AutomatedTransitionsSection
                      transitions={funnelSettings.automatedTransitions}
                      funnels={regularFunnels}
                      onUpdate={(transitions) => updateFunnelSettings({ automatedTransitions: transitions })}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Inactivity Rules */}
              <AccordionItem value="inactivity" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.funnels.inactivity-rules')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <InactivityRulesSection
                      rules={funnelSettings.inactivityRules}
                      onUpdate={(rules) => updateFunnelSettings({ inactivityRules: rules })}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Conversion Settings */}
              <AccordionItem value="conversion" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <CheckSquare className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.funnels.conversion-settings')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <ConversionSettingsSection
                      settings={funnelSettings.conversionSettings}
                      onUpdate={(settings) => updateFunnelSettings({ conversionSettings: settings })}
                    />
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
                    <LossHandlingSection
                      settings={funnelSettings.lossHandlingSettings}
                      onUpdate={(settings) => updateFunnelSettings({ lossHandlingSettings: settings })}
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
              {hasSalesChanges() && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetSalesSettings} disabled={saving}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={saveSalesSettings} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              )}
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="pipelines" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <IoFunnelOutline className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.sales.pipelines')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <PipelinesSection settings={settings.sales_settings} onUpdate={updateSalesSettings} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="deal-defaults" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.sales.deal-defaults')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <DealDefaultsSection settings={settings.sales_settings} onUpdate={updateSalesSettings} />
                  </div>
                </AccordionContent>
              </AccordionItem>

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

              <AccordionItem value="commissions" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.sales.commissions')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <CommissionsSection settings={settings.sales_settings} onUpdate={updateSalesSettings} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Notifications moved to global Notifications tab */}

              <AccordionItem value="automations" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.sales.automations')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <AutomationsSection settings={settings.sales_settings} onUpdate={updateSalesSettings} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="permissions" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.sales.permissions')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <PermissionsSection settings={settings.sales_settings} onUpdate={updateSalesSettings} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmPanel;

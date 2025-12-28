import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import OptoIcon from '@/assets/opto-icon.png';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bell, Package, DollarSign, Settings, List, Tag, Users, Zap, Shield } from 'lucide-react';
import { IoFunnelOutline } from 'react-icons/io5';
import { Button } from '@/components/ui/button';
import { useSettingsPanel } from '@/hooks/useSettingsPanel';

// Product Settings
import ProductBehaviorSection from './products/ProductBehaviorSection';
import CustomFieldsSection from './products/CustomFieldsSection';
import PricingRulesSection from './products/PricingRulesSection';

// Sales Settings
import PipelinesSection from './sales/PipelinesSection';
import DealDefaultsSection from './sales/DealDefaultsSection';
import DealRulesSection from './sales/DealRulesSection';
import CommissionsSection from './sales/CommissionsSection';
import NotificationsSection from './sales/NotificationsSection';
import AutomationsSection from './sales/AutomationsSection';
import PermissionsSection from './sales/PermissionsSection';

const CrmPanel = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('notifications');
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

  if (loading) {
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
            <div className="flex items-center gap-3 mb-6">
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('settings.crm-panel.notifications.placeholder')}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Funnels Tab */}
        <TabsContent value="funnels" className="mt-0">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <IoFunnelOutline className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('settings.crm-panel.funnels.placeholder')}
              </p>
            </div>
          </div>
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
                      settings={settings.product_settings} 
                      onUpdate={updateProductSettings} 
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

              <AccordionItem value="notifications" className="border rounded-lg px-4 bg-background/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {t('settings.sales.notifications')}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 px-2 border-t">
                    <NotificationsSection settings={settings.sales_settings} onUpdate={updateSalesSettings} />
                  </div>
                </AccordionContent>
              </AccordionItem>

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

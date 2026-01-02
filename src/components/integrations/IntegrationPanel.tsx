/**
 * INTEGRATION PANEL - Integration Instance Management
 * 
 * Page for managing integration instances like WhatsApp Evolution API.
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, AlertCircle, Store } from 'lucide-react';
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Alert, AlertDescription } from '../ui/alert';
import api from '../../services/api';

interface AvailableIntegrations {
  n8n_available: boolean;
  meta_ads_available: boolean;
  google_ads_available: boolean;
  wpp_evo_available: boolean;
}

const IntegrationPanel: React.FC = () => {
  const { t } = useLanguage();
  const [integrations, setIntegrations] = useState<AvailableIntegrations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableIntegrations();
  }, []);

  const fetchAvailableIntegrations = async () => {
    try {
      const response = await api.get('/api/integrations/available');
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error fetching available integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = () => {
    // Will be implemented - placeholder for now
    console.log('Create WhatsApp instance');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <span>{t('nav.settings')}</span>
            <ChevronRight className="w-4 h-4" />
            <span>{t('nav.integrations')}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{t('integrations.panel.title')}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('integrations.panel.title')}</h1>
          <p className="text-muted-foreground">
            {t('integrations.panel.description')}
          </p>
        </div>

        {/* Integrations Accordions */}
        {loading ? (
          <div className="glass-card p-8 text-center">
            <div className="animate-pulse text-muted-foreground">
              {t('common.loading')}...
            </div>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {/* WhatsApp Accordion */}
            <AccordionItem value="whatsapp" className="glass-card border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <SiWhatsapp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">WhatsApp (Evolution API)</h3>
                    <p className="text-sm text-muted-foreground">
                      {integrations?.wpp_evo_available 
                        ? t('integrations.panel.whatsapp.available')
                        : t('integrations.panel.whatsapp.not-available')}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {integrations?.wpp_evo_available ? (
                  <div className="space-y-4">
                    {/* Instances List Placeholder */}
                    <div className="border border-border rounded-lg p-4 text-center text-muted-foreground">
                      {t('integrations.panel.whatsapp.no-instances')}
                    </div>
                    
                    {/* Create Instance Button */}
                    <Button onClick={handleCreateInstance} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('integrations.panel.create-instance')}
                    </Button>
                  </div>
                ) : (
                  <Alert className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Store className="h-5 w-5 mt-0.5 shrink-0" />
                      <AlertDescription>
                        {t('integrations.panel.whatsapp.install-message')}
                      </AlertDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="shrink-0 w-full sm:w-auto"
                      onClick={() => window.location.href = '/?section=integrations'}
                    >
                      <Store className="w-4 h-4 mr-2" />
                      {t('integrations.panel.go-to-app-store')}
                    </Button>
                  </Alert>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default IntegrationPanel;

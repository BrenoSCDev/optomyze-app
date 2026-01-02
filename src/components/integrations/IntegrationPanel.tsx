/**
 * INTEGRATION PANEL - WhatsApp Instance Management
 * 
 * Placeholder page for managing WhatsApp Evolution API instances.
 * This page will allow users to create and manage WhatsApp instances.
 */

import React from 'react';
import { ChevronRight, Settings2, Smartphone, Plus } from 'lucide-react';
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/button';

const IntegrationPanel: React.FC = () => {
  const { t } = useLanguage();

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

        {/* Placeholder Content */}
        <div className="glass-card p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <SiWhatsapp className="w-12 h-12 text-green-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-3">
            {t('integrations.panel.coming-soon-title')}
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            {t('integrations.panel.coming-soon-description')}
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="glass-card p-4 opacity-60">
              <Smartphone className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                {t('integrations.panel.feature-instances')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('integrations.panel.feature-instances-desc')}
              </p>
            </div>
            
            <div className="glass-card p-4 opacity-60">
              <Settings2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                {t('integrations.panel.feature-config')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('integrations.panel.feature-config-desc')}
              </p>
            </div>
            
            <div className="glass-card p-4 opacity-60">
              <Plus className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                {t('integrations.panel.feature-connect')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('integrations.panel.feature-connect-desc')}
              </p>
            </div>
          </div>

          <Button disabled variant="outline" className="opacity-60">
            <Plus className="w-4 h-4 mr-2" />
            {t('integrations.panel.create-instance')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationPanel;

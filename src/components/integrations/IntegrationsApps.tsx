/**
 * INTEGRATIONS APPS PAGE
 * 
 * Displays available app integrations in a card grid format with dynamic status checking.
 * Features:
 * - Responsive grid layout (3/2/1 columns for desktop/tablet/mobile)
 * - n8n integration with live status checking via API
 * - Loading states and error handling
 * - Coming soon placeholders for future integrations
 * - Glassmorphism design matching the app theme
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Package, 
  AlertCircle, 
  ChevronRight 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { SiN8N, SiGoogleanalytics, SiGoogleads } from "react-icons/si";
import { FaMeta } from "react-icons/fa6";
import { useToast } from '../../hooks/use-toast';
import { Check } from 'lucide-react';
import N8nConfigModal from './N8nConfigModal';
import MetaAdsConfigModal from './MetaAdsConfigModal';
import GoogleAdsConfigModal from './GoogleAdsConfigModal';

interface Integration {
  key: string;
  name: string;
  description: string;
  category: string;
  available: boolean;
  status?: string;
  lastUpdated?: string;
  comingSoon?: boolean;
}

interface IntegrationCardProps {
  integration: Integration;
  onAction: (key: string, action: string) => Promise<void>;
  loading?: boolean;
  installing?: boolean;
  justInstalled?: boolean;
}

// Integration Card Component
const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
  integration, 
  onAction, 
  loading = false, 
  installing = false,
  justInstalled = false 
}) => {
  const { t } = useLanguage();
  const getActionButton = () => {
    if (loading) {
      return (
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-muted/50 text-muted-foreground rounded-lg cursor-not-allowed"
        >
          <div className="animate-spin w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
          {t('integrations.checking')}
        </button>
      );
    }

    if (installing) {
      return (
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary/50 text-primary-foreground rounded-lg cursor-not-allowed"
        >
          <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
          Installing {integration.name}...
        </button>
      );
    }

    if (justInstalled) {
      return (
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg animate-pulse"
        >
          <Check className="w-4 h-4" />
          {t('integrations.installed')}
        </button>
      );
    }

    if (integration.comingSoon) {
      return (
        <button
          disabled
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-muted/30 text-muted-foreground rounded-lg cursor-not-allowed"
        >
          <Package className="w-4 h-4" />
          {t('integrations.coming-soon')}
        </button>
      );
    }

    if (integration.available) {
      return (
        <button
          onClick={() => onAction(integration.key, 'configure')}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors group"
        >
          <Settings className="w-4 h-4" />
          {t('integrations.configure')}
        </button>
      );
    } else {
      return (
        <button
          onClick={() => onAction(integration.key, 'install')}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors group"
        >
          <Download className="w-4 h-4" />
          {t('integrations.install')}
        </button>
      );
    }
  };

  return (
    <div className="glass-card p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
      <div className="flex items-start gap-4">
        {/* Integration Logo/Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-card flex-shrink-0">
          {integration.key === "n8n" ? (
            <SiN8N className="w-10 h-10 text-muted-foreground" />
          ) : integration.key === "google-ads" ? (
            <SiGoogleads className="w-8 h-8 text-muted-foreground" />
          ) : integration.key === "google-analytics" ? (
            <SiGoogleanalytics className="w-8 h-8 text-muted-foreground" />
          ) : integration.key === "meta-ads" ? (
            <FaMeta className="w-10 h-10 text-muted-foreground" />
          ) : (
            <Package className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Integration Content */}
        <div className="flex-1 min-w-0">
          {/* Integration Name and Status */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-foreground">
              {integration.name}
            </h3>
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0
              ${integration.comingSoon 
                ? 'bg-muted/20 text-muted-foreground border-muted/30'
                : integration.available 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }
            `}>
              {integration.comingSoon ? t('integrations.coming-soon') : integration.available ? t('integrations.available') : t('integrations.not-installed')}
            </span>
          </div>

          {/* Integration Description */}
          <p className="text-muted-foreground text-sm mb-4">
            {integration.description}
          </p>

          {/* Action Button and Additional Info */}
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              {getActionButton()}
            </div>
            
            {/* Additional Info */}
            {integration.available && integration.lastUpdated && (
              <div className="text-xs text-muted-foreground flex-shrink-0">
                Updated: {integration.lastUpdated}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Apps Page Component
const IntegrationsApps: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [installingIntegrations, setInstallingIntegrations] = useState<Set<string>>(new Set());
  const [justInstalledIntegrations, setJustInstalledIntegrations] = useState<Set<string>>(new Set());
  const [showN8nConfigModal, setShowN8nConfigModal] = useState(false);
  const [showMetaAdsConfigModal, setShowMetaAdsConfigModal] = useState(false);
  const [showGoogleAdsConfigModal, setShowGoogleAdsConfigModal] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

// Define available integrations
const availableIntegrations: Integration[] = [
  {
    key: 'n8n',
    name: t('integrations.n8n.name'),
    description: t('integrations.n8n.description'),
    category: 'automation',
    available: false, // Will be updated from API
    lastUpdated: undefined
  },
  {
    key: 'google-ads',
    name: t('integrations.google-ads.name'),
    description: t('integrations.google-ads.description'),
    category: 'ads',
    available: false,
    comingSoon: false // Can be installed
  },
  {
    key: 'google-analytics',
    name: t('integrations.google-analytics.name'),
    description: t('integrations.google-analytics.description'),
    category: 'analytics',
    available: false,
    comingSoon: true
  },
  {
    key: 'meta-ads',
    name: t('integrations.meta-ads.name'),
    description: t('integrations.meta-ads.description'),
    category: 'ads',
    available: false,
    comingSoon: false // Can be installed
  }
];


  // Fetch integration statuses
  const fetchIntegrationStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check all integrations status
      const response = await api.get('/api/integrations/available');

      // Update integrations with API data
      const updatedIntegrations = availableIntegrations.map(integration => {
        // Map integration key to API response key (e.g., 'n8n' -> 'n8n_available')
        const apiKey = `${integration.key.replace('-', '_')}_available`;
        const isAvailable = response.data[apiKey] || false;

        return {
          ...integration,
          available: isAvailable,
          comingSoon: integration.comingSoon && !isAvailable, // Remove "coming soon" if available
        };
      });

      setIntegrations(updatedIntegrations);

    } catch (err) {
      console.error('Error fetching integration statuses:', err);
      setError(err as Error);
      // Set default integrations even on error
      setIntegrations(availableIntegrations);
    } finally {
      setLoading(false);
    }
  };

  // Handle integration actions
  const handleIntegrationAction = async (integrationKey: string, action: string) => {
    console.log(`Action: ${action} for integration: ${integrationKey}`);
    
    if (action === 'configure') {
      if (integrationKey === 'n8n') {
        setShowN8nConfigModal(true);
      } else if (integrationKey === 'meta-ads') {
        setShowMetaAdsConfigModal(true);
      } else if (integrationKey === 'google-ads') {
        setShowGoogleAdsConfigModal(true);
      } else {
        toast({
          title: t('integrations.configuration'),
          description: `Configure ${integrationKey} integration - Coming soon!`,
        });
      }
    } else if (action === 'install') {
      await installIntegration(integrationKey);
    }
  };

  // Install integration (scalable for all integrations)
  const installIntegration = async (integrationKey: string) => {
    try {
      // Add to installing state
      setInstallingIntegrations(prev => new Set(prev).add(integrationKey));

      // Convert key to API endpoint (e.g., 'n8n' -> 'n8n-integrations', 'meta-ads' -> 'meta-ads')
      const endpoint = integrationKey === 'n8n' 
        ? '/api/integrations/n8n-integrations' 
        : `/api/integrations/${integrationKey}`;

      // Make API call to install integration
      const response = await api.post(endpoint);

      // Update integration state to available
      setIntegrations(prev => prev.map(integration => 
        integration.key === integrationKey 
          ? { 
              ...integration, 
              available: true, 
              status: 'active',
              comingSoon: false,
            }
          : integration
      ));

      // Show success state briefly
      setJustInstalledIntegrations(prev => new Set(prev).add(integrationKey));
      
      const integrationName = integrations.find(i => i.key === integrationKey)?.name || integrationKey;
      toast({
        title: t('integrations.installation-successful'),
        description: `${integrationName} has been installed successfully!`,
      });

      // Clear just installed state after animation
      setTimeout(() => {
        setJustInstalledIntegrations(prev => {
          const newSet = new Set(prev);
          newSet.delete(integrationKey);
          return newSet;
        });
      }, 2000);

    } catch (error) {
      console.error(`Error installing ${integrationKey} integration:`, error);
      const integrationName = integrations.find(i => i.key === integrationKey)?.name || integrationKey;
      toast({
        title: t('integrations.installation-failed'),
        description: `Failed to install ${integrationName}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      // Remove from installing state
      setInstallingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integrationKey);
        return newSet;
      });
    }
  };

  // Handle n8n configuration saved
  const handleN8nConfigSaved = () => {
    // Optionally refresh integration status or show success feedback
    fetchIntegrationStatuses();
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchIntegrationStatuses();
  }, []);

  // Error state
  if (error && integrations.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 text-center border-red-500/20">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('integrations.failed-to-load')}</h3>
            <p className="text-muted-foreground mb-4">{t('integrations.unable-to-check')}</p>
            <button
              onClick={fetchIntegrationStatuses}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('integrations.try-again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Coming soon integrations for display
  const comingSoonIntegrations = [
    'Slack', 'Discord', 'Telegram', 'WhatsApp', 
    'HubSpot', 'Salesforce', 'Pipedrive', 'Mailchimp'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <span>{t('nav.settings')}</span>
            <ChevronRight className="w-4 h-4" />
            <span>{t('nav.integrations')}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Apps</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('integrations.title')}</h1>
          <p className="text-muted-foreground">
            {t('integrations.description')}
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.key}
              integration={integration}
              onAction={handleIntegrationAction}
              loading={loading && integration.key === 'n8n'}
              installing={installingIntegrations.has(integration.key)}
              justInstalled={justInstalledIntegrations.has(integration.key)}
            />
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">{t('integrations.more-coming-soon')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {comingSoonIntegrations.map((name) => (
              <div key={name} className="glass-card p-4 text-center border-muted/20">
                <div className="w-8 h-8 bg-muted/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* n8n Configuration Modal */}
        <N8nConfigModal
          open={showN8nConfigModal}
          onOpenChange={setShowN8nConfigModal}
          onConfigurationSaved={handleN8nConfigSaved}
        />

        {/* Meta Ads Configuration Modal */}
        <MetaAdsConfigModal
          open={showMetaAdsConfigModal}
          onOpenChange={setShowMetaAdsConfigModal}
          onConfigurationSaved={handleN8nConfigSaved}
        />

        {/* Google Ads Configuration Modal */}
        <GoogleAdsConfigModal
          open={showGoogleAdsConfigModal}
          onOpenChange={setShowGoogleAdsConfigModal}
          onConfigurationSaved={handleN8nConfigSaved}
        />
      </div>
    </div>
  );
};

export default IntegrationsApps;
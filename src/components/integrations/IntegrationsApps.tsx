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
import api from '../../services/api';
import { SiN8N, SiGoogleanalytics } from "react-icons/si";
import { FaMeta } from "react-icons/fa6";
import { FaGoogle } from "react-icons/fa";
import { useToast } from '../../hooks/use-toast';
import { Check } from 'lucide-react';

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
  installProgress?: number;
}

// Integration Card Component
const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
  integration, 
  onAction, 
  loading = false, 
  installing = false,
  justInstalled = false,
  installProgress = 0
}) => {
  const getActionButton = () => {
    if (loading) {
      return (
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-muted/50 text-muted-foreground rounded-lg cursor-not-allowed"
        >
          <div className="animate-spin w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
          Checking...
        </button>
      );
    }

    if (installing) {
      return (
        <div className="w-full space-y-3">
          <div className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary/50 text-primary-foreground rounded-lg">
            <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            Installing n8n...
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      );
    }

    if (justInstalled) {
      return (
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg animate-pulse"
        >
          <Check className="w-4 h-4" />
          Installed!
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
          Coming Soon
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
          Configure
        </button>
      );
    } else {
      return (
        <button
          onClick={() => onAction(integration.key, 'install')}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors group"
        >
          <Download className="w-4 h-4" />
          Install
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
            <FaGoogle className="w-8 h-8 text-muted-foreground" />
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
              {integration.comingSoon ? 'Coming Soon' : integration.available ? 'Available' : 'Not Installed'}
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
  const [installProgress, setInstallProgress] = useState<{ [key: string]: number }>({});
  const { token } = useAuth();
  const { toast } = useToast();

// Define available integrations
const availableIntegrations: Integration[] = [
  {
    key: 'n8n',
    name: 'n8n',
    description: 'Powerful workflow automation tool for connecting your apps and services seamlessly.',
    category: 'automation',
    available: false, // Will be updated from API
    lastUpdated: undefined
  },
  {
    key: 'google-ads',
    name: 'Google Ads',
    description: 'Integrate with Google Ads to sync campaigns, track performance, and optimize leads.',
    category: 'ads',
    available: false,
    comingSoon: true
  },
  {
    key: 'google-analytics',
    name: 'Google Analytics',
    description: 'Connect to Google Analytics for tracking website and campaign performance.',
    category: 'analytics',
    available: false,
    comingSoon: true
  },
  {
    key: 'meta-ads',
    name: 'Meta Ads',
    description: 'Integrate with Meta Ads (Facebook & Instagram) to manage and analyze ad campaigns.',
    category: 'ads',
    available: false,
    comingSoon: true
  }
];


  // Fetch integration statuses
  const fetchIntegrationStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check n8n integration status
      const n8nResponse = await api.get('/api/integrations/available');

      // Update integrations with API data
      const updatedIntegrations = availableIntegrations.map(integration => {
        if (integration.key === 'n8n') {
          return {
            ...integration,
            available: n8nResponse.data.n8n_available,
            status: n8nResponse.data.status,
            lastUpdated: n8nResponse.data.last_updated || undefined
          };
        }
        return integration;
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
      // TODO: Open configuration modal or navigate to config page
      toast({
        title: "Configuration",
        description: `Configure ${integrationKey} integration - Coming soon!`,
      });
    } else if (action === 'install') {
      if (integrationKey === 'n8n') {
        await installN8nIntegration();
      } else {
        toast({
          title: "Installation",
          description: `Install ${integrationKey} integration - Coming soon!`,
        });
      }
    }
  };

  // Install n8n integration
  const installN8nIntegration = async () => {
    try {
      // Add to installing state
      setInstallingIntegrations(prev => new Set(prev).add('n8n'));
      setInstallProgress(prev => ({ ...prev, n8n: 0 }));

      // Start progress animation
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => ({
          ...prev,
          n8n: Math.min((prev.n8n || 0) + Math.random() * 15, 85)
        }));
      }, 200);

      // Make API call to install n8n integration
      const response = await api.post('/api/integrations/n8n-integrations');

      // Complete progress bar
      setTimeout(() => {
        setInstallProgress(prev => ({ ...prev, n8n: 100 }));
        clearInterval(progressInterval);
        
        // Delay showing success state for 1.5 seconds to extend loading effect
        setTimeout(() => {
          // Update integration state to available
          setIntegrations(prev => prev.map(integration => 
            integration.key === 'n8n' 
              ? { 
                  ...integration, 
                  available: true, 
                  status: 'active',
                }
              : integration
          ));

          // Show success state briefly
          setJustInstalledIntegrations(prev => new Set(prev).add('n8n'));
          
          toast({
            title: "Installation Successful",
            description: "n8n integration has been installed successfully!",
          });
        }, 1500);
      }, 300);

      // Clear just installed state after animation
      setTimeout(() => {
        setJustInstalledIntegrations(prev => {
          const newSet = new Set(prev);
          newSet.delete('n8n');
          return newSet;
        });
      }, 2000);

    } catch (error) {
      console.error('Error installing n8n integration:', error);
      // Clear progress interval on error
      setInstallProgress(prev => ({ ...prev, n8n: 0 }));
      toast({
        title: "Installation Failed",
        description: "Failed to install n8n integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from installing state
      setInstallingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete('n8n');
        return newSet;
      });
    }
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Integrations</h3>
            <p className="text-muted-foreground mb-4">Unable to check integration availability</p>
            <button
              onClick={fetchIntegrationStatuses}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
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
            <span>Settings</span>
            <ChevronRight className="w-4 h-4" />
            <span>Integrations</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Apps</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">App Integrations</h1>
          <p className="text-muted-foreground">
            Connect Optomyze with your favorite tools and services to automate your workflow.
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
              installProgress={installProgress[integration.key] || 0}
            />
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">More Integrations Coming Soon</h2>
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
      </div>
    </div>
  );
};

export default IntegrationsApps;
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
  onAction: (key: string, action: string) => void;
  loading?: boolean;
}

// Integration Card Component
const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration, onAction, loading = false }) => {
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
      {/* Integration Logo/Icon */}
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-lg bg-card">
        {integration.key === 'n8n' ? (
          <div className="text-2xl font-bold text-primary">n8n</div>
        ) : (
          <Package className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      {/* Integration Name */}
      <h3 className="text-xl font-semibold text-foreground text-center mb-2">
        {integration.name}
      </h3>

      {/* Integration Description */}
      <p className="text-muted-foreground text-sm text-center mb-4 min-h-[40px]">
        {integration.description}
      </p>

      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        <span className={`
          px-3 py-1 rounded-full text-xs font-medium border
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

      {/* Action Button */}
      {getActionButton()}

      {/* Additional Info */}
      {integration.available && integration.lastUpdated && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {integration.lastUpdated}
          </p>
        </div>
      )}
    </div>
  );
};

// Main Apps Page Component
const IntegrationsApps: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

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
      key: 'zapier',
      name: 'Zapier',
      description: 'Connect Optomyze with 5000+ apps through Zapier\'s automation platform.',
      category: 'automation',
      available: false,
      comingSoon: true
    },
    {
      key: 'make',
      name: 'Make',
      description: 'Visual platform for creating, building and automating workflows.',
      category: 'automation', 
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
      const n8nResponse = await api.get('/api/integrations/n8n-integrations');

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
      alert(`Configure ${integrationKey} integration - Coming soon!`);
    } else if (action === 'install') {
      // TODO: Start installation process
      alert(`Install ${integrationKey} integration - Coming soon!`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.key}
              integration={integration}
              onAction={handleIntegrationAction}
              loading={loading && integration.key === 'n8n'}
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
/**
 * INTEGRATIONS APPS PAGE
 * 
 * Displays available app integrations organized by category.
 * Categories:
 * - Ads & Analytics
 * - Social Messaging Platforms
 * - Artificial Intelligence (Coming Soon)
 * - Automation Platforms
 * - Google Apps (Coming Soon)
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Package, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  MessageCircle,
  Bot,
  Workflow,
  Calendar,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { 
  SiN8N, 
  SiGoogleanalytics, 
  SiGoogleads,
  SiWhatsapp,
  SiInstagram,
  SiFacebook,
  SiTelegram,
  SiOpenai,
  SiGooglecalendar,
  SiGooglesheets,
  SiGmail
} from "react-icons/si";
import { FaMeta } from "react-icons/fa6";
import { useToast } from '../../hooks/use-toast';
import N8nConfigModal from './N8nConfigModal';
import MetaAdsConfigModal from './MetaAdsConfigModal';
import GoogleAdsConfigModal from './GoogleAdsConfigModal';
import { Badge } from '@/components/ui/badge';

interface Integration {
  key: string;
  name: string;
  description: string;
  available: boolean;
  status?: string;
  lastUpdated?: string;
  comingSoon?: boolean;
  icon: React.ReactNode;
}

interface IntegrationCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  integrations: Integration[];
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
  const isDisabled = integration.comingSoon || loading || installing;

  const getActionButton = () => {
    if (loading) {
      return (
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-muted/50 text-muted-foreground rounded-lg cursor-not-allowed text-sm"
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
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary/50 text-primary-foreground rounded-lg cursor-not-allowed text-sm"
        >
          <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
          {t('integrations.installing')}...
        </button>
      );
    }

    if (justInstalled) {
      return (
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg animate-pulse text-sm"
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
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-muted/30 text-muted-foreground rounded-lg cursor-not-allowed text-sm"
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
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          {t('integrations.configure')}
        </button>
      );
    } else {
      return (
        <button
          onClick={() => onAction(integration.key, 'install')}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          {t('integrations.install')}
        </button>
      );
    }
  };

  return (
    <div 
      className={`glass-card p-5 transition-all duration-300 relative ${
        integration.comingSoon 
          ? 'opacity-60 hover:border-muted/30' 
          : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20'
      }`}
    >
      {/* Status Badge */}
      {integration.comingSoon ? (
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-muted/50 text-muted-foreground text-xs"
        >
          {t('integrations.coming-soon')}
        </Badge>
      ) : integration.available ? (
        <Badge 
          className="absolute top-3 right-3 bg-green-500/20 text-green-400 border-green-500/30 text-xs"
        >
          <Check className="w-3 h-3 mr-1" />
          {t('integrations.available')}
        </Badge>
      ) : null}

      <div className="flex flex-col h-full">
        {/* Icon */}
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
          integration.comingSoon 
            ? 'bg-muted/30 text-muted-foreground' 
            : 'bg-primary/10 text-primary'
        }`}>
          {integration.icon}
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-foreground mb-2">
          {integration.name}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
          {integration.description}
        </p>

        {/* Action Button */}
        {getActionButton()}
      </div>
    </div>
  );
};

// Category Section Component
interface CategorySectionProps {
  category: IntegrationCategory;
  onAction: (key: string, action: string) => Promise<void>;
  loading: boolean;
  installingIntegrations: Set<string>;
  justInstalledIntegrations: Set<string>;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  onAction,
  loading,
  installingIntegrations,
  justInstalledIntegrations
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          category.comingSoon 
            ? 'bg-muted/30 text-muted-foreground' 
            : 'bg-primary/10 text-primary'
        }`}>
          {category.icon}
        </div>
        <h2 className={`text-lg font-semibold ${
          category.comingSoon ? 'text-muted-foreground' : 'text-foreground'
        }`}>
          {category.title}
        </h2>
        {category.comingSoon && (
          <Badge variant="outline" className="text-xs border-accent/50 text-accent">
            {t('integrations.coming-soon')}
          </Badge>
        )}
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {category.integrations.map((integration) => (
          <IntegrationCard
            key={integration.key}
            integration={integration}
            onAction={onAction}
            loading={loading && integration.key === 'n8n'}
            installing={installingIntegrations.has(integration.key)}
            justInstalled={justInstalledIntegrations.has(integration.key)}
          />
        ))}
      </div>
    </div>
  );
};

// Main Apps Page Component
const IntegrationsApps: React.FC = () => {
  const [categories, setCategories] = useState<IntegrationCategory[]>([]);
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

  // Define categories with integrations
  const getInitialCategories = (): IntegrationCategory[] => [
    {
      id: 'ads-analytics',
      title: t('integrations.categories.ads-analytics') || 'Ads & Analytics',
      icon: <TrendingUp className="w-5 h-5" />,
      integrations: [
        {
          key: 'meta-ads',
          name: 'Meta Ads',
          description: t('integrations.meta-ads.description') || 'Connect your Meta Ads account to track and manage Facebook & Instagram advertising campaigns.',
          available: false,
          icon: <FaMeta className="w-6 h-6" />
        },
        {
          key: 'google-ads',
          name: 'Google Ads',
          description: t('integrations.google-ads.description') || 'Integrate Google Ads to monitor your search and display advertising performance.',
          available: false,
          icon: <SiGoogleads className="w-6 h-6" />
        },
        {
          key: 'google-analytics',
          name: 'Google Analytics',
          description: t('integrations.google-analytics.description') || 'Track website traffic and user behavior with Google Analytics integration.',
          available: false,
          icon: <SiGoogleanalytics className="w-6 h-6" />
        }
      ]
    },
    {
      id: 'social-messaging',
      title: t('integrations.categories.social-messaging') || 'Social Messaging Platforms',
      icon: <MessageCircle className="w-5 h-5" />,
      integrations: [
        {
          key: 'whatsapp',
          name: 'WhatsApp',
          description: t('integrations.whatsapp.description') || 'Connect WhatsApp Business to manage customer conversations directly from your CRM.',
          available: false,
          icon: <SiWhatsapp className="w-6 h-6" />
        },
        {
          key: 'instagram',
          name: 'Instagram',
          description: t('integrations.instagram.description') || 'Integrate Instagram DMs to engage with your audience and manage inquiries.',
          available: false,
          icon: <SiInstagram className="w-6 h-6" />
        },
        {
          key: 'facebook',
          name: 'Facebook',
          description: t('integrations.facebook.description') || 'Connect Facebook Messenger to handle customer messages from your Facebook page.',
          available: false,
          icon: <SiFacebook className="w-6 h-6" />
        },
        {
          key: 'telegram',
          name: 'Telegram',
          description: t('integrations.telegram.description') || 'Integrate Telegram to communicate with customers through bots or direct messages.',
          available: false,
          icon: <SiTelegram className="w-6 h-6" />
        }
      ]
    },
    {
      id: 'artificial-intelligence',
      title: t('integrations.categories.ai') || 'Artificial Intelligence',
      icon: <Bot className="w-5 h-5" />,
      comingSoon: true,
      integrations: [
        {
          key: 'openai',
          name: 'OpenAI',
          description: t('integrations.openai.description') || 'Leverage OpenAI GPT models for intelligent automation and customer interactions.',
          available: false,
          comingSoon: true,
          icon: <SiOpenai className="w-6 h-6" />
        },
        {
          key: 'gemini',
          name: 'Gemini',
          description: t('integrations.gemini.description') || 'Integrate Google Gemini for advanced AI capabilities and multimodal processing.',
          available: false,
          comingSoon: true,
          icon: <Bot className="w-6 h-6" />
        },
        {
          key: 'claude',
          name: 'Claude',
          description: t('integrations.claude.description') || 'Use Anthropic Claude for safe and helpful AI assistance in your workflows.',
          available: false,
          comingSoon: true,
          icon: <Bot className="w-6 h-6" />
        },
        {
          key: 'deepseek',
          name: 'DeepSeek',
          description: t('integrations.deepseek.description') || 'Integrate DeepSeek AI for powerful reasoning and code generation capabilities.',
          available: false,
          comingSoon: true,
          icon: <Bot className="w-6 h-6" />
        }
      ]
    },
    {
      id: 'automation',
      title: t('integrations.categories.automation') || 'Automation Platforms',
      icon: <Workflow className="w-5 h-5" />,
      integrations: [
        {
          key: 'n8n',
          name: 'n8n',
          description: t('integrations.n8n.description') || 'Connect n8n for powerful workflow automation and integration with hundreds of services.',
          available: false,
          icon: <SiN8N className="w-6 h-6" />
        }
      ]
    },
    {
      id: 'google-apps',
      title: t('integrations.categories.google-apps') || 'Google Apps',
      icon: <Calendar className="w-5 h-5" />,
      comingSoon: true,
      integrations: [
        {
          key: 'google-calendar',
          name: 'Google Calendar',
          description: t('integrations.google-calendar.description') || 'Sync appointments and meetings with Google Calendar for seamless scheduling.',
          available: false,
          comingSoon: true,
          icon: <SiGooglecalendar className="w-6 h-6" />
        },
        {
          key: 'google-sheets',
          name: 'Google Sheets',
          description: t('integrations.google-sheets.description') || 'Export and sync data with Google Sheets for reporting and analysis.',
          available: false,
          comingSoon: true,
          icon: <SiGooglesheets className="w-6 h-6" />
        },
        {
          key: 'gmail',
          name: 'Gmail',
          description: t('integrations.gmail.description') || 'Integrate Gmail to send and track emails directly from your CRM.',
          available: false,
          comingSoon: true,
          icon: <SiGmail className="w-6 h-6" />
        }
      ]
    }
  ];

  // Fetch integration statuses
  const fetchIntegrationStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/integrations/available');

      setCategories(prev => {
        const updated = prev.map(category => ({
          ...category,
          integrations: category.integrations.map(integration => {
            const apiKey = `${integration.key.replace('-', '_')}_available`;
            const isAvailable = response.data[apiKey] || false;
            return {
              ...integration,
              available: isAvailable,
              comingSoon: integration.comingSoon && !isAvailable
            };
          })
        }));
        return updated;
      });

    } catch (err) {
      console.error('Error fetching integration statuses:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Handle integration actions
  const handleIntegrationAction = async (integrationKey: string, action: string) => {
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

  // Install integration
  const installIntegration = async (integrationKey: string) => {
    try {
      setInstallingIntegrations(prev => new Set(prev).add(integrationKey));

      const endpoint = integrationKey === 'n8n' 
        ? '/api/integrations/n8n-integrations' 
        : `/api/integrations/${integrationKey}`;

      await api.post(endpoint);

      setCategories(prev => prev.map(category => ({
        ...category,
        integrations: category.integrations.map(integration => 
          integration.key === integrationKey 
            ? { ...integration, available: true, comingSoon: false }
            : integration
        )
      })));

      setJustInstalledIntegrations(prev => new Set(prev).add(integrationKey));
      
      toast({
        title: t('integrations.installation-successful'),
        description: `Integration installed successfully!`,
      });

      setTimeout(() => {
        setJustInstalledIntegrations(prev => {
          const newSet = new Set(prev);
          newSet.delete(integrationKey);
          return newSet;
        });
      }, 2000);

    } catch (error) {
      console.error(`Error installing ${integrationKey} integration:`, error);
      toast({
        title: t('integrations.installation-failed'),
        description: `Failed to install integration. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setInstallingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integrationKey);
        return newSet;
      });
    }
  };

  const handleConfigSaved = () => {
    fetchIntegrationStatuses();
  };

  useEffect(() => {
    setCategories(getInitialCategories());
    fetchIntegrationStatuses();
  }, []);

  // Error state
  if (error && categories.length === 0) {
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
            <span className="text-foreground">Apps</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('integrations.title')}</h1>
          <p className="text-muted-foreground">
            {t('integrations.description')}
          </p>
        </div>

        {/* Category Sections */}
        <div className="space-y-10">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onAction={handleIntegrationAction}
              loading={loading}
              installingIntegrations={installingIntegrations}
              justInstalledIntegrations={justInstalledIntegrations}
            />
          ))}
        </div>

        {/* Config Modals */}
        <N8nConfigModal
          open={showN8nConfigModal}
          onOpenChange={setShowN8nConfigModal}
          onConfigurationSaved={handleConfigSaved}
        />
        <MetaAdsConfigModal
          open={showMetaAdsConfigModal}
          onOpenChange={setShowMetaAdsConfigModal}
          onConfigurationSaved={handleConfigSaved}
        />
        <GoogleAdsConfigModal
          open={showGoogleAdsConfigModal}
          onOpenChange={setShowGoogleAdsConfigModal}
          onConfigurationSaved={handleConfigSaved}
        />
      </div>
    </div>
  );
};

export default IntegrationsApps;

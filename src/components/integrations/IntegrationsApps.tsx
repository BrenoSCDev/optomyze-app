/**
 * INTEGRATIONS APPS PAGE
 *
 * Marketplace-style catalog of available app integrations.
 * Supports search and category filters across a single dense grid
 * of branded integration cards.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Download,
  Package,
  AlertCircle,
  Bot,
  Check,
  Search,
  FlaskConical,
  Rocket,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import {
  SiGoogleanalytics,
  SiGoogleads,
  SiWhatsapp,
  SiInstagram,
  SiMessenger,
  SiTelegram,
  SiOpenai,
  SiGooglecalendar,
  SiGooglesheets,
  SiGmail
} from "react-icons/si";
import { FaMeta } from "react-icons/fa6";
import { useToast } from '../../hooks/use-toast';
import MetaAdsConfigModal from './MetaAdsConfigModal';
import GoogleAdsConfigModal from './GoogleAdsConfigModal';
import WhatsAppConfigModal from './WhatsAppConfigModal';
import InstagramConfigModal from './InstagramConfigModal';
import FacebookMessengerConfigModal from './FacebookMessengerConfigModal';
import OpenAiConfigModal from './OpenAiConfigModal';
import { Input } from '@/components/ui/input';
import { RiGeminiLine, RiClaudeFill, RiAppsFill } from "react-icons/ri";
import { cn } from '@/lib/utils';

interface Integration {
  key: string;
  name: string;
  description: string;
  available: boolean;
  comingSoon?: boolean;
  beta?: boolean;
  popular?: boolean;
  icon: React.ReactNode;
}

interface IntegrationCategory {
  id: string;
  title: string;
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

// Brand styling per integration - gives each card a distinct identity via
// a subtle tinted gradient, brand-colored icon, and matching hover glow.
interface BrandStyle {
  gradient: string;
  iconColor: string;
  hoverBorder: string;
  hoverShadow: string;
}

const BRAND_STYLES: Record<string, BrandStyle> = {
  wpp_evo: {
    gradient: 'bg-[linear-gradient(135deg,rgba(37,211,102,0.10),rgba(37,211,102,0.02))]',
    iconColor: 'text-[#25D366]',
    hoverBorder: 'hover:border-[#25D366]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(37,211,102,0.5)]',
  },
  instagram: {
    gradient: 'bg-[linear-gradient(135deg,rgba(225,48,108,0.10),rgba(255,204,0,0.04))]',
    iconColor: 'text-[#E1306C]',
    hoverBorder: 'hover:border-[#E1306C]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(225,48,108,0.5)]',
  },
  facebook: {
    gradient: 'bg-[linear-gradient(135deg,rgba(24,119,242,0.10),rgba(24,119,242,0.02))]',
    iconColor: 'text-[#1877F2]',
    hoverBorder: 'hover:border-[#1877F2]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(24,119,242,0.5)]',
  },
  telegram: {
    gradient: 'bg-[linear-gradient(135deg,rgba(38,165,228,0.10),rgba(38,165,228,0.02))]',
    iconColor: 'text-[#26A5E4]',
    hoverBorder: 'hover:border-[#26A5E4]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(38,165,228,0.5)]',
  },
  'meta-ads': {
    gradient: 'bg-[linear-gradient(135deg,rgba(0,129,251,0.10),rgba(0,196,255,0.03))]',
    iconColor: 'text-[#0081FB]',
    hoverBorder: 'hover:border-[#0081FB]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(0,129,251,0.5)]',
  },
  'google-ads': {
    gradient: 'bg-[linear-gradient(135deg,rgba(66,133,244,0.10),rgba(52,168,83,0.04))]',
    iconColor: 'text-[#4285F4]',
    hoverBorder: 'hover:border-[#4285F4]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(66,133,244,0.5)]',
  },
  'google-analytics': {
    gradient: 'bg-[linear-gradient(135deg,rgba(249,171,0,0.10),rgba(249,171,0,0.02))]',
    iconColor: 'text-[#F9AB00]',
    hoverBorder: 'hover:border-[#F9AB00]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(249,171,0,0.5)]',
  },
  openai: {
    gradient: 'bg-[linear-gradient(135deg,rgba(16,163,127,0.10),rgba(16,163,127,0.02))]',
    iconColor: 'text-[#10A37F]',
    hoverBorder: 'hover:border-[#10A37F]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(16,163,127,0.5)]',
  },
  gemini: {
    gradient: 'bg-[linear-gradient(135deg,rgba(66,133,244,0.08),rgba(168,85,247,0.05))]',
    iconColor: 'text-[#8E75F2]',
    hoverBorder: 'hover:border-[#8E75F2]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(142,117,242,0.5)]',
  },
  claude: {
    gradient: 'bg-[linear-gradient(135deg,rgba(217,119,87,0.10),rgba(217,119,87,0.02))]',
    iconColor: 'text-[#D97757]',
    hoverBorder: 'hover:border-[#D97757]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(217,119,87,0.5)]',
  },
  deepseek: {
    gradient: 'bg-[linear-gradient(135deg,rgba(83,108,232,0.10),rgba(83,108,232,0.02))]',
    iconColor: 'text-[#536CE8]',
    hoverBorder: 'hover:border-[#536CE8]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(83,108,232,0.5)]',
  },
  'google-calendar': {
    gradient: 'bg-[linear-gradient(135deg,rgba(66,133,244,0.10),rgba(66,133,244,0.02))]',
    iconColor: 'text-[#4285F4]',
    hoverBorder: 'hover:border-[#4285F4]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(66,133,244,0.5)]',
  },
  'google-sheets': {
    gradient: 'bg-[linear-gradient(135deg,rgba(52,168,83,0.10),rgba(52,168,83,0.02))]',
    iconColor: 'text-[#34A853]',
    hoverBorder: 'hover:border-[#34A853]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(52,168,83,0.5)]',
  },
  gmail: {
    gradient: 'bg-[linear-gradient(135deg,rgba(234,67,53,0.10),rgba(234,67,53,0.02))]',
    iconColor: 'text-[#EA4335]',
    hoverBorder: 'hover:border-[#EA4335]/40',
    hoverShadow: 'hover:shadow-[0_12px_30px_-14px_rgba(234,67,53,0.5)]',
  },
};

const DEFAULT_BRAND: BrandStyle = {
  gradient: '',
  iconColor: 'text-primary',
  hoverBorder: 'hover:border-primary/40',
  hoverShadow: 'hover:shadow-lg',
};

// Small pill used for status/marketing badges (Available, Beta, Popular, etc.)
const StatusBadge: React.FC<{ icon: React.ReactNode; label: string; className: string }> = ({ icon, label, className }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap", className)}>
    {icon}
    {label}
  </span>
);

// Integration Card Component
const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onAction,
  loading = false,
  installing = false,
  justInstalled = false,
}) => {
  const { t } = useLanguage();
  const isComingSoon = integration.comingSoon;
  const brand = isComingSoon ? DEFAULT_BRAND : (BRAND_STYLES[integration.key] || DEFAULT_BRAND);

  const getActionButton = () => {
    if (loading) {
      return (
        <button
          disabled
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-muted/50 text-muted-foreground rounded-lg cursor-not-allowed text-sm"
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
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary/50 text-primary-foreground rounded-lg cursor-not-allowed text-sm"
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
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-500 text-white rounded-lg animate-pulse text-sm"
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
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-muted/30 text-muted-foreground rounded-lg cursor-not-allowed text-sm"
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
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg transition-all duration-300 text-sm group-hover:shadow-md"
        >
          <Settings className="w-4 h-4" />
          {t('integrations.configure')}
        </button>
      );
    } else {
      return (
        <button
          onClick={() => onAction(integration.key, 'install')}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-accent text-accent-foreground rounded-lg transition-all duration-300 text-sm group-hover:shadow-md"
        >
          <Download className="w-4 h-4" />
          {t('integrations.install')}
        </button>
      );
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-card border border-border/60 rounded-2xl p-4 transition-all duration-300",
        isComingSoon
          ? "opacity-60"
          : cn(brand.gradient, brand.hoverBorder, brand.hoverShadow, "hover:-translate-y-1")
      )}
    >
      {/* Brand icon + status badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-2xl bg-background shadow-sm shrink-0",
          isComingSoon ? "text-muted-foreground" : brand.iconColor
        )}>
          {integration.icon}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          {integration.popular && (
            <StatusBadge
              icon={<Rocket className="w-3 h-3" />}
              label={t('integrations.popular')}
              className="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
            />
          )}
          {integration.beta && (
            <StatusBadge
              icon={<FlaskConical className="w-3 h-3" />}
              label="Beta"
              className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
          )}
          {isComingSoon && (
            <StatusBadge
              icon={<Clock className="w-3 h-3" />}
              label={t('integrations.coming-soon')}
              className="border-border bg-muted text-muted-foreground"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-foreground">
        {integration.name}
      </h3>

      <p className="text-sm text-muted-foreground mt-1 mb-4 line-clamp-2 flex-1">
        {integration.description}
      </p>

      {/* Action Button */}
      {getActionButton()}
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
  const [showMetaAdsConfigModal, setShowMetaAdsConfigModal] = useState(false);
  const [showGoogleAdsConfigModal, setShowGoogleAdsConfigModal] = useState(false);
  const [showWhatsAppConfigModal, setShowWhatsAppConfigModal] = useState(false);
  const [showInstagramConfigModal, setShowInstagramConfigModal] = useState(false);
  const [showFacebookConfigModal, setShowFacebookConfigModal] = useState(false);
  const [showOpenAiConfigModal, setShowOpenAiConfigModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { token, user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Define categories with integrations
  const getInitialCategories = (): IntegrationCategory[] => [
    {
      id: 'ads-analytics',
      title: t('integrations.categories.ads-analytics') || 'Ads & Analytics',
      integrations: [
        {
          key: 'meta-ads',
          name: 'Meta Ads',
          description: t('integrations.meta-ads.description') || 'Connect your Meta Ads account to track and manage Facebook & Instagram advertising campaigns.',
          available: false,
          icon: <FaMeta className="w-7 h-7" />
        },
        {
          key: 'google-ads',
          name: 'Google Ads',
          description: t('integrations.google-ads.description') || 'Integrate Google Ads to monitor your search and display advertising performance.',
          available: false,
          icon: <SiGoogleads className="w-7 h-7" />
        },
        {
          key: 'google-analytics',
          name: 'Google Analytics',
          description: t('integrations.google-analytics.description') || 'Track website traffic and user behavior with Google Analytics integration.',
          available: false,
          comingSoon: true,
          icon: <SiGoogleanalytics className="w-7 h-7" />
        }
      ]
    },
    {
      id: 'social-messaging',
      title: t('integrations.categories.social-messaging') || 'Social Messaging Platforms',
      integrations: [
        {
          key: 'wpp_evo',
          name: 'WhatsApp',
          description: t('integrations.whatsapp-evo.description') || 'Connect WhatsApp via Evolution API to manage customer conversations directly from your CRM.',
          available: false,
          beta: true,
          popular: true,
          icon: <SiWhatsapp className="w-7 h-7" />
        },
        {
          key: 'instagram',
          name: 'Instagram',
          description: t('integrations.instagram.description') || 'Integrate Instagram DMs to engage with your audience and manage inquiries.',
          available: false,
          beta: true,
          popular: true,
          icon: <SiInstagram className="w-7 h-7" />
        },
        {
          key: 'facebook',
          name: 'Facebook Messenger',
          description: t('integrations.facebook.description') || 'Connect Facebook Messenger to handle customer messages from your Facebook page.',
          available: false,
          beta: true,
          icon: <SiMessenger className="w-7 h-7" />
        },
        {
          key: 'telegram',
          name: 'Telegram',
          description: t('integrations.telegram.description') || 'Integrate Telegram to communicate with customers through bots or direct messages.',
          available: false,
          comingSoon: true,
          icon: <SiTelegram className="w-7 h-7" />
        }
      ]
    },
    {
      id: 'artificial-intelligence',
      title: t('integrations.categories.ai') || 'Artificial Intelligence',
      integrations: [
        {
          key: 'openai',
          name: 'OpenAI',
          description: t('integrations.openai.description') || 'Leverage OpenAI GPT models for intelligent automation and customer interactions.',
          available: false,
          beta: true,
          icon: <SiOpenai className="w-7 h-7" />
        },
        {
          key: 'gemini',
          name: 'Gemini',
          description: t('integrations.gemini.description') || 'Integrate Google Gemini for advanced AI capabilities and multimodal processing.',
          available: false,
          comingSoon: true,
          icon: <RiGeminiLine className="w-7 h-7" />
        },
        {
          key: 'claude',
          name: 'Claude',
          description: t('integrations.claude.description') || 'Use Anthropic Claude for safe and helpful AI assistance in your workflows.',
          available: false,
          comingSoon: true,
          icon: <RiClaudeFill className="w-7 h-7" />
        },
        {
          key: 'deepseek',
          name: 'DeepSeek',
          description: t('integrations.deepseek.description') || 'Integrate DeepSeek AI for powerful reasoning and code generation capabilities.',
          available: false,
          comingSoon: true,
          icon: <Bot className="w-7 h-7" />
        }
      ]
    },
    {
      id: 'google-apps',
      title: t('integrations.categories.google-apps') || 'Google Apps',
      comingSoon: true,
      integrations: [
        {
          key: 'google-calendar',
          name: 'Google Calendar',
          description: t('integrations.google-calendar.description') || 'Sync appointments and meetings with Google Calendar for seamless scheduling.',
          available: false,
          comingSoon: true,
          icon: <SiGooglecalendar className="w-7 h-7" />
        },
        {
          key: 'google-sheets',
          name: 'Google Sheets',
          description: t('integrations.google-sheets.description') || 'Export and sync data with Google Sheets for reporting and analysis.',
          available: false,
          comingSoon: true,
          icon: <SiGooglesheets className="w-7 h-7" />
        },
        {
          key: 'gmail',
          name: 'Gmail',
          description: t('integrations.gmail.description') || 'Integrate Gmail to send and track emails directly from your CRM.',
          available: false,
          comingSoon: true,
          icon: <SiGmail className="w-7 h-7" />
        }
      ]
    },
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
      if (integrationKey === 'meta-ads') {
        setShowMetaAdsConfigModal(true);
      } else if (integrationKey === 'google-ads') {
        setShowGoogleAdsConfigModal(true);
      } else if (integrationKey === 'wpp_evo') {
        setShowWhatsAppConfigModal(true);
      } else if (integrationKey === 'instagram') {
        setShowInstagramConfigModal(true);
      } else if (integrationKey === 'facebook') {
        setShowFacebookConfigModal(true);
      } else if (integrationKey === 'openai') {
        setShowOpenAiConfigModal(true);
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

      let endpoint: string;
      if (integrationKey === 'wpp_evo') {
        endpoint = '/api/integrations/whatsapp-evo-integrations';
      } else {
        endpoint = `/api/integrations/${integrationKey}`;
      }

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

  // Marketplace-style pill filters, derived from the category list
  const filterOptions = useMemo(
    () => [
      { id: 'all', label: t('integrations.filter-all') || 'All' },
      ...categories.map((category) => ({ id: category.id, label: category.title })),
      { id: 'coming-soon', label: t('integrations.coming-soon') },
    ],
    [categories, t]
  );

  // Flatten categories into a single searchable/filterable list of cards
  const filteredIntegrations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const integrations = activeFilter === 'coming-soon'
      ? categories.flatMap((category) => category.integrations).filter((integration) => integration.comingSoon)
      : categories
          .filter((category) => activeFilter === 'all' || category.id === activeFilter)
          .flatMap((category) => category.integrations);

    return integrations.filter((integration) =>
      !query ||
      integration.name.toLowerCase().includes(query) ||
      integration.description.toLowerCase().includes(query)
    );
  }, [categories, activeFilter, searchQuery]);

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
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
            <RiAppsFill className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('integrations.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('integrations.description')}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-border mb-4" />

        {/* Tabs + Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 border-b border-border">
          {/* Category Tabs */}
          <div className="flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] min-w-0">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={cn(
                  "relative whitespace-nowrap pb-3 pt-1 text-[13px] transition-colors duration-200",
                  activeFilter === option.id
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground font-medium hover:text-foreground/80"
                )}
              >
                {option.label}
                <span
                  className={cn(
                    "absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-primary transition-opacity duration-200",
                    activeFilter === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full sm:w-64 shrink-0 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('integrations.search-placeholder') || 'Search integrations...'}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Integration Grid */}
        {filteredIntegrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">{t('integrations.no-results')}</h3>
            <p className="text-muted-foreground text-sm max-w-sm">{t('integrations.no-results-description')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.key}
                integration={integration}
                onAction={handleIntegrationAction}
                loading={loading && integration.key === 'meta-ads'}
                installing={installingIntegrations.has(integration.key)}
                justInstalled={justInstalledIntegrations.has(integration.key)}
              />
            ))}
          </div>
        )}

        {/* Config Modals */}
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
        <WhatsAppConfigModal
          open={showWhatsAppConfigModal}
          onOpenChange={setShowWhatsAppConfigModal}
          onConfigurationSaved={handleConfigSaved}
        />
        <InstagramConfigModal
          open={showInstagramConfigModal}
          onOpenChange={setShowInstagramConfigModal}
          onConfigurationSaved={handleConfigSaved}
        />
        <FacebookMessengerConfigModal
          open={showFacebookConfigModal}
          onOpenChange={setShowFacebookConfigModal}
          onConfigurationSaved={handleConfigSaved}
        />
        <OpenAiConfigModal
          open={showOpenAiConfigModal}
          onOpenChange={setShowOpenAiConfigModal}
          onConfigurationSaved={handleConfigSaved}
        />
      </div>
    </div>
  );
};

export default IntegrationsApps;

/**
 * INTEGRATION PANEL - Integration Instance Management
 * 
 * Page for managing integration instances like WhatsApp Evolution API.
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Store, Trash2, QrCode, Key, Unplug } from 'lucide-react';
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Alert, AlertDescription } from '../ui/alert';
import { format } from 'date-fns';
import api from '../../services/api';
import CreateInstanceModal from './CreateInstanceModal';
import TestInstanceModal from './TestInstanceModal';
import DeleteInstanceModal from './DeleteInstanceModal';
import QRCodeModal from './QRCodeModal';
import FunnelSelectionModal from './FunnelSelectionModal';
import CredentialsModal from './CredentialsModal';
import { CiPlay1 } from "react-icons/ci";
import { IoFunnelOutline } from 'react-icons/io5';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  created_at: string;
  status?: string;
  funnel_id?: number;
  funnel?: {
    id: number;
    name: string;
  };
}

interface Funnel {
  id: number;
  name: string;
}

interface AvailableIntegrations {
  n8n_available: boolean;
  meta_ads_available: boolean;
  google_ads_available: boolean;
  wpp_evo_available: boolean;
  wpp_evo_instances?: WhatsAppInstance[];
  funnels?: Funnel[];
}

const IntegrationPanel: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<AvailableIntegrations | null>(null);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [funnelModalOpen, setFunnelModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);

  useEffect(() => {
    fetchAvailableIntegrations();
  }, []);

  const fetchAvailableIntegrations = async () => {
    try {
      const response = await api.get('/api/integrations/available/settings');
      setIntegrations(response.data);
      // Store funnels in separate state for reuse
      if (response.data.funnels) {
        setFunnels(response.data.funnels);
      }
    } catch (error) {
      console.error('Error fetching available integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceCreated = (newInstance: WhatsAppInstance) => {
    setIntegrations(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        wpp_evo_instances: [...(prev.wpp_evo_instances || []), newInstance]
      };
    });
    toast({
      title: t('integrations.panel.create.success-title'),
      description: t('integrations.panel.create.success-description'),
    });
  };

  const handleInstanceDeleted = (instanceId: number) => {
    setIntegrations(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        wpp_evo_instances: (prev.wpp_evo_instances || []).filter(i => i.id !== instanceId)
      };
    });
    toast({
      title: t('integrations.panel.delete.success-title'),
      description: t('integrations.panel.delete.success-description'),
    });
  };

  const openTestModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setTestModalOpen(true);
  };

  const openDeleteModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setDeleteModalOpen(true);
  };

  const openQrCodeModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setQrCodeModalOpen(true);
  };

  const openFunnelModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setFunnelModalOpen(true);
  };

  const openCredentialsModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setCredentialsModalOpen(true);
  };

  const handleStatusChange = (instanceId: number, status: string) => {
    setIntegrations(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        wpp_evo_instances: (prev.wpp_evo_instances || []).map(inst =>
          inst.id === instanceId ? { ...inst, status } : inst
        )
      };
    });
  };

  const handleDisconnect = async (instance: WhatsAppInstance) => {
    try {
      await api.post(`/api/integrations/whatsapp-evo-instances/disconnect/${instance.id}`);
      handleStatusChange(instance.id, 'disconnected');
      toast({
        title: t('integrations.panel.disconnect.success-title'),
        description: t('integrations.panel.disconnect.success-description'),
      });
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      toast({
        title: t('integrations.panel.disconnect.error-title'),
        description: t('integrations.panel.disconnect.error-description'),
        variant: 'destructive',
      });
    }
  };

  const handleFunnelUpdated = (instanceId: number, funnelId: number) => {
    const selectedFunnel = funnels.find(f => f.id === funnelId);
    setIntegrations(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        wpp_evo_instances: (prev.wpp_evo_instances || []).map(inst =>
          inst.id === instanceId
            ? { ...inst, funnel_id: funnelId, funnel: selectedFunnel ? { id: funnelId, name: selectedFunnel.name } : undefined }
            : inst
        )
      };
    });
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
                    {/* Create Instance Button - Top */}
                    <div className="flex justify-end">
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('integrations.panel.create-instance')}
                      </Button>
                    </div>

                    {/* Instances Grid - 2 columns */}
                    {integrations.wpp_evo_instances && integrations.wpp_evo_instances.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {integrations.wpp_evo_instances.map((instance) => (
                          <div 
                            key={instance.id} 
                            className="border border-border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                <SiWhatsapp className="w-5 h-5 text-green-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">
                                  {instance.instance_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(instance.created_at), 'dd/MM/yyyy HH:mm')}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${instance.status === 'connected' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : ''}`}
                                  >
                                    {instance.status || 'created'}
                                  </Badge>
                                  {instance.funnel && (
                                    <Badge variant="outline" className="text-xs">
                                      <IoFunnelOutline className="w-3 h-3 mr-1" />
                                      {instance.funnel.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => openQrCodeModal(instance)}
                              >
                                <QrCode className="w-4 h-4 mr-1" />
                                QR
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => openTestModal(instance)}
                              >
                                <CiPlay1 className="w-4 h-4 mr-1" />
                                {t('common.test')}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => openFunnelModal(instance)}
                              >
                                <IoFunnelOutline className="w-4 h-4 mr-1" />
                                {t('integrations.panel.funnel.button')}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => openCredentialsModal(instance)}
                              >
                                <Key className="w-4 h-4 mr-1" />
                                {t('integrations.panel.credentials.button')}
                              </Button>
                              {instance.status === 'connected' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 text-orange-600 hover:text-orange-600 hover:bg-orange-500/10 border-orange-500/30"
                                  onClick={() => handleDisconnect(instance)}
                                >
                                  <Unplug className="w-4 h-4 mr-1" />
                                  {t('integrations.panel.disconnect.button')}
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => openDeleteModal(instance)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
                        <SiWhatsapp className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
                        <p>{t('integrations.panel.whatsapp.no-instances')}</p>
                      </div>
                    )}
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

      {/* Modals */}
      <CreateInstanceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onInstanceCreated={handleInstanceCreated}
      />
      
      <TestInstanceModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        instance={selectedInstance}
        onStatusChange={handleStatusChange}
      />
      
      <DeleteInstanceModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        instance={selectedInstance}
        onInstanceDeleted={handleInstanceDeleted}
      />
      
      <QRCodeModal
        open={qrCodeModalOpen}
        onOpenChange={setQrCodeModalOpen}
        instance={selectedInstance}
      />

      <FunnelSelectionModal
        open={funnelModalOpen}
        onOpenChange={setFunnelModalOpen}
        instance={selectedInstance}
        funnels={funnels}
        onFunnelUpdated={handleFunnelUpdated}
      />

      <CredentialsModal
        open={credentialsModalOpen}
        onOpenChange={setCredentialsModalOpen}
        instance={selectedInstance}
      />
    </div>
  );
};

export default IntegrationPanel;

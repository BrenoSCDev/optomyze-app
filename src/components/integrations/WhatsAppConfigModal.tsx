import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { format } from 'date-fns';
import { Loader2, Key, Globe, Info, Plus, Trash2, QrCode, Unplug, CheckCircle2, RefreshCw, Wifi } from 'lucide-react';
import { SiWhatsapp } from "react-icons/si";
import { CiPlay1 } from "react-icons/ci";
import { IoFunnelOutline } from 'react-icons/io5';
import CreateInstanceModal from './CreateInstanceModal';
import TestInstanceModal from './TestInstanceModal';
import DeleteInstanceModal from './DeleteInstanceModal';
import DisconnectInstanceModal from './DisconnectInstanceModal';
import QRCodeModal from './QRCodeModal';
import FunnelSelectionModal from './FunnelSelectionModal';
import ConnectionStatusModal, { ConnectionStatusResponse } from './ConnectionStatusModal';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatPhoneNumber } from '@/lib/phone';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  created_at: string;
  status?: string;
  profile_name?: string | null;
  profile_pic_url?: string | null;
  phone_number?: string | null;
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

interface WhatsAppConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);

  // Instance management modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [refreshingStatuses, setRefreshingStatuses] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [funnelModalOpen, setFunnelModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);

  // Always derive fresh instance data from the instances state
  const freshSelectedInstance = selectedInstance
    ? instances.find(i => i.id === selectedInstance.id) || selectedInstance
    : null;

  /**
   * Merge a live connection check (Evolution's /instance/connectionState) into
   * a local instance. When the instance isn't connected the stored profile no
   * longer describes a live session, so it is cleared.
   */
  const applyConnectionResult = (
    instance: WhatsAppInstance,
    result: ConnectionStatusResponse
  ): WhatsAppInstance => ({
    ...instance,
    status: result.status,
    profile_name: result.profile?.name ?? null,
    profile_pic_url: result.profile?.picture_url ?? null,
    phone_number: result.profile?.phone_number ?? null,
  });

  /**
   * Statuses stored locally can be stale (the phone may have been unlinked
   * outside the CRM), so the panel always confirms them against Evolution.
   */
  const refreshConnectionStatuses = useCallback(async () => {
    setRefreshingStatuses(true);

    try {
      const response = await api.get<{ instances: ConnectionStatusResponse[] }>(
        '/api/integrations/whatsapp-evo-instances/connection-status'
      );

      const liveById = new Map(response.data.instances.map(result => [result.id, result]));

      setInstances(prev => prev.map(instance => {
        const live = liveById.get(instance.id);
        return live ? applyConnectionResult(instance, live) : instance;
      }));
    } catch (error) {
      console.error('Error refreshing WhatsApp connection statuses:', error);
    } finally {
      setRefreshingStatuses(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/integrations/available/settings');
      const instanceList: WhatsAppInstance[] = response.data.wpp_evo_instances || [];

      setConfigured(!!response.data.wpp_evo_configured);
      setBaseUrl(response.data.wpp_evo_base_url || '');
      setInstances(instanceList);
      setFunnels(response.data.funnels || []);

      if (instanceList.length > 0) {
        refreshConnectionStatuses();
      }
    } catch (error) {
      console.error('Error fetching WhatsApp integration settings:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshConnectionStatuses]);

  useEffect(() => {
    if (open) {
      setApiKey('');
      fetchSettings();
    }
  }, [open, fetchSettings]);

  const validateUrl = (url: string): boolean => {
    if (!url) return true;

    try {
      new URL(url);
      return true;
    } catch {
      toast({
        title: t('common.error'),
        description: `${t('integrations.whatsapp-evo.invalid-url')} Base URL`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!baseUrl.trim() || (!configured && !apiKey.trim())) {
      toast({
        title: t('common.error'),
        description: t('integrations.whatsapp-evo.fill-required-fields'),
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(baseUrl)) {
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, string> = { base_url: baseUrl.trim() };
      if (apiKey.trim()) {
        payload.api_key = apiKey.trim();
      }

      await api.put('/api/integrations/whatsapp-evo-integrations/configure', payload);

      setApiKey('');

      toast({
        title: t('integrations.configuration-successful'),
        description: t('integrations.whatsapp-evo.configuration-success-description'),
      });

      await fetchSettings();
      onConfigurationSaved();
    } catch (error) {
      console.error('Error configuring WhatsApp Evolution API integration:', error);
      toast({
        title: t('integrations.configuration-failed'),
        description: t('integrations.configuration-failed-description'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInstanceCreated = (newInstance: WhatsAppInstance) => {
    setInstances(prev => [...prev, newInstance]);
    toast({
      title: t('integrations.panel.create.success-title'),
      description: t('integrations.panel.create.success-description'),
    });
  };

  const handleInstanceDeleted = (instanceId: number) => {
    setInstances(prev => prev.filter(i => i.id !== instanceId));
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

  const openConnectionModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setConnectionModalOpen(true);
  };

  const handleConnectionResult = useCallback((result: ConnectionStatusResponse) => {
    setInstances(prev => prev.map(instance =>
      instance.id === result.id ? applyConnectionResult(instance, result) : instance
    ));
  }, []);

  const openFunnelModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setFunnelModalOpen(true);
  };

  const handleStatusChange = (instanceId: number, status: string) => {
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, status } : inst
    ));
  };

  const handleDisconnect = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setDisconnectModalOpen(true);
  };

  const handleDisconnected = (instanceId: number) => {
    setInstances(prev => prev.map(instance =>
      instance.id === instanceId
        ? { ...instance, status: 'disconnected', profile_name: null, profile_pic_url: null, phone_number: null }
        : instance
    ));
  };

  const handleFunnelUpdated = (instanceId: number, funnelId: number) => {
    const selectedFunnel = funnels.find(f => f.id === funnelId);
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId
        ? { ...inst, funnel_id: funnelId, funnel: selectedFunnel ? { id: funnelId, name: selectedFunnel.name } : undefined }
        : inst
    ));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setApiKey('');
    }
    onOpenChange(next);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <SiWhatsapp className="w-8 h-8 text-green-500" />
              </div>
              {t('integrations.whatsapp-evo.configure-title')}
              {configured && (
                <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {t('integrations.whatsapp-evo.status-configured')}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {t('integrations.whatsapp-evo.configure-description')}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Alert - Evolution API Notice */}
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-500">{t('integrations.whatsapp-evo.warning-title')}</AlertTitle>
                <AlertDescription className="text-blue-400/80">
                  {t('integrations.whatsapp-evo.warning-description')}
                </AlertDescription>
              </Alert>

              {/* Configuration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Base URL Field */}
                <div className="space-y-2">
                  <Label htmlFor="base_url" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {t('integrations.whatsapp-evo.base-url')}
                  </Label>
                  <Input
                    id="base_url"
                    type="url"
                    placeholder={t('integrations.whatsapp-evo.base-url-placeholder')}
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.whatsapp-evo.base-url-description')}
                  </p>
                </div>

                {/* API Key Field */}
                <div className="space-y-2">
                  <Label htmlFor="api_key" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    {t('integrations.whatsapp-evo.api-key')}
                  </Label>
                  <Input
                    id="api_key"
                    type="password"
                    placeholder={
                      configured
                        ? t('integrations.whatsapp-evo.api-key-placeholder-saved')
                        : t('integrations.whatsapp-evo.api-key-placeholder')
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={saving}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.whatsapp-evo.api-key-description')}
                  </p>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {saving ? t('integrations.whatsapp-evo.saving-configuration') : t('integrations.whatsapp-evo.save-configuration')}
                </Button>
              </form>

              {!configured && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">{t('integrations.whatsapp-evo.next-steps-title')}</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    {t('integrations.whatsapp-evo.next-steps-description')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Instance Management - only after credentials are configured */}
              {configured && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {t('integrations.whatsapp-evo.instances-title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t('integrations.whatsapp-evo.instances-description')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {instances.length > 0 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={refreshConnectionStatuses}
                            disabled={refreshingStatuses}
                            title={t('integrations.panel.connection.refresh-all')}
                          >
                            <RefreshCw className={`w-4 h-4 ${refreshingStatuses ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        <Button onClick={() => setCreateModalOpen(true)}>
                          <Plus className="w-4 h-4" />
                          {t('integrations.panel.create-instance')}
                        </Button>
                      </div>
                    </div>

                    {instances.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {instances.map((instance) => (
                          <div
                            key={instance.id}
                            className="border border-border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {instance.status === 'connected' && (instance.profile_pic_url || instance.profile_name) ? (
                                <div className="relative shrink-0">
                                  <Avatar className="w-10 h-10 border border-green-500/30">
                                    {instance.profile_pic_url && (
                                      <AvatarImage src={instance.profile_pic_url} alt={instance.profile_name || instance.instance_name} />
                                    )}
                                    <AvatarFallback className="bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-medium">
                                      {(instance.profile_name || instance.instance_name).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center">
                                    <SiWhatsapp className="w-3 h-3 text-green-500" />
                                  </span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                  <SiWhatsapp className="w-5 h-5 text-green-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">
                                  {instance.instance_name}
                                </h4>
                                {instance.status === 'connected' && (instance.profile_name || instance.phone_number) ? (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {[instance.profile_name, instance.phone_number ? formatPhoneNumber(instance.phone_number) : null]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(instance.created_at), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${instance.status === 'connected' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : instance.status === 'disconnected' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : ''}`}
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
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border">
                              {instance.status !== 'connected' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => openQrCodeModal(instance)}
                                >
                                  <QrCode className="w-4 h-4" />
                                  QR
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => openConnectionModal(instance)}
                              >
                                <Wifi className="w-4 h-4" />
                                {t('integrations.panel.connection.check-button')}
                              </Button>
                              {instance.status === 'connected' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => openTestModal(instance)}
                                >
                                  <CiPlay1 className="w-4 h-4" />
                                  {t('common.test')}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => openFunnelModal(instance)}
                              >
                                <IoFunnelOutline className="w-4 h-4" />
                                {t('integrations.panel.funnel.button')}
                              </Button>
                              {instance.status === 'connected' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-orange-600 hover:text-orange-600 hover:bg-orange-500/10 border-orange-500/30"
                                  onClick={() => handleDisconnect(instance)}
                                >
                                  <Unplug className="w-4 h-4" />
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
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Instance Management Modals */}
      <CreateInstanceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onInstanceCreated={handleInstanceCreated}
      />

      <TestInstanceModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        instance={freshSelectedInstance}
        onStatusChange={handleStatusChange}
      />

      <DeleteInstanceModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        instance={freshSelectedInstance}
        onInstanceDeleted={handleInstanceDeleted}
      />

      <DisconnectInstanceModal
        open={disconnectModalOpen}
        onOpenChange={setDisconnectModalOpen}
        instance={freshSelectedInstance}
        onDisconnected={handleDisconnected}
      />

      <ConnectionStatusModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
        instance={freshSelectedInstance}
        onStatusChange={handleConnectionResult}
        onShowQrCode={openQrCodeModal}
      />

      <QRCodeModal
        open={qrCodeModalOpen}
        onOpenChange={setQrCodeModalOpen}
        instance={freshSelectedInstance}
        onStatusChange={handleConnectionResult}
      />

      <FunnelSelectionModal
        open={funnelModalOpen}
        onOpenChange={setFunnelModalOpen}
        instance={freshSelectedInstance}
        funnels={funnels}
        onFunnelUpdated={handleFunnelUpdated}
      />
    </>
  );
};

export default WhatsAppConfigModal;

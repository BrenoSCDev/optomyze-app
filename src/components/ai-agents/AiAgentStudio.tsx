/**
 * AI AGENT STUDIO
 *
 * Full-screen slide-up panel (same pattern as LeadPreviewModal) for
 * creating and editing AI Agents. Left 60%: configuration sections
 * stacked vertically. Right 40%: live chat preview that runs the CURRENT
 * form state through the sandbox endpoint so agents can be tested before
 * being deployed to a channel — product searches are real, CRM actions
 * are simulated.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bot,
  Loader2,
  Send,
  RotateCcw,
  Settings2,
  MessageSquareText,
  Wrench,
  Share2,
  UserRound,
  FlaskConical,
  Info,
  Globe,
} from 'lucide-react';
import { SiWhatsapp, SiInstagram } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AiAgent,
  AiAgentPayload,
  AiAgentTool,
  ChannelAccount,
  createAiAgent,
  updateAiAgent,
  syncAiAgentChannels,
  getAiAgentTools,
  getChannelAccounts,
  getOpenAiModels,
  previewAiAgentChat,
  PreviewChatToolCall,
} from '@/services/aiAgentApi';

interface AiAgentStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AiAgent | null;
  onSaved: () => void;
}

interface PreviewBubble {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: PreviewChatToolCall[];
}

const FALLBACK_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'];
const MIN_DELAY = 10;

const defaultFormData = {
  name: '',
  description: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1024,
  system_prompt: '',
  enabled_tools: [] as string[],
  response_delay_seconds: 15,
  handover_message: '',
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; description?: string }> = ({ icon, title, description }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
      {icon}
    </div>
    <div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  </div>
);

const AiAgentStudio: React.FC<AiAgentStudioProps> = ({ open, onOpenChange, agent, onSaved }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isEdit = !!agent;

  const [formData, setFormData] = useState(defaultFormData);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [tools, setTools] = useState<AiAgentTool[]>([]);
  const [channelAccounts, setChannelAccounts] = useState<ChannelAccount[]>([]);
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS);
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Chat preview state. The preview reproduces the production debounce:
  // every user message resets the Conversation Delay timer, and only when
  // it expires are all buffered messages sent as one LLM turn. A message
  // sent while a reply is being generated supersedes that reply (same as
  // the trigger-id invalidation in ProcessAiAgentTurn).
  const [previewMessages, setPreviewMessages] = useState<PreviewBubble[]>([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHandedOver, setPreviewHandedOver] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState<number | null>(null);
  const previewEndRef = useRef<HTMLDivElement>(null);
  const previewMessagesRef = useRef<PreviewBubble[]>([]);
  const previewSeqRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    previewMessagesRef.current = previewMessages;
  }, [previewMessages]);

  const clearPreviewTimers = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    debounceTimerRef.current = null;
    countdownIntervalRef.current = null;
    setPreviewCountdown(null);
  }, []);

  useEffect(() => () => clearPreviewTimers(), [clearPreviewTimers]);

  const channelKey = (type: string, id: number) => `${type}:${id}`;

  const fetchMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [toolsData, accountsData] = await Promise.all([
        getAiAgentTools(),
        getChannelAccounts(),
      ]);
      setTools(toolsData);
      setChannelAccounts(accountsData);

      try {
        const modelsData = await getOpenAiModels();
        if (modelsData.length > 0) setModels(modelsData);
      } catch {
        // Integration not configured yet — keep the fallback list.
      }
    } catch (error) {
      console.error('Error loading AI agent form data:', error);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    fetchMeta();
    previewSeqRef.current += 1;
    clearPreviewTimers();
    setPreviewMessages([]);
    setPreviewInput('');
    setPreviewHandedOver(false);
    setPreviewLoading(false);

    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || '',
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        system_prompt: agent.system_prompt || '',
        enabled_tools: agent.enabled_tools || [],
        response_delay_seconds: agent.response_delay_seconds,
        handover_message: agent.handover_message || '',
      });
      setSelectedChannels(new Set(
        agent.channel_bindings.map(b => channelKey(b.channelable_type, b.channelable_id))
      ));
    } else {
      setFormData(defaultFormData);
      setSelectedChannels(new Set());
    }
  }, [open, agent, fetchMeta, clearPreviewTimers]);

  useEffect(() => {
    previewEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [previewMessages, previewLoading, previewCountdown]);

  const toggleTool = (key: string) => {
    setFormData(prev => ({
      ...prev,
      enabled_tools: prev.enabled_tools.includes(key)
        ? prev.enabled_tools.filter(k => k !== key)
        : [...prev.enabled_tools, key],
    }));
  };

  // Prefer a localized string for the tool; fall back to the label/description
  // the backend catalog provides (t() returns the key itself when unmapped).
  const toolText = (tool: AiAgentTool, field: 'label' | 'description') => {
    const key = `ai-agents.tools.${tool.key}.${field}`;
    const translated = t(key);
    return translated === key ? tool[field] : translated;
  };

  const toggleChannel = (account: ChannelAccount) => {
    const key = channelKey(account.channelable_type, account.channelable_id);
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: t('ai-agents.form.name-required'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: AiAgentPayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        provider: 'openai',
        model: formData.model,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        system_prompt: formData.system_prompt || null,
        enabled_tools: formData.enabled_tools,
        response_delay_seconds: Math.max(MIN_DELAY, formData.response_delay_seconds),
        handover_message: formData.handover_message.trim() || null,
      };

      const saved = isEdit
        ? await updateAiAgent(agent!.id, payload)
        : await createAiAgent(payload);

      const bindings = Array.from(selectedChannels).map(key => {
        const [channelable_type, id] = key.split(':');
        return { channelable_type, channelable_id: parseInt(id, 10) };
      });

      await syncAiAgentChannels(saved.id, bindings);

      toast({ title: isEdit ? t('ai-agents.updated') : t('ai-agents.created') });
      onOpenChange(false);
      onSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving AI agent:', error);
      toast({
        title: t('ai-agents.save-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const firePreviewTurn = async (seq: number) => {
    clearPreviewTimers();
    setPreviewLoading(true);

    try {
      const history = previewMessagesRef.current
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const result = await previewAiAgentChat(
        {
          provider: 'openai',
          model: formData.model,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          system_prompt: formData.system_prompt || null,
          enabled_tools: formData.enabled_tools,
          handover_message: formData.handover_message || null,
        },
        history
      );

      // A newer user message arrived while this reply was being generated:
      // drop it — the newer message's own debounce owns the conversation
      // now (mirrors the production late-arrival re-check).
      if (seq !== previewSeqRef.current) return;

      setPreviewMessages(prev => {
        const updated = [...prev];

        if (result.handover) {
          if (result.handover_message) {
            updated.push({ role: 'assistant', content: result.handover_message, toolCalls: result.tool_calls });
          }
          updated.push({ role: 'system', content: t('ai-agents.preview.handover-notice') });
        } else if (result.reply) {
          updated.push({ role: 'assistant', content: result.reply, toolCalls: result.tool_calls });
        }

        return updated;
      });

      if (result.handover) {
        setPreviewHandedOver(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (seq !== previewSeqRef.current) return;

      toast({
        title: t('ai-agents.preview.error'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      if (seq === previewSeqRef.current) {
        setPreviewLoading(false);
      }
    }
  };

  const handlePreviewSend = () => {
    const text = previewInput.trim();
    if (!text || previewHandedOver) return;

    setPreviewMessages(prev => [...prev, { role: 'user', content: text }]);
    setPreviewInput('');

    // New message: invalidate any in-flight reply and reset the timer,
    // exactly like production's debounce.
    previewSeqRef.current += 1;
    const seq = previewSeqRef.current;
    setPreviewLoading(false);
    clearPreviewTimers();

    const delaySeconds = Math.max(MIN_DELAY, formData.response_delay_seconds || MIN_DELAY);
    setPreviewCountdown(delaySeconds);

    countdownIntervalRef.current = setInterval(() => {
      setPreviewCountdown(prev => (prev !== null && prev > 1 ? prev - 1 : prev));
    }, 1000);

    debounceTimerRef.current = setTimeout(() => firePreviewTurn(seq), delaySeconds * 1000);
  };

  const handlePreviewReset = () => {
    previewSeqRef.current += 1;
    clearPreviewTimers();
    setPreviewMessages([]);
    setPreviewHandedOver(false);
    setPreviewInput('');
    setPreviewLoading(false);
  };

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-overlay backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Slide-up panel — 90% of the screen */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 top-[10vh] z-[60] flex flex-col rounded-t-2xl border border-primary/20 bg-background overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border shrink-0 bg-card">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold truncate">
                    {isEdit ? t('ai-agents.form.edit-title') : t('ai-agents.form.create-title')}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEdit ? t('ai-agents.form.save') : t('ai-agents.form.create')}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Body: 60% configuration / 40% chat preview */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Configuration column */}
              <div className="w-full lg:w-[60%] overflow-y-auto p-4 sm:p-6 space-y-10">
                {/* General */}
                <section>
                  <SectionHeader
                    icon={<Settings2 className="w-4 h-4" />}
                    title={t('ai-agents.form.tab-general')}
                  />
                  <div className="space-y-4 pl-0 sm:pl-11">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="agent-name">{t('ai-agents.form.name')}</Label>
                        <Input
                          id="agent-name"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder={t('ai-agents.form.name-placeholder')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('ai-agents.form.model')}</Label>
                        <Select
                          value={formData.model}
                          onValueChange={value => setFormData(prev => ({ ...prev, model: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[70]">
                            {models.map(model => (
                              <SelectItem key={model} value={model}>{model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="agent-description">{t('ai-agents.form.description-label')}</Label>
                      <Textarea
                        id="agent-description"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5 sm:col-span-1">
                        <div className="flex items-center justify-between">
                          <Label>{t('ai-agents.form.temperature')}</Label>
                          <span className="text-xs text-muted-foreground font-mono">{formData.temperature.toFixed(2)}</span>
                        </div>
                        <Slider
                          value={[formData.temperature]}
                          min={0}
                          max={2}
                          step={0.05}
                          onValueChange={([value]) => setFormData(prev => ({ ...prev, temperature: value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="agent-max-tokens">{t('ai-agents.form.max-tokens')}</Label>
                        <Input
                          id="agent-max-tokens"
                          type="number"
                          min={64}
                          max={16000}
                          value={formData.max_tokens}
                          onChange={e => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value, 10) || 1024 }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="agent-delay">{t('ai-agents.form.delay')}</Label>
                        <Input
                          id="agent-delay"
                          type="number"
                          min={MIN_DELAY}
                          max={600}
                          value={formData.response_delay_seconds}
                          onChange={e => setFormData(prev => ({ ...prev, response_delay_seconds: parseInt(e.target.value, 10) || MIN_DELAY }))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('ai-agents.form.delay-help')}</p>
                  </div>
                </section>

                {/* Behavior */}
                <section>
                  <SectionHeader
                    icon={<MessageSquareText className="w-4 h-4" />}
                    title={t('ai-agents.form.tab-behavior')}
                    description={t('ai-agents.form.system-prompt-help')}
                  />
                  <div className="pl-0 sm:pl-11">
                    <Textarea
                      id="agent-system-prompt"
                      value={formData.system_prompt}
                      onChange={e => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                      placeholder={t('ai-agents.form.system-prompt-placeholder')}
                      className="min-h-[280px] font-mono text-sm"
                    />
                  </div>
                </section>

                {/* Tools */}
                <section>
                  <SectionHeader
                    icon={<Wrench className="w-4 h-4" />}
                    title={t('ai-agents.form.tab-tools')}
                    description={t('ai-agents.form.tools-help')}
                  />
                  <div className="space-y-2 pl-0 sm:pl-11">
                    {loadingMeta ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      tools.map(tool => (
                        <label
                          key={tool.key}
                          className={`flex items-start gap-3 rounded-lg border border-border p-3 transition-colors ${
                            tool.always_enabled ? 'opacity-70' : 'cursor-pointer hover:border-primary/40'
                          }`}
                        >
                          <Checkbox
                            checked={tool.always_enabled || formData.enabled_tools.includes(tool.key)}
                            disabled={tool.always_enabled}
                            onCheckedChange={() => toggleTool(tool.key)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{toolText(tool, 'label')}</span>
                              {tool.always_enabled && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {t('ai-agents.form.always-enabled')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{toolText(tool, 'description')}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </section>

                {/* Channels */}
                <section>
                  <SectionHeader
                    icon={<Share2 className="w-4 h-4" />}
                    title={t('ai-agents.form.tab-channels')}
                    description={t('ai-agents.form.channels-help')}
                  />
                  <div className="space-y-2 pl-0 sm:pl-11">
                    {loadingMeta ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : channelAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('ai-agents.form.no-channel-accounts')}
                      </p>
                    ) : (
                      channelAccounts.map(account => {
                        const key = channelKey(account.channelable_type, account.channelable_id);
                        const claimedByOther = !!account.bound_agent && account.bound_agent.id !== agent?.id;

                        return (
                          <label
                            key={key}
                            className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors ${
                              claimedByOther ? 'opacity-60' : 'cursor-pointer hover:border-primary/40'
                            }`}
                          >
                            <Checkbox
                              checked={selectedChannels.has(key)}
                              disabled={claimedByOther}
                              onCheckedChange={() => toggleChannel(account)}
                            />
                            {account.channel === 'whatsapp' && <SiWhatsapp className="w-4 h-4 text-[#25D366]" />}
                            {account.channel === 'instagram' && <SiInstagram className="w-4 h-4 text-[#E1306C]" />}
                            {account.channel === 'website' && <Globe className="w-4 h-4 text-[#0EA5E9]" />}
                            <span className="text-sm font-medium text-foreground flex-1 truncate">
                              {account.label}
                            </span>
                            {claimedByOther && (
                              <Badge variant="secondary" className="text-[10px]">
                                {t('ai-agents.form.claimed-by').replace('{agent}', account.bound_agent!.name)}
                              </Badge>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* Handover */}
                <section className="pb-6">
                  <SectionHeader
                    icon={<UserRound className="w-4 h-4" />}
                    title={t('ai-agents.form.tab-handover')}
                    description={t('ai-agents.form.handover-message-help')}
                  />
                  <div className="pl-0 sm:pl-11">
                    <Textarea
                      id="agent-handover-message"
                      value={formData.handover_message}
                      onChange={e => setFormData(prev => ({ ...prev, handover_message: e.target.value }))}
                      placeholder={t('ai-agents.form.handover-message-placeholder')}
                      rows={3}
                    />
                  </div>
                </section>
              </div>

              {/* Chat preview column */}
              <div className="w-full lg:w-[40%] border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-muted/20 min-h-[320px]">
                {/* Preview header */}
                <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0 bg-card/60">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{t('ai-agents.preview.title')}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviewReset}
                    disabled={previewMessages.length === 0}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('ai-agents.preview.reset')}
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {previewMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                      <Bot className="w-10 h-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        {t('ai-agents.preview.empty-title')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('ai-agents.preview.empty-description')}
                      </p>
                    </div>
                  ) : (
                    previewMessages.map((message, index) => {
                      if (message.role === 'system') {
                        return (
                          <div key={index} className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] text-secondary-foreground">
                              <UserRound className="w-3 h-3" />
                              {message.content}
                            </span>
                          </div>
                        );
                      }

                      const isUser = message.role === 'user';

                      return (
                        <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {message.toolCalls.map((call, i) => (
                                <Badge key={i} variant="outline" className="gap-1 text-[10px] bg-card">
                                  <Wrench className="w-2.5 h-2.5" />
                                  {call.tool}
                                  {call.simulated && (
                                    <span className="text-muted-foreground">· {t('ai-agents.preview.simulated')}</span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                              isUser
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-card border border-border rounded-bl-none'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {previewCountdown !== null && (
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1 text-[11px] text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t('ai-agents.preview.waiting').replace('{seconds}', String(previewCountdown))}
                      </span>
                    </div>
                  )}

                  {previewLoading && (
                    <div className="flex items-start">
                      <div className="bg-card border border-border rounded-lg rounded-bl-none px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={previewEndRef} />
                </div>

                {/* Sandbox note + input */}
                <div className="border-t border-border p-3 space-y-2 bg-card/60 shrink-0">
                  <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    {t('ai-agents.preview.note')}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={previewInput}
                      onChange={e => setPreviewInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePreviewSend();
                        }
                      }}
                      placeholder={
                        previewHandedOver
                          ? t('ai-agents.preview.handover-placeholder')
                          : t('ai-agents.preview.placeholder')
                      }
                      disabled={previewHandedOver}
                    />
                    <Button
                      size="icon"
                      onClick={handlePreviewSend}
                      disabled={previewHandedOver || !previewInput.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(panel, document.body) : null;
};

export default AiAgentStudio;

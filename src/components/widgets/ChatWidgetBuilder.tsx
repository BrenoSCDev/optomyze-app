/**
 * CHAT WIDGET BUILDER
 *
 * Configuration surface for a Website Chat Widget. Shares the widget engine
 * with the form builder — same save/duplicate/embed plumbing — while owning
 * the chat-specific settings: identification flow, conversation copy and
 * where conversations land in the CRM.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Loader2, Save, Globe, Plus, X, Palette, MessagesSquare,
  Settings, Code2, Tag, UserCheck, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Widget, WidgetOptions, ChatWidgetConfig, WidgetIcon, WIDGET_ICONS, WidgetPosition,
  ChatIdentificationMode, ChatFieldState, CHAT_MODE_FIELDS,
  createWidget, updateWidget, regenerateWidgetPublicId, defaultChatConfig,
} from '../../services/widgetApi';
import { WidgetIconGlyph, WIDGET_COLOR_PRESETS } from './widgetIcons';
import ChatWidgetPreview from './ChatWidgetPreview';
import EmbedCodeCard from './EmbedCodeCard';

type ApiErrorShape = {
  response?: { data?: { errors?: Record<string, string[]>; message?: string } };
};

const IDENTIFICATION_MODES: { value: ChatIdentificationMode; labelKey: string; hintKey: string }[] = [
  { value: 'none', labelKey: 'widgets.chat.identification-none', hintKey: 'widgets.chat.identification-none-hint' },
  { value: 'basic', labelKey: 'widgets.chat.identification-basic', hintKey: 'widgets.chat.identification-basic-hint' },
  { value: 'full', labelKey: 'widgets.chat.identification-full', hintKey: 'widgets.chat.identification-full-hint' },
];

const FIELD_STATES: ChatFieldState[] = ['required', 'optional', 'hidden'];

interface ChatWidgetBuilderProps {
  widget: Widget | null;
  options: WidgetOptions | null;
  isEmbedded?: boolean;
  onBack: () => void;
  onSaved: (widget: Widget) => void;
}

const ChatWidgetBuilder: React.FC<ChatWidgetBuilderProps> = ({
  widget, options, isEmbedded = false, onBack, onSaved,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [current, setCurrent] = useState<Widget | null>(widget);
  const [name, setName] = useState(widget?.name || '');
  const [status, setStatus] = useState(widget?.status ?? 'active');
  const [domains, setDomains] = useState<string[]>(widget?.allowed_domains?.length ? widget.allowed_domains : ['']);
  const [config, setConfig] = useState<ChatWidgetConfig>(
    (widget?.config as ChatWidgetConfig) || defaultChatConfig(t)
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [previewOpen, setPreviewOpen] = useState(true);

  useEffect(() => {
    setCurrent(widget);
    setName(widget?.name || '');
    setStatus(widget?.status ?? 'active');
    setDomains(widget?.allowed_domains?.length ? widget.allowed_domains : ['']);
    setConfig((widget?.config as ChatWidgetConfig) || defaultChatConfig(t));
  }, [widget, t]);

  const funnels = useMemo(() => options?.funnels ?? [], [options]);
  const users = useMemo(() => options?.users ?? [], [options]);
  const selectedFunnel = useMemo(
    () => funnels.find((funnel) => funnel.id === config.mapping.funnel_id) || null,
    [funnels, config.mapping.funnel_id]
  );

  const patchTheme = (patch: Partial<ChatWidgetConfig['theme']>) =>
    setConfig((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } }));

  const patchContent = (patch: Partial<ChatWidgetConfig['content']>) =>
    setConfig((prev) => ({ ...prev, content: { ...prev.content, ...patch } }));

  const patchBranding = (patch: Partial<ChatWidgetConfig['branding']>) =>
    setConfig((prev) => ({ ...prev, branding: { ...prev.branding, ...patch } }));

  const patchIdentification = (patch: Partial<ChatWidgetConfig['identification']>) =>
    setConfig((prev) => ({ ...prev, identification: { ...prev.identification, ...patch } }));

  const patchMapping = (patch: Partial<ChatWidgetConfig['mapping']>) =>
    setConfig((prev) => ({ ...prev, mapping: { ...prev.mapping, ...patch } }));

  const patchBehavior = (patch: Partial<ChatWidgetConfig['behavior']>) =>
    setConfig((prev) => ({ ...prev, behavior: { ...prev.behavior, ...patch } }));

  const offeredFields = CHAT_MODE_FIELDS[config.identification.mode] || [];

  const handleSave = async () => {
    const cleanDomains = domains.map((domain) => domain.trim()).filter(Boolean);

    if (!name.trim()) {
      setActiveTab('general');
      toast({ title: t('widgets.validation.name-required'), variant: 'destructive' });
      return;
    }

    if (cleanDomains.length === 0) {
      setActiveTab('general');
      toast({ title: t('widgets.validation.domain-required'), variant: 'destructive' });
      return;
    }

    if (!config.mapping.funnel_id || !config.mapping.stage_id) {
      setActiveTab('mapping');
      toast({ title: t('widgets.validation.mapping-required'), variant: 'destructive' });
      return;
    }

    setSaving(true);

    // Fields the API back-fills when left blank: send the localized default the
    // builder showed as a placeholder, so a cleared field never becomes English.
    const defaults = defaultChatConfig(t);
    const filledConfig: ChatWidgetConfig = {
      ...config,
      theme: {
        ...config.theme,
        launcher_text: config.theme.launcher_text.trim() || defaults.theme.launcher_text,
      },
      content: {
        ...config.content,
        online_text: config.content.online_text.trim() || defaults.content.online_text,
        input_placeholder: config.content.input_placeholder.trim() || defaults.content.input_placeholder,
      },
      identification: {
        ...config.identification,
        submit_text: config.identification.submit_text.trim() || defaults.identification.submit_text,
      },
    };

    try {
      const payload = { name: name.trim(), status, allowed_domains: cleanDomains, config: filledConfig };

      const saved = current
        ? await updateWidget(current.id, payload)
        : await createWidget({ ...payload, type: 'chat' });

      setCurrent(saved);
      setDomains(saved.allowed_domains.length ? saved.allowed_domains : ['']);
      setConfig(saved.config as ChatWidgetConfig);
      onSaved(saved);

      toast({ title: t('widgets.toast.saved'), description: t('widgets.toast.saved-description') });
    } catch (error) {
      const data = (error as ApiErrorShape)?.response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;

      toast({
        title: t('widgets.toast.save-failed'),
        description: firstError || data?.message || t('widgets.toast.save-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!current) return;

    try {
      const updated = await regenerateWidgetPublicId(current.id);
      setCurrent(updated);
      onSaved(updated);
      toast({ title: t('widgets.embed.regenerated'), description: t('widgets.embed.regenerated-description') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  return (
    <div className={isEmbedded ? '' : 'min-h-screen bg-background'}>
      <div className={isEmbedded ? '' : 'px-4 py-6 sm:px-6'}>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-foreground">
              {name.trim() || t('widgets.form.untitled')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {current ? t('widgets.chat.editing') : t('widgets.chat.creating')}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
            <Switch
              checked={status === 'active'}
              onCheckedChange={(checked) => setStatus(checked ? 'active' : 'disabled')}
            />
            <span className="text-sm text-foreground">
              {status === 'active' ? t('widgets.status.active') : t('widgets.status.disabled')}
            </span>
          </div>

          <Button onClick={handleSave} loading={saving}>
            {!saving && <Save />}
            {t('common.save')}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.general')}</span>
              </TabsTrigger>
              <TabsTrigger value="conversation" className="gap-1.5">
                <MessagesSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.conversation')}</span>
              </TabsTrigger>
              <TabsTrigger value="mapping" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.mapping')}</span>
              </TabsTrigger>
              <TabsTrigger value="embed" className="gap-1.5">
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.embed')}</span>
              </TabsTrigger>
            </TabsList>

            {/* ─── General ─────────────────────────────────────────── */}
            <TabsContent value="general" className="mt-4 space-y-5">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  {t('widgets.form.name-label')}
                </Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('widgets.form.name-placeholder')} />
                <p className="text-xs text-muted-foreground">{t('widgets.form.name-hint')}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
                  {t('widgets.form.allowed-domains')}
                </Label>
                {domains.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={domain}
                      placeholder="acme.com"
                      onChange={(e) => {
                        const next = [...domains];
                        next[index] = e.target.value;
                        setDomains(next);
                      }}
                    />
                    {domains.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => setDomains(domains.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setDomains([...domains, ''])}>
                  <Plus className="h-3.5 w-3.5" />
                  {t('widgets.form.add-domain')}
                </Button>
                <p className="text-xs text-muted-foreground">{t('widgets.form.allowed-domains-hint')}</p>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-sm">{t('widgets.form.color')}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {WIDGET_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => patchTheme({ primary_color: preset })}
                      className={`h-7 w-7 rounded-full transition-shadow duration-fast ease-standard ${
                        config.theme.primary_color.toLowerCase() === preset.toLowerCase()
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : ''
                      }`}
                      style={{ backgroundColor: preset }}
                      aria-label={preset}
                    />
                  ))}
                  <input
                    type="color"
                    value={config.theme.primary_color}
                    onChange={(e) => patchTheme({ primary_color: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded-full border-none bg-transparent"
                    title={t('widgets.form.custom-color')}
                  />
                  <code className="ml-1 font-mono text-xs text-muted-foreground">{config.theme.primary_color}</code>
                </div>
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label className="text-sm">{t('widgets.form.icon')}</Label>
                <div className="flex flex-wrap gap-2">
                  {WIDGET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => patchTheme({ icon: icon as WidgetIcon })}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                        config.theme.icon === icon
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                      aria-label={icon}
                    >
                      <WidgetIconGlyph icon={icon as WidgetIcon} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.form.position')}</Label>
                  <Select
                    value={config.theme.position}
                    onValueChange={(value) => patchTheme({ position: value as WidgetPosition })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">{t('widgets.form.position-bottom-right')}</SelectItem>
                      <SelectItem value="bottom-left">{t('widgets.form.position-bottom-left')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.form.launcher-text')}</Label>
                  <Input
                    value={config.theme.launcher_text}
                    placeholder={t('widgets.defaults.chat.launcher-text')}
                    onChange={(e) => patchTheme({ launcher_text: e.target.value })}
                  />
                </div>
              </div>

              {/* Branding */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.chat.agent-avatar')}</Label>
                  <Input
                    value={config.branding.agent_avatar_url || ''}
                    placeholder="https://…"
                    onChange={(e) => patchBranding({ agent_avatar_url: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.chat.company-logo')}</Label>
                  <Input
                    value={config.branding.company_logo_url || ''}
                    placeholder="https://…"
                    onChange={(e) => patchBranding({ company_logo_url: e.target.value || null })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('widgets.chat.remember-state')}</p>
                  <p className="text-xs text-muted-foreground">{t('widgets.chat.remember-state-hint')}</p>
                </div>
                <Switch
                  checked={config.behavior.remember_state}
                  onCheckedChange={(remember_state) => patchBehavior({ remember_state })}
                />
              </div>
            </TabsContent>

            {/* ─── Conversation ────────────────────────────────────── */}
            <TabsContent value="conversation" className="mt-4 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.chat.header-title')}</Label>
                  <Input
                    value={config.content.header_title}
                    placeholder={t('widgets.defaults.chat.header-title')}
                    onChange={(e) => patchContent({ header_title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.chat.header-subtitle')}</Label>
                  <Input
                    value={config.content.header_subtitle}
                    placeholder={t('widgets.defaults.chat.header-subtitle')}
                    onChange={(e) => patchContent({ header_subtitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.chat.welcome-message')}</Label>
                <Textarea
                  value={config.content.welcome_message}
                  placeholder={t('widgets.defaults.chat.welcome-message')}
                  onChange={(e) => patchContent({ welcome_message: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.chat.online-text')}</Label>
                  <Input
                    value={config.content.online_text}
                    placeholder={t('widgets.defaults.chat.online-text')}
                    onChange={(e) => patchContent({ online_text: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.chat.input-placeholder')}</Label>
                  <Input
                    value={config.content.input_placeholder}
                    placeholder={t('widgets.defaults.chat.input-placeholder')}
                    onChange={(e) => patchContent({ input_placeholder: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.chat.offline-text')}</Label>
                <Input
                  value={config.content.offline_text}
                  placeholder={t('widgets.defaults.chat.offline-text')}
                  onChange={(e) => patchContent({ offline_text: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{t('widgets.chat.offline-text-hint')}</p>
              </div>

              {/* Identification */}
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">{t('widgets.chat.identification')}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{t('widgets.chat.identification-hint')}</p>

                <div className="grid gap-2 sm:grid-cols-3">
                  {IDENTIFICATION_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => patchIdentification({ mode: mode.value })}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        config.identification.mode === mode.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className="block text-sm font-medium text-foreground">{t(mode.labelKey)}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{t(mode.hintKey)}</span>
                    </button>
                  ))}
                </div>

                {offeredFields.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {offeredFields.map((field) => (
                      <div key={field} className="flex items-center justify-between gap-3">
                        <span className="text-sm capitalize text-foreground">{t(`widgets.chat.field-${field}`)}</span>
                        <Select
                          value={config.identification.fields[field]}
                          onValueChange={(value) =>
                            patchIdentification({
                              fields: { ...config.identification.fields, [field]: value as ChatFieldState },
                            })
                          }
                        >
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FIELD_STATES.map((state) => (
                              <SelectItem key={state} value={state}>{t(`widgets.chat.state-${state}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    <div className="grid gap-3 pt-1 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('widgets.chat.identification-intro')}</Label>
                        <Input
                          value={config.identification.intro}
                          placeholder={t('widgets.defaults.chat.identification-intro')}
                          onChange={(e) => patchIdentification({ intro: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('widgets.chat.identification-submit')}</Label>
                        <Input
                          value={config.identification.submit_text}
                          placeholder={t('widgets.defaults.chat.identification-submit')}
                          onChange={(e) => patchIdentification({ submit_text: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ─── CRM mapping ─────────────────────────────────────── */}
            <TabsContent value="mapping" className="mt-4 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('widgets.chat.mapping-title')}</h3>
                <p className="text-xs text-muted-foreground">{t('widgets.chat.mapping-description')}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.mapping.funnel')}</Label>
                <Select
                  value={config.mapping.funnel_id ? String(config.mapping.funnel_id) : ''}
                  onValueChange={(value) => patchMapping({ funnel_id: Number(value), stage_id: null })}
                >
                  <SelectTrigger><SelectValue placeholder={t('widgets.mapping.select-funnel')} /></SelectTrigger>
                  <SelectContent>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={String(funnel.id)}>{funnel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.mapping.stage')}</Label>
                <Select
                  value={config.mapping.stage_id ? String(config.mapping.stage_id) : ''}
                  disabled={!selectedFunnel}
                  onValueChange={(value) => patchMapping({ stage_id: Number(value) })}
                >
                  <SelectTrigger><SelectValue placeholder={t('widgets.mapping.select-stage')} /></SelectTrigger>
                  <SelectContent>
                    {(selectedFunnel?.stages ?? []).map((stage) => (
                      <SelectItem key={stage.id} value={String(stage.id)}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.chat.assigned-user')}</Label>
                <Select
                  value={config.mapping.assigned_user_id ? String(config.mapping.assigned_user_id) : 'none'}
                  onValueChange={(value) =>
                    patchMapping({ assigned_user_id: value === 'none' ? null : Number(value) })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('widgets.chat.assigned-user-none')}</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('widgets.chat.assigned-user-hint')}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">{t('widgets.chat.summary-title')}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• {t('widgets.chat.summary-inbox')}</li>
                  <li>• {t('widgets.chat.summary-lead')}</li>
                  <li>• {t('widgets.chat.summary-anonymous')}</li>
                </ul>
              </div>
            </TabsContent>

            {/* ─── Embed ───────────────────────────────────────────── */}
            <TabsContent value="embed" className="mt-4">
              <EmbedCodeCard
                widget={current}
                embedBaseUrl={options?.embed_base_url || ''}
                onRegenerate={current ? handleRegenerate : undefined}
              />
            </TabsContent>
          </Tabs>

          {/* Live preview */}
          <div className={isEmbedded ? 'lg:sticky lg:top-0 lg:self-start' : 'lg:sticky lg:top-6 lg:self-start'}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{t('widgets.preview.title')}</h3>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen((prev) => !prev)}>
                {previewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {previewOpen ? t('widgets.preview.collapse') : t('widgets.preview.expand')}
              </Button>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
              <ChatWidgetPreview
                config={config}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                showIdentification={activeTab === 'conversation' && config.identification.mode !== 'none'}
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {activeTab === 'conversation' && config.identification.mode !== 'none'
                ? t('widgets.chat.preview-identification-hint')
                : t('widgets.preview.hint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidgetBuilder;

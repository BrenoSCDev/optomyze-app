/**
 * CHAT WIDGET PREVIEW
 *
 * Mirrors what the embed script draws on the customer's website: the floating
 * launcher, the pre-chat identification form and the live conversation view.
 * The builder toggles between them so both states can be checked without
 * publishing.
 */

import React from 'react';
import { Minus, Send } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChatWidgetConfig, CHAT_MODE_FIELDS } from '../../services/widgetApi';
import { WidgetIconGlyph } from './widgetIcons';
import WidgetBrandMark from './WidgetBrandMark';

interface ChatWidgetPreviewProps {
  config: ChatWidgetConfig;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the pre-chat form instead of the conversation. */
  showIdentification?: boolean;
}

const ChatWidgetPreview: React.FC<ChatWidgetPreviewProps> = ({
  config,
  open = true,
  onOpenChange,
  showIdentification = false,
}) => {
  const { t } = useLanguage();
  const color = config.theme.primary_color;
  const alignment = config.theme.position === 'bottom-left' ? 'items-start' : 'items-end';

  const visibleFields = (CHAT_MODE_FIELDS[config.identification.mode] || []).filter(
    (field) => config.identification.fields[field] !== 'hidden'
  );

  const launcher = (
    <button
      type="button"
      onClick={() => onOpenChange?.(true)}
      className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105"
      style={{ backgroundColor: color }}
      aria-label={config.theme.launcher_text}
    >
      <WidgetIconGlyph icon={config.theme.icon} className="h-6 w-6" />
    </button>
  );

  const panel = (
    <div className="flex h-[420px] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 px-4 py-3 text-white" style={{ backgroundColor: color }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3">
          {config.branding.agent_avatar_url || config.branding.company_logo_url ? (
            <img
              src={config.branding.agent_avatar_url || config.branding.company_logo_url || ''}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <WidgetIconGlyph icon={config.theme.icon} className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight">{config.content.header_title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] opacity-90">
            {config.content.header_subtitle && <span className="truncate">{config.content.header_subtitle} ·</span>}
            <span className="inline-flex shrink-0 items-center gap-1">
              <span className="h-[7px] w-[7px] rounded-full bg-emerald-400" />
              {config.content.online_text || t('widgets.defaults.chat.online-text')}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-85 transition-colors hover:bg-surface-3 hover:opacity-100"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {showIdentification && visibleFields.length > 0 ? (
        /* Pre-chat identification */
        <div className="flex-1 overflow-y-auto bg-card p-4">
          {config.identification.intro && (
            <p className="mb-3 text-[13px] text-muted-foreground">{config.identification.intro}</p>
          )}

          {visibleFields.map((field) => (
            <div key={field} className="mb-3">
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {t(`widgets.chat.field-${field}`)}
                {config.identification.fields[field] === 'required' && ' *'}
              </label>
              <input
                readOnly
                className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          ))}

          <button
            type="button"
            disabled
            className="w-full rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {config.identification.submit_text || t('widgets.defaults.chat.identification-submit')}
          </button>
        </div>
      ) : (
        <>
          {/* Conversation */}
          <div className="flex-1 space-y-2.5 overflow-y-auto bg-muted/40 p-4">
            <div className="flex justify-start">
              <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm">
                {config.content.welcome_message}
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className="max-w-[78%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {t('widgets.preview.sample-message')}
                <span className="mt-1 block text-[10px] opacity-70">10:24</span>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="flex shrink-0 items-end gap-2 border-t border-border bg-card px-3 py-2.5">
            <div className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
              {config.content.input_placeholder || t('widgets.defaults.chat.input-placeholder')}
            </div>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              <Send className="h-4 w-4" />
            </div>
          </div>
        </>
      )}

      <WidgetBrandMark className="shrink-0 bg-card pb-2.5" />
    </div>
  );

  return (
    <div className={`mx-auto flex min-h-[460px] w-full max-w-[400px] flex-col justify-end gap-3 rounded-xl border border-dashed border-border bg-background/40 p-3 ${alignment}`}>
      {open ? panel : launcher}
    </div>
  );
};

export default ChatWidgetPreview;

/**
 * FORM WIDGET PREVIEW
 *
 * Renders the widget exactly as the embed script will draw it on the
 * customer's website, so the builder is a true WYSIWYG — including the
 * launcher and open/closed states of the expandable display modes.
 * Inputs are inert: this is a preview, not a working form.
 */

import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FormWidgetConfig, FormField } from '../../services/widgetApi';
import { WidgetIconGlyph } from './widgetIcons';
import WidgetBrandMark from './WidgetBrandMark';

interface FormWidgetPreviewProps {
  config: FormWidgetConfig;
  /** Expanded state, controlled by the builder so it can be toggled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FieldPreview: React.FC<{ field: FormField; color: string }> = ({ field, color }) => {
  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground';

  const label = (
    <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
      {field.label}
      {field.required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );

  return (
    <div className="mb-3.5">
      {field.type !== 'checkbox' && label}

      {field.type === 'textarea' && (
        <textarea className={`${inputClass} min-h-[84px] resize-none`} placeholder={field.placeholder} readOnly />
      )}

      {field.type === 'select' && (
        <select className={inputClass} disabled defaultValue="">
          <option value="">{field.placeholder || '—'}</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="flex flex-col gap-2">
          {(field.options || []).map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
              <input type="radio" disabled className="h-4 w-4" style={{ accentColor: color }} />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" disabled className="mt-0.5 h-4 w-4" style={{ accentColor: color }} />
          <span>
            {field.label}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </span>
        </label>
      )}

      {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
        <input
          className={inputClass}
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          placeholder={field.placeholder}
          readOnly
        />
      )}

      {field.help_text && <span className="mt-1 block text-xs text-muted-foreground">{field.help_text}</span>}
    </div>
  );
};

/** The form itself — identical in every display mode. */
const FormCard: React.FC<{
  config: FormWidgetConfig;
  closable?: boolean;
  onClose?: () => void;
}> = ({ config, closable, onClose }) => {
  const { t } = useLanguage();
  const color = config.theme.primary_color;
  const fields = config.fields.filter((field) => field.enabled);

  return (
    <div className="relative w-full rounded-2xl border border-border bg-card p-6 shadow-lg">
      {closable && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Header */}
      <div className={`mb-4 flex items-center gap-3 ${closable ? 'pr-8' : ''}`}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          <WidgetIconGlyph icon={config.theme.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {config.content.title && (
            <h3 className="truncate text-[17px] font-bold leading-tight text-foreground">{config.content.title}</h3>
          )}
          {config.content.description && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{config.content.description}</p>
          )}
        </div>
      </div>

      {/* Fields */}
      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          {t('widgets.preview.no-fields')}
        </div>
      ) : (
        fields.map((field) => <FieldPreview key={field.key} field={field} color={color} />)
      )}

      {/* Submit */}
      <button
        type="button"
        disabled
        className="mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {config.content.submit_text || t('widgets.defaults.form.submit-text')}
      </button>

      <WidgetBrandMark className="mt-3.5" />
    </div>
  );
};

/** The launcher visitors click to expand the form. */
const Launcher: React.FC<{
  config: FormWidgetConfig;
  bubble?: boolean;
  onClick?: () => void;
}> = ({ config, bubble, onClick }) => {
  const { t } = useLanguage();
  const color = config.theme.primary_color;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        bubble
          ? 'flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:-translate-y-0.5'
          : 'inline-flex items-center gap-2 rounded-full px-[18px] py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5'
      }
      style={{ backgroundColor: color }}
    >
      <WidgetIconGlyph icon={config.theme.icon} className={bubble ? 'h-6 w-6' : 'h-[18px] w-[18px]'} />
      {!bubble && <span>{config.theme.launcher_text || t('widgets.defaults.form.launcher-text')}</span>}
    </button>
  );
};

const FormWidgetPreview: React.FC<FormWidgetPreviewProps> = ({ config, open = true, onOpenChange }) => {
  const display = config.theme.display || 'inline';

  if (display === 'inline') {
    return (
      <div className="mx-auto w-full max-w-[420px]">
        <FormCard config={config} />
      </div>
    );
  }

  if (display === 'collapsible') {
    return (
      <div className="mx-auto w-full max-w-[420px] space-y-3">
        {open ? (
          <FormCard config={config} closable onClose={() => onOpenChange?.(false)} />
        ) : (
          <Launcher config={config} onClick={() => onOpenChange?.(true)} />
        )}
      </div>
    );
  }

  // Floating: mimic a browser viewport corner so the anchoring is obvious.
  const alignment = config.theme.position === 'bottom-left' ? 'items-start' : 'items-end';

  return (
    <div className={`mx-auto flex min-h-[320px] w-full max-w-[420px] flex-col justify-end gap-3 rounded-xl border border-dashed border-border bg-background/40 p-3 ${alignment}`}>
      {open ? (
        <FormCard config={config} closable onClose={() => onOpenChange?.(false)} />
      ) : (
        <Launcher config={config} bubble onClick={() => onOpenChange?.(true)} />
      )}
    </div>
  );
};

export default FormWidgetPreview;

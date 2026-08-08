import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  type PageSettings, PAPER_SIZES, AVAILABLE_FONTS, type PaperSize,
} from './pageGeometry';

interface PageSettingsPanelProps {
  settings: PageSettings;
  onChange: (settings: PageSettings) => void;
  disabled?: boolean;
}

/**
 * Paper setup.
 *
 * Every control here changes the canvas immediately *and* travels to the PDF
 * renderer with the same value — that is the point. Margins are in
 * millimetres because that is what dompdf's `@page` takes, so nothing is
 * converted between what the author sets and what the printer gets.
 */
const PageSettingsPanel: React.FC<PageSettingsPanelProps> = ({ settings, onChange, disabled }) => {
  const { t } = useLanguage();

  const set = <K extends keyof PageSettings>(key: K, value: PageSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const setMargin = (side: keyof PageSettings['margins'], value: number) =>
    onChange({ ...settings, margins: { ...settings.margins, [side]: value } });

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">{t('documents.settings.paper')}</Label>
          <Select
            value={settings.paper}
            disabled={disabled}
            onValueChange={(value) => set('paper', value as PaperSize)}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PAPER_SIZES).map(([key, paper]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {paper.label}
                  <span className="text-muted-foreground ml-1.5">
                    {paper.width}×{paper.height}mm
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px]">{t('documents.settings.orientation')}</Label>
          <Select
            value={settings.orientation}
            disabled={disabled}
            onValueChange={(value) => set('orientation', value as 'portrait' | 'landscape')}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait" className="text-xs">{t('documents.settings.portrait')}</SelectItem>
              <SelectItem value="landscape" className="text-xs">{t('documents.settings.landscape')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-[11px] mb-2 block">{t('documents.settings.margins')}</Label>
        <div className="grid grid-cols-2 gap-3">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="space-y-1">
              <span className="text-[10px] text-muted-foreground capitalize">
                {t(`documents.settings.margin-${side}`)}
              </span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  disabled={disabled}
                  value={settings.margins[side]}
                  onChange={(event) => setMargin(side, Number(event.target.value))}
                  className="h-7 text-xs"
                />
                <span className="text-[10px] text-muted-foreground">mm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">{t('documents.settings.header-offset')}</span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number" min={0} max={100} disabled={disabled}
              value={settings.header_offset}
              onChange={(event) => set('header_offset', Number(event.target.value))}
              className="h-7 text-xs"
            />
            <span className="text-[10px] text-muted-foreground">mm</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">{t('documents.settings.footer-offset')}</span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number" min={0} max={100} disabled={disabled}
              value={settings.footer_offset}
              onChange={(event) => set('footer_offset', Number(event.target.value))}
              className="h-7 text-xs"
            />
            <span className="text-[10px] text-muted-foreground">mm</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">{t('documents.settings.default-font')}</Label>
          <Select
            value={settings.font_family}
            disabled={disabled}
            onValueChange={(value) => set('font_family', value)}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AVAILABLE_FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value} className="text-xs">
                  <span style={{ fontFamily: font.css }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/*
            The list is short on purpose: these are the families dompdf can
            actually produce. Offering one it cannot would show the author a
            font the signer never receives.
          */}
          <p className="text-[10px] text-muted-foreground">
            {t('documents.settings.font-note')}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px]">{t('documents.settings.font-size')}</Label>
            <span className="text-[10px] text-muted-foreground">{settings.font_size}pt</span>
          </div>
          <Slider
            min={6} max={32} step={1} disabled={disabled}
            value={[settings.font_size]}
            onValueChange={([value]) => set('font_size', value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px]">{t('documents.settings.line-height')}</Label>
            <span className="text-[10px] text-muted-foreground">{settings.line_height}</span>
          </div>
          <Slider
            min={1} max={3} step={0.05} disabled={disabled}
            value={[settings.line_height]}
            onValueChange={([value]) => set('line_height', Number(value.toFixed(2)))}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px]">{t('documents.settings.paragraph-spacing')}</Label>
            <span className="text-[10px] text-muted-foreground">{settings.paragraph_spacing}pt</span>
          </div>
          <Slider
            min={0} max={40} step={1} disabled={disabled}
            value={[settings.paragraph_spacing]}
            onValueChange={([value]) => set('paragraph_spacing', value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PageSettingsPanel;

/**
 * WIDGET BRAND MARK
 *
 * "Powered by Optomyze" watermark shown at the bottom of every embedded
 * widget. Rendered inert here so the builder preview matches what visitors
 * see; on the customer's website the embed scripts render the same line as a
 * link to optomyze.io.
 */

import React from 'react';
import optomyzeLogo from '@/assets/optomyze.png';
import optomyzeLogoLight from '@/assets/optomyze-light.png';
import { useTheme } from '@/contexts/ThemeContext';

interface WidgetBrandMarkProps {
  className?: string;
}

const WidgetBrandMark: React.FC<WidgetBrandMarkProps> = ({ className = '' }) => {
  const { mode } = useTheme();
  // The white lockup reads on dark surfaces, the dark one on light surfaces.
  const logo = mode === 'dark' ? optomyzeLogo : optomyzeLogoLight;

  return (
    <div className={`flex items-center justify-center gap-1.5 text-[12px] leading-none text-muted-foreground ${className}`}>
      <span>Powered by</span>
      {/* The logo carries the wordmark, so no separate "Optomyze" text. */}
      <img src={logo} alt="Optomyze" className="h-[17px] w-auto shrink-0" />
    </div>
  );
};

export default WidgetBrandMark;

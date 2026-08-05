/**
 * SOURCE PLATFORM ICON
 *
 * Maps a lead's source_platform to a representative icon, used on lead
 * cards instead of a text badge.
 */

import { FaWhatsapp, FaFacebook, FaInstagram, FaTelegram } from 'react-icons/fa';
import { FaMeta } from 'react-icons/fa6';
import { SiGoogleads } from 'react-icons/si';
import { Phone, MessageSquare, Code2, Globe, Mail, MoreHorizontal, CalendarClock, LucideIcon } from 'lucide-react';
import { IconType } from 'react-icons';
import { SourcePlatform } from '@/types/leads';
import { cn } from '@/lib/utils';

const PLATFORM_META: Record<SourcePlatform, { icon: IconType | LucideIcon; color: string; label: string }> = {
  whatsapp: { icon: FaWhatsapp, color: 'text-green-500', label: 'WhatsApp' },
  facebook: { icon: FaFacebook, color: 'text-blue-600', label: 'Facebook' },
  instagram: { icon: FaInstagram, color: 'text-pink-500', label: 'Instagram' },
  meta_ads: { icon: FaMeta, color: 'text-blue-500', label: 'Meta Ads' },
  google_ads: { icon: SiGoogleads, color: 'text-yellow-500', label: 'Google Ads' },
  telegram: { icon: FaTelegram, color: 'text-sky-500', label: 'Telegram' },
  phone: { icon: Phone, color: 'text-emerald-500', label: 'Phone' },
  sms: { icon: MessageSquare, color: 'text-indigo-400', label: 'SMS' },
  email: { icon: Mail, color: 'text-red-400', label: 'Email' },
  website: { icon: Globe, color: 'text-cyan-400', label: 'Website' },
  api: { icon: Code2, color: 'text-slate-400', label: 'API' },
  // A public booking page — a native origin, not an 'other'.
  calendar: { icon: CalendarClock, color: 'text-violet-400', label: 'Calendar' },
  other: { icon: MoreHorizontal, color: 'text-muted-foreground', label: 'Other' },
};

export const normalizeSourcePlatform = (value?: string | null): SourcePlatform => {
  const normalized = (value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return (normalized in PLATFORM_META ? normalized : 'other') as SourcePlatform;
};

interface SourcePlatformIconProps {
  source?: string | null;
  className?: string;
}

/**
 * `className` lands on the icon, not the wrapper — callers pass it to resize
 * (e.g. `w-4 h-4` inside a select), and on the wrapper it had no effect.
 */
const SourcePlatformIcon = ({ source, className }: SourcePlatformIconProps) => {
  const platform = normalizeSourcePlatform(source);
  const { icon: Icon, color, label } = PLATFORM_META[platform];

  return (
    <span title={label} className="inline-flex items-center justify-center">
      <Icon className={cn('w-5 h-5', color, className)} />
    </span>
  );
};

export default SourcePlatformIcon;

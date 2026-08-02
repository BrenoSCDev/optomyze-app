/**
 * SOURCE PLATFORM ICON
 *
 * Where a contact originally came from. Distinct from ChannelIcon, which maps
 * *inbox conversation* channels — a lead's origin covers ad platforms, forms
 * and imports that never produce a conversation at all.
 *
 * Values seen in the wild: api, Direct, email, facebook, google_ads,
 * instagram, meta_ads, other, phone, sms, telegram, website, whatsapp.
 */

import React from 'react';
import {
  FaWhatsapp, FaInstagram, FaFacebook, FaFacebookMessenger, FaSms, FaTelegram,
} from 'react-icons/fa';
import { SiGoogleads } from 'react-icons/si';
import { FaMeta } from 'react-icons/fa6';
import { Globe, Mail, MousePointerClick, Phone, Plug, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  platform: string | null | undefined;
  className?: string;
}

/** Icon + brand tint + human label for a source platform. */
export const sourcePlatformMeta = (
  platform: string | null | undefined
): { Icon: React.ComponentType<{ className?: string }>; tone: string; label: string } => {
  switch ((platform ?? '').toLowerCase()) {
    case 'whatsapp':   return { Icon: FaWhatsapp, tone: 'text-green-600', label: 'WhatsApp' };
    case 'instagram':  return { Icon: FaInstagram, tone: 'text-pink-500', label: 'Instagram' };
    case 'messenger':  return { Icon: FaFacebookMessenger, tone: 'text-blue-500', label: 'Messenger' };
    case 'facebook':   return { Icon: FaFacebook, tone: 'text-blue-600', label: 'Facebook' };
    case 'meta_ads':   return { Icon: FaMeta, tone: 'text-blue-500', label: 'Meta Ads' };
    case 'google_ads': return { Icon: SiGoogleads, tone: 'text-amber-500', label: 'Google Ads' };
    case 'telegram':   return { Icon: FaTelegram, tone: 'text-sky-500', label: 'Telegram' };
    case 'sms':        return { Icon: FaSms, tone: 'text-blue-400', label: 'SMS' };
    case 'email':      return { Icon: Mail, tone: 'text-violet-500', label: 'Email' };
    case 'phone':      return { Icon: Phone, tone: 'text-emerald-500', label: 'Phone' };
    case 'website':    return { Icon: Globe, tone: 'text-violet-500', label: 'Website' };
    case 'direct':     return { Icon: MousePointerClick, tone: 'text-muted-foreground', label: 'Direct' };
    case 'api':        return { Icon: Plug, tone: 'text-muted-foreground', label: 'API' };
    default:           return { Icon: HelpCircle, tone: 'text-muted-foreground', label: platform || 'Unknown' };
  }
};

const SourcePlatformIcon: React.FC<Props> = ({ platform, className }) => {
  const { Icon, tone, label } = sourcePlatformMeta(platform);
  return <Icon className={cn(tone, className)} aria-label={label} />;
};

export default SourcePlatformIcon;

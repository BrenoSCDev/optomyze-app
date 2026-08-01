/**
 * WHATSAPP PROFILE CARD
 *
 * Shows the WhatsApp account currently paired with an instance (picture, name
 * and phone number), as returned by Evolution's /instance/fetchInstances.
 * Used wherever we confirm to the user that a connection is live.
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPhoneNumber } from '@/lib/phone';

export interface WhatsAppProfile {
  name?: string | null;
  picture_url?: string | null;
  phone_number?: string | null;
}

interface WhatsAppProfileCardProps {
  profile: WhatsAppProfile | null | undefined;
  className?: string;
}

const initialsOf = (name?: string | null): string => {
  if (!name) return 'WA';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const WhatsAppProfileCard: React.FC<WhatsAppProfileCardProps> = ({ profile, className = '' }) => {
  const { t } = useLanguage();

  const name = profile?.name || t('integrations.panel.connection.unknown-name');
  const phone = profile?.phone_number ? formatPhoneNumber(profile.phone_number) : null;

  return (
    <div className={`flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4 ${className}`}>
      <Avatar className="w-12 h-12 border border-green-500/30">
        {profile?.picture_url && <AvatarImage src={profile.picture_url} alt={name} />}
        <AvatarFallback className="bg-green-500/20 text-green-700 dark:text-green-300 text-sm font-medium">
          {initialsOf(profile?.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-foreground truncate">{name}</p>
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        </div>
        {phone && <p className="text-sm text-muted-foreground truncate">{phone}</p>}
        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
          {t('integrations.panel.connection.connected-badge')}
        </p>
      </div>
    </div>
  );
};

export default WhatsAppProfileCard;

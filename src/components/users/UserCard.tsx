import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserX, UserCheck, Trash2, Pencil } from 'lucide-react';
import { User } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import { PrivateAvatarImage } from '@/components/ui/PrivateImage';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import { useOnlinePresence } from '@/contexts/PresenceContext';
import optomyzeLogo from '@/assets/user-banner.jpeg';
import { formatPhoneNumber } from '@/lib/phone';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
  isAgent?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
  isAgent = false,
}) => {
  const { t } = useLanguage();
  const backgroundUrl = usePrivateFile(user.bg_pic);
  const { isUserOnline } = useOnlinePresence();
  const online = isUserOnline(user.id);

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <div className="glass-card overflow-hidden transition-colors duration-base ease-standard hover:shadow-lg flex flex-col">

      {/* Cover image */}
      <div className="relative h-32 shrink-0">
        <img
          src={backgroundUrl || optomyzeLogo}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
        />

        {/* Status badge — top left */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="outline" className={`${getStatusColor(user.is_active)} backdrop-blur-sm text-xs`}>
            {user.is_active ? t('users.card.active') : t('users.card.inactive')}
          </Badge>
        </div>

        {/* Action buttons — top right */}
        {!isAgent && (
          <div className="absolute top-3 right-3 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(user)}
              className="h-7 w-7 bg-scrim/40 backdrop-blur-sm hover:bg-scrim/60 text-white"
              title={t('users.card.edit') || 'Edit'}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleStatus(user)}
              className="h-7 w-7 bg-scrim/40 backdrop-blur-sm hover:bg-scrim/60 text-white"
              title={user.is_active ? t('users.card.deactivate') : t('users.card.activate')}
            >
              {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(user)}
              className="h-7 w-7 bg-red-600/70 backdrop-blur-sm hover:bg-red-700/90 text-white"
              title={t('users.card.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Avatar overlapping the cover */}
      <div className="relative px-4 -mt-8">
        <Avatar className="h-16 w-16 border-4 border-background shadow-md">
          <PrivateAvatarImage path={user.profile_pic} alt={user.name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Info section */}
      <div className="px-4 pt-2 pb-4 flex flex-col gap-1">
        <h3 className="text-base font-bold text-foreground truncate">{user.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        {user.phone && <p className="text-xs text-muted-foreground truncate">{formatPhoneNumber(user.phone)}</p>}

        {/* Role + Teams */}
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className={`${getRoleColor(user.role)} text-xs`}>
            {user.role}
          </Badge>
          {user.managed_teams?.map(team => (
            <Badge
              key={`mgr-${team.id}`}
              variant="outline"
              className="bg-yellow-50 text-yellow-800 border-yellow-200 text-xs"
              title="Manages this team"
            >
              ★ {team.name}
            </Badge>
          ))}
          {user.teams?.map(team => (
            <Badge key={`mbr-${team.id}`} variant="secondary" className="text-xs">
              {team.name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          <span className={`text-xs font-medium ${online ? 'text-green-600' : 'text-muted-foreground'}`}>
            {online ? t('users.status.online') : t('users.status.offline')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserCard;

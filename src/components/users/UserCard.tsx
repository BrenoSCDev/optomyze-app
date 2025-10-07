import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Eye, UserX, UserCheck, Trash2 } from 'lucide-react';
import { User } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  const { t } = useLanguage();

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderator':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLastSeenText = (lastLogin: string | null) => {
    if (!lastLogin) return t('users.card.never-logged-in');
    
    try {
      return t('users.card.last-seen') + ' ' + formatDistanceToNow(new Date(lastLogin), { addSuffix: true });
    } catch {
      return t('users.card.recently');
    }
  };

  const backgroundStyle = user.background_image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${user.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))',
      };

  return (
    <div 
      className="relative glass-card overflow-hidden hover:scale-102 transition-all duration-300 h-80 group"
      style={backgroundStyle}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* Actions Menu */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('users.card.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onView(user)}>
              <Eye className="mr-2 h-4 w-4" />
              {t('users.card.view-profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(user)}>
              {user.is_active ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  {t('users.card.deactivate')}
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {t('users.card.activate')}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(user)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('users.card.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge 
          variant="outline" 
          className={`${getStatusColor(user.is_active)} backdrop-blur-sm`}
        >
          {user.is_active ? t('users.card.active') : t('users.card.inactive')}
        </Badge>
      </div>

      {/* User Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-end">
        {/* Profile Photo */}
        <div className="mb-4">
          <Avatar className="h-16 w-16 border-4 border-white/30 shadow-lg">
            <AvatarImage src={`http://localhost/storage/${user.profile_pic}` || undefined} alt={user.name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Info */}
        <div className="text-white">
          <h3 className="text-xl font-bold mb-1 truncate">{user.name || 'Unknown User'}</h3>
          <p className="text-white/90 text-sm mb-1 truncate">{user.email || 'No email'}</p>
          <p className="text-white/80 text-xs mb-3 truncate">{user.phone || 'No phone'}</p>
          
          {/* Role Badge */}
          <div className="mb-3">
            <Badge 
              variant="outline" 
              className={`${getRoleColor(user.role)} backdrop-blur-sm text-xs`}
            >
              {user.role || 'user'}
            </Badge>
          </div>

          {/* Last Login */}
          <p className="text-white/70 text-xs">
            {getLastSeenText(user.last_login_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
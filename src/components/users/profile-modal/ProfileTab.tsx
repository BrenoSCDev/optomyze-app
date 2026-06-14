import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, Users as UsersIcon, Circle } from 'lucide-react';
import { User } from '@/types/user';
import { format } from 'date-fns';

interface ProfileTabProps {
  user: User;
  online: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, online }) => {
  let joined = '—';
  try {
    joined = format(new Date(user.created_at), 'MMM d, yyyy');
  } catch {
    // keep fallback
  }

  const hasTeams = (user.managed_teams?.length ?? 0) > 0 || (user.teams?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-foreground truncate">{user.email}</span>
        </div>

        {user.phone && (
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-foreground">{user.phone}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-sm">
          <Circle className={`h-3 w-3 shrink-0 ${online ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
          <span className="text-foreground">{online ? 'Online' : 'Offline'}</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-foreground">Joined {joined}</span>
        </div>
      </div>

      {hasTeams && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <UsersIcon className="h-4 w-4" />
            <span>Teams</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
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
        </div>
      )}
    </div>
  );
};

export default ProfileTab;

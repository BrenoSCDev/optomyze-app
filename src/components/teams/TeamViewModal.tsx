import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Edit, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Team } from '@/types/team';
import { API_BASE_URL } from '@/services/api';

interface TeamViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onEdit: (team: Team) => void;
}

const TeamViewModal: React.FC<TeamViewModalProps> = ({
  open,
  onOpenChange,
  team,
  onEdit,
}) => {
  const { t } = useLanguage();

  if (!team) return null;

  const getAvatarUrl = (profileUrl: string | null | undefined) => {
    if (!profileUrl) return null;
    if (profileUrl.startsWith('http')) return profileUrl;
    return `${API_BASE_URL}/storage/${profileUrl}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {team.description && (
            <div>
              <p className="text-sm text-muted-foreground">{team.description}</p>
            </div>
          )}

          {/* Manager Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              {t('teams.view.manager')}
            </h4>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getAvatarUrl(team.manager?.profile_photo_url)} />
                <AvatarFallback>
                  {team.manager ? getInitials(team.manager.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{team.manager?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {team.manager?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('teams.view.members')} ({team.users?.length || 0})
            </h4>
            
            {team.users && team.users.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {team.users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getAvatarUrl(user.profile_photo_url)} />
                      <AvatarFallback className="text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {user.role && (
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('teams.view.no-members')}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('teams.view.close')}
          </Button>
          <Button onClick={() => { onOpenChange(false); onEdit(team); }}>
            <Edit className="h-4 w-4" />
            {t('teams.view.edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamViewModal;

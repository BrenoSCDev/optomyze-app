import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash2, Users, Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Team } from '@/types/team';
import { API_BASE_URL } from '@/services/api';

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onView: (team: Team) => void;
  onDelete: (team: Team) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onEdit, onView, onDelete }) => {
  const { t } = useLanguage();

  const getAvatarUrl = (profileUrl: string | null | undefined) => {
    if (!profileUrl) return null;
    if (profileUrl.startsWith('http')) return profileUrl;
    return `${API_BASE_URL}/storage/${profileUrl}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-6">
        {/* Header with actions */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {team.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(team)}>
                <Eye className="h-4 w-4 mr-2" />
                {t('teams.actions.view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(team)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('teams.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(team)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('teams.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Manager info */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
          <Crown className="h-4 w-4 text-amber-500" />
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarUrl(team.manager?.profile_photo_url)} />
            <AvatarFallback className="text-xs">
              {team.manager ? getInitials(team.manager.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{team.manager?.name || 'N/A'}</p>
            <p className="text-xs text-muted-foreground truncate">{team.manager?.email}</p>
          </div>
        </div>

        {/* Team members preview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {(team.users?.length || 0) + 1} {t('teams.members')}
            </span>
          </div>
          
          {/* Avatar stack for team members */}
          {team.users && team.users.length > 0 && (
            <div className="flex -space-x-2">
              {team.users.slice(0, 4).map((user) => (
                <Avatar key={user.id} className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={getAvatarUrl(user.profile_photo_url)} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {team.users.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{team.users.length - 4}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;

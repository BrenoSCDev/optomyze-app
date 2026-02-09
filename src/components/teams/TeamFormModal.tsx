import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Team, TeamFormData } from '@/types/team';
import { User } from '@/types/user';
import { teamApi } from '@/services/teamApi';
import { API_BASE_URL } from '@/services/api';

interface TeamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  users: User[];
  onSave: (team: Team) => void;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_photo_url?: string | null;
}

const TeamFormModal: React.FC<TeamFormModalProps> = ({
  open,
  onOpenChange,
  team,
  users,
  onSave,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    manager_user_id: number | null;
  }>({
    name: '',
    description: '',
    manager_user_id: null,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [memberRole, setMemberRole] = useState<string>('');

  // Reset form when modal opens/closes or team changes
  useEffect(() => {
    if (open) {
      if (team) {
        setFormData({
          name: team.name,
          description: team.description || '',
          manager_user_id: team.manager_user_id,
        });
        // Fetch full team data to ensure users are loaded
        teamApi.getTeam(team.id).then(fullTeam => {
          setTeamMembers(
            fullTeam.users?.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.pivot?.role || u.role || '',
              profile_photo_url: u.profile_photo_url,
            })) || []
          );
        }).catch(() => {
          // Fallback to whatever we have
          setTeamMembers(
            team.users?.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.pivot?.role || u.role || '',
              profile_photo_url: u.profile_photo_url,
            })) || []
          );
        });
      } else {
        setFormData({
          name: '',
          description: '',
          manager_user_id: null,
        });
        setTeamMembers([]);
      }
      setSelectedUserId('');
      setMemberRole('');
    }
  }, [open, team]);

  const getAvatarUrl = (profileUrl: string | null | undefined) => {
    if (!profileUrl) return null;
    if (profileUrl.startsWith('http')) return profileUrl;
    return `${API_BASE_URL}/storage/${profileUrl}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddMember = () => {
    if (!selectedUserId) return;
    
    const userId = parseInt(selectedUserId);
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    if (teamMembers.some(m => m.id === userId)) {
      toast({
        variant: "destructive",
        title: t('teams.form.member-exists'),
      });
      return;
    }

    setTeamMembers(prev => [...prev, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: memberRole,
      profile_photo_url: user.profile_photo_url,
    }]);
    setSelectedUserId('');
    setMemberRole('');
  };

  const handleRemoveMember = (memberId: number) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleUpdateMemberRole = (memberId: number, newRole: string) => {
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: t('teams.form.name-required'),
      });
      return;
    }

    if (!formData.manager_user_id) {
      toast({
        variant: "destructive",
        title: t('teams.form.manager-required'),
      });
      return;
    }

    setLoading(true);
    try {
      const payload: TeamFormData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        manager_user_id: formData.manager_user_id,
        users: teamMembers.map(m => ({ id: m.id, role: m.role || undefined })),
      };

      let savedTeam: Team;
      if (team) {
        savedTeam = await teamApi.updateTeam(team.id, payload);
        toast({
          title: t('teams.form.updated'),
          description: t('teams.form.updated-description'),
        });
      } else {
        savedTeam = await teamApi.createTeam(payload);
        toast({
          title: t('teams.form.created'),
          description: t('teams.form.created-description'),
        });
      }
      onSave(savedTeam);
    } catch (err) {
      console.error('Failed to save team:', err);
      toast({
        variant: "destructive",
        title: team ? t('teams.errors.update-failed') : t('teams.errors.create-failed'),
        description: t('teams.errors.try-again'),
      });
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = users.filter(u => !teamMembers.some(m => m.id === u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {team ? t('teams.form.edit-title') : t('teams.form.create-title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('teams.form.name')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('teams.form.name-placeholder')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('teams.form.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('teams.form.description-placeholder')}
              rows={3}
            />
          </div>

          {/* Manager Selection */}
          <div className="space-y-2">
            <Label>{t('teams.form.manager')} *</Label>
            <Select
              value={formData.manager_user_id?.toString() || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, manager_user_id: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('teams.form.select-manager')} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <Label>{t('teams.form.members')}</Label>
            
            {/* Add member row */}
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('teams.form.select-member')} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={t('teams.form.role-placeholder')}
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="w-40"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddMember}
                disabled={!selectedUserId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Members list */}
            {teamMembers.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(member.profile_photo_url)} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <Input
                      placeholder={t('teams.form.role-placeholder')}
                      value={member.role}
                      onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('teams.form.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {team ? t('teams.form.save') : t('teams.form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamFormModal;

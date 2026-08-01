import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UsersRound, Plus, RefreshCw, Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Team, TeamFilters } from '@/types/team';
import { User } from '@/types/user';
import { teamApi } from '@/services/teamApi';
import { userApi } from '@/services/userApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import TeamCard from './TeamCard';
import TeamFormModal from './TeamFormModal';
import TeamViewModal from './TeamViewModal';

const ManageTeams = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // State
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TeamFilters>({ search: '' });
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);

  // Load teams and users on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamsData, usersData] = await Promise.all([
        teamApi.getTeams(),
        userApi.getUsers()
      ]);
      setTeams(teamsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(t('teams.errors.load-failed'));
    } finally {
      setLoading(false);
    }
  };

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = !filters.search || 
        team.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        team.manager?.name?.toLowerCase().includes(filters.search.toLowerCase());
      return matchesSearch;
    });
  }, [teams, filters]);

  // Event handlers
  const handleCreate = () => {
    setEditingTeam(null);
    setShowFormModal(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setShowFormModal(true);
  };

  const handleView = (team: Team) => {
    setViewingTeam(team);
  };

  const handleDelete = (team: Team) => {
    setTeamToDelete(team);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    try {
      await teamApi.deleteTeam(teamToDelete.id);
      setTeams(prev => prev.filter(t => t.id !== teamToDelete.id));
      toast({
        title: t('teams.actions.deleted'),
        description: `${teamToDelete.name} ${t('teams.actions.deleted-description')}`,
      });
    } catch (err) {
      console.error('Failed to delete team:', err);
      toast({
        variant: "destructive",
        title: t('teams.errors.delete-failed'),
        description: t('teams.errors.try-again'),
      });
    } finally {
      setTeamToDelete(null);
    }
  };

  const handleSave = async (savedTeam: Team) => {
    if (editingTeam) {
      setTeams(prev => prev.map(t => t.id === savedTeam.id ? savedTeam : t));
    } else {
      setTeams(prev => [...prev, savedTeam]);
    }
    setShowFormModal(false);
    setEditingTeam(null);
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setFilters({ search: '' });
  };

  if (loading) {
    return (
      <div className="glass-card p-6 m-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          <Skeleton className="h-12 w-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 m-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('teams.manage.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('teams.manage.description')}
          </p>
          {error && (
            <p className="text-destructive text-sm mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('teams.actions.refresh')}
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('teams.actions.create-team')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('teams.filters.search-placeholder')}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
          {filters.search && (
            <button
              onClick={handleClearFilters}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center">
          {filteredTeams.length} {t('teams.filters.teams-found')}
        </div>
      </div>

      {/* Content */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <div className="text-muted-foreground mb-2">
            {filters.search ? t('teams.empty.no-results') : t('teams.empty.no-teams')}
          </div>
          {filters.search ? (
            <Button variant="outline" onClick={handleClearFilters}>
              {t('teams.filters.clear')}
            </Button>
          ) : (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              {t('teams.actions.create-first')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('teams.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('teams.delete.description')} <strong>{teamToDelete?.name}</strong>? {t('teams.delete.warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('teams.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('teams.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form Modal */}
      <TeamFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        team={editingTeam}
        users={users}
        onSave={handleSave}
      />

      {/* View Modal */}
      <TeamViewModal
        open={!!viewingTeam}
        onOpenChange={(open) => !open && setViewingTeam(null)}
        team={viewingTeam}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default ManageTeams;

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
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
import { UserPlus, RefreshCw, ShieldCheck, Users, UserCog } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, UserFilters, ViewMode } from '@/types/user';
import { userApi } from '@/services/userApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import UserCard from './UserCard';
import UserTableView from './UserTableView';
import UserFiltersComponent from './UserFilters';
import UserCreationDialog from './UserCreationDialog';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';

// Mock user data for fallback
const mockUsers: User[] = [
  {
    id: 1,
    name: "Breno Castro",
    email: "admin@optomyze.io",
    email_verified_at: null,
    phone: "+1-555-1111",
    role: "admin",
    is_active: true,
    last_login_at: "2025-09-28T17:37:36.000000Z",
    created_at: "2025-09-25T19:10:14.000000Z",
    updated_at: "2025-09-25T19:10:14.000000Z",
    profile_photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    profile_pic: "user1.jpg",
    bg_pic: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    email_verified_at: "2024-02-20T10:00:00.000000Z",
    phone: "+1-555-2222",
    role: "manager",
    is_active: true,
    last_login_at: "2025-09-27T15:30:00.000000Z",
    created_at: "2024-02-20T09:00:00.000000Z",
    updated_at: "2025-09-27T15:30:00.000000Z",
    profile_photo_url: "https://images.unsplash.com/photo-1494790108755-2616b612b522?w=150&h=150&fit=crop&crop=face",
    profile_pic: "user2.jpg",
    bg_pic: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop"
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    email_verified_at: null,
    phone: "+1-555-3333",
    role: "user",
    is_active: false,
    last_login_at: "2025-09-20T08:15:00.000000Z",
    created_at: "2024-03-10T12:00:00.000000Z",
    updated_at: "2025-09-20T08:15:00.000000Z",
    profile_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    profile_pic: "user3.jpg",
    bg_pic: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop"
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    email_verified_at: "2024-01-28T14:30:00.000000Z",
    phone: "+1-555-4444",
    role: "moderator",
    is_active: true,
    last_login_at: "2025-09-28T09:45:00.000000Z",
    created_at: "2024-01-28T10:00:00.000000Z",
    updated_at: "2025-09-28T09:45:00.000000Z",
    profile_photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    profile_pic: "user4.jpg",
    bg_pic: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=600&fit=crop"
  }
];

const ITEMS_PER_PAGE = 12;

const ManageUsers = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { openUserProfile } = useUserProfileModal();
  const isAgent = currentUser?.role === 'agent';

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('usersViewMode') as ViewMode) || 'grid';
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
  });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('usersViewMode', viewMode);
  }, [viewMode]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(t('users.errors.load-failed'));
      // Use mock data as fallback
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !filters.search || 
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone.toLowerCase().includes(filters.search.toLowerCase());

      const matchesRole = filters.role === 'all' || 
        user.role.toLowerCase() === filters.role.toLowerCase();

      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'active' && user.is_active) ||
        (filters.status === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Event handlers
  const handleEdit = (user: User) => {
    setEditUser(user);
    setShowCreateDialog(true);
  };

  const handleView = (user: User) => {
    openUserProfile(user.id);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updatedUser = await userApi.toggleUserStatus(user.id, !user.is_active);
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === user.id ? updatedUser.user : u)
      );
      toast({
        title: t('users.actions.status-updated'),
        description: `${user.name} ${updatedUser.user.is_active ? t('users.actions.activated') : t('users.actions.deactivated')}`,
      });
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      toast({
        variant: "destructive",
        title: t('users.errors.status-failed'),
        description: t('users.errors.try-again'),
      });
    }
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userApi.deleteUser(userToDelete.id);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      toast({
        title: t('users.actions.deleted'),
        description: `${userToDelete.name} ${t('users.actions.deleted-description')}`,
      });
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast({
        variant: "destructive",
        title: t('users.errors.delete-failed'),
        description: t('users.errors.try-again'),
      });
    } finally {
      setUserToDelete(null);
    }
  };

  const handleCreateUser = () => {
    setEditUser(null);
    setShowCreateDialog(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) setEditUser(null);
  };

  const handleUserCreated = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
    });
  };

  const handleExport = () => {
    // Simple CSV export
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Last Login', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.phone,
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        user.last_login_at || 'Never',
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: t('users.actions.exported'),
      description: t('users.actions.exported-description'),
    });
  };

  const handleRefresh = () => {
    loadUsers();
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
          
          <Skeleton className="h-16 w-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
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
            {t('users.manage.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('users.manage.description')}
          </p>
          {error && (
            <p className="text-destructive text-sm mt-1">
              {error}
            </p>
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
            {t('users.actions.refresh')}
          </Button>
          {!isAgent && (
            <Button onClick={handleCreateUser} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t('users.actions.create-user')}
            </Button>
          )}
        </div>
      </div>

      {/* Role Info KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-purple-50 dark:bg-purple-950/20 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
            <ShieldCheck className="h-4 w-4 text-purple-700 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              {t('users.roles.admin') || 'Admin'}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
              {t('users.roles.admin-description') || 'Full access to all company data, users, and settings.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-blue-50 dark:bg-blue-950/20 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <UserCog className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {t('users.roles.manager') || 'Manager'}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              {t('users.roles.manager-description') || 'Sees own data + team members\' data + unassigned leads and deals.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-gray-50 dark:bg-gray-800/30 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/40">
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t('users.roles.agent') || 'Agent'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('users.roles.agent-description') || 'Can only view their own leads and deals. Read-only access to team members.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <UserFiltersComponent
          filters={filters}
          viewMode={viewMode}
          totalUsers={filteredUsers.length}
          onFiltersChange={handleFiltersChange}
          onViewModeChange={setViewMode}
          onClearFilters={handleClearFilters}
          onExport={handleExport}
        />
      </div>

      {/* Content */}
      {currentUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            {filters.search || filters.role !== 'all' || filters.status !== 'all' 
              ? t('users.empty.no-results')
              : t('users.empty.no-users')
            }
          </div>
          {(filters.search || filters.role !== 'all' || filters.status !== 'all') && (
            <Button variant="outline" onClick={handleClearFilters}>
              {t('users.filters.clear')}
            </Button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              {currentUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEdit}
                  onView={handleView}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                  isAgent={isAgent}
                />
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <UserTableView
                users={currentUsers}
                onEdit={handleEdit}
                onView={handleView}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                isAgent={isAgent}
              />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {t('users.pagination.showing')} {startIndex + 1} {t('users.pagination.to')} {Math.min(endIndex, filteredUsers.length)} {t('users.pagination.of')} {filteredUsers.length} {t('users.pagination.results')}
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.delete.description')} <strong>{userToDelete?.name}</strong>? {t('users.delete.warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('users.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('users.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create / Edit User Dialog */}
      <UserCreationDialog
        open={showCreateDialog}
        onOpenChange={handleDialogOpenChange}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
        editUser={editUser}
      />
    </div>
  );
};

export default ManageUsers;
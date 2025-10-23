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
import { UserPlus, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, UserFilters, ViewMode } from '@/types/user';
import { userApi } from '@/services/userApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import UserCard from './UserCard';
import UserTableView from './UserTableView';
import UserFiltersComponent from './UserFilters';
import UserCreationDialog from './UserCreationDialog';

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
    background_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
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
    background_image_url: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop"
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
    background_image_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop"
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
    background_image_url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=600&fit=crop"
  }
];

const ITEMS_PER_PAGE = 12;

const ManageUsers = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
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
    console.log('Edit user:', user);
    toast({
      title: t('users.actions.edit-title'),
      description: `${t('users.actions.edit-description')} ${user.name}`,
    });
    // TODO: Implement edit functionality
  };

  const handleView = (user: User) => {
    console.log('View user profile:', user);
    toast({
      title: t('users.actions.view-title'),
      description: `${t('users.actions.view-description')} ${user.name}`,
    });
    // TODO: Implement view profile functionality
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
    setShowCreateDialog(true);
  };

  const handleUserCreated = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
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
          <Button onClick={handleCreateUser} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('users.actions.create-user')}
          </Button>
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

      {/* Create User Dialog */}
      <UserCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};

export default ManageUsers;
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Eye, Trash2 } from 'lucide-react';
import { User } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface UserTableViewProps {
  users: User[];
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserTableView: React.FC<UserTableViewProps> = ({
  users,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  const { t } = useLanguage();

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

  const getLastLoginText = (lastLogin: string | null) => {
    if (!lastLogin) return t('users.table.never');
    
    try {
      return formatDistanceToNow(new Date(lastLogin), { addSuffix: true });
    } catch {
      return t('users.table.recently');
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16"></TableHead>
            <TableHead>{t('users.table.name')}</TableHead>
            <TableHead>{t('users.table.email')}</TableHead>
            <TableHead>{t('users.table.phone')}</TableHead>
            <TableHead>{t('users.table.role')}</TableHead>
            <TableHead>{t('users.table.status')}</TableHead>
            <TableHead>{t('users.table.last-login')}</TableHead>
            <TableHead className="w-20">{t('users.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`http://localhost/storage/${user.profile_pic}` || undefined} alt={user.name || 'User'} />
                  <AvatarFallback>
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{user.name || 'Unknown User'}</TableCell>
              <TableCell className="text-muted-foreground">{user.email || 'No email'}</TableCell>
              <TableCell className="text-muted-foreground">{user.phone || 'No phone'}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={getRoleColor(user.role)}
                >
                  {user.role || 'user'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={user.is_active}
                    onCheckedChange={() => onToggleStatus(user)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {user.is_active ? t('users.table.active') : t('users.table.inactive')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {getLastLoginText(user.last_login_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onView(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t('users.table.view-profile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('users.table.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(user)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('users.table.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTableView;
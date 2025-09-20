import React, { useState } from 'react';
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { MoreHorizontal, UserPlus, Filter, Edit, Trash2, UserX, UserCheck } from 'lucide-react';

// Mock user data - expanded to show pagination
const mockUsers = [
  {
    id: 1,
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    status: "active",
    role: "Admin",
    registrationDate: "2024-01-15"
  },
  {
    id: 2,
    profilePicture: "https://images.unsplash.com/photo-1494790108755-2616b612b522?w=150&h=150&fit=crop&crop=face",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 987-6543",
    status: "active",
    role: "User",
    registrationDate: "2024-02-20"
  },
  {
    id: 3,
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1 (555) 456-7890",
    status: "inactive",
    role: "User",
    registrationDate: "2024-03-10"
  },
  {
    id: 4,
    profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1 (555) 321-0987",
    status: "active",
    role: "Manager",
    registrationDate: "2024-01-28"
  },
  {
    id: 5,
    profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "David Brown",
    email: "david.brown@example.com",
    phone: "+1 (555) 654-3210",
    status: "pending",
    role: "User",
    registrationDate: "2024-03-25"
  },
  {
    id: 6,
    profilePicture: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+1 (555) 789-0123",
    status: "active",
    role: "User",
    registrationDate: "2024-02-14"
  },
  {
    id: 7,
    profilePicture: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face",
    name: "Alex Rodriguez",
    email: "alex.rodriguez@example.com",
    phone: "+1 (555) 111-2222",
    status: "active",
    role: "User",
    registrationDate: "2024-01-05"
  },
  {
    id: 8,
    profilePicture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    name: "Lisa Chen",
    email: "lisa.chen@example.com",
    phone: "+1 (555) 333-4444",
    status: "inactive",
    role: "Manager",
    registrationDate: "2024-02-08"
  },
  {
    id: 9,
    profilePicture: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    name: "Tom Anderson",
    email: "tom.anderson@example.com",
    phone: "+1 (555) 555-6666",
    status: "pending",
    role: "User",
    registrationDate: "2024-03-15"
  },
  {
    id: 10,
    profilePicture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    name: "Anna Martinez",
    email: "anna.martinez@example.com",
    phone: "+1 (555) 777-8888",
    status: "active",
    role: "User",
    registrationDate: "2024-01-20"
  },
  {
    id: 11,
    profilePicture: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=face",
    name: "Robert Taylor",
    email: "robert.taylor@example.com",
    phone: "+1 (555) 999-0000",
    status: "active",
    role: "Admin",
    registrationDate: "2024-02-02"
  },
  {
    id: 12,
    profilePicture: "https://images.unsplash.com/photo-1485875437342-9b39470b3d95?w=150&h=150&fit=crop&crop=face",
    name: "Nicole White",
    email: "nicole.white@example.com",
    phone: "+1 (555) 222-3333",
    status: "inactive",
    role: "User",
    registrationDate: "2024-03-05"
  }
];

const ITEMS_PER_PAGE = 10;

const ManageUsers = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState(mockUsers);

  // Calculate pagination
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'User':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEdit = (userId: number) => {
    console.log('Edit user:', userId);
    // TODO: Implement edit functionality
  };

  const handleDelete = (userId: number) => {
    console.log('Delete user:', userId);
    // TODO: Implement delete functionality
  };

  const handleToggleStatus = (userId: number) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              status: user.status === 'active' ? 'inactive' : 'active' 
            }
          : user
      )
    );
  };

  const handleCreateUser = () => {
    console.log('Create new user');
    // TODO: Implement create user functionality
  };

  const handleFilter = () => {
    console.log('Open filter');
    // TODO: Implement filter functionality
  };

  return (
    <div className="glass-card p-6 m-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Manage Users</h1>
          <p className="text-muted-foreground">
            View and manage all users in your organization ({users.length} total users)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleFilter} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button onClick={handleCreateUser} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead className="w-20">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePicture} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(user.status)}
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={getRoleColor(user.role)}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.registrationDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                        {user.status === 'active' ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Disable
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, users.length)} of {users.length} users
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink 
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
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
    </div>
  );
};

export default ManageUsers;
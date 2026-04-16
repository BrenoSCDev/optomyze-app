/**
 * ASSIGN USER MODAL
 * 
 * Modal for assigning a user to a lead
 */

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import api from '@/services/api';
import { Loader2, User, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface CompanyUser {
  id: number;
  name: string;
  email: string;
}

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  users: CompanyUser[];
  currentAssignedUserId?: number | null;
  onUserAssigned: (userId: number, userName: string, userEmail: string) => void;
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({
  isOpen,
  onClose,
  leadId,
  users,
  currentAssignedUserId,
  onUserAssigned,
}) => {
  const { t } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentAssignedUserId ? currentAssignedUserId.toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error(t('lead-details.select-user-error'));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/api/leads/${leadId}/assign`, {
        user_id: parseInt(selectedUserId, 10),
      });

      const assignedUser = users.find(u => u.id === parseInt(selectedUserId, 10));
      if (assignedUser) {
        onUserAssigned(assignedUser.id, assignedUser.name, assignedUser.email);
      }
      
      toast.success(t('lead-details.user-assigned-success'));
      onClose();
    } catch (error: any) {
      console.error('Error assigning user:', error);
      toast.error(error.response?.data?.message || t('lead-details.user-assigned-error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t('lead-details.assign-user-title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t('lead-details.assign-user-description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full bg-gray-800 border-white/10 text-white">
              <SelectValue placeholder={t('lead-details.select-user-placeholder')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-white/10 z-[80]">
              {users.map((user) => (
                <SelectItem
                  key={user.id}
                  value={user.id.toString()}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="glass-card">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedUserId}
            className="bg-primary hover:bg-primary/80"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('lead-details.assign-button')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignUserModal;

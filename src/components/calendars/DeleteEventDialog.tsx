/**
 * DELETE EVENT CONFIRMATION DIALOG
 */

import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  eventTitle: string;
  isLoading?: boolean;
}

export const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  eventTitle,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {t('calendar.delete-event') || 'Delete Event'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('calendar.delete-event-confirm') || 'Are you sure you want to delete'} "{eventTitle}"? 
            {t('calendar.delete-event-warning') || ' This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('common.cancel') || 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.delete') || 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteEventDialog;

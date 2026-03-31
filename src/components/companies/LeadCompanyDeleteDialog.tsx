/**
 * LEAD COMPANY DELETE DIALOG
 * 
 * Confirmation dialog for deleting a lead company
 */

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
import { LeadCompany } from '@/types/leadCompany';

interface LeadCompanyDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: LeadCompany | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LeadCompanyDeleteDialog({
  open,
  onOpenChange,
  company,
  onConfirm,
  isLoading,
}: LeadCompanyDeleteDialogProps) {
  if (!company) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Company</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{company.trade_name}</strong>? 
            This action cannot be undone and will remove all data associated with this company.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

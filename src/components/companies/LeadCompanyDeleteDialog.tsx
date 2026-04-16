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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  if (!company) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('companies.delete-title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('companies.delete-description')} <strong>{company.trade_name}</strong>? 
            {t('companies.delete-warning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t('companies.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t('companies.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

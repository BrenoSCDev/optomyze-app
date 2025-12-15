/**
 * DOCUMENT DELETE DIALOG
 * 
 * Confirmation dialog for deleting documents
 */

import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LeadDocument } from '@/types/document';
import documentApi from '@/services/documentApi';

interface DocumentDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: LeadDocument | null;
  onDocumentDeleted: (documentId: number) => void;
}

const DocumentDeleteDialog: React.FC<DocumentDeleteDialogProps> = ({
  isOpen,
  onClose,
  document,
  onDocumentDeleted,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!document) return;

    setLoading(true);

    try {
      await documentApi.delete(document.id);
      onDocumentDeleted(document.id);
      toast.success('Document deleted successfully');
      onClose();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={() => !loading && onClose()}>
      <AlertDialogContent className="bg-gray-900 border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Are you sure you want to delete "{document?.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={loading}
            className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DocumentDeleteDialog;

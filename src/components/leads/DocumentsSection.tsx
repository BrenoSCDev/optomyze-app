import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, File, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStorageUrl } from '@/lib/constants';
import { deleteDocument } from '@/services/documentApi';
import { toast } from 'sonner';
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

export interface LeadDocument {
  id: number;
  lead_id: number;
  title: string;
  description: string | null;
  path: string;
  created_at: string;
  updated_at: string;
}

interface DocumentsSectionProps {
  documents: LeadDocument[];
  onUploadClick: () => void;
  onDocumentDeleted?: (documentId: number) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ documents, onUploadClick, onDocumentDeleted }) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LeadDocument | null>(null);

  const getFileIcon = (path: string) => {
    const ext = path?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-400" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="w-5 h-5 text-green-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const handleDownload = (doc: LeadDocument) => {
    const url = getStorageUrl(doc.path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDeleteClick = (doc: LeadDocument) => {
    setConfirmDelete(doc);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    setDeletingId(confirmDelete.id);
    try {
      await deleteDocument(confirmDelete.id);
      onDocumentDeleted?.(confirmDelete.id);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <motion.div 
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Documents</h3>
          <Button onClick={onUploadClick} size="sm" className="bg-primary hover:bg-primary/80">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No documents uploaded yet</p>
            <p className="text-gray-500 text-xs mt-1">Upload documents related to this lead</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    {getFileIcon(doc.path)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{doc.title}</p>
                    {doc.description && (
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{doc.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                    onClick={() => handleDeleteClick(doc)}
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentsSection;

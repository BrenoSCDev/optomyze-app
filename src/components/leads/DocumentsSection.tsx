import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, File, Download, Trash2, Loader2, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPrivateFile } from '@/hooks/usePrivateFile';
import { PrivateFilePreview } from '@/components/ui/PrivateImage';
import { deleteDocument } from '@/services/documentApi';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const { t } = useLanguage();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LeadDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<LeadDocument | null>(null);

  const getFileExtension = (path: string) => {
    return path?.split('.').pop()?.toLowerCase() || '';
  };

  const getFileIcon = (path: string) => {
    const ext = getFileExtension(path);
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
      return <FileText className="h-5 w-5 text-primary" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const isPreviewSupported = (path: string) => {
    const ext = getFileExtension(path);
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isImageFile = (path: string) => {
    const ext = getFileExtension(path);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const handlePreviewClick = (doc: LeadDocument) => {
    setPreviewDoc(doc);
  };

  const handleDownload = (doc: LeadDocument) => {
    downloadPrivateFile(doc.path, doc.title);
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
      toast.success(t('documents.delete-success'));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(t('documents.delete-error'));
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
        className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">{t('documents.title')}</h3>
          <Button onClick={onUploadClick} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="w-4 h-4" />
            {t('documents.upload')}
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm text-foreground">{t('documents.no-documents')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('documents.no-documents-description')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-border bg-background p-2">
                    {getFileIcon(doc.path)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.title}</p>
                    {doc.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{doc.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-foreground"
                    onClick={() => handlePreviewClick(doc)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-destructive"
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

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] border-border bg-card p-0 overflow-hidden text-card-foreground [&>button]:z-[80] [&>button]:text-muted-foreground">
          <DialogHeader className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate pr-4 text-foreground">{previewDoc?.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => previewDoc && handleDownload(previewDoc)}
                  size="sm" 
                  variant="outline"
                  className="border-border bg-background text-foreground hover:bg-muted"
                >
                  <Download className="w-4 h-4" />
                  {t('documents.download')}
                </Button>
                <Button 
                  onClick={() => setPreviewDoc(null)}
                  size="sm" 
                  variant="ghost"
                  className="border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                  {t('documents.close')}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            {previewDoc && isPreviewSupported(previewDoc.path) ? (
              <div className={isImageFile(previewDoc.path) ? "flex items-center justify-center" : ""}>
                <PrivateFilePreview
                  path={previewDoc.path}
                  isImage={isImageFile(previewDoc.path)}
                  alt={previewDoc.title}
                  title={previewDoc.title}
                />
              </div>
            ) : (
              <div className="text-center py-16">
                <File className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="mb-2 text-foreground">{t('documents.preview-not-available')}</p>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t('documents.download-to-view')}
                </p>
                <Button 
                  onClick={() => previewDoc && handleDownload(previewDoc)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="w-4 h-4" />
                  {t('documents.download-file')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="border-border bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('documents.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('documents.delete-confirm')} "{confirmDelete?.title}"? {t('documents.delete-warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-background text-foreground hover:bg-muted">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentsSection;

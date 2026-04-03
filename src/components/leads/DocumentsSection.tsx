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
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-400" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileText className="w-5 h-5 text-blue-400" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-5 h-5 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext)) return <FileText className="w-5 h-5 text-green-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
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
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{t('documents.title')}</h3>
          <Button onClick={onUploadClick} size="sm" className="bg-primary hover:bg-primary/80">
            <Upload className="w-4 h-4 mr-2" />
            {t('documents.upload')}
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{t('documents.no-documents')}</p>
            <p className="text-gray-500 text-xs mt-1">{t('documents.no-documents-description')}</p>
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
                    onClick={() => handlePreviewClick(doc)}
                  >
                    <Eye className="w-4 h-4" />
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

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-gray-900 border-white/10 p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white truncate pr-4">{previewDoc?.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => previewDoc && handleDownload(previewDoc)}
                  size="sm" 
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('documents.download')}
                </Button>
                <Button 
                  onClick={() => setPreviewDoc(null)}
                  size="sm" 
                  variant="ghost"
                  className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
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
                <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">{t('documents.preview-not-available')}</p>
                <p className="text-gray-500 text-sm mb-6">
                  {t('documents.download-to-view')}
                </p>
                <Button 
                  onClick={() => previewDoc && handleDownload(previewDoc)}
                  className="bg-primary hover:bg-primary/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('documents.download-file')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('documents.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t('documents.delete-confirm')} "{confirmDelete?.title}"? {t('documents.delete-warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
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

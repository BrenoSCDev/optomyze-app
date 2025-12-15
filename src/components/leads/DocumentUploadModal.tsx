import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createDocument, LeadDocument } from '@/services/documentApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  onDocumentUploaded?: (document: LeadDocument) => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  leadId,
  onDocumentUploaded
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error(t('documents.title-required'));
      return;
    }
    
    if (!file) {
      toast.error(t('documents.file-required'));
      return;
    }

    setIsUploading(true);
    
    try {
      const newDocument = await createDocument(
        leadId,
        title.trim(),
        description.trim() || null,
        file
      );
      
      toast.success(t('documents.upload-success'));
      onDocumentUploaded?.(newDocument);
      handleClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(t('documents.upload-error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">{t('documents.upload-title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">{t('documents.title-field')} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('documents.title-placeholder')}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">{t('documents.description-field')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('documents.description-placeholder')}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">{t('documents.file-field')} *</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${file 
                  ? 'border-primary/50 bg-primary/10' 
                  : 'border-white/20 hover:border-white/40 bg-white/5'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{file.name}</p>
                    <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    {t('documents.drag-drop')}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {t('documents.file-types')}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isUploading} className="bg-primary hover:bg-primary/80">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('documents.uploading')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('documents.upload')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;

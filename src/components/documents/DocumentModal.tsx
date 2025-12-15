/**
 * DOCUMENT MODAL COMPONENT
 * 
 * Modal for creating and editing documents
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { LeadDocument, DocumentType, DocumentStatus, CreateDocumentPayload, UpdateDocumentPayload } from '@/types/document';
import documentApi from '@/services/documentApi';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  editDocument?: LeadDocument | null;
  onDocumentCreated: (document: LeadDocument) => void;
  onDocumentUpdated: (document: LeadDocument) => void;
}

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'contract', label: 'Contract' },
  { value: 'nda', label: 'NDA' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'identity', label: 'Identity' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'company_document', label: 'Company Document' },
  { value: 'other', label: 'Other' },
];

const documentStatuses: { value: DocumentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'requested', label: 'Requested' },
  { value: 'received', label: 'Received' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  leadId,
  editDocument,
  onDocumentCreated,
  onDocumentUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DocumentType>('other');
  const [status, setStatus] = useState<DocumentStatus>('pending');
  const [externalUrl, setExternalUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editDocument;

  useEffect(() => {
    if (isOpen) {
      if (editDocument) {
        setTitle(editDocument.title);
        setDescription(editDocument.description || '');
        setType(editDocument.type);
        setStatus(editDocument.status);
        setExternalUrl(editDocument.external_url || '');
        setExpiresAt(editDocument.expires_at ? editDocument.expires_at.split('T')[0] : '');
        setExistingFileName(editDocument.file_name || null);
        setFile(null);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editDocument]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('other');
    setStatus('pending');
    setExternalUrl('');
    setExpiresAt('');
    setFile(null);
    setExistingFileName(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 20MB limit
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExistingFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && editDocument) {
        const payload: UpdateDocumentPayload = {
          title,
          description: description || undefined,
          type,
          status,
          external_url: externalUrl || undefined,
          expires_at: expiresAt || undefined,
        };
        
        if (file) {
          payload.file = file;
        }

        const updated = await documentApi.update(editDocument.id, payload);
        onDocumentUpdated(updated);
        toast.success('Document updated successfully');
      } else {
        const payload: CreateDocumentPayload = {
          lead_id: leadId,
          title,
          description: description || undefined,
          type,
          status,
          external_url: externalUrl || undefined,
          expires_at: expiresAt || undefined,
        };
        
        if (file) {
          payload.file = file;
        }

        const created = await documentApi.create(payload);
        onDocumentCreated(created);
        toast.success('Document created successfully');
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.error(error.response?.data?.message || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">
                {isEditing ? 'Edit Document' : 'New Document'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Type & Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {documentTypes.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-gray-300 focus:text-white focus:bg-white/10"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as DocumentStatus)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {documentStatuses.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-gray-300 focus:text-white focus:bg-white/10"
                        >
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-white">File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                />
                
                {file || existingFileName ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="truncate">{file?.name || existingFileName}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                )}
              </div>

              {/* External URL */}
              <div className="space-y-2">
                <Label htmlFor="externalUrl" className="text-white">
                  External URL
                </Label>
                <Input
                  id="externalUrl"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-white">
                  Expiration Date
                </Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/80"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Create Document'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentModal;

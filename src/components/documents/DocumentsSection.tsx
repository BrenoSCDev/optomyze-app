/**
 * DOCUMENTS SECTION COMPONENT
 * 
 * Section for displaying and managing lead documents
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadDocument } from '@/types/document';
import DocumentCard from './DocumentCard';
import DocumentModal from './DocumentModal';
import DocumentDeleteDialog from './DocumentDeleteDialog';
import documentApi from '@/services/documentApi';
import { toast } from 'sonner';

interface DocumentsSectionProps {
  documents: LeadDocument[];
  leadId: number;
  onDocumentsChange: (documents: LeadDocument[]) => void;
  isLoading?: boolean;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  leadId,
  onDocumentsChange,
  isLoading = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LeadDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<LeadDocument | null>(null);

  const handleEdit = (document: LeadDocument) => {
    setEditingDocument(document);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDocument(null);
  };

  const handleDocumentCreated = (newDocument: LeadDocument) => {
    onDocumentsChange([newDocument, ...documents]);
  };

  const handleDocumentUpdated = (updatedDocument: LeadDocument) => {
    onDocumentsChange(
      documents.map((d) => (d.id === updatedDocument.id ? updatedDocument : d))
    );
    setEditingDocument(null);
  };

  const handleDocumentDeleted = (documentId: number) => {
    onDocumentsChange(documents.filter((d) => d.id !== documentId));
  };

  const handleDownload = async (document: LeadDocument) => {
    const downloadUrl = documentApi.getDownloadUrl(document);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      toast.error('Download not available');
    }
  };

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold text-white">Documents</h3>
          {!isLoading && documents.length > 0 && (
            <span className="text-sm text-gray-400">({documents.length})</span>
          )}
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="bg-primary hover:bg-primary/80"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Document
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-white/5">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 bg-white/10" />
                  <Skeleton className="h-3 w-2/3 bg-white/10" />
                  <Skeleton className="h-3 w-1/4 bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No documents added yet</p>
          <p className="text-sm text-gray-500">
            Upload or link the first document for this lead.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onEdit={handleEdit}
                onDelete={setDeletingDocument}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Create/Edit Modal */}
      <DocumentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        leadId={leadId}
        editDocument={editingDocument}
        onDocumentCreated={handleDocumentCreated}
        onDocumentUpdated={handleDocumentUpdated}
      />

      {/* Delete Dialog */}
      <DocumentDeleteDialog
        isOpen={!!deletingDocument}
        onClose={() => setDeletingDocument(null)}
        document={deletingDocument}
        onDocumentDeleted={handleDocumentDeleted}
      />
    </motion.div>
  );
};

export default DocumentsSection;

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, File, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LeadDocument {
  id: number;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface DocumentsSectionProps {
  documents: LeadDocument[];
  onUploadClick: () => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ documents, onUploadClick }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    if (fileType?.includes('image')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText className="w-5 h-5 text-green-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  return (
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
                  {getFileIcon(doc.file_type)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{doc.title}</p>
                  {doc.description && (
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{doc.description}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {doc.file_name} • {formatFileSize(doc.file_size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DocumentsSection;

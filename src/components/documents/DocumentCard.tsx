/**
 * DOCUMENT CARD COMPONENT
 * 
 * Individual document card with actions menu
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  MoreVertical,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadDocument, DocumentType, DocumentStatus } from '@/types/document';

interface DocumentCardProps {
  document: LeadDocument;
  onEdit: (document: LeadDocument) => void;
  onDelete: (document: LeadDocument) => void;
  onDownload: (document: LeadDocument) => void;
}

const typeLabels: Record<DocumentType, string> = {
  proposal: 'Proposal',
  contract: 'Contract',
  nda: 'NDA',
  invoice: 'Invoice',
  identity: 'Identity',
  address_proof: 'Address Proof',
  company_document: 'Company Doc',
  other: 'Other',
};

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-600/20 text-gray-400 border-gray-600/30' },
  requested: { label: 'Requested', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  received: { label: 'Received', className: 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30' },
  approved: { label: 'Approved', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
  rejected: { label: 'Rejected', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
  expired: { label: 'Expired', className: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
};

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onEdit,
  onDelete,
  onDownload,
}) => {
  const isExpired = document.expires_at && new Date(document.expires_at) < new Date();
  const isApproved = document.status === 'approved';
  const isMissingFile = document.status === 'requested' && !document.file_path && !document.external_url;

  const getCardHighlight = () => {
    if (isExpired || document.status === 'expired') {
      return 'border-l-4 border-l-orange-500';
    }
    if (isApproved) {
      return 'border-l-4 border-l-green-500';
    }
    if (isMissingFile) {
      return 'border-l-4 border-l-blue-500';
    }
    return '';
  };

  return (
    <motion.div
      className={`group glass-card p-4 hover:bg-white/5 transition-colors ${getCardHighlight()}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Document Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-white/5">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Title & Type */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-medium text-white truncate">{document.title}</h4>
              <Badge variant="outline" className="text-xs uppercase px-1.5 py-0.5 bg-white/5 border-white/10 text-gray-300">
                {typeLabels[document.type]}
              </Badge>
            </div>
            
            {/* Description */}
            {document.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mb-2">{document.description}</p>
            )}
            
            {/* Status & Dates */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <Badge 
                variant="outline" 
                className={`${statusConfig[document.status].className} border`}
              >
                {statusConfig[document.status].label}
              </Badge>
              
              {(document.uploaded_at || document.received_at) && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  {format(new Date(document.uploaded_at || document.received_at!), 'MMM d, yyyy')}
                </span>
              )}
              
              {document.expires_at && (
                <span className={`flex items-center gap-1 ${isExpired ? 'text-orange-400' : 'text-gray-500'}`}>
                  <Calendar className="w-3 h-3" />
                  Expires: {format(new Date(document.expires_at), 'MMM d, yyyy')}
                  {isExpired && <AlertTriangle className="w-3 h-3" />}
                </span>
              )}
            </div>
            
            {/* File Info */}
            {(document.file_name || document.external_url) && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                {document.file_name && (
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {document.file_name}
                  </span>
                )}
                {document.external_url && !document.file_name && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    External Link
                  </span>
                )}
              </div>
            )}
            
            {/* Missing file indicator */}
            {isMissingFile && (
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                <AlertTriangle className="w-3 h-3" />
                Document requested but not yet received
              </div>
            )}
          </div>
        </div>
        
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
            <DropdownMenuItem 
              onClick={() => onEdit(document)}
              className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Document
            </DropdownMenuItem>
            
            {document.file_path && (
              <DropdownMenuItem 
                onClick={() => onDownload(document)}
                className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            
            {document.external_url && (
              <DropdownMenuItem 
                onClick={() => window.open(document.external_url, '_blank')}
                className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              onClick={() => onDelete(document)}
              className="text-red-400 focus:text-red-300 focus:bg-red-600/10 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default DocumentCard;

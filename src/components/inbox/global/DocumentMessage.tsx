/**
 * DOCUMENT MESSAGE COMPONENT
 *
 * Renders a document file card inside a chat bubble with icon, filename, size, and download link.
 */

import React from 'react';
import { FileText, FileSpreadsheet, FileImage, File, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentMessageProps {
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  isOutgoing: boolean;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocIcon(mime: string | null | undefined) {
  if (!mime) return <File className="h-6 w-6" />;
  if (mime.includes('pdf')) return <FileText className="h-6 w-6 text-red-400" />;
  if (mime.includes('word') || mime.includes('msword') || mime.includes('opendocument.text'))
    return <FileText className="h-6 w-6 text-blue-400" />;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
    return <FileSpreadsheet className="h-6 w-6 text-green-400" />;
  if (mime.includes('image'))
    return <FileImage className="h-6 w-6 text-purple-400" />;
  return <File className="h-6 w-6" />;
}

const DocumentMessage: React.FC<DocumentMessageProps> = ({
  fileName,
  fileUrl,
  mimeType,
  fileSize,
  isOutgoing,
}) => {
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-md p-2 min-w-[200px] transition-opacity hover:opacity-80",
        isOutgoing ? "bg-blue-600/30" : "bg-muted/50"
      )}
    >
      <div className="shrink-0">
        {getDocIcon(mimeType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName || 'Document'}</p>
        {fileSize ? (
          <p className={cn("text-xs", isOutgoing ? "text-blue-100/70" : "text-muted-foreground")}>
            {formatFileSize(fileSize)}
          </p>
        ) : null}
      </div>
      <Download className={cn("h-4 w-4 shrink-0", isOutgoing ? "text-blue-100" : "text-muted-foreground")} />
    </a>
  );
};

export default DocumentMessage;

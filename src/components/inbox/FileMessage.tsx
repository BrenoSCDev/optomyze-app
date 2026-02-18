import React from 'react';
import { FileText, FileSpreadsheet, FileIcon, Download } from 'lucide-react';
import { getFileMimeIcon } from '@/data/mockInboxData';

interface FileMessageCardProps {
  fileName: string;
  fileSize: string;
  fileMime: string;
  isOwn: boolean;
}

const FileMessageCard: React.FC<FileMessageCardProps> = ({ fileName, fileSize, fileMime, isOwn }) => {
  const iconType = getFileMimeIcon(fileMime);

  const IconComponent = () => {
    switch (iconType) {
      case 'pdf':   return <FileText className="w-5 h-5 text-red-400" />;
      case 'sheet': return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
      case 'doc':   return <FileText className="w-5 h-5 text-blue-400" />;
      default:      return <FileIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className={`flex items-center gap-3 min-w-[200px] max-w-[260px]
      ${isOwn
        ? 'bg-primary-foreground/10 border border-primary-foreground/20'
        : 'bg-muted/50 border border-border/50'
      } rounded-xl p-3`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
        ${isOwn ? 'bg-primary-foreground/15' : 'bg-background'}`}>
        <IconComponent />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
          {fileName}
        </p>
        <p className={`text-[10px] ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {fileSize}
        </p>
      </div>

      <button
        className={`shrink-0 p-1 rounded-lg transition-colors
          ${isOwn
            ? 'hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        title="Download"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default FileMessageCard;

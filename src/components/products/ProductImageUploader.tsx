/**
 * PRODUCT IMAGE UPLOADER COMPONENT
 * 
 * Upload form for adding new product images
 */

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    image: File;
    alt_text?: string;
    image_type?: string;
    is_primary?: boolean;
  }) => Promise<void>;
  isFirstImage?: boolean;
}

const ProductImageUploader = ({
  isOpen,
  onClose,
  onUpload,
  isFirstImage = false,
}: ProductImageUploaderProps) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [imageType, setImageType] = useState('');
  const [isPrimary, setIsPrimary] = useState(isFirstImage);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUpload({
        image: selectedFile,
        alt_text: altText || undefined,
        image_type: imageType || undefined,
        is_primary: isPrimary,
      });
      handleClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setAltText('');
    setImageType('');
    setIsPrimary(isFirstImage);
    onClose();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{t('products.images.upload-title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone / Preview */}
          <div
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="relative aspect-video">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={clearFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-8 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {t('products.images.drag-drop')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('products.images.supported-formats')}
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Alt Text */}
          <div>
            <Label htmlFor="alt_text">{t('products.images.alt-text')}</Label>
            <Input
              id="alt_text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder={t('products.images.alt-text-placeholder')}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('products.images.alt-text-hint')}
            </p>
          </div>

          {/* Image Type */}
          <div>
            <Label htmlFor="image_type">{t('products.images.image-type')}</Label>
            <Input
              id="image_type"
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              placeholder={t('products.images.image-type-placeholder')}
              className="mt-2"
            />
          </div>

          {/* Set as Primary */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
            />
            <Label
              htmlFor="is_primary"
              className="text-sm font-normal cursor-pointer"
            >
              {t('products.images.set-as-primary')}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('products.images.uploading')}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {t('products.images.upload')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImageUploader;

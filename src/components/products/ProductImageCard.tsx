/**
 * PRODUCT IMAGE CARD COMPONENT
 * 
 * Individual image card with actions for managing product images
 */

import { useState } from 'react';
import { Star, Edit, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useLanguage } from '@/contexts/LanguageContext';
import { type ProductImage } from '@/services/productImageApi';
import { PrivateImage } from '@/components/ui/PrivateImage';

interface ProductImageCardProps {
  image: ProductImage;
  onSetPrimary: (image: ProductImage) => void;
  onUpdate: (image: ProductImage, data: { alt_text?: string; image_type?: string }) => void;
  onDelete: (image: ProductImage) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const ProductImageCard = ({
  image,
  onSetPrimary,
  onUpdate,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: ProductImageCardProps) => {
  const { t } = useLanguage();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState({
    alt_text: image.alt_text || '',
    image_type: image.image_type || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditSave = async () => {
    setIsUpdating(true);
    await onUpdate(image, editData);
    setIsUpdating(false);
    setShowEditModal(false);
  };

  const handleDelete = () => {
    onDelete(image);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={`relative group bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-105 shadow-xl' : 'hover:border-primary/50'
        } ${image.is_primary ? 'ring-2 ring-primary' : ''}`}
      >
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="absolute top-2 left-2 z-10 p-1.5 bg-background/80 backdrop-blur-sm rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Primary Badge */}
        {image.is_primary && (
          <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            {t('products.images.primary')}
          </div>
        )}

        {/* Image Preview */}
        <div className="aspect-square bg-muted">
          <PrivateImage
            path={image.url}
            alt={image.alt_text || t('products.images.product-image')}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Image Info */}
        <div className="p-3 space-y-2">
          <p className="text-sm text-muted-foreground truncate">
            {image.alt_text || t('products.images.no-alt-text')}
          </p>
          {image.image_type && (
            <span className="inline-block px-2 py-0.5 bg-muted text-xs rounded">
              {image.image_type}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {!image.is_primary && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onSetPrimary(image)}
              className="gap-1"
            >
              <Star className="w-3 h-3" />
              {t('products.images.set-primary')}
            </Button>
          )}
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('products.images.edit-metadata')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="alt_text">{t('products.images.alt-text')}</Label>
              <Input
                id="alt_text"
                value={editData.alt_text}
                onChange={(e) => setEditData(prev => ({ ...prev, alt_text: e.target.value }))}
                placeholder={t('products.images.alt-text-placeholder')}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="image_type">{t('products.images.image-type')}</Label>
              <Input
                id="image_type"
                value={editData.image_type}
                onChange={(e) => setEditData(prev => ({ ...prev, image_type: e.target.value }))}
                placeholder={t('products.images.image-type-placeholder')}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditSave} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.images.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.images.delete-confirm')}
              {image.is_primary && (
                <span className="block mt-2 text-amber-500">
                  {t('products.images.delete-primary-warning')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default ProductImageCard;

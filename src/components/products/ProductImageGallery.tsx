/**
 * PRODUCT IMAGE GALLERY COMPONENT
 * 
 * Displays and manages all images for a product with drag-and-drop reordering
 */

import { useState, useEffect } from 'react';
import { Plus, ImageIcon, Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import ProductImageCard from './ProductImageCard';
import ProductImageUploader from './ProductImageUploader';
import {
  getProductImages,
  uploadProductImage,
  updateProductImage,
  setImageAsPrimary,
  reorderProductImages,
  deleteProductImage,
  type ProductImage,
} from '@/services/productImageApi';

interface ProductImageGalleryProps {
  productId: number;
  onImageChange?: () => void;
}

// Sortable wrapper component
const SortableImageCard = ({
  image,
  onSetPrimary,
  onUpdate,
  onDelete,
}: {
  image: ProductImage;
  onSetPrimary: (image: ProductImage) => void;
  onUpdate: (image: ProductImage, data: { alt_text?: string }) => void;
  onDelete: (image: ProductImage) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ProductImageCard
        image={image}
        onSetPrimary={onSetPrimary}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
};

const ProductImageGallery = ({ productId, onImageChange }: ProductImageGalleryProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await getProductImages(productId);
      // Sort by display_order
      const sorted = [...data].sort((a, b) => a.display_order - b.display_order);
      setImages(sorted);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('products.images.fetch-error'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchImages();
    }
  }, [productId]);

  const handleUpload = async (data: {
    image: File;
    alt_text?: string;
    is_primary?: boolean;
  }) => {
    try {
      await uploadProductImage(productId, data);
      toast({
        title: t('common.success'),
        description: t('products.images.upload-success'),
      });
      fetchImages();
      if (data.is_primary) {
        onImageChange?.(); // Notify parent if uploaded as primary
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('products.images.upload-error'),
      });
      throw error;
    }
  };

  const handleSetPrimary = async (image: ProductImage) => {
    try {
      await setImageAsPrimary(image.id);
      toast({
        title: t('common.success'),
        description: t('products.images.primary-set-success'),
      });
      fetchImages();
      onImageChange?.(); // Notify parent to refresh product card
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('products.images.primary-set-error'),
      });
    }
  };

  const handleUpdate = async (
    image: ProductImage,
    data: { alt_text?: string }
  ) => {
    try {
      await updateProductImage(image.id, data);
      toast({
        title: t('common.success'),
        description: t('products.images.update-success'),
      });
      fetchImages();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('products.images.update-error'),
      });
    }
  };

  const handleDelete = async (image: ProductImage) => {
    try {
      await deleteProductImage(image.id);
      toast({
        title: t('common.success'),
        description: t('products.images.delete-success'),
      });
      fetchImages();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('products.images.delete-error'),
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);

      // Prepare reorder data
      const reorderData = newImages.map((img, index) => ({
        id: img.id,
        display_order: index + 1,
      }));

      try {
        await reorderProductImages(reorderData);
        toast({
          title: t('common.success'),
          description: t('products.images.reorder-success'),
        });
      } catch (error) {
        // Revert on error
        fetchImages();
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('products.images.reorder-error'),
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('products.images.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('products.images.description')}
          </p>
        </div>
        <Button onClick={() => setShowUploader(true)} size="sm">
          <Plus className="w-4 h-4" />
          {t('products.images.add-image')}
        </Button>
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((image) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  onSetPrimary={handleSetPrimary}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-lg font-medium text-foreground mb-2">
            {t('products.images.no-images')}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {t('products.images.no-images-description')}
          </p>
          <Button onClick={() => setShowUploader(true)}>
            <Plus className="w-4 h-4" />
            {t('products.images.add-first-image')}
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <ProductImageUploader
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        onUpload={handleUpload}
        isFirstImage={images.length === 0}
      />
    </div>
  );
};

export default ProductImageGallery;

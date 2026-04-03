import React, { ImgHTMLAttributes } from 'react';
import { AvatarImage } from '@/components/ui/avatar';
import { usePrivateFile } from '@/hooks/usePrivateFile';

interface PrivateImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  path: string | null | undefined;
}

/**
 * Renders a private image fetched via the authenticated API.
 * Replaces <img src={getStorageUrl(path)} /> for private files.
 */
export function PrivateImage({ path, ...props }: PrivateImageProps) {
  const url = usePrivateFile(path);
  if (!url) return null;
  return <img src={url} {...props} />;
}

interface PrivateAvatarImageProps {
  path: string | null | undefined;
  alt?: string;
}

/**
 * Renders a shadcn AvatarImage with a private file URL.
 * Replaces <AvatarImage src={getStorageUrl(path)} /> for private files.
 */
export function PrivateAvatarImage({ path, alt }: PrivateAvatarImageProps) {
  const url = usePrivateFile(path);
  return <AvatarImage src={url} alt={alt} />;
}

interface PrivateFilePreviewProps {
  path: string;
  isImage: boolean;
  alt?: string;
  imageClassName?: string;
  iframeClassName?: string;
  title?: string;
}

/**
 * Previews a private file inline — renders an <img> for images or <iframe> for PDFs/other.
 */
export function PrivateFilePreview({
  path,
  isImage,
  alt,
  imageClassName,
  iframeClassName,
  title,
}: PrivateFilePreviewProps) {
  const url = usePrivateFile(path);

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (isImage) {
    return (
      <img
        src={url}
        alt={alt}
        className={imageClassName ?? 'max-w-full max-h-[60vh] object-contain rounded-lg'}
      />
    );
  }

  return (
    <iframe
      src={url}
      className={iframeClassName ?? 'w-full h-[70vh] rounded-lg bg-white'}
      title={title}
    />
  );
}

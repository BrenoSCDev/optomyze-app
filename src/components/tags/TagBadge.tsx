/**
 * TAG BADGE
 *
 * Renders a tag pill tinted with the tag's color. Falls back to the
 * default gray for legacy string tags or tags without a color.
 */

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_TAG_COLOR } from '@/lib/tagColors';

interface TagLike {
  name: string;
  color?: string;
}

interface TagBadgeProps {
  tag: TagLike | string;
  className?: string;
  onRemove?: () => void;
  removeDisabled?: boolean;
}

const TagBadge = ({ tag, className, onRemove, removeDisabled }: TagBadgeProps) => {
  const name = typeof tag === 'string' ? tag : tag.name;
  const color = (typeof tag === 'string' ? undefined : tag.color) || DEFAULT_TAG_COLOR;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}1A`,
        borderColor: `${color}4D`,
        color,
      }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={removeDisabled}
          className="hover:opacity-70"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default TagBadge;

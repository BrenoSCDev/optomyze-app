/**
 * TAG COLOR PICKER
 *
 * Preset color swatch grid used when creating or editing tags.
 */

import { cn } from '@/lib/utils';
import { TAG_COLORS } from '@/lib/tagColors';

interface TagColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

const TagColorPicker = ({ value, onChange, disabled, className }: TagColorPickerProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {TAG_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          disabled={disabled}
          className={cn(
            "w-7 h-7 rounded-full border-2 transition-colors duration-fast ease-standard",
            value?.toLowerCase() === color.value.toLowerCase()
              ? "border-primary ring-2 ring-primary/30"
              : "border-border hover:ring-2 hover:ring-ring/40",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ backgroundColor: color.value }}
          title={color.label}
        />
      ))}
    </div>
  );
};

export default TagColorPicker;

import { useState } from 'react';
import { Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface EmojiPickerButtonProps {
  /** Called with the selected emoji character (e.g. "😀"). */
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Toolbar button that opens an emoji picker popover. Shared by the Lead
 * Conversation / Global Inbox composer and the Teams Chat message input.
 */
const EmojiPickerButton = ({ onEmojiSelect, disabled, label = 'Insert emoji', className }: EmojiPickerButtonProps) => {
  const [open, setOpen] = useState(false);
  const { mode } = useTheme();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={label}
          aria-label={label}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed",
            className
          )}
        >
          <Smile className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-none bg-transparent p-0 shadow-none" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={mode === 'dark' ? Theme.DARK : Theme.LIGHT}
          autoFocusSearch={false}
          previewConfig={{ showPreview: false }}
          width={320}
          height={360}
        />
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerButton;

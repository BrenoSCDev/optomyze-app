import * as React from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number;
  onValueChange: (value: number) => void;
  currency?: string;
  locale?: string;
}

const formatDisplay = (raw: string, locale: string, currency: string): string => {
  if (!raw) return '';

  const parts = raw.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = new Intl.NumberFormat(locale, { style: 'currency', currency })
    .formatToParts(0)
    .find(p => p.type === 'currency')?.value ?? '$';

  if (parts.length === 1) return `${symbol}${intPart}`;
  return `${symbol}${intPart}.${parts[1]}`;
};

const formatBlur = (value: number, locale: string, currency: string): string =>
  value !== 0
    ? new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
    : '';

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, currency = 'USD', locale = 'en-US', className, onFocus, onBlur, ...props }, ref) => {
    const [rawInput, setRawInput] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    const displayValue = isFocused
      ? formatDisplay(rawInput, locale, currency)
      : formatBlur(value, locale, currency);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const initial = value !== 0 ? String(value) : '';
      setRawInput(initial);
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseFloat(rawInput) || 0;
      const rounded = Math.round(parsed * 100) / 100;
      onValueChange(rounded);
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip currency symbol and commas, keep only digits and one dot
      let stripped = e.target.value.replace(/[^0-9.]/g, '');

      // Allow only one decimal point
      const dotIndex = stripped.indexOf('.');
      if (dotIndex !== -1) {
        stripped = stripped.slice(0, dotIndex + 1) + stripped.slice(dotIndex + 1).replace(/\./g, '');
      }

      // Limit to 2 decimal places
      const parts = stripped.split('.');
      if (parts[1]?.length > 2) {
        stripped = parts[0] + '.' + parts[1].slice(0, 2);
      }

      setRawInput(stripped);
      onValueChange(parseFloat(stripped) || 0);
    };

    return (
      <Input
        ref={ref}
        inputMode="decimal"
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={className}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };

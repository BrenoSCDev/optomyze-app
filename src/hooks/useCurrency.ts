import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

/**
 * Currency symbol map for common currencies.
 * Falls back to Intl.NumberFormat for unlisted codes.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BRL: 'R$',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  MXN: '$',
  CHF: 'CHF',
};

/** Reverse map: symbol -> ISO code so backends sending symbols still work. */
const SYMBOL_TO_CODE: Record<string, string> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  'R$': 'BRL',
  '¥': 'JPY',
  '₹': 'INR',
};

/** Validate / normalize whatever the backend gives us into a 3-letter ISO code. */
function normalizeCurrency(input?: string | null): string {
  if (!input) return 'USD';
  const trimmed = String(input).trim();
  if (!trimmed) return 'USD';
  if (SYMBOL_TO_CODE[trimmed]) return SYMBOL_TO_CODE[trimmed];
  // ISO codes are 3 alphabetic letters
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
  return 'USD';
}

/**
 * Returns the company currency code from auth context, defaulting to 'USD'.
 * Also provides a `formatCurrency` helper and the raw symbol.
 */
export function useCurrency() {
  const { user } = useAuth();
  const currencyCode = normalizeCurrency(user?.company?.currency);
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;

  const formatCurrency = useCallback(
    (amount: number | string, overrideCurrency?: string) => {
      const code = normalizeCurrency(overrideCurrency) === 'USD' && !overrideCurrency
        ? currencyCode
        : normalizeCurrency(overrideCurrency || currencyCode);
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(num)) return `${CURRENCY_SYMBOLS[code] || code}0.00`;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    },
    [currencyCode],
  );

  /** Short format for axis ticks / compact display */
  const formatCompact = useCallback(
    (amount: number, overrideCurrency?: string) => {
      const sym = CURRENCY_SYMBOLS[overrideCurrency || currencyCode] || (overrideCurrency || currencyCode);
      if (amount >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`;
      if (amount >= 1_000) return `${sym}${(amount / 1_000).toFixed(0)}k`;
      return `${sym}${amount.toLocaleString()}`;
    },
    [currencyCode],
  );

  return { currencyCode, symbol, formatCurrency, formatCompact };
}

/**
 * Standalone helper for components that already have the currency code
 * but need Intl formatting without the hook.
 */
export function formatCurrencyValue(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${CURRENCY_SYMBOLS[currency] || currency}0.00`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getCurrencySymbol(currency: string = 'USD'): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

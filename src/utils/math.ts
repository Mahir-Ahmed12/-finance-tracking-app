import { CurrencyConfig } from '../types/finance';

/**
 * Decimal-safe arithmetic helpers to prevent IEEE-754 floating-point inaccuracies
 * e.g., 0.1 + 0.2 = 0.30000000000000004
 */

export function safeAdd(a: number, b: number): number {
  return Math.round((Number(a || 0) * 100 + Number(b || 0) * 100)) / 100;
}

export function safeSub(a: number, b: number): number {
  return Math.round((Number(a || 0) * 100 - Number(b || 0) * 100)) / 100;
}

export function safeMul(a: number, b: number): number {
  return Math.round((Number(a || 0) * Number(b || 0) * 100)) / 100;
}

export function safeDiv(a: number, b: number): number {
  if (!b || b === 0) return 0;
  return Math.round(((Number(a || 0) / Number(b)) * 100)) / 100;
}

export function safePercent(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  const pct = (part / total) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Format a number as currency according to user currency config
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyConfig,
  options?: { hideSign?: boolean; decimals?: number }
): string {
  const decimals = options?.decimals !== undefined ? options.decimals : 2;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount || 0);

  // Format with thousands separator
  const formattedNumber = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const sign = isNegative && !options?.hideSign ? '-' : '';
  
  if (currency.position === 'suffix') {
    return `${sign}${formattedNumber} ${currency.symbol}`;
  }
  return `${sign}${currency.symbol}${formattedNumber}`;
}

export function formatCompactCurrency(amount: number, currency: CurrencyConfig): string {
  const absAmount = Math.abs(amount);
  let formatted = '';
  if (absAmount >= 1_000_000) {
    formatted = (amount / 1_000_000).toFixed(1) + 'M';
  } else if (absAmount >= 1_000) {
    formatted = (amount / 1_000).toFixed(1) + 'K';
  } else {
    formatted = amount.toFixed(0);
  }

  if (currency.position === 'suffix') {
    return `${formatted} ${currency.symbol}`;
  }
  return `${currency.symbol}${formatted}`;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', position: 'prefix' },
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'prefix' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'prefix' },
  { code: 'GBP', symbol: '£', name: 'British Pound', position: 'prefix' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'prefix' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'prefix' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', position: 'prefix' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', position: 'prefix' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'prefix' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', position: 'suffix' },
];

export const DEFAULT_CURRENCY: CurrencyConfig = SUPPORTED_CURRENCIES[0]; // BDT ৳

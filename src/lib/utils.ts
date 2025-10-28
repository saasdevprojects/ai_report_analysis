import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with commas
// Example: 1000 -> '1,000'
export function formatNumber(num: number | string | null | undefined, decimals = 0): string {
  if (num === null || num === undefined) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  return number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format number as percentage
// Example: 0.123 -> '12.3%'
export function formatPercentage(num: number | string | null | undefined, decimals = 1): string {
  if (num === null || num === undefined) return '0%';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0%';
  return (number * 100).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

// Format date string
// Example: '2023-01-01' -> 'Jan 1, 2023'
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Safe number conversion
export function safeNumber(value: any, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

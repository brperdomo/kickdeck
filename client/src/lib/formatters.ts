/**
 * Formats a currency value with the given locale and currency code
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = 'en-US',
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  if (value === null || value === undefined) {
    return '$0.00';
  }

  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN
  if (isNaN(numericValue)) {
    return '$0.00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericValue);
}

/**
 * Formats a number with comma separators and optional decimal places
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  if (value === null || value === undefined) {
    return '0';
  }

  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN
  if (isNaN(numericValue)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericValue);
}

/**
 * Formats a date with the specified format
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  if (!date) {
    return 'N/A';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats a percentage value
 */
export function formatPercent(
  value: number | string | null | undefined,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  if (value === null || value === undefined) {
    return '0%';
  }

  // Convert string to number if needed
  let numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN
  if (isNaN(numericValue)) {
    return '0%';
  }

  // If value is already in percent form (0-100), convert to decimal
  if (numericValue > 1) {
    numericValue = numericValue / 100;
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericValue);
}

/**
 * Formats file size in bytes to a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncates text to a specified length and adds ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
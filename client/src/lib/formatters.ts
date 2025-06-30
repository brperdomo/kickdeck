import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format a date string to a localized date format
 * @param date Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date string to a localized date and time format
 * @param date Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return 'Invalid date';
  }
}

/**
 * Format a number as currency
 * @param amount Amount in cents
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  
  // Convert cents to dollars and format with 2 decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount / 100);
}

/**
 * Format a number as a percentage
 * @param value Decimal value (e.g., 0.25 for 25%)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
}

/**
 * Format a date as relative time from now
 * @param date Date string or Date object
 * @returns Relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date with full timestamp including timezone
 * @param date Date string or Date object  
 * @param treatAsUTC Whether to treat the date string as UTC (for database timestamps)
 * @returns Formatted date/time string with timezone
 */
export function formatTimestamp(date: string | Date, treatAsUTC: boolean = false): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // If treating as UTC, append 'Z' to ensure proper UTC interpretation
      dateObj = treatAsUTC ? new Date(date + 'Z') : new Date(date);
    } else {
      dateObj = date;
    }
    
    // Use user's local timezone automatically
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
}

/**
 * Format timestamp for a specific timezone
 * @param date Date string or Date object
 * @param timezone IANA timezone string (e.g., 'America/Los_Angeles')
 * @param treatAsUTC Whether to treat the date string as UTC (for database timestamps)
 * @returns Formatted date/time string with timezone
 */
export function formatTimestampInTimezone(date: string | Date, timezone: string, treatAsUTC: boolean = false): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // If treating as UTC, append 'Z' to ensure proper UTC interpretation
      dateObj = treatAsUTC ? new Date(date + 'Z') : new Date(date);
    } else {
      dateObj = date;
    }
    
    return dateObj.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting timestamp for timezone:', error);
    return 'Invalid date';
  }
}

/**
 * Get user's detected timezone
 * @returns IANA timezone string
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error detecting user timezone:', error);
    return 'America/New_York'; // fallback
  }
}
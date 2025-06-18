import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined) {
  // Handle null, undefined or empty strings
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    // If the date string is in YYYY-MM-DD format without time, 
    // add local time to prevent timezone conversion issues
    let processedDateString = dateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      processedDateString = dateString + 'T00:00:00';
    }
    
    const date = new Date(processedDateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatCurrency(amount: number): string {
  // Check if amount is a valid number
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0.00";
  }
  
  // Debug log to see what's being passed in
  console.log(`formatCurrency received: ${amount} (type: ${typeof amount})`);
  
  try {
    // Convert to a number explicitly to handle string inputs
    const numericAmount = Number(amount);
    
    // Ensure amount has at most 2 decimal places
    const fixedAmount = Number(numericAmount.toFixed(2));
    
    // Format as currency
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(fixedAmount);
    
    console.debug(`Formatted currency result: ${formatted}`);
    return formatted;
  } catch (error) {
    console.error("Error formatting currency amount:", amount, error);
    return "$0.00";
  }
}
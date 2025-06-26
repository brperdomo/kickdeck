/**
 * API Configuration
 * 
 * This module provides the correct API base URL for different environments
 */

export function getApiBaseUrl(): string {
  // In development, always use the current origin to make relative calls
  // This ensures API calls go to the same server serving the frontend
  if (import.meta.env.DEV) {
    return '';  // Empty string means relative URLs
  }
  
  // In production, use the production API
  return '';  // Still use relative URLs for production consistency
}

export const API_BASE = getApiBaseUrl();

/**
 * Creates a fetch wrapper that automatically includes credentials and proper headers
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  const apiUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
  
  return fetch(apiUrl, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}
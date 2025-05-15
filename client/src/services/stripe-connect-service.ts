/**
 * Stripe Connect Service
 * 
 * This service handles client-side interactions with the Stripe Connect API
 * to allow clubs to receive payments directly through the platform.
 */

import { apiRequest } from '@/lib/queryClient';

/**
 * Create a Stripe Connect account for a club
 * @param clubId The ID of the club
 * @param businessType The type of business (individual or company)
 * @returns Response with account ID and onboarding URL
 */
export async function createConnectAccount(clubId: number, businessType: 'individual' | 'company' = 'company') {
  const response = await apiRequest('POST', `/api/clubs/${clubId}/stripe-connect`, { 
    businessType 
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create Stripe Connect account');
  }
  
  return await response.json();
}

/**
 * Get the status of a club's Stripe Connect account
 * @param clubId The ID of the club
 * @returns Current status of the Stripe Connect account
 */
export async function getConnectAccountStatus(clubId: number) {
  const response = await apiRequest('GET', `/api/clubs/${clubId}/stripe-connect/status`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get Stripe Connect account status');
  }
  
  return await response.json();
}

/**
 * Generate a fresh account link for completing the onboarding process
 * @param clubId The ID of the club
 * @returns New onboarding URL
 */
export async function generateAccountLink(clubId: number) {
  const response = await apiRequest('POST', `/api/clubs/${clubId}/stripe-connect/account-link`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate account link');
  }
  
  return await response.json();
}

/**
 * Generate a dashboard login link for the club's Stripe Connect account
 * @param clubId The ID of the club
 * @returns Dashboard login URL
 */
export async function generateDashboardLink(clubId: number) {
  const response = await apiRequest('GET', `/api/clubs/${clubId}/stripe-connect/dashboard-link`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate dashboard link');
  }
  
  return await response.json();
}
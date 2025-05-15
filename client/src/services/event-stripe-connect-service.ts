/**
 * Event Stripe Connect Service
 * Client-side service to interact with Stripe Connect API for events/tournaments
 */

import { apiRequest } from '@/lib/queryClient';

/**
 * Create a Stripe Connect account for an event
 * @param eventId The event ID
 * @param businessType The business type (individual or company)
 */
export async function createEventConnectAccount(eventId: number, businessType: 'individual' | 'company') {
  const response = await apiRequest('POST', `/api/events/${eventId}/stripe-connect`, {
    businessType
  });
  return await response.json();
}

/**
 * Get the status of an event's Stripe Connect account
 * @param eventId The event ID
 */
export async function getEventConnectStatus(eventId: number) {
  const response = await apiRequest('GET', `/api/events/${eventId}/stripe-connect/status`);
  return await response.json();
}

/**
 * Generate a new account link for onboarding
 * @param eventId The event ID
 */
export async function generateEventAccountLink(eventId: number) {
  const response = await apiRequest('POST', `/api/events/${eventId}/stripe-connect/account-link`);
  return await response.json();
}

/**
 * Generate a dashboard login link
 * @param eventId The event ID
 */
export async function generateEventDashboardLink(eventId: number) {
  const response = await apiRequest('GET', `/api/events/${eventId}/stripe-connect/dashboard-link`);
  return await response.json();
}
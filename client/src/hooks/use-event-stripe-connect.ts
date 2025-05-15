/**
 * Event Stripe Connect Hook
 * 
 * React hook to manage Stripe Connect functionality for tournament/event level accounts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  createEventConnectAccount,
  getEventConnectStatus,
  generateEventAccountLink,
  generateEventDashboardLink
} from '@/services/event-stripe-connect-service';

export function useEventStripeConnect(eventId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const statusQuery = useQuery({
    queryKey: ['eventStripeConnect', eventId],
    queryFn: () => getEventConnectStatus(eventId),
    enabled: !!eventId,
  });

  const createAccountMutation = useMutation({
    mutationFn: (businessType: 'individual' | 'company') => 
      createEventConnectAccount(eventId, businessType),
    onSuccess: () => {
      toast({
        title: 'Stripe Connect Account Created',
        description: 'Stripe Connect account has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['eventStripeConnect', eventId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Stripe Connect Account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const generateAccountLinkMutation = useMutation({
    mutationFn: () => generateEventAccountLink(eventId),
    onSuccess: (data) => {
      // Redirect to Stripe's onboarding page
      window.location.href = data.accountLink;
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Generate Account Link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const generateDashboardLinkMutation = useMutation({
    mutationFn: () => generateEventDashboardLink(eventId),
    onSuccess: (data) => {
      // Open Stripe dashboard in a new tab
      window.open(data.url, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Generate Dashboard Link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,
    createAccount: createAccountMutation.mutate,
    isCreatingAccount: createAccountMutation.isPending,
    generateAccountLink: generateAccountLinkMutation.mutate,
    isGeneratingAccountLink: generateAccountLinkMutation.isPending,
    generateDashboardLink: generateDashboardLinkMutation.mutate,
    isGeneratingDashboardLink: generateDashboardLinkMutation.isPending,
    refreshStatus: () => queryClient.invalidateQueries({ queryKey: ['eventStripeConnect', eventId] }),
  };
}
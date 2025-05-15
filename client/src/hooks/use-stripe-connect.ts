/**
 * Stripe Connect Hook
 * 
 * Custom hook for interacting with Stripe Connect APIs using React Query
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  createConnectAccount, 
  getConnectAccountStatus, 
  generateAccountLink, 
  generateDashboardLink 
} from '@/services/stripe-connect-service';

export function useStripeConnect(clubId?: number) {
  const { toast } = useToast();
  
  // Get account status query
  const accountStatusQuery = useQuery({
    queryKey: ['stripe-connect', 'status', clubId],
    queryFn: () => clubId ? getConnectAccountStatus(clubId) : null,
    enabled: !!clubId,
    onError: (error: Error) => {
      toast({
        title: 'Failed to get account status',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Create Connect account mutation
  const createAccountMutation = useMutation({
    mutationFn: ({ clubId, businessType }: { clubId: number, businessType?: 'individual' | 'company' }) => 
      createConnectAccount(clubId, businessType),
    onSuccess: () => {
      toast({
        title: 'Stripe Connect account created',
        description: 'You can now complete the onboarding process',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create account',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Generate account link mutation
  const accountLinkMutation = useMutation({
    mutationFn: (clubId: number) => generateAccountLink(clubId),
    onSuccess: (data) => {
      // Redirect to Stripe onboarding
      window.location.href = data.accountLinkUrl;
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate onboarding link',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Generate dashboard link mutation
  const dashboardLinkMutation = useMutation({
    mutationFn: (clubId: number) => generateDashboardLink(clubId),
    onSuccess: (data) => {
      // Open Stripe dashboard in new tab
      window.open(data.dashboardLink, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate dashboard link',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  return {
    accountStatus: accountStatusQuery.data,
    isLoading: accountStatusQuery.isLoading,
    
    createAccount: createAccountMutation.mutate,
    isCreating: createAccountMutation.isPending,
    
    generateAccountLink: accountLinkMutation.mutate,
    isGeneratingAccountLink: accountLinkMutation.isPending,
    
    openDashboard: dashboardLinkMutation.mutate,
    isOpeningDashboard: dashboardLinkMutation.isPending,
  };
}
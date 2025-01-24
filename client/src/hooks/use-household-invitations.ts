import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Invitation {
  invitation: {
    id: number;
    email: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: string;
  };
  createdByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SendInvitationData {
  email: string;
}

export function useMatchproClientInvitations() {
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/matchpro-client/invitations'],
    queryFn: async () => {
      const response = await fetch('/api/matchpro-client/invitations', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    }
  });

  const sendInvitation = useMutation({
    mutationFn: async (data: SendInvitationData) => {
      const response = await fetch('/api/matchpro-client/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matchpro-client/invitations'] });
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const acceptInvitation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/matchpro-client/invitations/${token}/accept`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matchpro-client/invitations'] });
      toast({
        title: 'Success',
        description: 'Invitation accepted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const declineInvitation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/matchpro-client/invitations/${token}/decline`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matchpro-client/invitations'] });
      toast({
        title: 'Success',
        description: 'Invitation declined successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return {
    invitations,
    isLoading,
    sendInvitation: sendInvitation.mutate,
    acceptInvitation: acceptInvitation.mutate,
    declineInvitation: declineInvitation.mutate,
  };
}
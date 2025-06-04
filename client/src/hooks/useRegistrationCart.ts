import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RegistrationCart {
  id: number;
  eventId: string;
  formData: Record<string, any>;
  currentStep: string;
  selectedAgeGroupId?: number;
  selectedBracketId?: number;
  selectedClubId?: number;
  selectedFeeIds?: string;
  totalAmount?: number;
  lastUpdated: string;
  createdAt: string;
}

interface SaveCartData {
  formData: Record<string, any>;
  currentStep: string;
  selectedAgeGroupId?: number;
  selectedBracketId?: number;
  selectedClubId?: number;
  selectedFeeIds?: string;
  totalAmount?: number;
}

export function useRegistrationCart(eventId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing cart
  const cartQuery = useQuery({
    queryKey: ['registration-cart', eventId],
    queryFn: async (): Promise<RegistrationCart | null> => {
      const response = await fetch(`/api/events/${eventId}/cart`);
      if (!response.ok) {
        if (response.status === 401) {
          return null; // User not authenticated
        }
        throw new Error('Failed to fetch registration cart');
      }
      const data = await response.json();
      return data.cart;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Save cart mutation
  const saveCartMutation = useMutation({
    mutationFn: async (cartData: SaveCartData) => {
      const response = await fetch(`/api/events/${eventId}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData),
      });

      if (!response.ok) {
        throw new Error('Failed to save registration cart');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch cart data
      queryClient.invalidateQueries({ queryKey: ['registration-cart', eventId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save registration progress: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${eventId}/cart`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear registration cart');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch cart data
      queryClient.invalidateQueries({ queryKey: ['registration-cart', eventId] });
      toast({
        title: "Success",
        description: "Registration cart cleared successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to clear registration cart: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Auto-save function with debouncing
  const saveCart = (cartData: SaveCartData) => {
    saveCartMutation.mutate(cartData);
  };

  // Clear cart function
  const clearCart = () => {
    clearCartMutation.mutate();
  };

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    saveCart,
    clearCart,
    isSaving: saveCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface HouseholdDetails {
  id: number;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  primaryEmail: string;
  createdAt: string;
}

interface HouseholdAddressUpdate {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export function useHouseholdDetails() {
  const queryClient = useQueryClient();

  // Fetch household details
  const { data: household, isLoading, error } = useQuery({
    queryKey: ["/api/household/details"],
    queryFn: async () => {
      const response = await fetch("/api/household/details", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch household details");
      }

      return response.json() as Promise<HouseholdDetails>;
    },
    retry: 1,
  });

  // Update household address
  const updateHouseholdAddress = useMutation({
    mutationFn: async (data: HouseholdAddressUpdate) => {
      const response = await fetch("/api/household", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update household information");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Household updated",
        description: "Your household address has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/household/details"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    household,
    isLoading,
    error,
    updateHouseholdAddress,
  };
}
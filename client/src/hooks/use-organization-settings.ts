import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectOrganizationSettings } from '@db/schema';

export function useOrganizationSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SelectOrganizationSettings>({
    queryKey: ['/api/admin/organization-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organization-settings', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - match server cache time
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<SelectOrganizationSettings>) => {
      const response = await fetch('/api/admin/organization-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Don't cache mutations
        },
        body: JSON.stringify(newSettings),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the cache after updating settings
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organization-settings'] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    error: updateMutation.error,
  };
}

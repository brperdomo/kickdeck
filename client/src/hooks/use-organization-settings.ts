import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectOrganizationSettings } from '@db/schema';

export function useOrganizationSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SelectOrganizationSettings>({
    queryKey: ['/api/admin/organization-settings'],
    staleTime: 30000,
    gcTime: 3600000,
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<SelectOrganizationSettings>) => {
      const response = await fetch('/api/admin/organization-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

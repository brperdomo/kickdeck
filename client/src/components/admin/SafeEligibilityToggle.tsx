/**
 * Safe Age Group Eligibility Toggle Component
 * 
 * This component provides a simple toggle for age group eligibility
 * that bypasses the problematic event update code to prevent constraint violations.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface SafeEligibilityToggleProps {
  eventId: string;
  ageGroupId: number;
  ageGroupName: string;
  initialEligible: boolean;
}

export function SafeEligibilityToggle({ 
  eventId, 
  ageGroupId, 
  ageGroupName, 
  initialEligible 
}: SafeEligibilityToggleProps) {
  const [isEligible, setIsEligible] = useState(initialEligible);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleEligibilityMutation = useMutation({
    mutationFn: async (newEligibleState: boolean) => {
      console.log(`Toggling eligibility for ${ageGroupName} (ID: ${ageGroupId}) to ${newEligibleState}`);
      
      const response = await fetch(`/api/safe-eligibility/events/${eventId}/age-groups/${ageGroupId}/eligibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEligible: newEligibleState }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update eligibility');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Successfully updated eligibility:', data);
      setIsEligible(data.isEligible);
      
      toast({
        title: "Eligibility Updated",
        description: `${ageGroupName} is now ${data.isEligible ? 'eligible' : 'ineligible'} for registration`,
      });

      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/safe-eligibility/events', eventId, 'eligibility'] });
    },
    onError: (error) => {
      console.error('Error updating eligibility:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update age group eligibility",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (newValue: boolean) => {
    console.log(`User toggling ${ageGroupName} eligibility from ${isEligible} to ${newValue}`);
    toggleEligibilityMutation.mutate(newValue);
  };

  return (
    <div className="flex items-center space-x-3">
      <Switch
        checked={isEligible}
        onCheckedChange={handleToggle}
        disabled={toggleEligibilityMutation.isPending}
      />
      <span className="text-sm">
        {ageGroupName} - {isEligible ? 'Eligible' : 'Not Eligible'}
      </span>
      {toggleEligibilityMutation.isPending && (
        <span className="text-xs text-muted-foreground">Updating...</span>
      )}
    </div>
  );
}
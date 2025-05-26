/**
 * Simple Eligibility Manager
 * 
 * This component replaces the complex event update system with a simple
 * age group eligibility toggle interface that never tries to delete records.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SimpleEligibilityManagerProps {
  eventId: string;
}

export function SimpleEligibilityManager({ eventId }: SimpleEligibilityManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch age groups for this event
  const { data: ageGroups, isLoading } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'age-groups'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    },
  });

  // Safe eligibility toggle mutation
  const toggleEligibilityMutation = useMutation({
    mutationFn: async ({ ageGroupId, isEligible }: { ageGroupId: number; isEligible: boolean }) => {
      console.log(`Toggling eligibility for age group ${ageGroupId} to ${isEligible}`);
      
      const response = await fetch(`/api/safe-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ageGroupId,
          isEligible
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update eligibility: ${errorData}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'age-groups'] });
      queryClient.invalidateQueries({ queryKey: ['ageGroupEligibilitySettings', eventId] });
      
      toast({
        title: "Success!",
        description: `Age group eligibility updated successfully`,
      });
    },
    onError: (error) => {
      console.error('Error updating eligibility:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update eligibility",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (ageGroupId: number, currentEligible: boolean) => {
    const newEligible = !currentEligible;
    toggleEligibilityMutation.mutate({ ageGroupId, isEligible: newEligible });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading age groups...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Age Group Eligibility</CardTitle>
        <p className="text-sm text-muted-foreground">
          Toggle age groups on/off for registration. Disabled age groups won't appear in registration forms.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {ageGroups?.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No age groups found for this event.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ageGroups?.map((ageGroup: any) => (
              <div key={ageGroup.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`eligibility-${ageGroup.id}`} className="text-sm font-medium">
                    {ageGroup.divisionCode ? `${ageGroup.divisionCode} - ` : ''}
                    {ageGroup.gender} {ageGroup.ageGroup}
                  </Label>
                  {ageGroup.birthYear && (
                    <p className="text-xs text-muted-foreground">Birth Year: {ageGroup.birthYear}</p>
                  )}
                </div>
                <Switch
                  id={`eligibility-${ageGroup.id}`}
                  checked={ageGroup.isEligible !== false}
                  onCheckedChange={() => handleToggle(ageGroup.id, ageGroup.isEligible !== false)}
                  disabled={toggleEligibilityMutation.isPending}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">✅ Safe Eligibility System</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• No database constraint violations</li>
            <li>• Age groups are hidden from registration, not deleted</li>
            <li>• All existing data stays safe</li>
            <li>• Toggle any age group without errors</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
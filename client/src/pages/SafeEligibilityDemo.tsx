/**
 * Safe Eligibility Demo Page
 * 
 * This page demonstrates the safe eligibility toggle system
 * that bypasses the problematic event update code.
 */

import { useQuery } from '@tanstack/react-query';
import { SafeEligibilityToggle } from '@/components/admin/SafeEligibilityToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SafeEligibilityDemo() {
  // Using your event ID from the errors
  const eventId = '1408614908';

  const { data: eventData, isLoading } = useQuery({
    queryKey: ['/api/admin/events', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/edit`);
      if (!response.ok) throw new Error('Failed to fetch event data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading event data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ageGroups = eventData?.ageGroups || [];

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Safe Age Group Eligibility Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            This tool safely toggles age group eligibility without constraint violations.
            Event: {eventData?.name || `Event ${eventId}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {ageGroups.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No age groups found for this event.
            </div>
          ) : (
            ageGroups.map((ageGroup: any) => (
              <SafeEligibilityToggle
                key={ageGroup.id}
                eventId={eventId}
                ageGroupId={ageGroup.id}
                ageGroupName={ageGroup.ageGroup}
                initialEligible={ageGroup.isEligible !== false}
              />
            ))
          )}
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">✅ Constraint-Safe System</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• No age group deletions - only eligibility updates</li>
              <li>• Direct database updates to eligibility table only</li>
              <li>• Bypasses problematic event update code entirely</li>
              <li>• Safe to toggle any age group without errors</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
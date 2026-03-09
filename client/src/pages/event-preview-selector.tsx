import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from '@/hooks/use-location';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

// Define the event interface
interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

// Define the API response interface
interface EventsResponse {
  events: Event[];
}

export default function EventPreviewSelector() {
  const [_, setLocation] = useLocation();
  const eventsQuery = useQuery<EventsResponse>({
    queryKey: ['/api/admin/events'],
  });

  const handleNavigate = (eventId: number) => {
    setLocation(`/admin/events/${eventId}/preview-registration`);
  };

  if (eventsQuery.isLoading) {
    return (
      <AdminPageWrapper title="Event Preview" backUrl="/admin" backLabel="Back to Dashboard">
        <div className="text-muted-foreground">Loading events...</div>
      </AdminPageWrapper>
    );
  }

  // Get the events array from the response
  const events = eventsQuery.data?.events || [];

  return (
    <AdminPageWrapper
      title="Event Preview"
      subtitle="Select an event to preview its registration form"
      backUrl="/admin"
      backLabel="Back to Dashboard"
    >
      <Card>
        <CardHeader>
          <CardTitle>Select Event to Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                  <div>
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button onClick={() => handleNavigate(event.id)}>
                    Preview Registration
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center p-4">
                <p className="text-muted-foreground">No events available to preview</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}

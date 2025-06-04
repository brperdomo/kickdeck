
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useLocation } from "../hooks/use-location";

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
    return <div>Loading events...</div>;
  }

  // Get the events array from the response
  const events = eventsQuery.data?.events || [];
  
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Event to Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-sm text-gray-500">
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
                <p className="text-gray-500">No events available to preview</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

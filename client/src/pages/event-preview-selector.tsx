
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from '@/hooks/use-location';

// Define the event interface
interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export default function EventPreviewSelector() {
  const [_, setLocation] = useLocation();
  const eventsQuery = useQuery<Event[]>({
    queryKey: ['/api/admin/events'],
  });

  const handleNavigate = (eventId: number) => {
    setLocation(`/admin/events/${eventId}/preview-registration`);
  };

  if (eventsQuery.isLoading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Event to Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {eventsQuery.data && eventsQuery.data.map((event) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

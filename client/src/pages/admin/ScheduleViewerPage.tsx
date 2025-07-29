import React from 'react';
import { useParams } from 'wouter';
import { ScheduleViewer } from '@/components/admin/scheduling/ScheduleViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';

export function ScheduleViewerPage() {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="text-red-800">
              <h3 className="text-lg font-semibold mb-2">Invalid Event</h3>
              <p>No event ID provided for schedule viewing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Calendar className="h-8 w-8 mr-3 text-blue-600" />
                  Tournament Schedule
                </h1>
                <p className="text-gray-600 mt-1">Event ID: {eventId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ScheduleViewer eventId={eventId} />
      </div>
    </div>
  );
}
import { useState } from "react";
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';
import { UnifiedScheduleSetup } from '@/components/admin/scheduling/UnifiedScheduleSetup';

export default function QuickSchedulePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const [scheduleGenerated, setScheduleGenerated] = useState(false);

  if (!eventId) {
    return <div>Event ID is required</div>;
  }

  const handleBack = () => {
    setLocation('/admin/tournament-system');
  };

  const handleScheduleGenerated = (scheduleData: any) => {
    console.log('Schedule generated:', scheduleData);
    setScheduleGenerated(true);
    // Optionally redirect back to show success
    setTimeout(() => {
      setLocation('/admin/tournament-system');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tournament System
              </Button>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Zap className="h-6 w-6 text-blue-600" />
                  Quick Schedule Generator
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Generate your first tournament schedule in under 2 minutes for Event {eventId}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Unified Schedule Setup Component */}
        <UnifiedScheduleSetup 
          eventId={eventId}
          onComplete={handleScheduleGenerated}
        />

        {scheduleGenerated && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 Schedule Generated Successfully!
                </h3>
                <p className="text-green-700">
                  Redirecting back to tournament system to view your new schedule...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
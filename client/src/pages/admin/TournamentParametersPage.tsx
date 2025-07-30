import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TournamentParametersSetup } from '@/components/admin/scheduling/TournamentParametersSetup';

export default function TournamentParametersPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();

  if (!eventId) {
    return <div>Event ID is required</div>;
  }

  const handleBack = () => {
    setLocation('/admin/tournament-system');
  };

  const handleComplete = (data: any) => {
    console.log('Tournament parameters setup completed:', data);
    // Optionally redirect back or show success message
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
                <CardTitle className="text-2xl">Tournament Parameters Configuration</CardTitle>
                <p className="text-gray-600 mt-1">
                  Configure overall tournament settings and parameters for Event {eventId}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tournament Parameters Setup Component */}
        <TournamentParametersSetup 
          eventId={eventId}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
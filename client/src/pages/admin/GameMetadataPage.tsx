import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { GameMetadataSetup } from '@/components/admin/scheduling/GameMetadataSetup';

export default function GameMetadataPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();

  if (!eventId) {
    return <div>Event ID is required</div>;
  }

  const handleBack = () => {
    setLocation('/admin/tournament-system');
  };

  const handleComplete = (data: any) => {
    console.log('Game metadata setup completed:', data);
    // Navigate back to tournament system to show completion
    setLocation('/admin/tournament-system');
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
                <CardTitle className="text-2xl">Game Metadata Configuration</CardTitle>
                <p className="text-gray-600 mt-1">
                  Configure game formats, rules, and scheduling constraints for Event {eventId}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Game Metadata Setup Component */}
        <GameMetadataSetup 
          eventId={eventId}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
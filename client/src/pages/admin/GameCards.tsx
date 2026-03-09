import { useParams } from 'wouter';
import GameCardGenerator from '@/components/admin/gamecards/GameCardGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

const GameCardsPage = () => {
  const { eventId } = useParams();

  if (!eventId) {
    return <div>Event ID not found</div>;
  }

  return (
    <AdminPageWrapper
      title="Game Cards"
      subtitle="Generate professional game cards for tournament use"
      backUrl={`/admin/events/${eventId}`}
      backLabel="Back to Event"
    >
      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Professional Game Cards for Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Generate professional game cards that match tournament standards. These cards include
            team rosters, coach information, game schedules, and score sheets ready for field use.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Team Roster Cards Include:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Complete player roster with jersey numbers</li>
                <li>• Coach and manager information</li>
                <li>• Club logos (when available)</li>
                <li>• Game schedule templates</li>
                <li>• Score tracking sections</li>
                <li>• Official signature areas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Game Schedule Cards Include:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Game date, time, and field information</li>
                <li>• Team names and details</li>
                <li>• Score recording boxes</li>
                <li>• Referee information section</li>
                <li>• Official signatures</li>
                <li>• Print-ready format</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Card Generator */}
      <GameCardGenerator eventId={eventId} />
    </AdminPageWrapper>
  );
};

export default GameCardsPage;

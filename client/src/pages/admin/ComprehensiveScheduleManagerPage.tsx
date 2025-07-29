import { useParams } from 'wouter';
import { ComprehensiveScheduleManager } from '../../components/admin/scheduling/ComprehensiveScheduleManager';

export function ComprehensiveScheduleManagerPage() {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Event Not Found</h1>
          <p className="text-muted-foreground">Unable to load schedule manager without event ID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ComprehensiveScheduleManager eventId={eventId} />
    </div>
  );
}
import { useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import PDFFormEditor from '@/components/admin/scheduling/PDFFormEditor';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

export default function GameCardsDesigner() {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Event ID is required</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AdminPageWrapper
      title="Game Card Designer"
      subtitle="Create professional game cards with custom layouts and database integration"
      backUrl={`/admin/events/${eventId}`}
      backLabel="Back to Event"
    >
      <PDFFormEditor eventId={eventId} />
    </AdminPageWrapper>
  );
}

import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PDFFormEditor from '@/components/admin/scheduling/PDFFormEditor';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Game Card Designer</h1>
        <p className="text-muted-foreground mt-2">
          Create professional game cards with custom layouts and database integration
        </p>
      </div>
      
      <PDFFormEditor eventId={eventId} />
    </div>
  );
}
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings } from 'lucide-react';
import FieldSortingManager from './FieldSortingManager';

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  sortOrder: number;
  hasLights: boolean;
  isOpen: boolean;
  complexName?: string;
}

interface FieldManagementDashboardProps {
  eventId: string;
}

export default function FieldManagementDashboard({ eventId }: FieldManagementDashboardProps) {
  // Fetch event fields
  const { data: fieldsData, isLoading, refetch } = useQuery({
    queryKey: ['event-fields', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    }
  });

  const handleFieldsReordered = (reorderedFields: Field[]) => {
    // Refetch fields data to ensure UI is updated
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-slate-800 rounded-lg h-64"></div>
      </div>
    );
  }

  const fields = fieldsData?.fields || [];

  return (
    <div className="space-y-6">
      <Alert className="border-slate-600 bg-slate-800">
        <Settings className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-slate-200">
          <strong>Field Display Order Management:</strong> Arrange fields in the order you want them to appear 
          in the Master Scheduler's Calendar Grid. Priority fields (typically 12, 13) should be at the top 
          for optimal scheduling distribution.
        </AlertDescription>
      </Alert>

      {fields.length > 0 ? (
        <FieldSortingManager
          fields={fields}
          onFieldsReordered={handleFieldsReordered}
        />
      ) : (
        <Alert className="border-yellow-600 bg-yellow-900/20">
          <Settings className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            No fields found for this event. Please ensure fields are configured in the event setup.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
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
  isActive?: boolean;
  firstGameTime?: string;
  complexName?: string;
}

interface FieldManagementDashboardProps {
  eventId: string;
}

export default function FieldManagementDashboard({ eventId }: FieldManagementDashboardProps) {
  // Fetch event fields
  const { data: fieldsData, isLoading, error, refetch } = useQuery({
    queryKey: ['event-fields', eventId],
    queryFn: async () => {
      console.log(`[DEBUG] Fetching fields for event: ${eventId}`);
      console.log(`[DEBUG] Making authenticated request with credentials`);
      
      const response = await fetch(`/api/admin/events/${eventId}/fields`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log(`[DEBUG] Response status: ${response.status}`);
      console.log(`[DEBUG] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG] API error (${response.status}):`, errorText);
        
        if (response.status === 401) {
          console.error(`[DEBUG] Authentication failed - user may not be logged in or session expired`);
        }
        
        throw new Error(`Failed to fetch fields: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[DEBUG] Fields response:`, data);
      console.log(`[DEBUG] Fields array length:`, Array.isArray(data) ? data.length : (data?.fields?.length || 0));
      return data;
    }
  });

  const handleFieldsReordered = (reorderedFields: Field[]) => {
    console.log('🔄 FIELD REFRESH: Parent component received field update notification');
    console.log('🔄 FIELD REFRESH: Triggering data refetch to ensure persistence...');
    // Refetch fields data to ensure UI is updated with latest database values
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-slate-800 rounded-lg h-64"></div>
      </div>
    );
  }

  // Handle both response formats: direct array or nested in fields property
  const fields = Array.isArray(fieldsData) ? fieldsData : (fieldsData?.fields || []);
  
  console.log(`[DEBUG] Fields data:`, fieldsData);
  console.log(`[DEBUG] Fields array:`, fields);
  console.log(`[DEBUG] Fields length:`, fields.length);
  console.log(`[DEBUG] Is fieldsData an array?:`, Array.isArray(fieldsData));
  console.log(`[DEBUG] fieldsData.fields exists?:`, !!fieldsData?.fields);
  
  if (error) {
    console.error(`[DEBUG] Query error:`, error);
  }

  return (
    <div className="space-y-6">
      <Alert className="border-slate-600 bg-slate-800">
        <Settings className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-slate-200">
          <strong>Tournament Field Configuration:</strong> Arrange fields in the order you want them to appear 
          in the Master Scheduler's Calendar Grid and configure field sizes specific to this tournament. 
          Priority fields (typically 12, 13) should be at the top for optimal scheduling distribution.
        </AlertDescription>
      </Alert>

      {/* Debug information */}
      {process.env.NODE_ENV === 'development' && (
        <Alert className="border-blue-600 bg-blue-900/20">
          <AlertDescription className="text-blue-200 text-xs">
            <strong>Debug Info:</strong> Event ID: {eventId} | 
            Fields Count: {fields.length} | 
            Data Type: {Array.isArray(fieldsData) ? 'Array' : 'Object'} | 
            Loading: {isLoading.toString()} | 
            Error: {error ? 'Yes' : 'No'}
            {error && <div>Error Details: {error.message}</div>}
          </AlertDescription>
        </Alert>
      )}

      {fields.length > 0 ? (
        <FieldSortingManager
          fields={fields}
          onFieldsReordered={handleFieldsReordered}
          eventId={eventId}
        />
      ) : (
        <Alert className="border-yellow-600 bg-yellow-900/20">
          <Settings className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            No fields found for this event. Please ensure fields are configured in the event setup.
            {error && <div className="mt-2 text-xs">Error: {error.message}</div>}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
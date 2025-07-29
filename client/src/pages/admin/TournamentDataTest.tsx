import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Database, Users, Trophy } from 'lucide-react';

export function TournamentDataTest() {
  // Test different event IDs to see what's in the database
  const eventIds = ['1754094756146', '1742144286403', '1742144377515'];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tournament Data Debug - Real Database Values</h1>
      
      {eventIds.map(eventId => (
        <TestEventData key={eventId} eventId={eventId} />
      ))}
    </div>
  );
}

function TestEventData({ eventId }: { eventId: string }) {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['tournament-status-test', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/tournament-status`, {
        credentials: 'include'
      });
      return response.ok ? response.json() : { error: 'Auth required' };
    }
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule-test', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule`, {
        credentials: 'include'
      });
      return response.ok ? response.json() : { error: 'Auth required' };
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Event ID: {eventId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tournament Status API */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-medium mb-2">Tournament Status API</h3>
            {statusLoading ? (
              <p>Loading...</p>
            ) : status?.error ? (
              <p className="text-red-600">Authentication required</p>
            ) : (
              <div className="space-y-1 text-sm">
                <p><strong>Event:</strong> {status?.eventName || 'Unknown'}</p>
                <p><strong>Age Groups:</strong> {status?.ageGroups || 0}</p>
                <p><strong>Games:</strong> {status?.gamesScheduled || 0}</p>
                <p><strong>Teams:</strong> {status?.teamsRegistered || 0}</p>
                <p><strong>Status:</strong> {status?.status || 'Unknown'}</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-medium mb-2">Schedule Viewer API</h3>
            {scheduleLoading ? (
              <p>Loading...</p>
            ) : schedule?.error ? (
              <p className="text-red-600">Authentication required</p>
            ) : (
              <div className="space-y-1 text-sm">
                <p><strong>Total Games:</strong> {schedule?.totalGames || 0}</p>
                <p><strong>Teams Found:</strong> {schedule?.actualData?.realTeamsFound || 0}</p>
                <p><strong>Games in DB:</strong> {schedule?.actualData?.gamesInDatabase || 0}</p>
                <p><strong>Age Groups:</strong> {schedule?.actualData?.ageGroupsConfigured || 0}</p>
                {schedule?.teamsList?.length > 0 && (
                  <p><strong>Sample Teams:</strong> {schedule.teamsList.slice(0, 3).map((t: any) => t.name).join(', ')}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Raw API Response */}
        <details className="bg-gray-50 p-4 rounded">
          <summary className="cursor-pointer font-medium">Raw API Responses (Click to expand)</summary>
          <div className="mt-2 space-y-2">
            <div>
              <h4 className="font-medium">Status API:</h4>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(status, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium">Schedule API:</h4>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(schedule, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

export default TournamentDataTest;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SevenStepTournamentSystem } from '@/components/admin/scheduling/SevenStepTournamentSystem';
import { Settings, Trophy, AlertTriangle } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  teamCount: number;
}

export default function TournamentSystemPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Fetch tournaments available for scheduling
  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['scheduling-tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tournaments/scheduling', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading tournament system...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tournament Management System</h1>
          <p className="text-gray-600 mt-1">
            Systematic 7-step approach to automated tournament scheduling and management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-blue-600" />
          <Badge variant="outline">Professional Edition</Badge>
        </div>
      </div>

      {/* Tournament Selection */}
      {!selectedEventId && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <CardTitle>Select Tournament</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Choose a tournament to begin the 7-step automated scheduling process.
              </p>
              
              {tournaments && tournaments.length > 0 ? (
                <div className="space-y-3">
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a tournament to configure..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((tournament: Event) => (
                        <SelectItem key={tournament.id} value={tournament.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{tournament.name}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {tournament.teamCount} teams
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No tournaments found that are ready for scheduling. Create a tournament with registered teams first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-Step Tournament System */}
      {selectedEventId && (
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Tournament System</span>
            <span>›</span>
            <span className="font-medium">
              {tournaments?.find((t: Event) => t.id.toString() === selectedEventId)?.name}
            </span>
          </div>

          {/* System Interface */}
          <SevenStepTournamentSystem eventId={selectedEventId} />
        </div>
      )}
    </div>
  );
}
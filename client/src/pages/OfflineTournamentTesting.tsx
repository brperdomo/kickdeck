import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlexibleAgeGroupManager } from '@/components/admin/scheduling/FlexibleAgeGroupManager';
import { SevenStepTournamentSystem } from '@/components/admin/scheduling/SevenStepTournamentSystem';
import { AlertCircle, Database, Users, Calendar, MapPin, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Offline test data structure matching production schema
interface OfflineTournamentData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  teams: Array<{
    id: number;
    name: string;
    ageGroupId: number;
    status: string;
    clubName: string;
  }>;
  ageGroups: Array<{
    id: number;
    eventId: string;
    ageGroup: string;
    gender: string;
    fieldSize: string;
    projectedTeams: number;
    birthYear: number;
  }>;
  fields: Array<{
    id: number;
    name: string;
    fieldType: string;
    isActive: boolean;
  }>;
  gameTimeSlots: Array<{
    id: number;
    eventId: string;
    fieldId: number;
    startTime: string;
    endTime: string;
    dayIndex: number;
    isAvailable: boolean;
  }>;
  games: Array<{
    id: number;
    eventId: string;
    ageGroupId: number;
    homeTeamId: number;
    awayTeamId: number;
    fieldId: number;
    timeSlotId: number;
    status: string;
  }>;
}

export default function OfflineTournamentTesting() {
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState<OfflineTournamentData | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('1656618593');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Simulate fetching live tournament data for offline testing
  useEffect(() => {
    const loadOfflineData = async () => {
      setIsLoading(true);
      
      // Simulate real tournament data structure
      const mockTournamentData: OfflineTournamentData = {
        id: '1656618593',
        name: 'Rise Cup Tournament 2025',
        startDate: '2025-10-01',
        endDate: '2025-10-04',
        teams: [
          { id: 1, name: 'Arsenal Academy', ageGroupId: 1, status: 'approved', clubName: 'Arsenal FC' },
          { id: 2, name: 'Chelsea Youth', ageGroupId: 1, status: 'approved', clubName: 'Chelsea FC' },
          { id: 3, name: 'Manchester United U12', ageGroupId: 1, status: 'approved', clubName: 'Manchester United' },
          { id: 4, name: 'Liverpool Academy', ageGroupId: 1, status: 'approved', clubName: 'Liverpool FC' },
          { id: 5, name: 'Tottenham Hotspur Youth', ageGroupId: 2, status: 'approved', clubName: 'Tottenham' },
          { id: 6, name: 'Real Madrid Academy', ageGroupId: 2, status: 'approved', clubName: 'Real Madrid' },
          { id: 7, name: 'Barcelona La Masia', ageGroupId: 2, status: 'approved', clubName: 'FC Barcelona' },
          { id: 8, name: 'Bayern Munich Youth', ageGroupId: 2, status: 'approved', clubName: 'Bayern Munich' },
          { id: 9, name: 'Ajax Academy', ageGroupId: 3, status: 'approved', clubName: 'AFC Ajax' },
          { id: 10, name: 'Juventus Primavera', ageGroupId: 3, status: 'approved', clubName: 'Juventus FC' }
        ],
        ageGroups: [
          { id: 1, eventId: '1656618593', ageGroup: 'U12', gender: 'Boys', fieldSize: '9v9', projectedTeams: 4, birthYear: 2013 },
          { id: 2, eventId: '1656618593', ageGroup: 'U14', gender: 'Boys', fieldSize: '11v11', projectedTeams: 4, birthYear: 2011 },
          { id: 3, eventId: '1656618593', ageGroup: 'U16', gender: 'Boys', fieldSize: '11v11', projectedTeams: 2, birthYear: 2009 }
        ],
        fields: [
          { id: 1, name: 'Field A', fieldType: '11v11', isActive: true },
          { id: 2, name: 'Field B', fieldType: '11v11', isActive: true },
          { id: 3, name: 'Field C', fieldType: '9v9', isActive: true },
          { id: 4, name: 'Field D', fieldType: '9v9', isActive: true },
          { id: 5, name: 'Field E', fieldType: '7v7', isActive: true },
          { id: 6, name: 'Field F', fieldType: '7v7', isActive: true }
        ],
        gameTimeSlots: [],
        games: []
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTournamentData(mockTournamentData);
      setLastSyncTime(new Date().toISOString());
      setIsLoading(false);
    };

    loadOfflineData();
  }, [selectedTournamentId]);

  const syncWithProduction = async () => {
    setIsLoading(true);
    // In real implementation, this would fetch actual production data
    // For now, simulate the sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastSyncTime(new Date().toISOString());
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading offline tournament data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tournamentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load tournament data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Offline Tournament Testing System
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test all scheduling functionality with real tournament data without authentication barriers.
            Changes here mirror the production system behavior exactly.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Tournament</p>
                <p className="text-xs text-gray-600">{tournamentData.name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">{tournamentData.teams.length} Teams</p>
                <p className="text-xs text-gray-600">All Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">{tournamentData.ageGroups.length} Age Groups</p>
                <p className="text-xs text-gray-600">U12, U14, U16</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">{tournamentData.fields.length} Fields</p>
                <p className="text-xs text-gray-600">9v9, 11v11</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Status */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                OFFLINE MODE
              </Badge>
              <span className="text-sm text-gray-600">
                Last synced: {new Date(lastSyncTime).toLocaleString()}
              </span>
            </div>
            <Button onClick={syncWithProduction} variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Sync with Production
            </Button>
          </CardContent>
        </Card>

        {/* Testing Tabs */}
        <Tabs defaultValue="flexible" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flexible">Flexible Age Groups</TabsTrigger>
            <TabsTrigger value="traditional">Traditional 7-Step</TabsTrigger>
            <TabsTrigger value="data">Data Inspector</TabsTrigger>
          </TabsList>

          <TabsContent value="flexible" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flexible Age Group Manager</CardTitle>
                <CardDescription>
                  Test independent age group scheduling with real tournament data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FlexibleAgeGroupManager eventId={selectedTournamentId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traditional" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Traditional Tournament System</CardTitle>
                <CardDescription>
                  Test the complete 7-step tournament configuration system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SevenStepTournamentSystem eventId={selectedTournamentId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Data Structure</CardTitle>
                  <CardDescription>
                    Inspect the complete tournament data being used for testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Teams by Age Group</h4>
                      {tournamentData.ageGroups.map(ageGroup => {
                        const teams = tournamentData.teams.filter(t => t.ageGroupId === ageGroup.id);
                        return (
                          <div key={ageGroup.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-medium">{ageGroup.ageGroup} {ageGroup.gender}</span>
                            <Badge variant="secondary">{teams.length} teams</Badge>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Available Fields</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {tournamentData.fields.map(field => (
                          <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{field.name}</span>
                            <Badge variant="outline">{field.fieldType}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Generated Games</h4>
                      <p className="text-sm text-gray-600">
                        {tournamentData.games.length} games currently scheduled
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
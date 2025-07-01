import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: number;
  name: string;
  ageGroupId: number;
  status: string;
  flightId?: number;
}

interface TeamData {
  team: Team;
  ageGroup: { id: number; ageGroup: string };
  event: { id: number; name: string };
}

interface Flight {
  id: number;
  name: string;
  ageGroupId: number;
  level: string;
  maxTeams: number;
  eventId: number;
  teams?: Team[];
}

interface AgeGroup {
  id: number;
  ageGroup: string;
}

interface FlightManagerProps {
  eventId: number;
  teamsData: TeamData[];
  ageGroupsData: AgeGroup[];
}

export default function FlightManagerMinimal({ eventId, teamsData, ageGroupsData }: FlightManagerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [newFlightName, setNewFlightName] = useState<string>('');
  const [isCreateFlightDialogOpen, setIsCreateFlightDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch flights for this event
  const { data: flights = [], isLoading: flightsLoading, error: flightsError } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'flights'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flights`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned HTML instead of JSON - authentication issue');
      }
      
      return response.json();
    },
    enabled: !!eventId,
    retry: false
  });

  // Early return conditions
  if (!teamsData || !ageGroupsData || teamsData.length === 0 || ageGroupsData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading flight management data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flightsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <h3 className="text-lg font-semibold mb-2">Error Loading Flights</h3>
            <p className="text-sm">{flightsError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process age group data
  const ageGroupSummary = ageGroupsData.map(ageGroup => {
    const teamsInGroup = teamsData.filter(teamData => teamData.team.ageGroupId === ageGroup.id);
    const approvedTeams = teamsInGroup.filter(teamData => teamData.team.status === 'approved');
    
    return {
      ageGroup: ageGroup.ageGroup,
      totalTeams: teamsInGroup.length,
      approvedTeams: approvedTeams.length,
      suggestedFlights: Math.ceil(approvedTeams.length / 8) || 1
    };
  });

  // Create flight mutation
  const createFlightMutation = useMutation({
    mutationFn: async (flightData: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create flight: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'flights'] });
      toast({ title: 'Flight created successfully' });
      setIsCreateFlightDialogOpen(false);
      setNewFlightName('');
    },
    onError: (error: any) => {
      toast({ title: 'Error creating flight', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreateFlight = () => {
    if (!newFlightName.trim() || !selectedAgeGroup) {
      toast({ title: 'Please enter flight name and select age group', variant: 'destructive' });
      return;
    }

    const selectedAgeGroupData = ageGroupsData.find(ag => ag.ageGroup === selectedAgeGroup);
    if (!selectedAgeGroupData) {
      toast({ title: 'Invalid age group selected', variant: 'destructive' });
      return;
    }

    createFlightMutation.mutate({
      name: newFlightName,
      ageGroupId: selectedAgeGroupData.id,
      level: 'top_flight',
      maxTeams: 8,
      eventId: eventId
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Flight Management</CardTitle>
          <p className="text-sm text-gray-600">
            Managing {teamsData.length} teams across {ageGroupsData.length} age groups
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="create">Create Flights</TabsTrigger>
              <TabsTrigger value="assign">Assign Teams</TabsTrigger>
              <TabsTrigger value="manage">Manage Flights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ageGroupSummary.map((group, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{group.ageGroup}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Teams:</span>
                          <Badge variant="outline">{group.totalTeams}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Approved:</span>
                          <Badge variant="default">{group.approvedTeams}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Suggested Flights:</span>
                          <Badge variant="secondary">{group.suggestedFlights}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Flight</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <select
                      id="ageGroup"
                      value={selectedAgeGroup}
                      onChange={(e) => setSelectedAgeGroup(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">Select Age Group</option>
                      {ageGroupsData.map((ageGroup) => (
                        <option key={ageGroup.id} value={ageGroup.ageGroup}>
                          {ageGroup.ageGroup}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="flightName">Flight Name</Label>
                    <Input
                      id="flightName"
                      value={newFlightName}
                      onChange={(e) => setNewFlightName(e.target.value)}
                      placeholder="e.g., U12 Boys Flight 1"
                    />
                  </div>
                  
                  <Button onClick={handleCreateFlight} disabled={createFlightMutation.isPending}>
                    {createFlightMutation.isPending ? 'Creating...' : 'Create Flight'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assign" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Team assignment functionality will be available once flights are created.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Existing Flights</CardTitle>
                </CardHeader>
                <CardContent>
                  {flights.length === 0 ? (
                    <p className="text-sm text-gray-600">No flights created yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {flights.map((flight: Flight) => (
                        <div key={flight.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <h4 className="font-medium">{flight.name}</h4>
                            <p className="text-sm text-gray-600">Max Teams: {flight.maxTeams}</p>
                          </div>
                          <Badge variant="outline">{flight.level}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
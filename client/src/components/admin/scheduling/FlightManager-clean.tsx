import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, Calendar, MapPin, Trophy, AlertCircle } from 'lucide-react';

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

interface AgeGroupSummary {
  ageGroup: string;
  totalTeams: number;
  approvedTeams: number;
  suggestedFlights: number;
}

interface FlightManagerProps {
  eventId: number;
  teamsData: TeamData[];
  ageGroupsData: AgeGroup[];
}

const FlightManager: React.FC<FlightManagerProps> = ({ eventId, teamsData, ageGroupsData }) => {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [selectedFlightLevel, setSelectedFlightLevel] = useState<string>('');
  const [newFlightName, setNewFlightName] = useState<string>('');
  const [maxTeamsPerFlight, setMaxTeamsPerFlight] = useState<number>(8);
  const [selectedTeamForAssignment, setSelectedTeamForAssignment] = useState<number | null>(null);
  const [selectedFlightForAssignment, setSelectedFlightForAssignment] = useState<number | null>(null);
  const [isCreateFlightDialogOpen, setIsCreateFlightDialogOpen] = useState(false);
  const [flightSuggestions, setFlightSuggestions] = useState<Record<string, any>>({});

  const queryClient = useQueryClient();

  // Debug: Log teams data structure (only once per mount)
  // console.log('FlightManager received teamsData count:', teamsData?.length);
  
  // Fetch flights for this event - MUST be declared before any early returns
  const { data: flights = [], isLoading: flightsLoading, error: flightsError } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'flights'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flights`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flights API error:', response.status, errorText);
        throw new Error(`Failed to fetch flights: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlContent = await response.text();
        console.error('Expected JSON but got HTML:', htmlContent.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON - possible authentication issue');
      }
      
      return response.json();
    },
    enabled: !!eventId,
    retry: false
  });

  // Early return if data is not ready
  if (!teamsData || !ageGroupsData || teamsData.length === 0 || ageGroupsData.length === 0) {
    console.log('FlightManager: Waiting for data to load...', { teamsCount: teamsData?.length, ageGroupsCount: ageGroupsData?.length });
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

  // Display error if flights fetch failed
  if (flightsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <h3 className="text-lg font-semibold mb-2">Error Loading Flights</h3>
            <p className="text-sm">{flightsError.message}</p>
            <p className="text-xs mt-2 text-gray-500">Check browser console for detailed error information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe data processing after guard - no hooks needed here
  const ageGroupIds = teamsData
    .map(teamObj => teamObj.team?.ageGroupId)
    .filter(Boolean);
  
  const uniqueAgeGroupIds = Array.from(new Set(ageGroupIds));
  
  // Map IDs to age group names
  const ageGroupsWithNames = uniqueAgeGroupIds
    .map(id => {
      const ageGroup = ageGroupsData.find((ag: any) => ag.id === id);
      return ageGroup ? { id, name: ageGroup.ageGroup } : null;
    })
    .filter(Boolean);
  
  const extractedAgeGroups = ageGroupsWithNames.map(ag => ag?.name);
  const uniqueAgeGroups = Array.from(new Set(extractedAgeGroups));

  // Group teams by age group for analysis - no useMemo to avoid hook errors
  const ageGroupSummary: AgeGroupSummary[] = teamsData.reduce((acc: AgeGroupSummary[], teamObj) => {
    const team = teamObj.team;
    if (!team) return acc;
    
    // Find age group name by ID
    const ageGroupData = ageGroupsData.find((ag: any) => ag.id === team.ageGroupId);
    const ageGroup = ageGroupData?.ageGroup || 'Unknown';
    
    const existing = acc.find(item => item.ageGroup === ageGroup);
    
    if (existing) {
      existing.totalTeams++;
      if (team.status === 'approved') {
        existing.approvedTeams++;
      }
    } else {
      acc.push({
        ageGroup,
        totalTeams: 1,
        approvedTeams: team.status === 'approved' ? 1 : 0,
        suggestedFlights: 0 // Will be calculated below
      });
    }
    
    return acc;
  }, []);

  // Calculate suggested flights based on team count
  useEffect(() => {
    if (!teamsData || !ageGroupsData || ageGroupSummary.length === 0) return;
    
    const calculateSuggestedFlights = (teamCount: number) => {
      if (teamCount <= 8) return 1;
      if (teamCount <= 16) return 2;
      if (teamCount <= 24) return 3;
      return Math.ceil(teamCount / 8);
    };
    
    const generateAutoFlightSuggestions = (summary: AgeGroupSummary[]) => {
      const suggestions: Record<string, any> = {};
      
      summary.forEach((group: any) => {
        const suggestedCount = calculateSuggestedFlights(group.approvedTeams);
        suggestions[group.ageGroup] = {
          totalTeams: group.totalTeams,
          approvedTeams: group.approvedTeams,
          suggestedFlights: suggestedCount,
          flightLevels: suggestedCount === 1 ? ['top_flight'] :
                       suggestedCount === 2 ? ['top_flight', 'bottom_flight'] :
                       suggestedCount === 3 ? ['top_flight', 'middle_flight', 'bottom_flight'] :
                       Array.from({length: suggestedCount}, (_, i) => `flight_${i + 1}`)
        };
      });
      
      setFlightSuggestions(suggestions);
    };
    
    const updatedSummary = ageGroupSummary.map((group: any) => ({
      ...group,
      suggestedFlights: calculateSuggestedFlights(group.approvedTeams)
    }));
    
    generateAutoFlightSuggestions(updatedSummary);
  }, [teamsData, ageGroupsData]);

  const getFlightLevelBadge = (level: string) => {
    const colors = {
      top_flight: 'bg-gold-500 text-white',
      middle_flight: 'bg-blue-500 text-white',
      bottom_flight: 'bg-green-500 text-white',
      other: 'bg-gray-500 text-white'
    };
    
    return colors[level as keyof typeof colors] || colors.other;
  };

  const createFlightMutation = useMutation({
    mutationFn: async (flightData: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create flight API error:', response.status, errorText);
        throw new Error(`Failed to create flight: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlContent = await response.text();
        console.error('Expected JSON but got HTML:', htmlContent.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON');
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
    if (!selectedAgeGroup || !selectedFlightLevel || !newFlightName) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    const ageGroup = ageGroupsData.find(ag => ag.ageGroup === selectedAgeGroup);
    if (!ageGroup) {
      toast({ title: 'Invalid age group selected', variant: 'destructive' });
      return;
    }

    createFlightMutation.mutate({
      name: newFlightName,
      ageGroupId: ageGroup.id,
      level: selectedFlightLevel,
      maxTeams: maxTeamsPerFlight,
      eventId
    });
  };

  const getTeamsForAgeGroup = (ageGroupName: string) => {
    return teamsData.filter(teamObj => {
      const ageGroup = ageGroupsData.find((ag: any) => ag.id === teamObj.team.ageGroupId);
      return ageGroup?.ageGroup === ageGroupName && teamObj.team.status === 'approved';
    });
  };

  const getUnassignedTeams = () => {
    return teamsData.filter(teamObj => 
      teamObj.team.status === 'approved' && !teamObj.team.flightId
    );
  };

  if (flightsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading flights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Flight Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="create">Create Flights</TabsTrigger>
              <TabsTrigger value="assign">Assign Teams</TabsTrigger>
              <TabsTrigger value="manage">Manage Flights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ageGroupSummary.map((group: any) => (
                  <Card key={group.ageGroup}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{group.ageGroup}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Teams:</span>
                          <Badge variant="outline">{group.totalTeams}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Approved:</span>
                          <Badge variant="default">{group.approvedTeams}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Suggested Flights:</span>
                          <Badge variant="secondary">{group.suggestedFlights}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Current Flights:</span>
                          <Badge variant="outline">
                            {flights.filter((f: Flight) => {
                              const ageGroup = ageGroupsData.find((ag: any) => ag.ageGroup === group.ageGroup);
                              return f.ageGroupId === ageGroup?.id;
                            }).length}
                          </Badge>
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="age-group">Age Group</Label>
                      <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueAgeGroups.map(ageGroup => (
                            <SelectItem key={ageGroup} value={ageGroup || ''}>
                              {ageGroup}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flight-level">Flight Level</Label>
                      <Select value={selectedFlightLevel} onValueChange={setSelectedFlightLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select flight level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top_flight">Top Flight</SelectItem>
                          <SelectItem value="middle_flight">Middle Flight</SelectItem>
                          <SelectItem value="bottom_flight">Bottom Flight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flight-name">Flight Name</Label>
                      <Input
                        id="flight-name"
                        placeholder="Enter flight name"
                        value={newFlightName}
                        onChange={(e) => setNewFlightName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-teams">Max Teams</Label>
                      <Input
                        id="max-teams"
                        type="number"
                        min="4"
                        max="16"
                        value={maxTeamsPerFlight}
                        onChange={(e) => setMaxTeamsPerFlight(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateFlight}
                    disabled={createFlightMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Flight
                  </Button>
                </CardContent>
              </Card>

              {/* Flight Suggestions */}
              {selectedAgeGroup && flightSuggestions[selectedAgeGroup] && (
                <Card>
                  <CardHeader>
                    <CardTitle>Suggestions for {selectedAgeGroup}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Recommended Flight Structure</AlertTitle>
                      <AlertDescription>
                        Based on {flightSuggestions[selectedAgeGroup].approvedTeams} approved teams, 
                        we suggest creating {flightSuggestions[selectedAgeGroup].suggestedFlights} flights.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="assign" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Unassigned Teams</Label>
                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                          {getUnassignedTeams().length === 0 ? (
                            <p className="text-sm text-muted-foreground">All teams assigned</p>
                          ) : (
                            getUnassignedTeams().map(teamObj => (
                              <div 
                                key={teamObj.team.id}
                                className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                  selectedTeamForAssignment === teamObj.team.id ? 'bg-blue-50 border border-blue-200' : ''
                                }`}
                                onClick={() => setSelectedTeamForAssignment(teamObj.team.id)}
                              >
                                <div className="font-medium">{teamObj.team.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {ageGroupsData.find((ag: any) => ag.id === teamObj.team.ageGroupId)?.ageGroup}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Available Flights</Label>
                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                          {flights.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No flights created yet</p>
                          ) : (
                            flights.map((flight: Flight) => (
                              <div 
                                key={flight.id}
                                className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                  selectedFlightForAssignment === flight.id ? 'bg-blue-50 border border-blue-200' : ''
                                }`}
                                onClick={() => setSelectedFlightForAssignment(flight.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{flight.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {ageGroupsData.find((ag: any) => ag.id === flight.ageGroupId)?.ageGroup}
                                    </div>
                                  </div>
                                  <Badge className={getFlightLevelBadge(flight.level)}>
                                    {flight.level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {flight.teams?.length || 0} / {flight.maxTeams} teams
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      disabled={!selectedTeamForAssignment || !selectedFlightForAssignment}
                      className="w-full"
                    >
                      Assign Team to Flight
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Flights</CardTitle>
                </CardHeader>
                <CardContent>
                  {flights.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No flights created yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Use the "Create Flights" tab to get started
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {flights.map((flight: Flight) => (
                        <Card key={flight.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              {flight.name}
                              <Badge className={getFlightLevelBadge(flight.level)}>
                                {flight.level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Age Group: </span>
                                {ageGroupsData.find((ag: any) => ag.id === flight.ageGroupId)?.ageGroup}
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Teams: </span>
                                {flight.teams?.length || 0} / {flight.maxTeams}
                              </div>
                              <div className="pt-2">
                                <Button variant="outline" size="sm" className="w-full">
                                  Manage Teams
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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
};

export default FlightManager;
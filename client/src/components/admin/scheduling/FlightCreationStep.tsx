import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Users, Trophy, Plus, Trash2, Edit, Info } from 'lucide-react';

interface FlightCreationStepProps {
  eventId: string;
  onComplete: (data: any) => void;
}

interface Team {
  id: number;
  name: string;
  ageGroup: string;
  gender: string;
  status: string;
}

interface Flight {
  id: string;
  name: string;
  ageGroupId: number;
  gender: string;
  maxTeams: number;
  teams: Team[];
}

interface AgeGroup {
  id: number;
  ageGroup: string;
  birthYear?: number;
  gender: string;
  fieldSize: string;
  projectedTeams: number;
}

export function FlightCreationStep({ eventId, onComplete }: FlightCreationStepProps) {
  const [newFlightName, setNewFlightName] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [maxTeamsPerFlight, setMaxTeamsPerFlight] = useState(8);
  const queryClient = useQueryClient();

  // Fetch age groups for this event
  const { data: ageGroups, isLoading: ageGroupsLoading } = useQuery({
    queryKey: ['age-groups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/age-groups/${eventId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    }
  });

  // Fetch approved teams for this event
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['approved-teams', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/teams?eventId=${eventId}&status=approved`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    }
  });

  // Fetch existing flights
  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ['flights', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flights`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch flights');
      return response.json();
    }
  });

  // Create flight mutation
  const createFlightMutation = useMutation({
    mutationFn: async (flightData: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(flightData)
      });
      if (!response.ok) throw new Error('Failed to create flight');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights', eventId] });
      setNewFlightName('');
      setSelectedAgeGroup('');
      toast({ title: 'Flight created successfully' });
    }
  });

  // Auto-generate flights mutation
  const autoGenerateFlightsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flights/auto-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ maxTeamsPerFlight })
      });
      if (!response.ok) throw new Error('Failed to auto-generate flights');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flights', eventId] });
      toast({ 
        title: 'Flights generated successfully',
        description: `Created ${data.flightsCreated} flights across ${data.ageGroupsProcessed} age groups`
      });
    }
  });

  const handleCreateFlight = () => {
    if (!newFlightName || !selectedAgeGroup) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    const ageGroup = ageGroups?.find((ag: AgeGroup) => ag.id.toString() === selectedAgeGroup);
    if (!ageGroup) return;

    createFlightMutation.mutate({
      name: newFlightName,
      ageGroupId: ageGroup.id,
      gender: ageGroup.gender,
      maxTeams: maxTeamsPerFlight
    });
  };

  const handleAutoGenerate = () => {
    autoGenerateFlightsMutation.mutate();
  };

  const handleComplete = () => {
    if (!flights || flights.length === 0) {
      toast({ 
        title: 'No flights created',
        description: 'Please create flights before proceeding to the next step',
        variant: 'destructive'
      });
      return;
    }

    onComplete({
      flights: flights,
      totalFlights: flights.length,
      ageGroupsCovered: [...new Set(flights.map((f: Flight) => f.ageGroupId))].length
    });
  };

  const getTeamsByAgeGroupAndGender = (ageGroupId: number, gender: string) => {
    if (!teams) return [];
    return teams.filter((team: Team) => 
      team.ageGroup === ageGroups?.find((ag: AgeGroup) => ag.id === ageGroupId)?.ageGroup &&
      team.gender === gender
    );
  };

  if (ageGroupsLoading || teamsLoading || flightsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading flight creation interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            <span>Step 3: Flight Creation & Organization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Organize teams into competitive flights based on age groups and gender. Each flight should contain teams of similar skill levels for balanced competition.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teams?.length || 0}</div>
              <div className="text-sm text-gray-500">Approved Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{flights?.length || 0}</div>
              <div className="text-sm text-gray-500">Flights Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {ageGroups ? [...new Set(ageGroups.map((ag: AgeGroup) => `${ag.ageGroup}-${ag.gender}`))].length : 0}
              </div>
              <div className="text-sm text-gray-500">Age Group Divisions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Generation Option */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Automatic Flight Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Automatically create flights for all age groups based on registered teams.
            </p>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="maxTeams">Max Teams per Flight:</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  value={maxTeamsPerFlight}
                  onChange={(e) => setMaxTeamsPerFlight(parseInt(e.target.value) || 8)}
                  className="w-20"
                  min={4}
                  max={16}
                />
              </div>
              
              <Button 
                onClick={handleAutoGenerate}
                disabled={autoGenerateFlightsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {autoGenerateFlightsMutation.isPending ? 'Generating...' : 'Auto-Generate Flights'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Flight Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manual Flight Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="flightName">Flight Name</Label>
              <Input
                id="flightName"
                value={newFlightName}
                onChange={(e) => setNewFlightName(e.target.value)}
                placeholder="e.g., U12 Boys Flight A"
              />
            </div>
            
            <div>
              <Label htmlFor="ageGroup">Age Group & Gender</Label>
              <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age group..." />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups?.map((ageGroup: AgeGroup) => (
                    <SelectItem key={ageGroup.id} value={ageGroup.id.toString()}>
                      {ageGroup.ageGroup} {ageGroup.gender} ({ageGroup.fieldSize})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleCreateFlight}
                disabled={createFlightMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Flight
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Flights */}
      {flights && flights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Created Flights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flights.map((flight: Flight) => {
                const ageGroup = ageGroups?.find((ag: AgeGroup) => ag.id === flight.ageGroupId);
                const availableTeams = getTeamsByAgeGroupAndGender(flight.ageGroupId, flight.gender);
                
                return (
                  <Card key={flight.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{flight.name}</h4>
                          <Badge variant="outline">
                            {flight.teams?.length || 0}/{flight.maxTeams}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {ageGroup?.ageGroup} {flight.gender} • {ageGroup?.fieldSize}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {availableTeams.length} teams available for assignment
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Age Group Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Age Group Team Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ageGroups?.map((ageGroup: AgeGroup) => {
              const teamsInAgeGroup = getTeamsByAgeGroupAndGender(ageGroup.id, ageGroup.gender);
              const flightsForAgeGroup = flights?.filter((f: Flight) => 
                f.ageGroupId === ageGroup.id && f.gender === ageGroup.gender
              ) || [];
              
              return (
                <div key={`${ageGroup.id}-${ageGroup.gender}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">
                      {ageGroup.ageGroup} {ageGroup.gender} - [{ageGroup.birthYear}]
                    </Badge>
                    <span className="text-sm text-gray-600">{ageGroup.fieldSize}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-blue-600">{teamsInAgeGroup.length} teams</span>
                    <span className="text-green-600">{flightsForAgeGroup.length} flights</span>
                    {teamsInAgeGroup.length > 0 && flightsForAgeGroup.length === 0 && (
                      <Badge variant="destructive" className="text-xs">Needs flight</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Completion */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">Flight Creation Complete</h3>
              <p className="text-blue-700 text-sm">
                {flights?.length || 0} flights created. Ready to proceed to bracket generation.
              </p>
            </div>
            <Button 
              onClick={handleComplete}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue to Bracket Generation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
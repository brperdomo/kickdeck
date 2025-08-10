import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowRight, Shuffle, BarChart3, Move, Plus, AlertCircle, RotateCcw, Filter, Edit, UserPlus, UserMinus } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  status: string;
  groupId: number | null;
  seedRanking: number | null;
}

interface TournamentGroup {
  id: number;
  name: string;
  type: string;
  stage: string;
  teamCount: number;
  teams: Team[];
}

interface FlightBracketData {
  flightId: number;
  flightName: string;
  flightLevel: string;
  ageGroup: string;
  gender: string;
  birthYear: string;
  totalTeams: number;
  brackets: TournamentGroup[];
  unassignedTeams: Team[];
  isCompleted: boolean;
}

interface BracketAssignmentInterfaceProps {
  eventId: string;
}

export function BracketAssignmentInterface({ eventId }: BracketAssignmentInterfaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [teamAssignments, setTeamAssignments] = useState<{ [teamId: number]: number }>({});
  const [flightTypeFilter, setFlightTypeFilter] = useState<string>('all');
  const [editingBracket, setEditingBracket] = useState<number | null>(null);
  const [placeholderName, setPlaceholderName] = useState<string>('');

  // Fetch bracket assignment data
  const { data: bracketData, isLoading } = useQuery({
    queryKey: ['bracket-assignments', eventId],
    queryFn: async (): Promise<FlightBracketData[]> => {
      const response = await fetch(`/api/admin/events/${eventId}/bracket-assignments`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch bracket assignment data');
      return response.json();
    }
  });

  // Assign teams to brackets mutation
  const assignTeamsMutation = useMutation({
    mutationFn: async ({ assignments }: { assignments: { teamId: number; groupId: number }[] }) => {
      const response = await fetch(`/api/admin/events/${eventId}/teams/bulk-bracket-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignments })
      });
      if (!response.ok) throw new Error('Failed to assign teams to brackets');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Teams Assigned",
        description: "Teams have been successfully assigned to brackets"
      });
      queryClient.invalidateQueries({ queryKey: ['bracket-assignments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['bracket-creation', eventId] });
      queryClient.invalidateQueries({ queryKey: ['flight-review', eventId] });
      setTeamAssignments({});
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create brackets mutation
  const createBracketsMutation = useMutation({
    mutationFn: async (flightId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights/${flightId}/create-brackets`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create brackets');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Brackets Created",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['bracket-assignments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['bracket-creation', eventId] });
      queryClient.invalidateQueries({ queryKey: ['flight-review', eventId] });
    }
  });

  // Auto-balance brackets mutation
  const autoBalanceMutation = useMutation({
    mutationFn: async (flightId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights/${flightId}/auto-balance`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to auto-balance brackets');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Brackets Balanced",
        description: "Teams have been automatically balanced across brackets"
      });
      queryClient.invalidateQueries({ queryKey: ['bracket-assignments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['bracket-creation', eventId] });
    }
  });

  const handleTeamAssignment = (teamId: number, groupId: number) => {
    setTeamAssignments(prev => ({
      ...prev,
      [teamId]: groupId
    }));
  };

  const handleBulkAssign = () => {
    const assignments = Object.entries(teamAssignments).map(([teamId, groupId]) => ({
      teamId: parseInt(teamId),
      groupId
    }));
    
    if (assignments.length === 0) {
      toast({
        title: "No Assignments",
        description: "Please select brackets for teams before assigning",
        variant: "destructive"
      });
      return;
    }

    assignTeamsMutation.mutate({ assignments });
  };

  // Add placeholder team mutation
  const addPlaceholderMutation = useMutation({
    mutationFn: async ({ bracketId, placeholderName }: { bracketId: number; placeholderName: string }) => {
      const response = await fetch(`/api/admin/events/${eventId}/brackets/${bracketId}/add-placeholder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ placeholderName: placeholderName || 'Placeholder Team' })
      });
      if (!response.ok) throw new Error('Failed to add placeholder team');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Placeholder Added",
        description: "Placeholder team added successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['bracket-assignments', eventId] });
      setPlaceholderName('');
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Placeholder",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Replace placeholder with real team mutation
  const replacePlaceholderMutation = useMutation({
    mutationFn: async ({ placeholderTeamId, realTeamId }: { placeholderTeamId: number; realTeamId: number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/teams/${placeholderTeamId}/replace-with/${realTeamId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to replace placeholder team');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Placeholder Replaced",
        description: "Placeholder team replaced successfully. All scheduled games transferred."
      });
      queryClient.invalidateQueries({ queryKey: ['bracket-assignments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Replace Placeholder",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Clear all team assignments mutation
  const clearAllAssignmentsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/clear-all-team-assignments`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to clear team assignments');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignments Cleared",
        description: "All team bracket assignments have been cleared successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['bracket-assignments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['bracket-creation', eventId] });
      setTeamAssignments({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear team assignments. Please try again.",
        variant: "destructive"
      });
    }
  });



  // Remove team from bracket mutation
  const removeTeamMutation = useMutation({
    mutationFn: async ({ teamId }: { teamId: number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/teams/${teamId}/remove-from-bracket`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to remove team from bracket');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team Removed",
        description: "Team removed from bracket"
      });
      queryClient.invalidateQueries({ queryKey: ['bracket-assignments', eventId] });
    }
  });

  const getFlightLevelBadge = (level: string) => {
    const colors = {
      elite: 'bg-amber-500 text-white',
      premier: 'bg-blue-500 text-white', 
      classic: 'bg-emerald-500 text-white'
    };
    
    return (
      <Badge className={colors[level.toLowerCase() as keyof typeof colors] || 'bg-slate-500 text-white'}>
        {level}
      </Badge>
    );
  };

  // Helper function to get flight type from name
  const getFlightType = (flightName: string): string => {
    if (flightName.toLowerCase().includes('elite')) return 'elite';
    if (flightName.toLowerCase().includes('premier')) return 'premier';
    if (flightName.toLowerCase().includes('classic')) return 'classic';
    return 'other';
  };

  // Filter and sort flights
  const filteredFlights = useMemo(() => {
    if (!bracketData) return [];
    
    let flights = bracketData;
    
    // Filter by flight type if not 'all'
    if (flightTypeFilter !== 'all') {
      flights = flights.filter(flight => 
        getFlightType(flight.flightName) === flightTypeFilter
      );
    }
    
    // Sort by birth year (oldest to youngest) then by gender (Boys first)
    flights = flights.sort((a, b) => {
      // First sort by birth year (descending - oldest first)
      const yearA = parseInt(a.birthYear) || 0;
      const yearB = parseInt(b.birthYear) || 0;
      if (yearA !== yearB) {
        return yearA - yearB; // Ascending order for birth years (2010 before 2015)
      }
      
      // Then sort by gender (Boys first)
      if (a.gender !== b.gender) {
        return a.gender === 'Boys' ? -1 : 1;
      }
      
      // Finally sort by flight level (Elite > Premier > Classic)
      const levelOrder = { elite: 1, premier: 2, classic: 3, other: 4 };
      const levelA = levelOrder[getFlightType(a.flightName) as keyof typeof levelOrder] || 4;
      const levelB = levelOrder[getFlightType(b.flightName) as keyof typeof levelOrder] || 4;
      return levelA - levelB;
    });
    
    return flights;
  }, [bracketData, flightTypeFilter]);

  const selectedFlightData = filteredFlights?.find(f => f.flightId === selectedFlight);

  if (isLoading) {
    return <div className="flex justify-center p-8 text-slate-300">Loading bracket assignment data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Bracket Assignment</h3>
          <p className="text-slate-300">
            Assign teams to specific brackets within flights for optimal competition balance
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => clearAllAssignmentsMutation.mutate()}
          disabled={clearAllAssignmentsMutation.isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear All Assignments
        </Button>
      </div>

      {/* Flight Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Flight to Manage
          </CardTitle>
          <CardDescription className="text-slate-300">
            Choose a flight to assign teams to its brackets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flight Type Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">Filter by type:</span>
            </div>
            <Select value={flightTypeFilter} onValueChange={setFlightTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Flight Types</SelectItem>
                <SelectItem value="elite">
                  <div className="flex items-center gap-2">
                    {getFlightLevelBadge('elite')}
                    <span>Nike Elite</span>
                  </div>
                </SelectItem>
                <SelectItem value="premier">
                  <div className="flex items-center gap-2">
                    {getFlightLevelBadge('premier')}
                    <span>Nike Premier</span>
                  </div>
                </SelectItem>
                <SelectItem value="classic">
                  <div className="flex items-center gap-2">
                    {getFlightLevelBadge('classic')}
                    <span>Nike Classic</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Flight Selection */}
          <Select value={selectedFlight?.toString() || ""} onValueChange={(value) => setSelectedFlight(parseInt(value))}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Select a flight..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600 max-h-96 overflow-y-auto">
              {/* Active Flights */}
              {filteredFlights && filteredFlights.filter(flight => !flight.isCompleted).length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-slate-300 bg-slate-600 sticky top-0">
                    Active Flights ({filteredFlights.filter(flight => !flight.isCompleted).length})
                  </div>
                  {filteredFlights.filter(flight => !flight.isCompleted).map((flight) => (
                    <SelectItem key={flight.flightId} value={flight.flightId.toString()}>
                      <div className="flex items-center gap-2">
                        {getFlightLevelBadge(flight.flightLevel)}
                        <span>U{new Date().getFullYear() - parseInt(flight.birthYear)} {flight.gender} ({flight.birthYear}) - {flight.flightName}</span>
                        <span className="text-slate-400">({flight.totalTeams} teams)</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Completed Flights */}
              {filteredFlights && filteredFlights.filter(flight => flight.isCompleted).length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-slate-300 bg-slate-600 sticky top-0">
                    Completed ({filteredFlights.filter(flight => flight.isCompleted).length})
                  </div>
                  {filteredFlights.filter(flight => flight.isCompleted).map((flight) => (
                    <SelectItem key={flight.flightId} value={flight.flightId.toString()}>
                      <div className="flex items-center gap-2">
                        {getFlightLevelBadge(flight.flightLevel)}
                        <span>U{new Date().getFullYear() - parseInt(flight.birthYear)} {flight.gender} ({flight.birthYear}) - {flight.flightName}</span>
                        <span className="text-slate-400">({flight.totalTeams} teams)</span>
                        <Badge variant="secondary" className="text-xs">Completed</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}

              {/* No flights message */}
              {filteredFlights && filteredFlights.length === 0 && (
                <div className="px-2 py-4 text-center text-slate-400 text-sm">
                  No flights found for selected type
                </div>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Selected Flight Bracket Management */}
      {selectedFlightData && (
        <div className="space-y-4">
          {/* Flight Overview */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-white">
                    U{new Date().getFullYear() - parseInt(selectedFlightData.birthYear)} {selectedFlightData.gender} ({selectedFlightData.birthYear}) - {selectedFlightData.flightName}
                  </CardTitle>
                  {getFlightLevelBadge(selectedFlightData.flightLevel)}
                  {selectedFlightData.isCompleted && (
                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedFlightData.brackets.length === 0 ? (
                    <Button
                      onClick={() => createBracketsMutation.mutate(selectedFlightData.flightId)}
                      disabled={createBracketsMutation.isPending}
                      className="bg-green-600 hover:bg-green-500 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Brackets
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => autoBalanceMutation.mutate(selectedFlightData.flightId)}
                        disabled={autoBalanceMutation.isPending}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Auto-Balance
                      </Button>
                      <Button 
                        onClick={handleBulkAssign}
                        disabled={Object.keys(teamAssignments).length === 0 || assignTeamsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        <Move className="h-4 w-4 mr-2" />
                        Assign Teams ({Object.keys(teamAssignments).length})
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardDescription className="text-slate-300">
                Total Teams: {selectedFlightData.totalTeams} | 
                Brackets: {selectedFlightData.brackets.length} | 
                Unassigned: {selectedFlightData.unassignedTeams.length}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Show message when no brackets exist */}
          {selectedFlightData.brackets.length === 0 && (
            <Card className="bg-slate-800 border-amber-500 border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-amber-400">
                  <AlertCircle className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">No Brackets Created</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      This flight has {selectedFlightData.totalTeams} teams but no brackets yet. 
                      Click "Create Brackets" to automatically generate the appropriate bracket structure.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bracket Assignment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Existing Brackets */}
            {selectedFlightData.brackets.map((bracket) => (
              <Card key={bracket.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {bracket.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-slate-300 border-slate-600">
                        {bracket.teams.length} teams
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBracket(editingBracket === bracket.id ? null : bracket.id)}
                        className="border-slate-600 text-slate-200 hover:bg-slate-600"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {editingBracket === bracket.id ? 'Done' : 'Edit'}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {bracket.type} - {bracket.stage}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bracket.teams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                        <div className="flex items-center gap-2">
                          <span className={`text-slate-200 ${team.name.includes('Placeholder') ? 'italic text-slate-400' : ''}`}>
                            {team.name}
                          </span>
                          {team.name.includes('Placeholder') && (
                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400">
                              Placeholder
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {team.seedRanking && (
                            <Badge variant="secondary" className="text-xs">
                              Seed #{team.seedRanking}
                            </Badge>
                          )}
                          {team.name.includes('Placeholder') && selectedFlightData.unassignedTeams.length > 0 && (
                            <Select onValueChange={(value) => replacePlaceholderMutation.mutate({ placeholderTeamId: team.id, realTeamId: parseInt(value) })}>
                              <SelectTrigger className="w-8 h-6 p-0 border-none bg-blue-600 hover:bg-blue-700">
                                <ArrowRight className="h-3 w-3 text-white" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                {selectedFlightData.unassignedTeams.map((unassignedTeam) => (
                                  <SelectItem key={unassignedTeam.id} value={unassignedTeam.id.toString()}>
                                    Replace with {unassignedTeam.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {editingBracket === bracket.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTeamMutation.mutate({ teamId: team.id })}
                              className="h-6 w-6 p-0 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Placeholder Section */}
                    {bracket.teams.length < bracket.teamCount && (
                      <div className="border-t border-slate-600 pt-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPlaceholderMutation.mutate({ 
                            bracketId: bracket.id, 
                            placeholderName: `Placeholder ${bracket.name}` 
                          })}
                          disabled={addPlaceholderMutation.isPending}
                          className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-300"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Placeholder Team
                        </Button>
                      </div>
                    )}
                    {editingBracket === bracket.id && (
                      <div className="mt-4 p-3 border border-slate-600 rounded bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <UserPlus className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Add Placeholder Team</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Enter placeholder name (e.g., 'TBD Team A')"
                            value={placeholderName}
                            onChange={(e) => setPlaceholderName(e.target.value)}
                            className="flex-1 bg-slate-700 border-slate-600 text-white"
                          />
                          <Button
                            size="sm"
                            onClick={() => addPlaceholderMutation.mutate({ 
                              bracketId: bracket.id, 
                              placeholderName: placeholderName.trim() 
                            })}
                            disabled={!placeholderName.trim() || addPlaceholderMutation.isPending}
                            className="bg-green-600 hover:bg-green-500 text-white"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Unassigned Teams */}
            {selectedFlightData.unassignedTeams.length > 0 && (
              <Card className="bg-slate-800 border-slate-700 border-amber-500/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-amber-400" />
                      Unassigned Teams
                    </div>
                    <Badge variant="outline" className="text-amber-400 border-amber-400">
                      {selectedFlightData.unassignedTeams.length} teams
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Assign these teams to brackets within this flight
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedFlightData.unassignedTeams.map((team) => (
                      <div key={team.id} className="flex items-center gap-3 p-2 bg-slate-700 rounded">
                        <span className="text-slate-200 flex-1">{team.name}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <Select 
                          value={teamAssignments[team.id]?.toString() || ""} 
                          onValueChange={(value) => handleTeamAssignment(team.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-40 bg-slate-600 border-slate-500 text-white">
                            <SelectValue placeholder="Select bracket..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {selectedFlightData.brackets.map((bracket) => (
                              <SelectItem key={bracket.id} value={bracket.id.toString()}>
                                {bracket.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bracketData?.map((flight) => (
          <Card 
            key={flight.flightId} 
            className={`bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600 ${
              selectedFlight === flight.flightId ? 'border-blue-500' : ''
            }`}
            onClick={() => setSelectedFlight(flight.flightId)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-200">
                  {flight.ageGroup} {flight.gender}
                </div>
                {getFlightLevelBadge(flight.flightLevel)}
              </div>
              <div className="text-lg font-bold text-white">{flight.totalTeams}</div>
              <div className="text-xs text-slate-300">
                Total Teams • {flight.brackets.length} Brackets
              </div>
              {flight.unassignedTeams.length > 0 && (
                <div className="text-xs text-amber-400 mt-1">
                  {flight.unassignedTeams.length} unassigned
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
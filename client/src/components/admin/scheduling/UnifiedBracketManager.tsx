import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, Users, Target, Shuffle, CheckCircle, AlertTriangle,
  Settings, Play, Eye, Move, ArrowRight, Plus, Minus,
  Star, Split, ArrowLeftRight, UserPlus, UserMinus, Filter
} from 'lucide-react';

interface Team {
  id: number;
  name: string;
  clubName: string;
  status: string;
  flightId?: number;
  groupId?: number | null;
  seed?: number;
  ageGroupId?: number;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
}

interface Flight {
  id: number;
  flightId: number;
  name: string;
  level: string;
  ageGroup: string;
  gender: string;
  birthYear?: number;
  teamCount: number;
  assignedTeams: number;
  unassignedTeams: number;
  registeredTeams: Team[];
  maxTeams?: number;
  bracketType?: string;
  estimatedGames?: number;
  isConfigured: boolean;
  ageGroupId?: number;
  brackets?: TournamentBracket[];
}

interface TournamentBracket {
  id: number;
  name: string;
  type: string;
  stage: string;
  teamCount: number;
  teams: Team[];
  parentBracketId?: number;
}

interface BracketConfiguration {
  bracketType: 'group_of_4' | 'group_of_6' | 'group_of_8';
  bracketCount: number;
  teamsPerBracket: number;
}

interface UnifiedBracketManagerProps {
  eventId: string;
}

export function UnifiedBracketManager({ eventId }: UnifiedBracketManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [selectedBracketConfig, setSelectedBracketConfig] = useState<BracketConfiguration | null>(null);
  const [teamAssignments, setTeamAssignments] = useState<{ [teamId: number]: number }>({});
  const [activeTab, setActiveTab] = useState('flight-selection');
  const [flightFilter, setFlightFilter] = useState('all');

  // Fetch flight data with bracket information
  const { data: bracketData, isLoading } = useQuery({
    queryKey: ['unified-bracket-manager', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/bracket-creation`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch flight data');
      const data = await response.json();
      return data;
    }
  });

  const flightData = bracketData?.flights || [];
  const stats = bracketData?.stats;

  // Filter flights based on selection
  const filteredFlights = useMemo(() => {
    if (!flightData) return [];
    
    switch (flightFilter) {
      case 'with-brackets':
        return flightData.filter((f: Flight) => f.brackets && f.brackets.length > 0);
      case 'without-brackets':
        return flightData.filter((f: Flight) => !f.brackets || f.brackets.length === 0);
      case 'nike-elite':
        return flightData.filter((f: Flight) => f.name === 'Nike Elite');
      case 'nike-premier': 
        return flightData.filter((f: Flight) => f.name === 'Nike Premier');
      case 'nike-classic':
        return flightData.filter((f: Flight) => f.name === 'Nike Classic');
      default:
        return flightData;
    }
  }, [flightData, flightFilter]);

  // Get bracket configurations based on team count
  const getBracketConfigurations = (teamCount: number): BracketConfiguration[] => {
    const configs: BracketConfiguration[] = [];
    
    // Group of 4 - Single bracket for 4 teams, multiple brackets for more
    if (teamCount >= 4) {
      const bracketCount = Math.ceil(teamCount / 4);
      configs.push({
        bracketType: 'group_of_4',
        bracketCount,
        teamsPerBracket: 4
      });
    }
    
    // Group of 6 - Exactly 2 brackets for 6-12 teams
    if (teamCount >= 6 && teamCount <= 12) {
      configs.push({
        bracketType: 'group_of_6',
        bracketCount: 2,
        teamsPerBracket: Math.ceil(teamCount / 2)
      });
    }
    
    // Group of 8 - Exactly 2 brackets for 8-16 teams
    if (teamCount >= 8 && teamCount <= 16) {
      configs.push({
        bracketType: 'group_of_8',
        bracketCount: 2,
        teamsPerBracket: Math.ceil(teamCount / 2)
      });
    }
    
    return configs;
  };

  // Create brackets mutation
  const createBracketsMutation = useMutation({
    mutationFn: async ({ flightId, bracketConfig }: { flightId: number, bracketConfig: BracketConfiguration }) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights/${flightId}/create-brackets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bracketType: bracketConfig.bracketType,
          bracketCount: bracketConfig.bracketCount,
          teamsPerBracket: bracketConfig.teamsPerBracket
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create brackets');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Brackets Created",
        description: `Successfully created ${selectedBracketConfig?.bracketCount} ${selectedBracketConfig?.bracketType.replace('_', ' ')} brackets`
      });
      queryClient.invalidateQueries({ queryKey: ['unified-bracket-manager', eventId] });
      setActiveTab('team-assignment');
    },
    onError: (error: any) => {
      let errorMessage = error.message;
      let errorTitle = "Failed to Create Brackets";
      
      // Handle specific error cases
      if (error.message.includes('already exist')) {
        errorTitle = "Brackets Already Exist";
        errorMessage = "This flight already has brackets created. Use the team assignment tab to manage existing brackets.";
      } else if (error.message.includes('No teams assigned')) {
        errorTitle = "No Teams Assigned";
        errorMessage = "Please assign teams to this flight before creating brackets.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
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
      queryClient.invalidateQueries({ queryKey: ['unified-bracket-manager', eventId] });
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

  const selectedFlightData = flightData?.find((f: Flight) => f.flightId === selectedFlight);
  const bracketConfigs = selectedFlightData ? getBracketConfigurations(selectedFlightData.teamCount) : [];

  const handleCreateBrackets = () => {
    if (!selectedFlight || !selectedBracketConfig) return;
    createBracketsMutation.mutate({ 
      flightId: selectedFlight, 
      bracketConfig: selectedBracketConfig 
    });
  };

  const handleAssignTeam = (teamId: number, bracketId: number) => {
    setTeamAssignments(prev => ({
      ...prev,
      [teamId]: bracketId
    }));
  };

  const handleSaveAssignments = () => {
    const assignments = Object.entries(teamAssignments).map(([teamId, groupId]) => ({
      teamId: parseInt(teamId),
      groupId
    }));
    
    if (assignments.length === 0) {
      toast({
        title: "No Changes",
        description: "No team assignments to save",
        variant: "default"
      });
      return;
    }
    
    assignTeamsMutation.mutate({ assignments });
  };

  const getBracketTypeDescription = (bracketType: string) => {
    switch (bracketType) {
      case 'group_of_4':
        return 'Round-robin format where each team plays every other team in their bracket once';
      case 'group_of_6':
        return 'Pool A vs Pool B format where teams only play against teams from the opposite pool';
      case 'group_of_8':
        return 'Pool A vs Pool B format where teams only play against teams from the opposite pool';
      default:
        return 'Standard tournament bracket';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading bracket management interface...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-600">
          <TabsTrigger 
            value="flight-selection" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Select Flight
          </TabsTrigger>
          <TabsTrigger 
            value="bracket-config" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            disabled={!selectedFlight}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Brackets
          </TabsTrigger>
          <TabsTrigger 
            value="team-assignment" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            disabled={!selectedFlightData?.brackets?.length}
          >
            <Users className="h-4 w-4 mr-2" />
            Assign Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flight-selection" className="space-y-4">
          <Card className="border-slate-600 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-400" />
                Select Flight for Bracket Management
              </CardTitle>
              <CardDescription className="text-slate-300">
                Choose a flight to create brackets and assign teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Label htmlFor="flight-filter" className="text-slate-300">Filter Flights:</Label>
                <Select value={flightFilter} onValueChange={setFlightFilter}>
                  <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Filter flights" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Flights</SelectItem>
                    <SelectItem value="with-brackets">With Brackets</SelectItem>
                    <SelectItem value="without-brackets">Without Brackets</SelectItem>
                    <SelectItem value="nike-elite">Nike Elite</SelectItem>
                    <SelectItem value="nike-premier">Nike Premier</SelectItem>
                    <SelectItem value="nike-classic">Nike Classic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {filteredFlights && filteredFlights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFlights.map((flight: Flight) => (
                    <Card 
                      key={flight.flightId}
                      className={`border transition-colors cursor-pointer ${
                        selectedFlight === flight.flightId
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        setSelectedFlight(flight.flightId);
                        if (flight.brackets?.length) {
                          setActiveTab('team-assignment');
                        } else {
                          setActiveTab('bracket-config');
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-white text-sm">
                                {flight.ageGroup} {flight.gender} {flight.birthYear ? `(${flight.birthYear})` : ''}
                              </h3>
                              <p className="text-xs text-slate-300">{flight.name}</p>
                            </div>
                            <Badge 
                              variant={flight.brackets?.length ? "default" : "outline"}
                              className="text-xs"
                            >
                              {flight.brackets?.length ? "Has Brackets" : "No Brackets"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-slate-400">
                              <span className="font-medium text-white">{flight.teamCount}</span> teams
                            </div>
                            <div className="text-slate-400">
                              {flight.brackets?.length || 0} brackets
                            </div>
                          </div>

                          {flight.brackets && flight.brackets.length > 0 && (
                            <div className="pt-2 border-t border-slate-600">
                              <div className="text-xs text-slate-300 space-y-1">
                                <div className="font-medium text-green-400 mb-1">Existing Brackets:</div>
                                {flight.brackets.map((bracket: TournamentBracket, idx: number) => (
                                  <div key={bracket.id} className="flex justify-between items-center">
                                    <span>{bracket.name}</span>
                                    <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                                      {bracket.teamCount} teams
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert className="border-slate-600 bg-slate-700">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-slate-200">
                    No flights available for bracket management. Ensure flights are configured with teams assigned.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bracket-config" className="space-y-4">
          {selectedFlightData && (
            <Card className="border-slate-600 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Configure Brackets for {selectedFlightData.ageGroup} {selectedFlightData.gender}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Select bracket type and configuration for {selectedFlightData.teamCount} teams
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {bracketConfigs.length > 0 ? (
                  <div className="space-y-4">
                    <Label className="text-white text-sm font-medium">
                      Choose Bracket Configuration:
                    </Label>
                    
                    <div className="grid gap-4">
                      {bracketConfigs.map((config) => (
                        <Card 
                          key={config.bracketType}
                          className={`border transition-colors cursor-pointer ${
                            selectedBracketConfig?.bracketType === config.bracketType
                              ? 'border-blue-500 bg-blue-900/20' 
                              : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                          }`}
                          onClick={() => setSelectedBracketConfig(config)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-white">
                                    {config.bracketType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Format
                                  </h3>
                                  <p className="text-sm text-slate-300 mt-1">
                                    {getBracketTypeDescription(config.bracketType)}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {config.bracketCount} bracket{config.bracketCount > 1 ? 's' : ''}
                                </Badge>
                              </div>
                              
                              <div className="text-xs text-slate-400 space-y-1">
                                <div>• {config.bracketCount} bracket{config.bracketCount > 1 ? 's' : ''} with ~{config.teamsPerBracket} teams each</div>
                                {config.bracketType === 'group_of_4' && (
                                  <div>• Each team plays {config.teamsPerBracket - 1} games (round-robin)</div>
                                )}
                                {(config.bracketType === 'group_of_6' || config.bracketType === 'group_of_8') && (
                                  <div>• Teams only play against the opposite pool (crossplay format)</div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-600">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('flight-selection')}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        Back to Flight Selection
                      </Button>
                      {selectedFlightData.brackets && selectedFlightData.brackets.length > 0 ? (
                        <Button
                          onClick={() => setActiveTab('team-assignment')}
                          className="bg-green-600 hover:bg-green-500 text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Team Assignments
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCreateBrackets}
                          disabled={!selectedBracketConfig || createBracketsMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          {createBracketsMutation.isPending ? 'Creating...' : 'Create Brackets'}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : selectedFlightData.brackets && selectedFlightData.brackets.length > 0 ? (
                  <Alert className="border-green-600 bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-slate-200">
                      Brackets are already created for this flight. Use the "Team Assignment" tab to manage team assignments.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-slate-600 bg-slate-700">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-slate-200">
                      This flight has {selectedFlightData.assignedTeams} teams, which doesn't fit standard bracket configurations. 
                      Consider adding or removing teams to reach 4, 6, 8, or more teams.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team-assignment" className="space-y-4">
          {selectedFlightData?.brackets && selectedFlightData.brackets.length > 0 ? (
            <Card className="border-slate-600 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Assign Teams to Brackets
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Assign teams to specific brackets for fair competition pairing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedFlightData.brackets.map((bracket: TournamentBracket, idx: number) => (
                    <Card key={bracket.id} className="border-slate-600 bg-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white flex items-center justify-between">
                          <span>{bracket.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {bracket.teams.length} teams
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {bracket.teams.length > 0 ? (
                            bracket.teams.map((team: Team) => (
                              <div key={team.id} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                                <div>
                                  <div className="text-sm font-medium text-white">{team.name}</div>
                                  <div className="text-xs text-slate-300">{team.clubName}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAssignTeam(team.id, 0)} // Unassign
                                  className="border-slate-500 text-slate-300 hover:bg-slate-500"
                                >
                                  <UserMinus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-slate-400 text-sm">
                              No teams assigned
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Unassigned Teams */}
                {selectedFlightData.registeredTeams.filter((t: Team) => !t.groupId).length > 0 && (
                  <Card className="border-slate-600 bg-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        Unassigned Teams
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedFlightData.registeredTeams
                          .filter((team: Team) => !team.groupId)
                          .map((team: Team) => (
                          <div key={team.id} className="flex items-center justify-between p-3 bg-slate-600 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">{team.name}</div>
                              <div className="text-xs text-slate-300">{team.clubName}</div>
                            </div>
                            <div className="flex gap-2">
                              {selectedFlightData.brackets?.map((bracket: TournamentBracket) => (
                                <Button
                                  key={bracket.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAssignTeam(team.id, bracket.id)}
                                  className="border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white text-xs"
                                >
                                  {bracket.name.replace('Bracket ', '')}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-600">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('bracket-config')}
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    Back to Configuration
                  </Button>
                  <Button
                    onClick={handleSaveAssignments}
                    disabled={Object.keys(teamAssignments).length === 0 || assignTeamsMutation.isPending}
                    className="bg-green-600 hover:bg-green-500 text-white"
                  >
                    {assignTeamsMutation.isPending ? 'Saving...' : 'Save Team Assignments'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  Target, 
  Shuffle, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Play,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Flight {
  flightId: number;
  name: string;
  level: string;
  ageGroup: string;
  gender: string;
  teamCount: number;
  registeredTeams: Team[];
  maxTeams?: number;
}

interface Team {
  id: number;
  name: string;
  clubName: string;
  status: string;
  flightId?: number;
}

interface BracketStats {
  totalFlights: number;
  assignedFlights: number;
  unassignedTeams: number;
  totalTeams: number;
  readyForScheduling: boolean;
}

interface BracketCreationEngineProps {
  eventId: string;
}

export default function BracketCreationEngine({ eventId }: BracketCreationEngineProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bracket data
  const { data: bracketData, isLoading } = useQuery({
    queryKey: ['bracket-creation', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/bracket-creation`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch bracket data');
      return response.json();
    }
  });

  // Auto-assign teams mutation
  const autoAssignMutation = useMutation({
    mutationFn: async (config: { method: 'balanced' | 'skill' | 'geographic' }) => {
      const response = await fetch(`/api/admin/events/${eventId}/bracket-creation/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auto assign error:', errorText);
        throw new Error('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bracket-creation', eventId] });
      toast({
        title: "Teams Auto-Assigned",
        description: "Teams have been automatically distributed across flights."
      });
    },
    onError: (error) => {
      toast({
        title: "Auto-Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Lock brackets mutation
  const lockBracketsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/bracket-creation/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lock brackets error:', errorText);
        throw new Error('Failed to lock brackets');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bracket-creation', eventId] });
      toast({
        title: "Brackets Locked & Created",
        description: "All brackets are now locked and ready for scheduling."
      });
    },
    onError: (error) => {
      toast({
        title: "Lock Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bracket creation data...</p>
        </div>
      </div>
    );
  }

  const stats: BracketStats = bracketData?.stats || {
    totalFlights: 0,
    assignedFlights: 0,
    unassignedTeams: 0,
    totalTeams: 0,
    readyForScheduling: false
  };

  const flights: Flight[] = bracketData?.flights || [];
  const completionPercentage = stats.totalFlights > 0 ? 
    Math.round((stats.assignedFlights / stats.totalFlights) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Bracket Creation Engine</h2>
          <p className="text-slate-300">
            Assign teams to flights and create tournament brackets
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => autoAssignMutation.mutate({ method: 'balanced' })}
            disabled={autoAssignMutation.isPending}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Auto-Assign Teams
          </Button>
          <Button 
            onClick={() => lockBracketsMutation.mutate()}
            disabled={!stats.readyForScheduling || lockBracketsMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Lock Brackets & Create Games
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalFlights}</p>
                <p className="text-sm text-slate-300">Total Flights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.assignedFlights}</p>
                <p className="text-sm text-slate-300">Assigned Flights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
                <p className="text-sm text-slate-300">Total Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.unassignedTeams || 0}</p>
                <p className="text-sm text-slate-300">Unassigned Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="border-slate-600 bg-slate-800">
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-200">
              <span>Bracket Creation Progress</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
            {stats.readyForScheduling ? (
              <Alert className="mt-4 border-green-600 bg-green-800/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  All teams assigned! Ready to lock brackets and proceed to scheduling.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mt-4 border-orange-600 bg-orange-800/20">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-200">
                  {stats.unassignedTeams} teams still need flight assignments.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-600">
          <TabsTrigger 
            value="overview"
            className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="assign"
            className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Team Assignment
          </TabsTrigger>
          <TabsTrigger 
            value="preview"
            className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Bracket Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {flights.slice(0, 12).map((flight) => (
              <Card key={flight.id} className="border-slate-600 bg-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-white">
                        {flight.level} - {flight.name}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {flight.assignedTeams} teams assigned
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={flight.assignedTeams > 0 ? "default" : "secondary"}
                        className={flight.assignedTeams > 0 ? "bg-blue-600 text-white" : "bg-slate-600 text-slate-200"}
                      >
                        {flight.assignedTeams} teams
                      </Badge>
                      {flight.bracketType && (
                        <Badge variant="outline" className="border-green-500 text-green-300">
                          {flight.bracketType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {flight.estimatedGames && (
                      <p className="text-sm text-slate-300">
                        ~{flight.estimatedGames} games
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {flights.length > 12 && (
              <Card className="border-slate-600 bg-slate-800 p-4">
                <div className="text-center text-slate-300">
                  <p>... and {flights.length - 12} more flights</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Note: This event has {flights.length} total brackets, which may indicate duplicate data
                  </p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assign" className="space-y-4">
          {/* Auto-Assignment Controls */}
          <Card className="border-slate-600 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Auto-Assignment</CardTitle>
              <CardDescription className="text-slate-300">
                Automatically distribute teams across flights using intelligent algorithms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => autoAssignMutation.mutate({ method: 'balanced' })}
                  disabled={autoAssignMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 h-auto py-4"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Shuffle className="h-4 w-4" />
                      <span className="font-semibold">Balanced</span>
                    </div>
                    <div className="text-xs text-blue-200">
                      Equal team distribution across flights
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => autoAssignMutation.mutate({ method: 'skill' })}
                  disabled={autoAssignMutation.isPending}
                  variant="outline"
                  className="border-slate-600 bg-slate-700 hover:bg-slate-600 h-auto py-4"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4" />
                      <span className="font-semibold">Skill-Based</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Group teams by competitive level
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => autoAssignMutation.mutate({ method: 'geographic' })}
                  disabled={autoAssignMutation.isPending}
                  variant="outline"
                  className="border-slate-600 bg-slate-700 hover:bg-slate-600 h-auto py-4"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">Geographic</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Minimize travel conflicts
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Flight Assignment Overview */}
          <div className="grid gap-4">
            {bracketData?.flights?.map((flight: Flight) => (
              <Card key={flight.flightId} className="border-slate-600 bg-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">
                        {flight.ageGroup} {flight.gender} - {flight.name}
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        {flight.registeredTeams?.length || 0} / {flight.maxTeams || 'unlimited'} teams assigned
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={flight.registeredTeams?.length > 0 ? "default" : "secondary"}
                      className={flight.registeredTeams?.length > 0 ? "bg-green-600 text-white" : "bg-slate-600 text-slate-200"}
                    >
                      {flight.teamCount} teams
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {flight.registeredTeams?.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {flight.registeredTeams.map((team: Team) => (
                          <div 
                            key={team.id}
                            className="flex items-center justify-between p-2 bg-slate-700 rounded border border-slate-600"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">{team.name}</div>
                              {team.clubName && (
                                <div className="text-xs text-slate-400">{team.clubName}</div>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${team.status === 'approved' ? 'border-green-500 text-green-300' : 'border-slate-500 text-slate-300'}`}
                            >
                              {team.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <Users className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                      <p className="text-sm">No teams assigned to this flight yet</p>
                      <p className="text-xs text-slate-500 mt-1">Use auto-assignment or manual assignment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) || (
              <Card className="border-slate-600 bg-slate-800">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">No flights available for team assignment</p>
                  <p className="text-sm text-slate-400">
                    Please ensure game formats are configured and locked before proceeding with team assignments.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="border-slate-600 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Bracket Preview</CardTitle>
              <CardDescription className="text-slate-300">
                Preview tournament brackets before finalizing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300">
                  Bracket preview will be displayed here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Features: Visual brackets, matchup previews, export options
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
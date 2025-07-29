import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserCheck, Clock, MapPin, Calendar, AlertTriangle, 
  Plus, Edit, Trash2, CheckCircle, RefreshCw, Users, Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RefereeAssignmentEngineProps {
  eventId: string;
  scheduleData: any;
  onComplete?: (assignments: any) => void;
}

interface Referee {
  id: string;
  name: string;
  email: string;
  phone: string;
  certificationLevel: 'youth' | 'adult' | 'regional' | 'national';
  ageGroupPreferences: string[];
  timeAvailability: {
    [date: string]: {
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    };
  };
  maxGamesPerDay: number;
  conflictTeams: string[]; // Teams they cannot referee due to conflicts
}

interface GameAssignment {
  gameId: string;
  refereeId: string | null;
  centerReferee?: string;
  assistantReferees?: string[];
  status: 'unassigned' | 'assigned' | 'conflict';
  conflictReasons?: string[];
}

interface AssignmentConflict {
  type: 'availability' | 'overlap' | 'team_conflict' | 'certification' | 'workload';
  gameId: string;
  refereeId: string;
  message: string;
  severity: 'warning' | 'error';
}

export function RefereeAssignmentEngine({ eventId, scheduleData, onComplete }: RefereeAssignmentEngineProps) {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [assignments, setAssignments] = useState<GameAssignment[]>([]);
  const [conflicts, setConflicts] = useState<AssignmentConflict[]>([]);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [showAddReferee, setShowAddReferee] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing referees
  const { data: refereeData, isLoading } = useQuery({
    queryKey: ['referees', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/referees`);
      if (!response.ok) throw new Error('Failed to fetch referees');
      return response.json();
    }
  });

  // Save referee assignments
  const saveAssignmentsMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/referee-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });
      if (!response.ok) throw new Error('Failed to save assignments');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignments Saved",
        description: "Referee assignments have been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['referees', eventId] });
    }
  });

  // Initialize assignments from schedule data
  useEffect(() => {
    if (scheduleData?.games) {
      const initialAssignments: GameAssignment[] = scheduleData.games.map((game: any) => ({
        gameId: game.id,
        refereeId: game.refereeId || null,
        centerReferee: game.centerReferee,
        assistantReferees: game.assistantReferees || [],
        status: game.refereeId ? 'assigned' : 'unassigned'
      }));
      setAssignments(initialAssignments);
    }
  }, [scheduleData]);

  // Initialize referees from data
  useEffect(() => {
    if (refereeData?.referees) {
      setReferees(refereeData.referees);
    }
  }, [refereeData]);

  // Detect conflicts when assignments change - memoized to prevent infinite loops
  const detectConflicts = useCallback(() => {
    if (assignments.length > 0 && referees.length > 0) {
      const detectedConflicts = detectAssignmentConflicts();
      setConflicts(detectedConflicts);
    }
  }, [assignments, referees, scheduleData?.games]);

  useEffect(() => {
    detectConflicts();
  }, [detectConflicts]);

  const detectAssignmentConflicts = (): AssignmentConflict[] => {
    const conflicts: AssignmentConflict[] = [];
    const games = scheduleData?.games || [];
    
    // Check for conflicts in current assignments
    assignments.forEach(assignment => {
      if (!assignment.refereeId) return;
      
      const referee = referees.find(r => r.id === assignment.refereeId);
      const game = games.find((g: any) => g.id === assignment.gameId);
      
      if (!referee || !game) return;
      
      // Check availability conflicts
      const gameDate = new Date(game.startTime).toDateString();
      const availability = referee.timeAvailability[gameDate];
      
      if (!availability?.isAvailable) {
        conflicts.push({
          type: 'availability',
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          message: `${referee.name} is not available on ${gameDate}`,
          severity: 'error'
        });
      }
      
      // Check team conflicts
      const homeTeam = game.homeTeamName || game.homeTeamId;
      const awayTeam = game.awayTeamName || game.awayTeamId;
      
      if (referee.conflictTeams.includes(homeTeam) || referee.conflictTeams.includes(awayTeam)) {
        conflicts.push({
          type: 'team_conflict',
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          message: `${referee.name} has a conflict with one of the teams`,
          severity: 'error'
        });
      }
      
      // Check workload (games per day)
      const sameDay = assignments.filter((a: any) => 
        a.refereeId === assignment.refereeId && 
        games.find((g: any) => g.id === a.gameId && 
          new Date(g.startTime).toDateString() === gameDate
        )
      );
      
      if (sameDay.length > referee.maxGamesPerDay) {
        conflicts.push({
          type: 'workload',
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          message: `${referee.name} exceeds max games per day (${referee.maxGamesPerDay})`,
          severity: 'warning'
        });
      }
    });
    
    return conflicts;
  };

  const runAutoAssignment = async () => {
    setIsAutoAssigning(true);
    
    try {
      // Enhanced auto-assignment algorithm with conflict avoidance
      const games = scheduleData?.games || [];
      const newAssignments = [...assignments];
      
      // Sort games by priority (age group, time, field)
      const sortedGames = games.sort((a: any, b: any) => {
        // Prioritize youth games, then by start time
        const aTime = new Date(a.startTime).getTime();
        const bTime = new Date(b.startTime).getTime();
        return aTime - bTime;
      });
      
      // Assign referees to each game
      for (const game of sortedGames) {
        const existingAssignment = newAssignments.find(a => a.gameId === game.id);
        if (existingAssignment?.refereeId) continue; // Already assigned
        
        // Find best available referee
        const availableReferees = referees.filter(referee => {
          const gameDate = new Date(game.startTime).toDateString();
          const availability = referee.timeAvailability[gameDate];
          
          // Check basic availability
          if (!availability?.isAvailable) return false;
          
          // Check team conflicts
          const homeTeam = game.homeTeamName || game.homeTeamId;
          const awayTeam = game.awayTeamName || game.awayTeamId;
          if (referee.conflictTeams.includes(homeTeam) || referee.conflictTeams.includes(awayTeam)) {
            return false;
          }
          
          // Check workload for the day
          const sameDay = newAssignments.filter((a: any) => 
            a.refereeId === referee.id && 
            games.find((g: any) => g.id === a.gameId && 
              new Date(g.startTime).toDateString() === gameDate
            )
          );
          
          if (sameDay.length >= referee.maxGamesPerDay) return false;
          
          return true;
        });
        
        if (availableReferees.length > 0) {
          // Assign the first available referee (could be enhanced with scoring)
          const selectedReferee = availableReferees[0];
          const assignmentIndex = newAssignments.findIndex(a => a.gameId === game.id);
          if (assignmentIndex !== -1) {
            newAssignments[assignmentIndex].refereeId = selectedReferee.id;
            newAssignments[assignmentIndex].status = 'assigned';
          }
        }
      }
      
      setAssignments(newAssignments);
      toast({
        title: "Auto-Assignment Complete",
        description: `Assigned referees to available games successfully.`
      });
    } catch (error) {
      console.error('Auto-assignment error:', error);
      toast({
        title: "Assignment Failed",
        description: "There was an error during auto-assignment.",
        variant: "destructive"
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleSaveAssignments = () => {
    setAssignments((prev: any) => prev.map((assignment: any) => ({
      ...assignment,
      status: assignment.refereeId ? 'assigned' : 'unassigned'
    })));
  };

  const handleAddReferee = (newReferee: Referee) => {
    setReferees((prev: any) => [...prev, newReferee]);
    setShowAddReferee(false);
  };

  // Calculate statistics
  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a: any) => a.refereeId).length,
    conflicted: conflicts.filter((c: any) => c.severity === 'error').length
  };

  if (isLoading) {
    return <div>Loading referee data...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            Referee Assignment Engine
          </CardTitle>
          <p className="text-muted-foreground">
            Manage referee assignments with conflict detection and automated scheduling.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {stats.assigned}/{stats.total} Assigned
              </Badge>
              <Badge variant={stats.conflicted > 0 ? "destructive" : "secondary"}>
                {stats.conflicted} Conflicts
              </Badge>
              <Badge variant="outline">
                {referees.length} Referees
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddReferee(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Referee
              </Button>
              <Button 
                onClick={runAutoAssignment} 
                disabled={isAutoAssigning}
              >
                {isAutoAssigning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Target className="h-4 w-4 mr-2" />
                )}
                Auto-Assign Referees
              </Button>
            </div>
          </div>

          {/* Assignment Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.assigned}/{stats.total}
              </div>
              <div className="text-sm text-blue-600">Assigned Games</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats.conflicted}
              </div>
              <div className="text-sm text-red-600">Conflicts</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {referees.length}
              </div>
              <div className="text-sm text-green-600">Available Referees</div>
            </div>
          </div>

          {/* Conflicts Display */}
          {conflicts.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Assignment Conflicts Detected:</div>
                  {conflicts.slice(0, 3).map((conflict, index) => (
                    <div key={index} className="text-sm">
                      • {conflict.message}
                    </div>
                  ))}
                  {conflicts.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      +{conflicts.length - 3} more conflicts
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Assignment Grid */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {assignments.map((assignment, index) => {
              const game = scheduleData?.games?.find((g: any) => g.id === assignment.gameId);
              const referee = referees.find(r => r.id === assignment.refereeId);
              const gameConflicts = conflicts.filter(c => c.gameId === assignment.gameId);
              
              return (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {game?.homeTeamName || 'Team A'} vs {game?.awayTeamName || 'Team B'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {game?.startTime ? new Date(game.startTime).toLocaleString() : 'Time TBD'} 
                        • Field {game?.field || 'TBD'}
                      </div>
                    </div>
                    <Badge variant={assignment.refereeId ? 'default' : 'secondary'}>
                      {assignment.refereeId ? 'Assigned' : 'Unassigned'}
                    </Badge>
                  </div>
                  
                  {assignment.refereeId && referee && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span className="font-medium">{referee.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {referee.certificationLevel}
                        </Badge>
                      </div>
                      {gameConflicts.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {gameConflicts.length} conflict{gameConflicts.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Referee Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referee Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {referees.map(referee => {
              const assignedGames = assignments.filter((a: any) => a.refereeId === referee.id);
              const refereeConflicts = conflicts.filter(c => c.refereeId === referee.id);
              
              return (
                <div key={referee.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{referee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {referee.email} • {referee.certificationLevel}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {assignedGames.length} games
                      </Badge>
                      {refereeConflicts.length > 0 && (
                        <Badge variant="destructive">
                          {refereeConflicts.length} conflicts
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Complete Action */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Referee Assignment Complete</h3>
              <p className="text-sm text-muted-foreground">
                Save assignments and proceed to final schedule confirmation.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => saveAssignmentsMutation.mutate({ assignments, referees })}
                disabled={saveAssignmentsMutation.isPending}
              >
                Save Assignments
              </Button>
              <Button 
                onClick={() => onComplete?.({ assignments, referees, conflicts })}
                disabled={conflicts.some((c: any) => c.severity === 'error')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Assignment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
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
  Plus, Edit, Trash2, CheckCircle, RefreshCw, Users
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

  // Detect conflicts when assignments change
  useEffect(() => {
    if (assignments.length > 0 && referees.length > 0) {
      const detectedConflicts = detectAssignmentConflicts();
      setConflicts(detectedConflicts);
    }
  }, [assignments, referees]);

  const detectAssignmentConflicts = (): AssignmentConflict[] => {
    const conflicts: AssignmentConflict[] = [];
    const games = scheduleData?.games || [];
    
    // Check for conflicts in current assignments
    assignments.forEach(assignment => {
      if (!assignment.refereeId) return;
      
      const referee = referees.find(r => r.id === assignment.refereeId);
      const game = games.find(g => g.id === assignment.gameId);
      
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
      const sameDay = assignments.filter(a => 
        a.refereeId === assignment.refereeId && 
        games.find(g => g.id === a.gameId && 
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
      const sortedGames = games.sort((a, b) => {
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
          const sameDay = newAssignments.filter(a => 
            a.refereeId === referee.id && 
            games.find(g => g.id === a.gameId && 
              new Date(g.startTime).toDateString() === gameDate
            )
          );
          
          return sameDay.length < referee.maxGamesPerDay;
        });
        
        // Assign best referee (prioritize by certification level and workload)
        if (availableReferees.length > 0) {
          const bestReferee = availableReferees.sort((a, b) => {
            const certificationOrder = { 'national': 4, 'regional': 3, 'adult': 2, 'youth': 1 };
            const aCert = certificationOrder[a.certificationLevel] || 0;
            const bCert = certificationOrder[b.certificationLevel] || 0;
            
            if (aCert !== bCert) return bCert - aCert; // Higher certification first
            
            // Then by current workload (less assigned = better)
            const aAssigned = newAssignments.filter(assign => assign.refereeId === a.id).length;
            const bAssigned = newAssignments.filter(assign => assign.refereeId === b.id).length;
            return aAssigned - bAssigned;
          })[0];
          
          const assignmentIndex = newAssignments.findIndex(a => a.gameId === game.id);
          if (assignmentIndex >= 0) {
            newAssignments[assignmentIndex] = {
              ...newAssignments[assignmentIndex],
              refereeId: bestReferee.id,
              centerReferee: bestReferee.name,
              status: 'assigned'
            };
          }
        }
      }
      
      setAssignments(newAssignments);
      
      toast({
        title: "Auto-Assignment Complete",
        description: `Assigned referees to ${newAssignments.filter(a => a.refereeId).length} games`
      });
      
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to auto-assign referees. Please try manual assignment.",
        variant: "destructive"
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleSaveAssignments = async () => {
    try {
      await saveAssignmentsMutation.mutateAsync({
        eventId,
        assignments,
        conflicts: conflicts.filter(c => c.severity === 'error')
      });
      
      if (onComplete) {
        onComplete(assignments);
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save referee assignments.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading referee data...
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
            <UserCheck className="h-6 w-6" />
            Referee Assignment Engine
          </CardTitle>
          <p className="text-muted-foreground">
            Intelligent referee assignment with conflict detection and workload balancing.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runAutoAssignment} 
                disabled={isAutoAssigning || referees.length === 0}
                className="flex items-center gap-2"
              >
                {isAutoAssigning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Auto-Assigning...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    Auto-Assign Referees
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleSaveAssignments}
                disabled={saveAssignmentsMutation.isPending}
                variant="outline"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Assignments
              </Button>
            </div>

            {/* Assignment Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {assignments.filter(a => a.refereeId).length}
                </div>
                <div className="text-sm text-blue-600">Assigned Games</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {assignments.filter(a => !a.refereeId).length}
                </div>
                <div className="text-sm text-orange-600">Unassigned</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {conflicts.filter(c => c.severity === 'error').length}
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
              <Alert>
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
                const game = scheduleData?.games?.find(g => g.id === assignment.gameId);
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
      const gameStartTime = new Date(game.startTime);
      const gameEndTime = new Date(game.endTime);
      
      const availability = referee.timeAvailability[gameDate];
      if (availability && !availability.isAvailable) {
        conflictList.push({
          type: 'availability',
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          message: `${referee.name} is not available on ${gameDate}`,
          severity: 'error'
        });
      }
      
      // Check time overlap with other assignments
      const overlappingAssignments = assignments.filter(other => 
        other.gameId !== assignment.gameId && 
        other.refereeId === assignment.refereeId
      );
      
      overlappingAssignments.forEach(other => {
        const otherGame = games.find((g: any) => g.id === other.gameId);
        if (otherGame) {
          const otherStart = new Date(otherGame.startTime);
          const otherEnd = new Date(otherGame.endTime);
          
          // Check for time overlap (with 30min buffer)
          const buffer = 30 * 60 * 1000; // 30 minutes in milliseconds
          if (gameStartTime.getTime() < otherEnd.getTime() + buffer && 
              gameEndTime.getTime() + buffer > otherStart.getTime()) {
            conflictList.push({
              type: 'overlap',
              gameId: assignment.gameId,
              refereeId: assignment.refereeId,
              message: `${referee.name} has overlapping game assignments`,
              severity: 'error'
            });
          }
        }
      });
      
      // Check team conflicts
      if (referee.conflictTeams.includes(game.teamA) || referee.conflictTeams.includes(game.teamB)) {
        conflictList.push({
          type: 'team_conflict',
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          message: `${referee.name} has conflict with participating teams`,
          severity: 'error'
        });
      }
      
      // Check certification level
      const gameAgeGroup = game.ageGroup;
      if (!referee.ageGroupPreferences.includes(gameAgeGroup)) {
        conflictList.push({
          type: 'certification',
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          message: `${referee.name} may not be certified for ${gameAgeGroup}`,
          severity: 'warning'
        });
      }
      
      // Check daily workload
      const sameDay = assignments.filter(other => {
        const otherGame = games.find((g: any) => g.id === other.gameId);
        return otherGame && 
               other.refereeId === assignment.refereeId &&
               new Date(otherGame.startTime).toDateString() === new Date(game.startTime).toDateString();
      });
      
      if (sameDay.length > referee.maxGamesPerDay) {
        conflictList.push({
          type: 'workload',
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          message: `${referee.name} exceeds max games per day (${referee.maxGamesPerDay})`,
          severity: 'warning'
        });
      }
    });
    
    return conflictList;
  };

  const runAutoAssignment = async () => {
    setIsAutoAssigning(true);
    
    try {
      // Auto-assignment algorithm
      const newAssignments = [...assignments];
      const games = scheduleData?.games || [];
      const availableReferees = [...referees];
      
      // Sort games by start time
      const sortedGames = games.sort((a: any, b: any) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      sortedGames.forEach((game: any) => {
        const assignmentIndex = newAssignments.findIndex(a => a.gameId === game.id);
        if (assignmentIndex === -1 || newAssignments[assignmentIndex].refereeId) return;
        
        // Find best available referee for this game
        const suitableReferees = availableReferees.filter(referee => {
          // Check basic availability
          const gameDate = new Date(game.startTime).toDateString();
          const availability = referee.timeAvailability[gameDate];
          if (availability && !availability.isAvailable) return false;
          
          // Check team conflicts
          if (referee.conflictTeams.includes(game.teamA) || 
              referee.conflictTeams.includes(game.teamB)) return false;
          
          // Check age group preference
          if (!referee.ageGroupPreferences.includes(game.ageGroup)) return false;
          
          // Check workload for the day
          const sameDay = newAssignments.filter(assignment => {
            const otherGame = games.find((g: any) => g.id === assignment.gameId);
            return otherGame && 
                   assignment.refereeId === referee.id &&
                   new Date(otherGame.startTime).toDateString() === gameDate;
          });
          
          if (sameDay.length >= referee.maxGamesPerDay) return false;
          
          // Check for time conflicts
          const hasTimeConflict = newAssignments.some(assignment => {
            if (assignment.refereeId !== referee.id) return false;
            const otherGame = games.find((g: any) => g.id === assignment.gameId);
            if (!otherGame) return false;
            
            const gameStart = new Date(game.startTime);
            const gameEnd = new Date(game.endTime);
            const otherStart = new Date(otherGame.startTime);
            const otherEnd = new Date(otherGame.endTime);
            
            const buffer = 30 * 60 * 1000; // 30 minutes
            return gameStart.getTime() < otherEnd.getTime() + buffer && 
                   gameEnd.getTime() + buffer > otherStart.getTime();
          });
          
          return !hasTimeConflict;
        });
        
        // Assign the first suitable referee
        if (suitableReferees.length > 0) {
          newAssignments[assignmentIndex] = {
            ...newAssignments[assignmentIndex],
            refereeId: suitableReferees[0].id,
            status: 'assigned'
          };
        }
      });
      
      setAssignments(newAssignments);
      toast({
        title: "Auto-Assignment Complete",
        description: `Assigned referees to ${newAssignments.filter(a => a.refereeId).length} games`
      });
    } catch (error) {
      toast({
        title: "Auto-Assignment Failed",
        description: "Failed to automatically assign referees",
        variant: "destructive"
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const assignRefereeToGame = (gameId: string, refereeId: string | null) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.gameId === gameId 
        ? { ...assignment, refereeId, status: refereeId ? 'assigned' : 'unassigned' }
        : assignment
    ));
  };

  const addNewReferee = (refereeData: Partial<Referee>) => {
    const newReferee: Referee = {
      id: `ref_${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      certificationLevel: 'youth',
      ageGroupPreferences: [],
      timeAvailability: {},
      maxGamesPerDay: 4,
      conflictTeams: [],
      ...refereeData
    };
    
    setReferees(prev => [...prev, newReferee]);
    setShowAddReferee(false);
  };

  const getAssignmentStats = () => {
    const total = assignments.length;
    const assigned = assignments.filter(a => a.refereeId).length;
    const conflicted = assignments.filter(a => 
      conflicts.some(c => c.gameId === a.gameId && c.severity === 'error')
    ).length;
    
    return { total, assigned, unassigned: total - assigned, conflicted };
  };

  const stats = getAssignmentStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <UserCheck className="h-6 w-6 animate-pulse mr-2" />
            Loading referee management...
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
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Auto-Assign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Assignment Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.slice(0, 5).map((conflict, index) => (
                <Alert key={index} className="border-orange-200">
                  <AlertDescription className="text-orange-700">
                    {conflict.message}
                  </AlertDescription>
                </Alert>
              ))}
              {conflicts.length > 5 && (
                <p className="text-sm text-orange-600">
                  And {conflicts.length - 5} more conflicts...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Game Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleData?.games?.map((game: any) => {
              const assignment = assignments.find(a => a.gameId === game.id);
              const gameConflicts = conflicts.filter(c => c.gameId === game.id);
              
              return (
                <div key={game.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">
                          {game.teamA} vs {game.teamB}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(game.startTime).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(game.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {game.fieldName}
                          </span>
                        </div>
                      </div>
                      
                      {gameConflicts.length > 0 && (
                        <Badge variant="destructive">
                          {gameConflicts.length} Conflicts
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={assignment?.refereeId || ''}
                        onChange={(e) => assignRefereeToGame(game.id, e.target.value || null)}
                        className="border rounded px-3 py-1 text-sm"
                      >
                        <option value="">Select Referee</option>
                        {referees.map(referee => (
                          <option key={referee.id} value={referee.id}>
                            {referee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {gameConflicts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {gameConflicts.map((conflict, index) => (
                        <div key={index} className="text-xs text-red-600">
                          ⚠ {conflict.message}
                        </div>
                      ))}
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
              const assignedGames = assignments.filter(a => a.refereeId === referee.id);
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
                disabled={conflicts.some(c => c.severity === 'error')}
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
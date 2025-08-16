import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarDays, 
  Users, 
  Trophy, 
  Clock, 
  MapPin, 
  CheckCircle, 
  Circle, 
  Pause,
  ChevronDown,
  ChevronUp,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AgeGroup {
  id: number;
  name: string;
  divisionCode: string;
  gender: string;
  birthYear: number;
  fieldSize: string;
}

interface Game {
  id: number;
  gameNumber: number;
  homeTeamName: string;
  awayTeamName: string;
  fieldName: string;
  complexName: string;
  gameDate: string;
  gameTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  hasScore: boolean;
  isCompleted: boolean;
  coachInfo: {
    homeCoach: string | null;
    awayCoach: string | null;
  };
}

interface AgeGroupSchedule {
  ageGroup: AgeGroup;
  games: Game[];
  statistics: {
    totalGames: number;
    completedGames: number;
    scheduledGames: number;
    postponedGames: number;
    totalTeams: number;
    completionRate: number;
  };
}

interface ScheduleResponse {
  success: boolean;
  eventId: string;
  ageGroups: AgeGroupSchedule[];
  summary: {
    totalAgeGroups: number;
    totalGames: number;
    totalCompleted: number;
    totalTeams: number;
  };
}

const AgeGroupScheduleViewer = ({ eventId }: { eventId: number }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'individual' | 'csv' | 'all' | 'age-group'>('individual');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduleData, isLoading, error, refetch } = useQuery<ScheduleResponse>({
    queryKey: ['age-group-schedules', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/age-group-schedules/${eventId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch age group schedules: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!eventId
  });

  // Individual game delete mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await fetch(`/api/admin/games/game/${gameId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete game');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game Deleted",
        description: "Game has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['age-group-schedules', eventId] });
      setDeleteDialogOpen(false);
      setGameToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete game",
        variant: "destructive",
      });
    }
  });

  // Bulk delete mutations
  const deleteCsvGamesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games/delete-all`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete CSV games');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CSV Games Deleted",
        description: `Successfully deleted ${data.deletedCount} CSV imported games.`,
      });
      queryClient.invalidateQueries({ queryKey: ['age-group-schedules', eventId] });
      setBulkDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete CSV games",
        variant: "destructive",
      });
    }
  });

  const deleteAllGamesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameIds: [] }), // Empty array = delete all
      });
      if (!response.ok) {
        throw new Error('Failed to delete all games');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "All Games Deleted",
        description: `Successfully deleted ${data.deletedCount} games from tournament.`,
      });
      queryClient.invalidateQueries({ queryKey: ['age-group-schedules', eventId] });
      setBulkDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete all games",
        variant: "destructive",
      });
    }
  });

  const deleteAgeGroupGamesMutation = useMutation({
    mutationFn: async (ageGroupId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups/${ageGroupId}/games`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete age group games');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Age Group Games Deleted",
        description: `Successfully deleted ${data.deletedCount} games from age group.`,
      });
      queryClient.invalidateQueries({ queryKey: ['age-group-schedules', eventId] });
      setBulkDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete age group games",
        variant: "destructive",
      });
    }
  });

  const handleDeleteGame = (game: Game) => {
    setGameToDelete(game);
    setDeleteType('individual');
    setDeleteDialogOpen(true);
  };

  const handleBulkDelete = (type: 'csv' | 'all' | 'age-group', ageGroupId?: number) => {
    setDeleteType(type);
    setSelectedAgeGroup(ageGroupId || null);
    setBulkDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteType === 'individual' && gameToDelete) {
      deleteGameMutation.mutate(gameToDelete.id);
    } else if (deleteType === 'csv') {
      deleteCsvGamesMutation.mutate();
    } else if (deleteType === 'all') {
      deleteAllGamesMutation.mutate();
    } else if (deleteType === 'age-group' && selectedAgeGroup) {
      deleteAgeGroupGamesMutation.mutate(selectedAgeGroup);
    }
  };

  const toggleGroup = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const formatGameTime = (gameTime: string) => {
    try {
      const date = new Date(gameTime);
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
    } catch {
      return { date: 'TBD', time: 'TBD' };
    }
  };

  const getStatusIcon = (status: string, hasScore: boolean) => {
    if (hasScore && status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === 'scheduled') {
      return <Circle className="h-4 w-4 text-blue-500" />;
    } else if (status === 'postponed') {
      return <Pause className="h-4 w-4 text-yellow-500" />;
    }
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = (status: string, hasScore: boolean) => {
    if (hasScore && status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'scheduled') return 'bg-blue-100 text-blue-800';
    if (status === 'postponed') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading age group schedules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Trophy className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">Failed to load schedules</p>
            <p className="text-muted-foreground text-sm mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData?.ageGroups?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">No scheduled games found</p>
            <p className="text-muted-foreground text-sm mt-2">
              Import games via CSV or create schedules to see them organized by age group.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Schedule Overview
          </CardTitle>
          <CardDescription>
            Games organized by age groups and divisions (Gender + Birth Year format)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{scheduleData.summary.totalAgeGroups}</div>
              <div className="text-sm text-muted-foreground">Age Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{scheduleData.summary.totalGames}</div>
              <div className="text-sm text-muted-foreground">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{scheduleData.summary.totalCompleted}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{scheduleData.summary.totalTeams}</div>
              <div className="text-sm text-muted-foreground">Teams</div>
            </div>
          </div>
          
          {/* Bulk Delete Options */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkDelete('csv')}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete CSV Imports
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkDelete('all')}
              className="text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Games
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Age Group Schedules */}
      <div className="space-y-4">
        {scheduleData.ageGroups.map((ageGroupData) => {
          const isExpanded = expandedGroups.has(ageGroupData.ageGroup.id);
          
          return (
            <Card key={ageGroupData.ageGroup.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(ageGroupData.ageGroup.id)}
                      className="p-0 h-8 w-8"
                    >
                      {isExpanded ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {ageGroupData.ageGroup.divisionCode}
                        </Badge>
                        {ageGroupData.ageGroup.name}
                      </CardTitle>
                      <CardDescription>
                        {ageGroupData.ageGroup.gender} • Born {ageGroupData.ageGroup.birthYear} • {ageGroupData.ageGroup.fieldSize}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {ageGroupData.statistics.completedGames}/{ageGroupData.statistics.totalGames} Games
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ageGroupData.statistics.completionRate}% Complete
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {ageGroupData.statistics.totalTeams}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleBulkDelete('age-group', ageGroupData.ageGroup.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All Games in Age Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="grid gap-3">
                    {ageGroupData.games.map((game) => {
                      const timeInfo = formatGameTime(game.gameTime);
                      
                      return (
                        <div
                          key={game.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {getStatusIcon(game.status, game.hasScore)}
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  Game #{game.gameNumber || game.id}
                                </Badge>
                                <Badge className={getStatusColor(game.status, game.hasScore)}>
                                  {game.hasScore ? 'Final' : game.status}
                                </Badge>
                              </div>
                              
                              <div className="font-medium text-sm">
                                {game.homeTeamName} vs {game.awayTeamName}
                              </div>
                              
                              {game.hasScore && (
                                <div className="text-lg font-bold text-primary">
                                  {game.homeScore} - {game.awayScore}
                                </div>
                              )}
                              
                              {(game.coachInfo.homeCoach || game.coachInfo.awayCoach) && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Coaches: {game.coachInfo.homeCoach || 'TBD'} • {game.coachInfo.awayCoach || 'TBD'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <CalendarDays className="h-4 w-4" />
                                {timeInfo.date}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {timeInfo.time}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {game.fieldName}
                              </div>
                              {game.complexName !== 'TBD' && (
                                <div className="text-xs text-muted-foreground">
                                  {game.complexName}
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteGame(game)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Game
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Individual Game Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this game? This action cannot be undone.
              {gameToDelete && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="font-medium">Game #{gameToDelete.gameNumber || gameToDelete.id}</div>
                  <div className="text-sm">{gameToDelete.homeTeamName} vs {gameToDelete.awayTeamName}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteGameMutation.isPending}
            >
              {deleteGameMutation.isPending ? 'Deleting...' : 'Delete Game'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === 'csv' && 'Delete CSV Imported Games'}
              {deleteType === 'all' && 'Delete All Games'}
              {deleteType === 'age-group' && 'Delete Age Group Games'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'csv' && 'This will delete all games that were imported from CSV files. Games created through other methods will remain.'}
              {deleteType === 'all' && 'This will delete ALL games in the tournament. This action cannot be undone and will clear the entire schedule.'}
              {deleteType === 'age-group' && 'This will delete all games for this specific age group. Other age groups will not be affected.'}
              
              <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <Trash2 className="h-4 w-4" />
                  Warning: This action cannot be undone
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCsvGamesMutation.isPending || deleteAllGamesMutation.isPending || deleteAgeGroupGamesMutation.isPending}
            >
              {(deleteCsvGamesMutation.isPending || deleteAllGamesMutation.isPending || deleteAgeGroupGamesMutation.isPending) ? 'Deleting...' : 'Delete Games'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgeGroupScheduleViewer;
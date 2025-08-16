import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  ChevronUp
} from 'lucide-react';

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
    </div>
  );
};

export default AgeGroupScheduleViewer;
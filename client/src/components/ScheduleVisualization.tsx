import React, { useState, useMemo } from 'react';
import { 
  Trophy,
  ChevronRight,
  Users,
  Calendar,
  PenSquare,
  Filter,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Team {
  id: number;
  name: string;
  score?: number;
  coach?: string;
  ageGroup?: string;
}

interface Game {
  id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  field?: string;
  startTime?: string;
  endTime?: string;
  round?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: { home: number; away: number };
}

interface Match {
  id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  nextMatchId?: string;
  round: number;
  position: number;
}

interface BracketData {
  id: number;
  name: string;
  type: string;
  stage: string;
  matches: Match[];
}

interface ScheduleVisualizationProps {
  games: Game[];
  ageGroups: string[];
  selectedAgeGroup: string;
  onAgeGroupChange: (value: string) => void;
  isLoading: boolean;
  date: Date;
  bracketData?: BracketData;
  onMatchSelect?: (matchId: string | null) => void;
}

const ScheduleVisualization: React.FC<ScheduleVisualizationProps> = ({
  games,
  ageGroups,
  selectedAgeGroup,
  onAgeGroupChange,
  isLoading,
  date,
  bracketData,
  onMatchSelect
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'brackets' | 'teams'>('games');
  
  // Format games by time slot for display
  const groupedGames = useMemo(() => {
    return games.reduce<Record<string, Game[]>>((acc, game) => {
      if (!game.startTime) return acc;
      
      const timeKey = game.startTime.split('T')[1].substring(0, 5); // extract HH:MM from ISO time
      if (!acc[timeKey]) {
        acc[timeKey] = [];
      }
      acc[timeKey].push(game);
      return acc;
    }, {});
  }, [games]);
  
  // Extract teams from games for the teams view
  const teams = useMemo(() => {
    const uniqueTeams = new Map<number, Team>();
    games.forEach(game => {
      if (game.homeTeam) uniqueTeams.set(game.homeTeam.id, game.homeTeam);
      if (game.awayTeam) uniqueTeams.set(game.awayTeam.id, game.awayTeam);
    });
    return Array.from(uniqueTeams.values());
  }, [games]);
  
  // If bracket data is available, prepare it for display
  const renderBracketView = () => {
    if (!bracketData || !bracketData.matches || bracketData.matches.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="p-4 bg-muted rounded-lg inline-block">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No bracket data available for this age group.</p>
            <p className="text-xs text-muted-foreground mt-1">Brackets will appear here when created.</p>
          </div>
        </div>
      );
    }
    
    // Group matches by round
    const maxRound = bracketData.matches.reduce((max, match) => Math.max(max, match.round), 0);
    const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
    const matchesByRound = rounds.reduce<Record<number, Match[]>>((acc, round) => {
      acc[round] = bracketData.matches.filter(match => match.round === round) || [];
      return acc;
    }, {});

    // Handle match click
    const handleMatchClick = (matchId: string) => {
      if (onMatchSelect) onMatchSelect(matchId);
    };
    
    return (
      <div className="space-y-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{bracketData.name}</h3>
          <Badge variant="outline" className="text-xs">
            {bracketData.type.replace('_', ' ')}
          </Badge>
        </div>
        
        {rounds.map(round => (
          <div key={round} className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">
              {round === maxRound ? 'Final' : round === maxRound - 1 ? 'Semi-Finals' : `Round ${round}`}
            </h5>
            
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {matchesByRound[round]?.map(match => (
                <div 
                  key={match.id}
                  onClick={() => handleMatchClick(match.id)}
                  className="p-3 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
                    <span>Match {match.id}</span>
                    <span>Position {match.position}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium">{match.homeTeam?.name || 'TBD'}</span>
                        {match.homeTeam?.ageGroup && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {match.homeTeam.ageGroup}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-bold">{match.homeTeam?.score}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium">{match.awayTeam?.name || 'TBD'}</span>
                        {match.awayTeam?.ageGroup && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {match.awayTeam.ageGroup}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-bold">{match.awayTeam?.score}</span>
                    </div>
                  </div>
                  
                  {match.nextMatchId && (
                    <div className="mt-2 text-xs flex items-center text-muted-foreground">
                      <span>Winner advances to match {match.nextMatchId}</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render the games view (schedule grid)
  const renderGamesView = () => {
    if (games.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="p-4 bg-muted rounded-lg inline-block">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No games scheduled for this day.</p>
            <p className="text-xs text-muted-foreground mt-1">Games will appear here when scheduled.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Games for {format(date, 'MMMM d, yyyy')}
          </h3>
        </div>
        
        {Object.entries(groupedGames)
          .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
          .map(([timeSlot, gamesInSlot]) => (
            <div key={timeSlot} className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">
                {timeSlot}
              </h5>
              
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {gamesInSlot.map(game => (
                  <div 
                    key={game.id}
                    className="p-3 border rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
                      <span>Field: {game.field || 'TBD'}</span>
                      <Badge 
                        variant={
                          game.status === 'completed' ? 'default' : 
                          game.status === 'in_progress' ? 'secondary' :
                          game.status === 'cancelled' ? 'destructive' : 
                          'outline'
                        }
                        className="text-xs"
                      >
                        {game.status === 'scheduled' ? 'Scheduled' : 
                         game.status === 'in_progress' ? 'In Progress' :
                         game.status === 'completed' ? 'Completed' : 
                         game.status === 'cancelled' ? 'Cancelled' : 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="font-medium">{game.homeTeam?.name || 'TBD'}</span>
                          {game.homeTeam?.ageGroup && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {game.homeTeam.ageGroup}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold">{game.score?.home ?? '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="font-medium">{game.awayTeam?.name || 'TBD'}</span>
                          {game.awayTeam?.ageGroup && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {game.awayTeam.ageGroup}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold">{game.score?.away ?? '-'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Start: {game.startTime?.split('T')[1].substring(0, 5) || 'TBD'}</span>
                        <span>End: {game.endTime?.split('T')[1].substring(0, 5) || 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  };

  // Render teams view
  const renderTeamsView = () => {
    if (teams.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="p-4 bg-muted rounded-lg inline-block">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No teams available for this age group.</p>
            <p className="text-xs text-muted-foreground mt-1">Teams will appear here when added.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Teams</h3>
        </div>
        
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => (
            <div key={team.id} className="p-3 border rounded-md hover:bg-accent/50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{team.name}</span>
                {team.ageGroup && (
                  <Badge variant="outline" className="text-xs">
                    {team.ageGroup}
                  </Badge>
                )}
              </div>
              
              {team.coach && (
                <div className="text-sm text-muted-foreground">
                  Coach: {team.coach}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading schedule data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Select
          value={selectedAgeGroup}
          onValueChange={onAgeGroupChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            {ageGroups.map((ageGroup) => (
              <SelectItem key={ageGroup} value={ageGroup}>
                {ageGroup}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'games' | 'brackets' | 'teams')}>
          <TabsList>
            <TabsTrigger value="games" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Games</span>
            </TabsTrigger>
            <TabsTrigger value="brackets" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Brackets</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {activeTab === 'games' && renderGamesView()}
          {activeTab === 'brackets' && renderBracketView()}
          {activeTab === 'teams' && renderTeamsView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleVisualization;
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
  status?: 'registered' | 'approved' | 'rejected' | 'withdrawn' | 'refunded';
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
  bracketName?: string; // Added bracketName to identify which bracket a game belongs to
  bracketId?: number;    // Added bracketId for reference to actual bracket
  division?: string;     // Division information (can be derived from teams' age groups)
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
  const [activeTab, setActiveTab] = useState<'games' | 'brackets' | 'teams' | 'divisions'>('games');
  
  // Format games by time slot for display
  const groupedGamesByTime = useMemo(() => {
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
  
  // Group games by division and bracket for the division view
  const groupedGamesByDivisionAndBracket = useMemo(() => {
    return games.reduce<Record<string, Record<string, Game[]>>>((divisions, game) => {
      // Get division (age group) from either home or away team
      const division = (game.homeTeam?.ageGroup || game.awayTeam?.ageGroup || 'Unassigned');
      
      // Initialize the division if it doesn't exist
      if (!divisions[division]) {
        divisions[division] = {};
      }
      
      // Use bracket name if available, otherwise use a default
      // This could come from additional properties we add to the game object
      const bracketName = game.bracketName || 'Unassigned Bracket';
      
      // Initialize the bracket if it doesn't exist
      if (!divisions[division][bracketName]) {
        divisions[division][bracketName] = [];
      }
      
      // Add the game to the appropriate division and bracket
      divisions[division][bracketName].push(game);
      
      return divisions;
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

    // Get a list of any unapproved teams in the bracket
    const unapprovedTeams = bracketData.matches.flatMap(match => {
      const teams = [];
      if (match.homeTeam && match.homeTeam.status !== 'approved') teams.push(match.homeTeam);
      if (match.awayTeam && match.awayTeam.status !== 'approved') teams.push(match.awayTeam);
      return teams;
    });
    
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

    // Check if a team is eligible for scheduling (approved status)
    const isTeamEligible = (team?: Team) => {
      return team ? team.status === 'approved' : true; // TBD teams are considered eligible
    };
    
    return (
      <div className="space-y-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{bracketData.name}</h3>
          <Badge variant="outline" className="text-xs">
            {bracketData.type.replace('_', ' ')}
          </Badge>
        </div>
        
        {/* Warning message if there are unapproved teams in the bracket */}
        {unapprovedTeams.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-center text-destructive">
              <span className="font-medium">Warning:</span> There {unapprovedTeams.length === 1 ? 'is' : 'are'} {unapprovedTeams.length} non-approved {unapprovedTeams.length === 1 ? 'team' : 'teams'} in this bracket. 
              Only teams with 'Approved' status should be used for scheduling.
            </p>
          </div>
        )}
        
        {rounds.map(round => (
          <div key={round} className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">
              {round === maxRound ? 'Final' : round === maxRound - 1 ? 'Semi-Finals' : `Round ${round}`}
            </h5>
            
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {matchesByRound[round]?.map(match => {
                // Check if both teams in the match are eligible
                const homeTeamEligible = isTeamEligible(match.homeTeam);
                const awayTeamEligible = isTeamEligible(match.awayTeam);
                const matchHasEligibilityIssue = !homeTeamEligible || !awayTeamEligible;
                
                return (
                  <div 
                    key={match.id}
                    onClick={() => handleMatchClick(match.id)}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      matchHasEligibilityIssue 
                        ? 'border-destructive/50 bg-destructive/5' 
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
                      <span>Match {match.id}</span>
                      <span>Position {match.position}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`font-medium ${!homeTeamEligible && match.homeTeam ? 'text-destructive' : ''}`}>
                            {match.homeTeam?.name || 'TBD'}
                          </span>
                          {match.homeTeam?.ageGroup && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {match.homeTeam.ageGroup}
                            </Badge>
                          )}
                          {match.homeTeam && !homeTeamEligible && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {match.homeTeam.status || 'Not Approved'}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold">{match.homeTeam?.score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`font-medium ${!awayTeamEligible && match.awayTeam ? 'text-destructive' : ''}`}>
                            {match.awayTeam?.name || 'TBD'}
                          </span>
                          {match.awayTeam?.ageGroup && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {match.awayTeam.ageGroup}
                            </Badge>
                          )}
                          {match.awayTeam && !awayTeamEligible && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {match.awayTeam.status || 'Not Approved'}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold">{match.awayTeam?.score}</span>
                      </div>
                    </div>
                    
                    {matchHasEligibilityIssue ? (
                      <div className="mt-2 border-t border-destructive/30 pt-2">
                        <p className="text-xs text-destructive">
                          This match contains non-approved teams
                        </p>
                      </div>
                    ) : match.nextMatchId && (
                      <div className="mt-2 text-xs flex items-center text-muted-foreground">
                        <span>Winner advances to match {match.nextMatchId}</span>
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    )}
                  </div>
                );
              })}
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

    // Check for non-approved teams in games
    const teamsWithIssues = games.flatMap(game => {
      const issues = [];
      if (game.homeTeam && game.homeTeam.status !== 'approved') issues.push(game.homeTeam);
      if (game.awayTeam && game.awayTeam.status !== 'approved') issues.push(game.awayTeam);
      return issues;
    });

    return (
      <div className="space-y-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Games for {format(date, 'MMMM d, yyyy')}
          </h3>
        </div>
        
        {/* Warning for non-approved teams in games */}
        {teamsWithIssues.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-center text-destructive">
              <span className="font-medium">Warning:</span> There {teamsWithIssues.length === 1 ? 'is' : 'are'} {teamsWithIssues.length} non-approved {teamsWithIssues.length === 1 ? 'team' : 'teams'} in scheduled games. 
              Only teams with 'Approved' status should be used for scheduling.
            </p>
          </div>
        )}
        
        {Object.entries(groupedGamesByTime)
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
                          <span className={`font-medium ${game.homeTeam?.status !== 'approved' && game.homeTeam ? 'text-destructive' : ''}`}>
                            {game.homeTeam?.name || 'TBD'}
                          </span>
                          <div className="flex flex-wrap ml-2 gap-1">
                            {game.homeTeam?.ageGroup && (
                              <Badge variant="outline" className="text-xs">
                                {game.homeTeam.ageGroup}
                              </Badge>
                            )}
                            {game.homeTeam?.status && game.homeTeam.status !== 'approved' && (
                              <Badge variant="destructive" className="text-xs">
                                {game.homeTeam.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold">{game.score?.home ?? '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`font-medium ${game.awayTeam?.status !== 'approved' && game.awayTeam ? 'text-destructive' : ''}`}>
                            {game.awayTeam?.name || 'TBD'}
                          </span>
                          <div className="flex flex-wrap ml-2 gap-1">
                            {game.awayTeam?.ageGroup && (
                              <Badge variant="outline" className="text-xs">
                                {game.awayTeam.ageGroup}
                              </Badge>
                            )}
                            {game.awayTeam?.status && game.awayTeam.status !== 'approved' && (
                              <Badge variant="destructive" className="text-xs">
                                {game.awayTeam.status}
                              </Badge>
                            )}
                          </div>
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

  // Render divisions view (games organized by division and bracket)
  const renderDivisionsView = () => {
    if (games.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="p-4 bg-muted rounded-lg inline-block">
            <Filter className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No games scheduled for this division.</p>
            <p className="text-xs text-muted-foreground mt-1">Games will appear here when scheduled.</p>
          </div>
        </div>
      );
    }

    // Check for non-approved teams in games
    const teamsWithIssues = games.flatMap(game => {
      const issues = [];
      if (game.homeTeam && game.homeTeam.status !== 'approved') issues.push(game.homeTeam);
      if (game.awayTeam && game.awayTeam.status !== 'approved') issues.push(game.awayTeam);
      return issues;
    });

    return (
      <div className="space-y-8 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Games by Division and Bracket
          </h3>
        </div>
        
        {/* Warning for non-approved teams in games */}
        {teamsWithIssues.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-center text-destructive">
              <span className="font-medium">Warning:</span> There {teamsWithIssues.length === 1 ? 'is' : 'are'} {teamsWithIssues.length} non-approved {teamsWithIssues.length === 1 ? 'team' : 'teams'} in scheduled games. 
              Only teams with 'Approved' status should be used for scheduling.
            </p>
          </div>
        )}
        
        {/* Iterate through each division */}
        {Object.entries(groupedGamesByDivisionAndBracket).map(([divisionName, bracketGames]) => (
          <div key={divisionName} className="space-y-4 mb-8 border-b pb-6">
            <h4 className="text-md font-semibold bg-muted/50 p-2 rounded">
              Division: {divisionName}
            </h4>
            
            {/* Iterate through each bracket in this division */}
            {Object.entries(bracketGames).map(([bracketName, gamesInBracket]) => (
              <div key={`${divisionName}-${bracketName}`} className="space-y-3">
                <h5 className="text-sm font-medium pl-2 border-l-2 border-primary">
                  Bracket: {bracketName}
                </h5>
                
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {gamesInBracket.map(game => (
                    <div 
                      key={game.id}
                      className="p-3 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>Field: {game.field || 'TBD'}</span>
                          {game.startTime && (
                            <span>
                              {game.startTime.split('T')[1].substring(0, 5)}
                            </span>
                          )}
                        </div>
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
                            <span className={`font-medium ${game.homeTeam?.status !== 'approved' && game.homeTeam ? 'text-destructive' : ''}`}>
                              {game.homeTeam?.name || 'TBD'}
                            </span>
                            {game.homeTeam?.status && game.homeTeam.status !== 'approved' && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {game.homeTeam.status}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-bold">{game.score?.home ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`font-medium ${game.awayTeam?.status !== 'approved' && game.awayTeam ? 'text-destructive' : ''}`}>
                              {game.awayTeam?.name || 'TBD'}
                            </span>
                            {game.awayTeam?.status && game.awayTeam.status !== 'approved' && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {game.awayTeam.status}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-bold">{game.score?.away ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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

    // Get an array of approved teams (only these can be used for scheduling)
    const approvedTeams = teams.filter(team => team.status === 'approved');

    return (
      <div className="space-y-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Teams</h3>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{approvedTeams.length}</span> of <span>{teams.length}</span> teams approved for scheduling
          </div>
        </div>
        
        {/* Warning if there are non-approved teams */}
        {teams.length > approvedTeams.length ? (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-center text-destructive">
              <span className="font-medium">Warning:</span> There {teams.length - approvedTeams.length === 1 ? 'is' : 'are'} {teams.length - approvedTeams.length} non-approved {teams.length - approvedTeams.length === 1 ? 'team' : 'teams'} that cannot be used for scheduling.
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-muted/30 rounded-md">
            <p className="text-sm text-center text-muted-foreground">
              <span className="font-medium">Note:</span> Only teams with 'Approved' status can be placed in brackets for scheduling.
            </p>
          </div>
        )}
        
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => {
            // Determine badge variant based on team status
            const statusVariant = 
              team.status === 'approved' ? 'success' : 
              team.status === 'rejected' ? 'destructive' :
              team.status === 'withdrawn' ? 'destructive' :
              team.status === 'refunded' ? 'destructive' : 
              'outline';
            
            // Check if this team is eligible for scheduling
            const isScheduleEligible = team.status === 'approved';
            
            return (
              <div 
                key={team.id} 
                className={`p-3 border rounded-md transition-colors ${isScheduleEligible ? 'hover:bg-accent/50' : 'opacity-75'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{team.name}</span>
                  {team.ageGroup && (
                    <Badge variant="outline" className="text-xs">
                      {team.ageGroup}
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  {team.coach && (
                    <div className="text-sm text-muted-foreground">
                      Coach: {team.coach}
                    </div>
                  )}
                  
                  <Badge variant={statusVariant} className="capitalize">
                    {team.status || 'registered'}
                  </Badge>
                </div>
                
                {!isScheduleEligible && (
                  <div className="mt-2 border-t pt-2">
                    <p className="text-xs text-muted-foreground">
                      Not eligible for scheduling
                    </p>
                  </div>
                )}
              </div>
            );
          })}
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
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'games' | 'brackets' | 'teams' | 'divisions')}>
          <TabsList>
            <TabsTrigger value="games" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>By Time</span>
            </TabsTrigger>
            <TabsTrigger value="divisions" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>By Division</span>
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
          {activeTab === 'divisions' && renderDivisionsView()}
          {activeTab === 'brackets' && renderBracketView()}
          {activeTab === 'teams' && renderTeamsView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleVisualization;
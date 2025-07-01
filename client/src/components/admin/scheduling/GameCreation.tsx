import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, CheckCircle, AlertTriangle, Info, 
  Play, Shuffle, Users, Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameCreationProps {
  eventId: string;
  workflowData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface Game {
  id: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  bracketId: string;
  bracketName: string;
  poolId?: string;
  poolName?: string;
  round: string;
  gameType: 'pool_play' | 'knockout' | 'final';
  gameNumber: number;
  duration: number;
  estimatedStart?: Date;
}

interface BracketGames {
  bracketId: string;
  bracketName: string;
  format: string;
  poolGames: Game[];
  knockoutGames: Game[];
  totalGames: number;
}

export function GameCreation({ eventId, workflowData, onComplete, onError }: GameCreationProps) {
  const [bracketGames, setBracketGames] = useState<BracketGames[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const brackets = workflowData?.bracket?.brackets || [];
  const seedings = workflowData?.seed?.bracketSeedings || [];
  const timeBlocks = workflowData?.timeblock?.timeBlocks || [];

  // Debug logging
  console.log('GameCreation workflowData:', workflowData);
  console.log('GameCreation brackets:', brackets);
  console.log('GameCreation seedings:', seedings);
  console.log('GameCreation timeBlocks:', timeBlocks);

  useEffect(() => {
    if (brackets.length > 0) {
      if (seedings.length > 0) {
        generateAllGames();
      } else {
        // If we have brackets but no seedings, try to generate games with automatic team assignment
        console.log('No seedings found, attempting automatic team assignment for brackets');
        generateGamesWithAutoSeeding();
      }
    }
  }, [brackets, seedings]);

  const generateAllGames = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const allBracketGames: BracketGames[] = [];
    
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      const seeding = seedings.find(s => s.bracketId === bracket.id);
      
      if (seeding) {
        const games = generateGamesForBracket(bracket, seeding);
        allBracketGames.push(games);
        
        setGenerationProgress(((i + 1) / brackets.length) * 100);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setBracketGames(allBracketGames);
    setIsGenerating(false);
    
    toast({
      title: "Games Generated",
      description: `Created ${allBracketGames.reduce((sum, bg) => sum + bg.totalGames, 0)} games across ${allBracketGames.length} brackets`
    });
  };

  const generateGamesWithAutoSeeding = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const allBracketGames: BracketGames[] = [];
    
    // Get flight data to find teams assigned to each bracket
    const flights = workflowData?.flight?.flights || [];
    
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      
      // Find teams assigned to this bracket from flight data
      const bracketTeams = findTeamsForBracket(bracket, flights);
      
      if (bracketTeams.length > 1) {
        // Create automatic seeding data
        const autoSeeding = {
          bracketId: bracket.id,
          teams: bracketTeams.map((team, index) => ({
            teamId: team.id,
            name: team.name,
            seedRanking: index + 1,
            poolAssignment: bracket.format === 'pool_play' ? 'Pool A' : undefined
          })),
          pools: bracket.format === 'pool_play' ? [
            {
              poolId: 'pool_a',
              poolName: 'Pool A',
              teamIds: bracketTeams.map(team => team.id)
            }
          ] : []
        };
        
        const games = generateGamesForBracket(bracket, autoSeeding);
        allBracketGames.push(games);
      }
      
      setGenerationProgress(((i + 1) / brackets.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setBracketGames(allBracketGames);
    setIsGenerating(false);
    
    if (allBracketGames.length > 0) {
      toast({
        title: "Games Generated (Auto-Seeded)",
        description: `Created ${allBracketGames.reduce((sum, bg) => sum + bg.totalGames, 0)} games across ${allBracketGames.length} brackets using automatic team assignment`
      });
    } else {
      toast({
        title: "No Games Generated",
        description: "No teams were found assigned to brackets. Please complete the flight assignment step first.",
        variant: "destructive"
      });
    }
  };

  const findTeamsForBracket = (bracket: any, flights: any[]): any[] => {
    const teams: any[] = [];
    
    // Look through flights to find teams assigned to this bracket
    flights.forEach(flight => {
      if (flight.teams && Array.isArray(flight.teams)) {
        flight.teams.forEach((team: any) => {
          // Check if team belongs to this bracket (either by flight match or bracket assignment)
          if (bracket.flightId === flight.id || 
              (bracket.flightName && bracket.flightName.includes(flight.name))) {
            teams.push({
              id: team.id,
              name: team.name,
              flightId: flight.id
            });
          }
        });
      }
    });
    
    return teams;
  };

  const generateGamesForBracket = (bracket: any, seeding: any): BracketGames => {
    const poolGames: Game[] = [];
    const knockoutGames: Game[] = [];
    let gameCounter = 1;

    console.log('generateGamesForBracket - bracket:', bracket);
    console.log('generateGamesForBracket - seeding:', seeding);
    console.log('generateGamesForBracket - seeding.teams:', seeding?.teams);
    console.log('generateGamesForBracket - seeding.pools:', seeding?.pools);

    // Generate pool play games
    if (bracket.format !== 'knockout' && seeding?.pools?.length > 0) {
      seeding.pools.forEach((pool: any) => {
        const poolTeams = seeding.teams.filter((team: any) => 
          team.poolAssignment === pool.poolName
        );
        
        // Generate round-robin games for this pool
        for (let i = 0; i < poolTeams.length; i++) {
          for (let j = i + 1; j < poolTeams.length; j++) {
            poolGames.push({
              id: `${bracket.id}_pool_${gameCounter}`,
              homeTeamId: poolTeams[i].teamId,
              homeTeamName: poolTeams[i].name,
              awayTeamId: poolTeams[j].teamId,
              awayTeamName: poolTeams[j].name,
              bracketId: bracket.id,
              bracketName: bracket.flightName,
              poolId: pool.poolId,
              poolName: pool.poolName,
              round: 'Pool Play',
              gameType: 'pool_play',
              gameNumber: gameCounter++,
              duration: getGameDuration(bracket.id)
            });
          }
        }
      });
    } else if (bracket.format === 'pool_play') {
      // Single pool round-robin
      const teams = seeding?.teams || [];
      console.log('Pool play teams for bracket', bracket.id, ':', teams);
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          poolGames.push({
            id: `${bracket.id}_rr_${gameCounter}`,
            homeTeamId: teams[i].teamId,
            homeTeamName: teams[i].name,
            awayTeamId: teams[j].teamId,
            awayTeamName: teams[j].name,
            bracketId: bracket.id,
            bracketName: bracket.flightName,
            round: 'Round Robin',
            gameType: 'pool_play',
            gameNumber: gameCounter++,
            duration: getGameDuration(bracket.id)
          });
        }
      }
    }

    // Generate knockout games
    if (bracket.format !== 'pool_play') {
      const knockoutTeams = bracket.format === 'knockout' 
        ? seeding.teams 
        : getQualifyingTeams(seeding.pools);
      
      knockoutGames.push(...generateKnockoutGames(
        bracket,
        knockoutTeams,
        gameCounter
      ));
    }

    return {
      bracketId: bracket.id,
      bracketName: bracket.flightName,
      format: bracket.format,
      poolGames,
      knockoutGames,
      totalGames: poolGames.length + knockoutGames.length
    };
  };

  const getQualifyingTeams = (pools: any[]): any[] => {
    // For now, take top 2 teams from each pool
    const qualifiers: any[] = [];
    pools.forEach(pool => {
      const poolTeams = pool.teamIds.slice(0, 2).map((teamId: number) => ({
        teamId,
        name: `Team ${teamId}`, // Would be populated from actual team data
        seedRanking: 1 // Would be determined by pool results
      }));
      qualifiers.push(...poolTeams);
    });
    return qualifiers;
  };

  const generateKnockoutGames = (bracket: any, teams: any[], startingGameNumber: number): Game[] => {
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    if (teams.length <= 1) return games;

    // Simple knockout bracket generation
    if (teams.length === 2) {
      // Final only
      games.push({
        id: `${bracket.id}_final`,
        homeTeamId: teams[0].teamId,
        homeTeamName: teams[0].name,
        awayTeamId: teams[1].teamId,
        awayTeamName: teams[1].name,
        bracketId: bracket.id,
        bracketName: bracket.flightName,
        round: 'Final',
        gameType: 'final',
        gameNumber: gameCounter++,
        duration: getGameDuration(bracket.id)
      });
    } else if (teams.length <= 4) {
      // Semifinals + Final + 3rd Place
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          games.push({
            id: `${bracket.id}_semi_${Math.floor(i/2) + 1}`,
            homeTeamId: teams[i].teamId,
            homeTeamName: teams[i].name,
            awayTeamId: teams[i + 1].teamId,
            awayTeamName: teams[i + 1].name,
            bracketId: bracket.id,
            bracketName: bracket.flightName,
            round: 'Semifinal',
            gameType: 'knockout',
            gameNumber: gameCounter++,
            duration: getGameDuration(bracket.id)
          });
        }
      }

      // Add final and 3rd place placeholder games
      games.push({
        id: `${bracket.id}_3rd_place`,
        homeTeamId: 0, // TBD from semifinal losers
        homeTeamName: 'TBD',
        awayTeamId: 0,
        awayTeamName: 'TBD',
        bracketId: bracket.id,
        bracketName: bracket.flightName,
        round: '3rd Place',
        gameType: 'knockout',
        gameNumber: gameCounter++,
        duration: getGameDuration(bracket.id)
      });

      games.push({
        id: `${bracket.id}_final`,
        homeTeamId: 0, // TBD from semifinal winners
        homeTeamName: 'TBD',
        awayTeamId: 0,
        awayTeamName: 'TBD',
        bracketId: bracket.id,
        bracketName: bracket.flightName,
        round: 'Final',
        gameType: 'final',
        gameNumber: gameCounter++,
        duration: getGameDuration(bracket.id)
      });
    }

    return games;
  };

  const getGameDuration = (bracketId: string): number => {
    const ageGroupName = extractAgeGroupFromBracket(bracketId);
    const timeBlock = timeBlocks.find((tb: any) => tb.ageGroupName === ageGroupName);
    return timeBlock?.gameFormat.totalMinutes || 65; // Default 65 minutes
  };

  const extractAgeGroupFromBracket = (bracketId: string): string => {
    // Extract age group from bracket ID or name
    const bracket = brackets.find((b: any) => b.id === bracketId);
    if (bracket) {
      const match = bracket.flightName.match(/(\d{4}|\w+\d+)\s+(Boys|Girls)/i);
      if (match) {
        return `${match[1]} ${match[2]}`;
      }
    }
    return 'Unknown';
  };

  const getGameTypeBadge = (gameType: string) => {
    const colors = {
      pool_play: 'bg-blue-500 text-white',
      knockout: 'bg-orange-500 text-white',
      final: 'bg-gold-500 text-white'
    };
    
    const labels = {
      pool_play: 'Pool Play',
      knockout: 'Knockout',
      final: 'Final'
    };
    
    return (
      <Badge className={colors[gameType as keyof typeof colors]}>
        {labels[gameType as keyof typeof labels]}
      </Badge>
    );
  };

  const validateGames = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (bracketGames.length === 0) {
      errors.push('No games have been generated');
      return { isValid: false, errors };
    }

    bracketGames.forEach(bg => {
      if (bg.totalGames === 0) {
        errors.push(`${bg.bracketName} has no games generated`);
      }

      // Check for games with invalid teams
      const allGames = [...bg.poolGames, ...bg.knockoutGames];
      allGames.forEach(game => {
        if (game.homeTeamId === game.awayTeamId && game.homeTeamId !== 0) {
          errors.push(`${bg.bracketName} has a game where team plays itself`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleComplete = () => {
    const validation = validateGames();
    
    if (!validation.isValid) {
      onError(`Game generation validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    const gameData = {
      bracketGames: bracketGames.map(bg => ({
        bracketId: bg.bracketId,
        bracketName: bg.bracketName,
        format: bg.format,
        games: [...bg.poolGames, ...bg.knockoutGames].map(game => ({
          id: game.id,
          homeTeamId: game.homeTeamId,
          homeTeamName: game.homeTeamName,
          awayTeamId: game.awayTeamId,
          awayTeamName: game.awayTeamName,
          round: game.round,
          gameType: game.gameType,
          duration: game.duration,
          poolId: game.poolId,
          poolName: game.poolName
        }))
      })),
      summary: {
        totalBrackets: bracketGames.length,
        totalGames: bracketGames.reduce((sum, bg) => sum + bg.totalGames, 0),
        poolPlayGames: bracketGames.reduce((sum, bg) => sum + bg.poolGames.length, 0),
        knockoutGames: bracketGames.reduce((sum, bg) => sum + bg.knockoutGames.length, 0)
      }
    };

    onComplete(gameData);
  };

  const totalGames = bracketGames.reduce((sum, bg) => sum + bg.totalGames, 0);
  const poolPlayGames = bracketGames.reduce((sum, bg) => sum + bg.poolGames.length, 0);
  const knockoutGames = bracketGames.reduce((sum, bg) => sum + bg.knockoutGames.length, 0);

  if (brackets.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No brackets found. Please complete the previous steps first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generating Games...</span>
                <span className="text-sm text-gray-600">{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Generation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Game Generation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{totalGames}</div>
              <div className="text-sm text-blue-800">Total Games</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{poolPlayGames}</div>
              <div className="text-sm text-green-800">Pool Play</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{knockoutGames}</div>
              <div className="text-sm text-orange-800">Knockout</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{bracketGames.length}</div>
              <div className="text-sm text-purple-800">Brackets</div>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              onClick={generateAllGames}
              disabled={isGenerating}
              className="mr-2"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Regenerate All Games
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Games Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Generated Games by Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {bracketGames.map(bg => (
              <div key={bg.bracketId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">{bg.bracketName}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{bg.format.replace('_', ' ')}</Badge>
                    <Badge className="bg-gray-600 text-white">{bg.totalGames} games</Badge>
                  </div>
                </div>

                {/* Pool Play Games */}
                {bg.poolGames.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Pool Play Games ({bg.poolGames.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Game #</TableHead>
                          <TableHead>Matchup</TableHead>
                          <TableHead>Pool</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bg.poolGames.slice(0, 10).map(game => (
                          <TableRow key={game.id}>
                            <TableCell>{game.gameNumber}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {game.homeTeamName} vs {game.awayTeamName}
                              </div>
                            </TableCell>
                            <TableCell>
                              {game.poolName && (
                                <Badge variant="outline">{game.poolName}</Badge>
                              )}
                            </TableCell>
                            <TableCell>{game.duration} min</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {bg.poolGames.length > 10 && (
                      <div className="text-sm text-gray-600 mt-2">
                        ... and {bg.poolGames.length - 10} more pool play games
                      </div>
                    )}
                  </div>
                )}

                {/* Knockout Games */}
                {bg.knockoutGames.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Knockout Games ({bg.knockoutGames.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Game #</TableHead>
                          <TableHead>Matchup</TableHead>
                          <TableHead>Round</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bg.knockoutGames.map(game => (
                          <TableRow key={game.id}>
                            <TableCell>{game.gameNumber}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {game.homeTeamName} vs {game.awayTeamName}
                              </div>
                            </TableCell>
                            <TableCell>{game.round}</TableCell>
                            <TableCell>{getGameTypeBadge(game.gameType)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation & Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Game Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <GameValidation 
            bracketGames={bracketGames}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function GameValidation({ bracketGames, onComplete }: any) {
  const errors: string[] = [];

  if (bracketGames.length === 0) {
    errors.push('No games have been generated');
  }

  bracketGames.forEach((bg: BracketGames) => {
    if (bg.totalGames === 0) {
      errors.push(`${bg.bracketName} has no games generated`);
    }

    const allGames = [...bg.poolGames, ...bg.knockoutGames];
    allGames.forEach(game => {
      if (game.homeTeamId === game.awayTeamId && game.homeTeamId !== 0) {
        errors.push(`${bg.bracketName} has invalid matchup`);
      }
    });
  });

  const isValid = errors.length === 0;

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Game generation errors:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All games have been generated successfully and are ready for scheduling.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {bracketGames.reduce((sum: number, bg: BracketGames) => sum + bg.totalGames, 0)} games ready for scheduling
        </div>
        <Button 
          onClick={onComplete}
          disabled={!isValid}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Game Creation
        </Button>
      </div>
    </div>
  );
}
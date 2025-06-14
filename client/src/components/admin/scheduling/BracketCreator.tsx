import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, Calculator, Info, CheckCircle, AlertTriangle, Plus, Edit2, Trash2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BracketCreatorProps {
  eventId: string;
  workflowData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface BracketStructure {
  id: string;
  flightId: string;
  flightName: string;
  teamCount: number;
  format: 'pool_play' | 'knockout' | 'round_robin_knockout';
  poolCount?: number;
  teamsPerPool?: number;
  poolPlayGames: number;
  finalGames: number;
  totalGames: number;
  estimatedDuration: number; // in minutes
}

interface GameCalculation {
  teamCount: number;
  poolPlayGames: number;
  finalGames: number;
  totalGames: number;
  description: string;
}

export function BracketCreator({ eventId, workflowData, onComplete, onError }: BracketCreatorProps) {
  const [brackets, setBrackets] = useState<BracketStructure[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('round_robin_knockout');
  const { toast } = useToast();

  const flights = workflowData?.flight?.flights || [];

  useEffect(() => {
    // Initialize brackets from existing team bracket selections and flight data
    if (flights.length > 0) {
      const initialBrackets = generateBracketsFromTeamSelections(flights, selectedFormat);
      setBrackets(initialBrackets);
    }
  }, [flights, selectedFormat]);

  const generateBracketsFromTeamSelections = (flights: any[], format: string): BracketStructure[] => {
    const brackets: BracketStructure[] = [];
    
    flights.forEach((flight: any) => {
      const flightTeams = flight.teams || [];
      
      // Group teams by their bracket selection
      const teamsByBracket = flightTeams.reduce((acc: any, team: any) => {
        let bracketKey = 'unassigned';
        
        if (team.bracketId && team.bracketId !== -1) {
          // Team has selected a specific bracket
          bracketKey = `bracket_${team.bracketId}`;
        } else {
          // Team chose "Allow directors to choose" or has no bracket
          bracketKey = 'unassigned';
        }
        
        if (!acc[bracketKey]) {
          acc[bracketKey] = [];
        }
        acc[bracketKey].push(team);
        return acc;
      }, {});
      
      // Create brackets for teams that have made selections
      Object.entries(teamsByBracket).forEach(([bracketKey, teams]: [string, any]) => {
        if (bracketKey !== 'unassigned' && teams.length > 0) {
          const bracketName = teams[0].bracketName || `${flight.name} - ${bracketKey}`;
          const gameCalc = calculateGames(teams.length, format);
          
          brackets.push({
            id: `${flight.id}_${bracketKey}`,
            flightId: flight.id,
            flightName: `${flight.name} - ${bracketName}`,
            teamCount: teams.length,
            format: format as any,
            poolCount: getOptimalPoolCount(teams.length),
            teamsPerPool: Math.ceil(teams.length / getOptimalPoolCount(teams.length)),
            poolPlayGames: gameCalc.poolPlayGames,
            finalGames: gameCalc.finalGames,
            totalGames: gameCalc.totalGames,
            estimatedDuration: gameCalc.totalGames * 65
          });
        }
      });
      
      // Handle unassigned teams (those who chose "Allow directors to choose")
      if (teamsByBracket.unassigned && teamsByBracket.unassigned.length > 0) {
        const gameCalc = calculateGames(teamsByBracket.unassigned.length, format);
        
        brackets.push({
          id: `${flight.id}_unassigned`,
          flightId: flight.id,
          flightName: `${flight.name} - Director Assignment Needed`,
          teamCount: teamsByBracket.unassigned.length,
          format: format as any,
          poolCount: getOptimalPoolCount(teamsByBracket.unassigned.length),
          teamsPerPool: Math.ceil(teamsByBracket.unassigned.length / getOptimalPoolCount(teamsByBracket.unassigned.length)),
          poolPlayGames: gameCalc.poolPlayGames,
          finalGames: gameCalc.finalGames,
          totalGames: gameCalc.totalGames,
          estimatedDuration: gameCalc.totalGames * 65
        });
      }
    });
    
    return brackets;
  };

  const createBracketFromFlight = (flight: any, format: string): BracketStructure => {
    const teamCount = flight.teamIds?.length || flight.teams?.length || 0;
    const gameCalc = calculateGames(teamCount, format);
    
    return {
      id: `bracket_${flight.id}`,
      flightId: flight.id,
      flightName: flight.name,
      teamCount,
      format: format as any,
      poolCount: getOptimalPoolCount(teamCount),
      teamsPerPool: Math.ceil(teamCount / getOptimalPoolCount(teamCount)),
      poolPlayGames: gameCalc.poolPlayGames,
      finalGames: gameCalc.finalGames,
      totalGames: gameCalc.totalGames,
      estimatedDuration: gameCalc.totalGames * 65 // 65 minutes per game (including buffer)
    };
  };

  const calculateGames = (teamCount: number, format: string): GameCalculation => {
    if (teamCount < 2) {
      return {
        teamCount,
        poolPlayGames: 0,
        finalGames: 0,
        totalGames: 0,
        description: 'Not enough teams'
      };
    }

    let poolPlayGames = 0;
    let finalGames = 0;
    let description = '';

    switch (format) {
      case 'pool_play':
        // Round robin only
        poolPlayGames = (teamCount * (teamCount - 1)) / 2;
        finalGames = 0;
        description = `Round robin: ${poolPlayGames} games total`;
        break;
        
      case 'knockout':
        // Single elimination
        poolPlayGames = 0;
        finalGames = teamCount - 1;
        description = `Single elimination: ${finalGames} games`;
        break;
        
      case 'round_robin_knockout':
      default:
        // Pool play + finals
        if (teamCount <= 4) {
          // Small bracket: round robin + final
          poolPlayGames = (teamCount * (teamCount - 1)) / 2 - 1; // All matches except final
          finalGames = 1;
          description = `${poolPlayGames} pool games + 1 final`;
        } else if (teamCount <= 8) {
          // Medium bracket: 2 pools + finals
          const poolSize = Math.ceil(teamCount / 2);
          poolPlayGames = 2 * ((poolSize * (poolSize - 1)) / 2);
          finalGames = 3; // Semi-final, 3rd place, final
          description = `${poolPlayGames} pool games + 3 finals`;
        } else {
          // Large bracket: multiple pools + knockout
          const poolCount = Math.ceil(teamCount / 4);
          const avgPoolSize = Math.ceil(teamCount / poolCount);
          poolPlayGames = poolCount * ((avgPoolSize * (avgPoolSize - 1)) / 2);
          finalGames = Math.pow(2, Math.ceil(Math.log2(poolCount))) - 1;
          description = `${poolPlayGames} pool games + ${finalGames} knockout games`;
        }
        break;
    }

    return {
      teamCount,
      poolPlayGames,
      finalGames,
      totalGames: poolPlayGames + finalGames,
      description
    };
  };

  const getOptimalPoolCount = (teamCount: number): number => {
    if (teamCount <= 4) return 1;
    if (teamCount <= 8) return 2;
    if (teamCount <= 12) return 3;
    return Math.ceil(teamCount / 4);
  };

  const updateBracketFormat = (bracketId: string, newFormat: string) => {
    setBrackets(prev => prev.map(bracket => {
      if (bracket.id === bracketId) {
        const gameCalc = calculateGames(bracket.teamCount, newFormat);
        return {
          ...bracket,
          format: newFormat as any,
          poolPlayGames: gameCalc.poolPlayGames,
          finalGames: gameCalc.finalGames,
          totalGames: gameCalc.totalGames,
          estimatedDuration: gameCalc.totalGames * 65
        };
      }
      return bracket;
    }));
  };

  const getFormatBadge = (format: string) => {
    const colors = {
      pool_play: 'bg-blue-500 text-white',
      knockout: 'bg-red-500 text-white',
      round_robin_knockout: 'bg-green-500 text-white'
    };
    
    const labels = {
      pool_play: 'Pool Play Only',
      knockout: 'Knockout Only',
      round_robin_knockout: 'Pool + Knockout'
    };
    
    return (
      <Badge className={colors[format as keyof typeof colors]}>
        {labels[format as keyof typeof labels]}
      </Badge>
    );
  };

  const validateBrackets = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    brackets.forEach(bracket => {
      if (bracket.teamCount < 2) {
        errors.push(`${bracket.flightName} has insufficient teams (${bracket.teamCount})`);
      }
      if (bracket.totalGames === 0) {
        errors.push(`${bracket.flightName} has no games calculated`);
      }
    });
    
    if (brackets.length === 0) {
      errors.push('No brackets have been created');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleComplete = () => {
    const validation = validateBrackets();
    
    if (!validation.isValid) {
      onError(`Bracket validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    const bracketData = {
      brackets: brackets.map(bracket => ({
        ...bracket,
        pools: generatePoolStructure(bracket)
      })),
      summary: {
        totalBrackets: brackets.length,
        totalGames: brackets.reduce((sum, bracket) => sum + bracket.totalGames, 0),
        totalDuration: brackets.reduce((sum, bracket) => sum + bracket.estimatedDuration, 0),
        formats: Array.from(new Set(brackets.map(b => b.format)))
      }
    };
    
    onComplete(bracketData);
  };

  const generatePoolStructure = (bracket: BracketStructure) => {
    if (bracket.format === 'knockout') return [];
    
    const pools = [];
    const poolCount = bracket.poolCount || 1;
    const teamsPerPool = Math.ceil(bracket.teamCount / poolCount);
    
    for (let i = 0; i < poolCount; i++) {
      pools.push({
        id: `pool_${bracket.id}_${i + 1}`,
        name: `Pool ${String.fromCharCode(65 + i)}`, // Pool A, B, C, etc.
        maxTeams: teamsPerPool,
        teams: []
      });
    }
    
    return pools;
  };

  const getTotalSummary = () => {
    return {
      totalBrackets: brackets.length,
      totalTeams: brackets.reduce((sum, bracket) => sum + bracket.teamCount, 0),
      totalGames: brackets.reduce((sum, bracket) => sum + bracket.totalGames, 0),
      totalHours: Math.round(brackets.reduce((sum, bracket) => sum + bracket.estimatedDuration, 0) / 60)
    };
  };

  if (flights.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No flights found. Please complete the Flight Management step first.
        </AlertDescription>
      </Alert>
    );
  }

  const summary = getTotalSummary();

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tournament Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="defaultFormat">Default Format for All Brackets</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin_knockout">Pool Play + Knockout</SelectItem>
                  <SelectItem value="pool_play">Pool Play Only</SelectItem>
                  <SelectItem value="knockout">Knockout Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Format Guide:</strong>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li><strong>Pool Play + Knockout:</strong> Teams play round-robin in pools, then top teams advance to knockout finals</li>
                  <li><strong>Pool Play Only:</strong> Complete round-robin format where every team plays every other team</li>
                  <li><strong>Knockout Only:</strong> Single-elimination tournament format</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Bracket Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brackets.map(bracket => (
              <div key={bracket.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{bracket.flightName}</h3>
                    <p className="text-sm text-gray-600">{bracket.teamCount} teams</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getFormatBadge(bracket.format)}
                    <Select 
                      value={bracket.format} 
                      onValueChange={(value) => updateBracketFormat(bracket.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin_knockout">Pool + Knockout</SelectItem>
                        <SelectItem value="pool_play">Pool Play Only</SelectItem>
                        <SelectItem value="knockout">Knockout Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium text-blue-800">Pool Play Games</div>
                    <div className="text-xl font-bold text-blue-600">{bracket.poolPlayGames}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="font-medium text-green-800">Final Games</div>
                    <div className="text-xl font-bold text-green-600">{bracket.finalGames}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="font-medium text-purple-800">Total Games</div>
                    <div className="text-xl font-bold text-purple-600">{bracket.totalGames}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded">
                    <div className="font-medium text-amber-800">Est. Duration</div>
                    <div className="text-xl font-bold text-amber-600">{Math.round(bracket.estimatedDuration / 60)}h</div>
                  </div>
                </div>

                {bracket.format !== 'knockout' && bracket.poolCount && bracket.poolCount > 1 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium mb-2">Pool Structure</div>
                    <div className="text-sm text-gray-600">
                      {bracket.poolCount} pools with {bracket.teamsPerPool} teams each
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Game Calculation Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Game Calculation Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Count</TableHead>
                <TableHead>Pool Play Games</TableHead>
                <TableHead>Final Games</TableHead>
                <TableHead>Total Games</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[4, 6, 8, 12, 16].map(teamCount => {
                const calc = calculateGames(teamCount, 'round_robin_knockout');
                return (
                  <TableRow key={teamCount}>
                    <TableCell className="font-medium">{teamCount} teams</TableCell>
                    <TableCell>{calc.poolPlayGames}</TableCell>
                    <TableCell>{calc.finalGames}</TableCell>
                    <TableCell className="font-medium">{calc.totalGames}</TableCell>
                    <TableCell className="text-sm text-gray-600">{calc.description}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary & Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalBrackets}</div>
                <div className="text-sm text-gray-600">Brackets</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalTeams}</div>
                <div className="text-sm text-gray-600">Teams</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.totalGames}</div>
                <div className="text-sm text-gray-600">Total Games</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">{summary.totalHours}</div>
                <div className="text-sm text-gray-600">Est. Hours</div>
              </div>
            </div>

            <BracketValidation 
              brackets={brackets}
              onComplete={handleComplete}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BracketValidation({ brackets, onComplete }: any) {
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  brackets.forEach((bracket: BracketStructure) => {
    if (bracket.teamCount < 2) {
      validation.isValid = false;
      validation.errors.push(`${bracket.flightName} has insufficient teams (${bracket.teamCount})`);
    }
    if (bracket.totalGames === 0) {
      validation.isValid = false;
      validation.errors.push(`${bracket.flightName} has no games calculated`);
    }
    if (bracket.totalGames > 50) {
      validation.warnings.push(`${bracket.flightName} has a high number of games (${bracket.totalGames})`);
    }
  });

  if (brackets.length === 0) {
    validation.isValid = false;
    validation.errors.push('No brackets have been created');
  }

  return (
    <div className="space-y-4">
      {validation.errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Errors found:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Warnings:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All brackets are properly configured and ready for team seeding.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {brackets.length} brackets configured • {brackets.reduce((sum: number, b: BracketStructure) => sum + b.totalGames, 0)} total games
        </div>
        <Button 
          onClick={onComplete}
          disabled={!validation.isValid}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Bracket Setup
        </Button>
      </div>
    </div>
  );
}
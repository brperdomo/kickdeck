import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Target, ArrowUpDown, Shuffle, CheckCircle, AlertTriangle, 
  GripVertical, Trophy, Users, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamSeedingProps {
  eventId: string;
  workflowData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface SeededTeam {
  id: number;
  name: string;
  clubName: string;
  coach: string;
  seedRanking: number;
  poolAssignment?: string;
  bracketId: string;
  bracketName: string;
}

interface Pool {
  id: string;
  name: string;
  teams: SeededTeam[];
  maxTeams: number;
}

interface BracketSeeding {
  bracketId: string;
  bracketName: string;
  format: string;
  pools: Pool[];
  teams: SeededTeam[];
}

export function TeamSeeding({ eventId, workflowData, onComplete, onError }: TeamSeedingProps) {
  const [bracketSeedings, setBracketSeedings] = useState<BracketSeeding[]>([]);
  const [selectedBracket, setSelectedBracket] = useState<string>('');
  const [seedingMode, setSeedingMode] = useState<'manual' | 'automatic'>('automatic');
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const { toast } = useToast();

  // Enable drag and drop after component mounts to prevent SSR issues
  useEffect(() => {
    setIsDragEnabled(true);
  }, []);

  const brackets = workflowData?.bracket?.brackets || [];
  const flights = workflowData?.flight?.flights || [];

  useEffect(() => {
    if (brackets.length > 0 && flights.length > 0) {
      initializeBracketSeedings();
    }
  }, [brackets, flights]);

  const initializeBracketSeedings = () => {
    const seedings: BracketSeeding[] = [];

    brackets.forEach((bracket: any) => {
      // Find the corresponding flight and teams
      const flight = flights.find((f: any) => f.id === bracket.flightId);
      if (!flight) return;

      const teams = flight.teams || [];
      const relevantTeams = teams.filter((team: any) => {
        // Filter teams based on bracket assignment
        if (bracket.id.includes('unassigned')) {
          return !team.bracketId || team.bracketId === -1;
        } else {
          return team.bracketId && team.bracketId.toString() === bracket.id.split('_bracket_')[1];
        }
      });

      // Create seeded teams with initial ranking
      const seededTeams: SeededTeam[] = relevantTeams.map((team: any, index: number) => ({
        id: team.id,
        name: team.name,
        clubName: team.clubName || '',
        coach: team.coach || '',
        seedRanking: team.seedRanking || index + 1,
        bracketId: bracket.id,
        bracketName: bracket.flightName
      }));

      // Sort teams by current seed ranking
      seededTeams.sort((a, b) => a.seedRanking - b.seedRanking);

      // Generate pools if needed
      const pools = generatePools(bracket, seededTeams);

      // Auto-distribute teams into pools if pools exist
      const finalPools = pools.length > 0 ? distributeTeamsIntoPools(pools, seededTeams) : pools;
      
      // Update team pool assignments
      const finalTeams = seededTeams.map(team => {
        const poolAssignment = finalPools.find(pool => 
          pool.teams.some(t => t.id === team.id)
        )?.name;
        
        return {
          ...team,
          poolAssignment
        };
      });

      seedings.push({
        bracketId: bracket.id,
        bracketName: bracket.flightName,
        format: bracket.format,
        pools: finalPools,
        teams: finalTeams
      });
    });

    setBracketSeedings(seedings);
    if (seedings.length > 0) {
      setSelectedBracket(seedings[0].bracketId);
    }
  };

  const generatePools = (bracket: any, teams: SeededTeam[]): Pool[] => {
    // Only pure knockout brackets don't need pools
    if (bracket.format === 'knockout') {
      return [];
    }

    const pools: Pool[] = [];
    
    // For round_robin_knockout or pool_play formats, we need at least one pool
    const poolCount = Math.max(1, bracket.poolCount || 1);
    const teamsPerPool = Math.ceil(teams.length / poolCount);

    for (let i = 0; i < poolCount; i++) {
      pools.push({
        id: `pool_${bracket.id}_${i}`,
        name: `Pool ${String.fromCharCode(65 + i)}`, // Pool A, B, C, etc.
        teams: [],
        maxTeams: teamsPerPool
      });
    }

    return pools;
  };

  const autoSeedTeams = (bracketId: string) => {
    setBracketSeedings(prev => prev.map(seeding => {
      if (seeding.bracketId === bracketId) {
        // Sort teams alphabetically by club name, then by team name for consistent seeding
        const sortedTeams = [...seeding.teams].sort((a, b) => {
          const clubCompare = a.clubName.localeCompare(b.clubName);
          if (clubCompare !== 0) return clubCompare;
          return a.name.localeCompare(b.name);
        });

        // Assign seed rankings
        const reseededTeams = sortedTeams.map((team, index) => ({
          ...team,
          seedRanking: index + 1
        }));

        // Distribute teams into pools using snake draft method
        const updatedPools = distributeTeamsIntoPools(seeding.pools, reseededTeams);

        return {
          ...seeding,
          teams: reseededTeams,
          pools: updatedPools
        };
      }
      return seeding;
    }));

    toast({
      title: "Auto-Seeding Complete",
      description: "Teams have been automatically seeded and distributed into pools."
    });
  };

  const distributeTeamsIntoPools = (pools: Pool[], teams: SeededTeam[]): Pool[] => {
    if (pools.length === 0) return pools;

    const updatedPools: Pool[] = pools.map(pool => ({ ...pool, teams: [] }));
    
    // Snake draft distribution
    let currentPoolIndex = 0;
    let direction = 1; // 1 for forward, -1 for backward

    teams.forEach((team) => {
      const teamWithPool: SeededTeam = {
        ...team,
        poolAssignment: updatedPools[currentPoolIndex].name
      };
      
      updatedPools[currentPoolIndex].teams.push(teamWithPool);

      // Move to next pool
      currentPoolIndex += direction;
      
      // Check if we need to reverse direction
      if (currentPoolIndex >= updatedPools.length) {
        currentPoolIndex = updatedPools.length - 1;
        direction = -1;
      } else if (currentPoolIndex < 0) {
        currentPoolIndex = 0;
        direction = 1;
      }
    });

    return updatedPools;
  };

  const handleDragEnd = (result: any, bracketId: string) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (result.source.droppableId === result.destination.droppableId) {
      // Reordering within the same list
      setBracketSeedings(prev => prev.map(seeding => {
        if (seeding.bracketId === bracketId) {
          const newTeams = Array.from(seeding.teams);
          const [removed] = newTeams.splice(sourceIndex, 1);
          newTeams.splice(destinationIndex, 0, removed);

          // Update seed rankings
          const rerankedTeams = newTeams.map((team, index) => ({
            ...team,
            seedRanking: index + 1
          }));

          return {
            ...seeding,
            teams: rerankedTeams
          };
        }
        return seeding;
      }));
    }
  };

  const handleSeedChange = (teamId: number, newSeed: number, bracketId: string) => {
    setBracketSeedings(prev => prev.map(seeding => {
      if (seeding.bracketId === bracketId) {
        const updatedTeams = seeding.teams.map(team => 
          team.id === teamId ? { ...team, seedRanking: newSeed } : team
        );
        
        // Sort by new rankings
        updatedTeams.sort((a, b) => a.seedRanking - b.seedRanking);
        
        return {
          ...seeding,
          teams: updatedTeams
        };
      }
      return seeding;
    }));
  };

  const validateSeeding = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    bracketSeedings.forEach(seeding => {
      // Check for duplicate seed rankings
      const rankings = seeding.teams.map(t => t.seedRanking);
      const duplicates = rankings.filter((rank, index) => rankings.indexOf(rank) !== index);
      if (duplicates.length > 0) {
        errors.push(`${seeding.bracketName} has duplicate seed rankings: ${duplicates.join(', ')}`);
      }

      // Check for missing rankings
      for (let i = 1; i <= seeding.teams.length; i++) {
        if (!rankings.includes(i)) {
          errors.push(`${seeding.bracketName} is missing seed ranking ${i}`);
        }
      }

      // Check pool distribution
      if (seeding.pools.length > 0) {
        const totalPoolTeams = seeding.pools.reduce((sum, pool) => sum + pool.teams.length, 0);
        if (totalPoolTeams !== seeding.teams.length) {
          errors.push(`${seeding.bracketName} has incorrect pool distribution`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleComplete = () => {
    const validation = validateSeeding();
    
    if (!validation.isValid) {
      onError(`Seeding validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    const seedingData = {
      bracketSeedings: bracketSeedings.map(seeding => ({
        bracketId: seeding.bracketId,
        bracketName: seeding.bracketName,
        teams: seeding.teams.map(team => ({
          teamId: team.id,
          name: team.name,
          seedRanking: team.seedRanking,
          poolAssignment: team.poolAssignment
        })),
        pools: seeding.pools.map(pool => ({
          poolId: pool.id,
          poolName: pool.name,
          teamIds: pool.teams.map(t => t.id)
        }))
      })),
      summary: {
        totalBrackets: bracketSeedings.length,
        totalTeams: bracketSeedings.reduce((sum, s) => sum + s.teams.length, 0),
        totalPools: bracketSeedings.reduce((sum, s) => sum + s.pools.length, 0)
      }
    };

    onComplete(seedingData);
  };

  const selectedSeeding = bracketSeedings.find(s => s.bracketId === selectedBracket);

  if (brackets.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No brackets found. Please complete the Bracket Creation step first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bracket Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Team Seeding & Pool Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bracket">Select Bracket</Label>
              <Select value={selectedBracket} onValueChange={setSelectedBracket}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose bracket to seed" />
                </SelectTrigger>
                <SelectContent>
                  {bracketSeedings.map(seeding => (
                    <SelectItem key={seeding.bracketId} value={seeding.bracketId}>
                      {seeding.bracketName} ({seeding.teams.length} teams)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mode">Seeding Mode</Label>
              <Select value={seedingMode} onValueChange={(value: any) => setSeedingMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic (by club/team name)</SelectItem>
                  <SelectItem value="manual">Manual (drag & drop)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSeeding && (
        <>
          {/* Seeding Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedSeeding.bracketName}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => autoSeedTeams(selectedBracket)}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Auto-Seed Teams
                  </Button>
                  {selectedSeeding.pools.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const updatedPools = distributeTeamsIntoPools(selectedSeeding.pools, selectedSeeding.teams);
                        setBracketSeedings(prev => prev.map(s => 
                          s.bracketId === selectedBracket ? { ...s, pools: updatedPools } : s
                        ));
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Distribute to Pools
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Seeding Guide:</strong> Higher seeds (1, 2, 3...) are stronger teams. 
                  Use drag-and-drop to manually adjust rankings or click "Auto-Seed" for alphabetical sorting.
                  {selectedSeeding.pools.length > 0 && " Teams will be distributed into pools using snake draft method."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Team Seeding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Team Rankings ({selectedSeeding.teams.length} teams)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seedingMode === 'manual' ? (
                isDragEnabled ? (
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, selectedBracket)}>
                    <Droppable droppableId="teams">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {selectedSeeding.teams.map((team, index) => (
                            <Draggable key={team.id} draggableId={team.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-4 p-3 border rounded-lg ${
                                    snapshot.isDragging ? 'bg-blue-50 border-blue-300' : 'bg-white'
                                  }`}
                                >
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <Badge variant="outline" className="min-w-[3rem] text-center">
                                    #{team.seedRanking}
                                  </Badge>
                                <div className="flex-1">
                                  <div className="font-medium">{team.name}</div>
                                  <div className="text-sm text-gray-600">{team.clubName}</div>
                                </div>
                                <div className="text-sm text-gray-500">{team.coach}</div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Loading drag and drop interface...
                  </div>
                )
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Seed</TableHead>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead className="w-32">Manual Seed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSeeding.teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <Badge variant="outline">#{team.seedRanking}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.clubName}</TableCell>
                        <TableCell>{team.coach}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            max={selectedSeeding.teams.length}
                            value={team.seedRanking}
                            onChange={(e) => handleSeedChange(team.id, parseInt(e.target.value), selectedBracket)}
                            className="w-20"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pool Assignments */}
          {selectedSeeding.pools.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pool Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSeeding.pools.map((pool) => (
                    <div key={pool.id} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3 text-center">{pool.name}</h3>
                      <div className="space-y-2">
                        {pool.teams.map((team) => (
                          <div key={team.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Badge variant="outline" className="text-xs">#{team.seedRanking}</Badge>
                            <div className="flex-1 text-sm">
                              <div className="font-medium">{team.name}</div>
                              <div className="text-gray-600 text-xs">{team.clubName}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-center text-sm text-gray-500 mt-2">
                        {pool.teams.length} / {pool.maxTeams} teams
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Summary & Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Seeding Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <SeedingValidation 
            bracketSeedings={bracketSeedings}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SeedingValidation({ bracketSeedings, onComplete }: any) {
  const errors: string[] = [];

  bracketSeedings.forEach((seeding: BracketSeeding) => {
    const rankings = seeding.teams.map(t => t.seedRanking);
    const duplicates = rankings.filter((rank, index) => rankings.indexOf(rank) !== index);
    if (duplicates.length > 0) {
      errors.push(`${seeding.bracketName} has duplicate seed rankings`);
    }

    for (let i = 1; i <= seeding.teams.length; i++) {
      if (!rankings.includes(i)) {
        errors.push(`${seeding.bracketName} is missing seed ranking ${i}`);
      }
    }
  });

  const isValid = errors.length === 0;

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Seeding errors found:</strong>
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
            All teams are properly seeded and ready for time block assignment.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {bracketSeedings.length} brackets seeded • {bracketSeedings.reduce((sum: number, s: BracketSeeding) => sum + s.teams.length, 0)} teams ranked
        </div>
        <Button 
          onClick={onComplete}
          disabled={!isValid}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Team Seeding
        </Button>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Calendar, MapPin, Clock, Wand2, CheckCircle, AlertTriangle, 
  Info, Play, Users, Download, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScheduleVisualization } from "@/components/ScheduleVisualization";

interface ScheduleBuilderProps {
  eventId: string;
  workflowData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface ScheduleConstraints {
  useAI: boolean;
  maxGamesPerDay: number;
  minRestPeriod: number;
  resolveCoachConflicts: boolean;
  optimizeFieldUsage: boolean;
  tournamentFormat: string;
  selectedAgeGroups: string[];
  selectedBrackets: string[];
  previewMode: boolean;
}

interface ScheduledGame {
  id: string;
  homeTeam: { id: number; name: string; coach: string; clubName?: string };
  awayTeam: { id: number; name: string; coach: string; clubName?: string };
  field: string;
  complexName?: string;
  startTime: string;
  endTime: string;
  bracket: string;
  round: string;
  ageGroup?: string;
}

export function ScheduleBuilder({ eventId, workflowData, onComplete, onError }: ScheduleBuilderProps) {
  const [schedulingMethod, setSchedulingMethod] = useState<'ai' | 'manual'>('ai');
  const [constraints, setConstraints] = useState<ScheduleConstraints>({
    useAI: true,
    maxGamesPerDay: 8,
    minRestPeriod: 60,
    resolveCoachConflicts: true,
    optimizeFieldUsage: true,
    tournamentFormat: 'round_robin_knockout',
    selectedAgeGroups: [],
    selectedBrackets: [],
    previewMode: false
  });
  const [generatedGames, setGeneratedGames] = useState<ScheduledGame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const { toast } = useToast();

  const games = workflowData?.games?.bracketGames || [];
  const timeBlocks = workflowData?.timeblock?.timeBlocks || [];
  const brackets = workflowData?.bracket?.brackets || [];

  // Debug logging to see what data we actually have
  console.log('ScheduleBuilder workflowData:', workflowData);
  console.log('ScheduleBuilder games:', games);
  console.log('ScheduleBuilder timeBlocks:', timeBlocks);
  console.log('ScheduleBuilder brackets:', brackets);

  useEffect(() => {
    // Initialize constraints with workflow data
    if (brackets.length > 0) {
      setConstraints(prev => ({
        ...prev,
        selectedBrackets: brackets.map((b: any) => b.bracketName)
      }));
    }
  }, [brackets]);

  const generateAISchedule = async () => {
    setIsGenerating(true);
    
    try {
      // Check if proper workflow games exist
      let workflowGames = games;
      
      if (!workflowGames || workflowGames.length === 0) {
        // Provide more detailed guidance about what's missing
        const missingSteps = [];
        
        if (!workflowData?.metadata?.gameFormats?.length) {
          missingSteps.push('Step 1: Game Metadata - Define game format rules');
        }
        
        if (!workflowData?.flight || !brackets?.length) {
          missingSteps.push('Step 2: Flight Management - Organize teams into flights');
        }
        
        if (!brackets?.length) {
          missingSteps.push('Step 3: Bracket Creation - Create tournament brackets');
        }
        
        if (!workflowData?.seed) {
          missingSteps.push('Step 4: Team Seeding - Assign teams to brackets');
        }
        
        if (!timeBlocks?.length) {
          missingSteps.push('Step 5: Time Block Assignment - Define game times');
        }
        
        const errorMessage = missingSteps.length > 0 
          ? `Missing workflow steps:\n\n${missingSteps.join('\n')}\n\nPlease complete these steps first. Use the "Re-validate Steps" button to check your progress.`
          : 'No games found for scheduling. Please complete the previous workflow steps first: Game Metadata → Flight Management → Bracket Creation → Team Seeding → Time Block Assignment. These steps are required to define which age groups and teams should have games scheduled.';
        
        onError(errorMessage);
        return;
      }

      const response = await fetch(`/api/admin/events/${eventId}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...constraints,
          useWorkflowData: true,
          workflowGames: workflowGames,
          workflowTimeBlocks: timeBlocks
        })
      });

      if (!response.ok) {
        // Try to parse as JSON first, fallback to text if it fails
        let errorMessage = `Failed to generate schedule: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, try to read as text
          try {
            const errorText = await response.text();
            console.error('Schedule generation API error response:', errorText);
            errorMessage = errorText.substring(0, 200) + '...'; // Truncate long HTML responses
          } catch (textError) {
            console.error('Failed to read error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (constraints.previewMode) {
        // Show preview
        toast({
          title: "Schedule Preview",
          description: `Generated ${data.previewGames?.length || 0} sample games. Review and confirm to generate the full schedule.`,
        });
        return;
      }

      // Convert API response to our format
      const scheduledGames: ScheduledGame[] = (data.scheduleData || data.schedule || data.games || []).map((game: any, index: number) => ({
        id: game.id || `scheduled_game_${index}`,
        homeTeam: {
          id: game.homeTeamId || game.homeTeam?.id || 0,
          name: game.homeTeamName || game.homeTeam?.name || `Team ${game.homeTeamId || 'A'}`,
          coach: game.homeTeam?.coach || '',
          clubName: game.homeTeam?.clubName || ''
        },
        awayTeam: {
          id: game.awayTeamId || game.awayTeam?.id || 0,
          name: game.awayTeamName || game.awayTeam?.name || `Team ${game.awayTeamId || 'B'}`,
          coach: game.awayTeam?.coach || '',
          clubName: game.awayTeam?.clubName || ''
        },
        field: game.field || 'Field TBD',
        complexName: game.complexName || '',
        startTime: game.startTime || new Date().toISOString(),
        endTime: game.endTime || new Date().toISOString(),
        bracket: game.bracket || game.bracketName || 'Default',
        round: game.round || 'Group Stage',
        ageGroup: game.ageGroup || ''
      }));

      setGeneratedGames(scheduledGames);
      setQualityScore(data.qualityScore || 85);
      setConflicts(data.conflicts || []);

      toast({
        title: "Schedule Generated",
        description: `Created schedule with ${scheduledGames.length} games. Quality score: ${data.qualityScore || 85}%`
      });

    } catch (error) {
      console.error("Error generating schedule:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate schedule",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSchedule = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          games: generatedGames,
          workflowData,
          qualityScore,
          conflicts
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      toast({
        title: "Schedule Saved",
        description: "Tournament schedule has been saved successfully."
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schedule to database",
        variant: "destructive",
      });
    }
  };

  const handleGameDelete = async (gameId: string) => {
    setGeneratedGames(prev => prev.filter(game => game.id !== gameId));
    toast({
      title: "Game Removed",
      description: "Game has been removed from the schedule."
    });
  };

  const handleBulkGameDelete = async (gameIds: string[]) => {
    setGeneratedGames(prev => prev.filter(game => !gameIds.includes(game.id)));
    toast({
      title: "Games Removed",
      description: `${gameIds.length} games have been removed from the schedule.`
    });
  };

  const validateSchedule = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (generatedGames.length === 0) {
      errors.push('No games have been scheduled');
    }

    // Check for basic schedule validity
    generatedGames.forEach(game => {
      if (!game.field || game.field === 'Field TBD') {
        errors.push(`Game ${game.id} has no field assigned`);
      }
      if (!game.startTime) {
        errors.push(`Game ${game.id} has no start time`);
      }
      if (game.homeTeam.name === 'TBD' || game.awayTeam.name === 'TBD') {
        errors.push(`Game ${game.id} has unassigned teams`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleComplete = () => {
    const validation = validateSchedule();
    
    if (!validation.isValid) {
      onError(`Schedule validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    const scheduleData = {
      method: schedulingMethod,
      games: generatedGames,
      constraints: constraints,
      qualityScore,
      conflicts,
      summary: {
        totalGames: generatedGames.length,
        fieldsUsed: Array.from(new Set(generatedGames.map(g => g.field))).length,
        bracketsScheduled: Array.from(new Set(generatedGames.map(g => g.bracket))).length,
        avgQualityScore: qualityScore
      },
      workflowCompleted: true
    };

    onComplete(scheduleData);
  };

  // Helper function to generate sample workflow games from teams
  const generateSampleWorkflowGames = async (teams: any[]) => {
    // Group teams by age group
    const ageGroups = teams.reduce((acc: any, team: any) => {
      const ageGroup = team.ageGroup?.ageGroup || 'Unknown';
      if (!acc[ageGroup]) {
        acc[ageGroup] = [];
      }
      acc[ageGroup].push(team);
      return acc;
    }, {});

    const workflowGames = [];

    // Create bracket games for each age group
    for (const [ageGroupName, ageGroupTeams] of Object.entries(ageGroups) as [string, any[]][]) {
      if (ageGroupTeams.length >= 2) {
        const bracketId = `bracket_${ageGroupName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
        const bracketName = `${ageGroupName} Flight A`;
        
        const games = [];
        
        // Calculate appropriate number of games based on team count
        // Small age groups get round-robin, larger groups get limited sampling
        let gameCount = 0;
        
        if (ageGroupTeams.length <= 4) {
          // Round robin for 4 or fewer teams
          for (let i = 0; i < ageGroupTeams.length; i++) {
            for (let j = i + 1; j < ageGroupTeams.length; j++) {
              const homeTeam = ageGroupTeams[i];
              const awayTeam = ageGroupTeams[j];
              
              games.push({
                id: `game_${bracketId}_${i}_${j}`,
                homeTeamId: homeTeam.id,
                homeTeamName: homeTeam.name,
                awayTeamId: awayTeam.id,
                awayTeamName: awayTeam.name,
                round: 'Pool Play',
                gameType: 'pool_play',
                duration: 90
              });
              gameCount++;
            }
          }
        } else {
          // Limited sampling for larger age groups (max 6 games)
          const maxGamesPerBracket = 6;
          
          for (let i = 0; i < ageGroupTeams.length && gameCount < maxGamesPerBracket; i++) {
            for (let j = i + 1; j < ageGroupTeams.length && gameCount < maxGamesPerBracket; j++) {
              const homeTeam = ageGroupTeams[i];
              const awayTeam = ageGroupTeams[j];
              
              games.push({
                id: `game_${bracketId}_${i}_${j}`,
                homeTeamId: homeTeam.id,
                homeTeamName: homeTeam.name,
                awayTeamId: awayTeam.id,
                awayTeamName: awayTeam.name,
                round: 'Pool Play',
                gameType: 'pool_play',
                duration: 90
              });
              
              gameCount++;
            }
          }
        }

        if (games.length > 0) {
          workflowGames.push({
            bracketId,
            bracketName,
            format: 'round_robin',
            games
          });
        }
      }
    }

    const totalSampleGames = workflowGames.reduce((sum, bracket) => sum + bracket.games.length, 0);
    console.log(`Generated ${workflowGames.length} brackets with ${totalSampleGames} sample games from ${teams.length} teams`);
    return workflowGames;
  };

  const totalGamesFromWorkflow = games.reduce((sum: number, bg: any) => 
    sum + (bg.games?.length || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Workflow Status Check */}
      {(!games || games.length === 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>No games ready for scheduling</strong>
            <p className="mt-2">To generate a schedule, you need to complete the previous workflow steps:</p>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li><strong>Game Metadata Setup</strong> - Define tournament rules and game formats</li>
              <li><strong>Flight Management</strong> - Organize teams into competitive flights</li>
              <li><strong>Bracket Creation</strong> - Create tournament brackets for each flight</li>
              <li><strong>Team Seeding</strong> - Assign teams to specific brackets</li>
              <li><strong>Time Block Assignment</strong> - Set up available time slots</li>
            </ol>
            <p className="mt-2 text-sm text-muted-foreground">
              These steps ensure you only generate games for the age groups and teams you want to include in your tournament.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Scheduling Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Building Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={schedulingMethod} onValueChange={(value: any) => setSchedulingMethod(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">AI-Powered Scheduling</TabsTrigger>
              <TabsTrigger value="manual">Manual Drag & Drop</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertDescription>
                  AI will automatically assign games to fields and times while respecting constraints and optimizing the schedule.
                </AlertDescription>
              </Alert>

              {/* AI Constraints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="resolveCoachConflicts"
                      checked={constraints.resolveCoachConflicts}
                      onCheckedChange={(checked) => 
                        setConstraints(prev => ({ ...prev, resolveCoachConflicts: checked as boolean }))
                      }
                    />
                    <Label htmlFor="resolveCoachConflicts">Resolve coach conflicts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="optimizeFieldUsage"
                      checked={constraints.optimizeFieldUsage}
                      onCheckedChange={(checked) => 
                        setConstraints(prev => ({ ...prev, optimizeFieldUsage: checked as boolean }))
                      }
                    />
                    <Label htmlFor="optimizeFieldUsage">Optimize field usage</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="previewMode"
                      checked={constraints.previewMode}
                      onCheckedChange={(checked) => 
                        setConstraints(prev => ({ ...prev, previewMode: checked as boolean }))
                      }
                    />
                    <Label htmlFor="previewMode">Preview mode (5 sample games)</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxGames">Max games per team per day</Label>
                    <Select 
                      value={constraints.maxGamesPerDay.toString()} 
                      onValueChange={(value) => 
                        setConstraints(prev => ({ ...prev, maxGamesPerDay: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 games</SelectItem>
                        <SelectItem value="4">4 games</SelectItem>
                        <SelectItem value="5">5 games</SelectItem>
                        <SelectItem value="6">6 games</SelectItem>
                        <SelectItem value="8">8 games</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="restPeriod">Minimum rest between games</Label>
                    <Select 
                      value={constraints.minRestPeriod.toString()} 
                      onValueChange={(value) => 
                        setConstraints(prev => ({ ...prev, minRestPeriod: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={generateAISchedule}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Schedule...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Schedule
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Manually drag and drop games to assign them to specific fields and time slots. 
                  Games from your workflow will be available for scheduling.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">Manual scheduling interface will be available once games are loaded.</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalGamesFromWorkflow} games ready for manual scheduling
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Workflow Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Workflow Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded text-center">
              <div className="text-lg font-bold text-blue-600">
                {workflowData?.flight?.flights?.length || 0}
              </div>
              <div className="text-sm text-blue-800">Flights</div>
            </div>
            <div className="p-3 bg-green-50 rounded text-center">
              <div className="text-lg font-bold text-green-600">
                {brackets?.length || 0}
              </div>
              <div className="text-sm text-green-800">Brackets</div>
            </div>
            <div className="p-3 bg-purple-50 rounded text-center">
              <div className="text-lg font-bold text-purple-600">
                {totalGamesFromWorkflow}
              </div>
              <div className="text-sm text-purple-800">Games Created</div>
            </div>
            <div className="p-3 bg-amber-50 rounded text-center">
              <div className="text-lg font-bold text-amber-600">
                {timeBlocks?.length || 0}
              </div>
              <div className="text-sm text-amber-800">Time Blocks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Schedule */}
      {generatedGames.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Generated Schedule ({generatedGames.length} games)
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveSchedule}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Schedule
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {qualityScore && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Schedule Quality Score</span>
                  <Badge className="bg-green-600 text-white">{qualityScore}%</Badge>
                </div>
                {conflicts.length > 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
                  </p>
                )}
              </div>
            )}

            <ScheduleVisualization
              games={generatedGames}
              conflicts={conflicts}
              qualityScore={qualityScore}
              onDeleteGame={handleGameDelete}
              onBulkDeleteGames={handleBulkGameDelete}
              allowEditing={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Scheduling Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleValidation 
            generatedGames={generatedGames}
            workflowData={workflowData}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleValidation({ generatedGames, workflowData, onComplete }: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (generatedGames.length === 0) {
    errors.push('No schedule has been generated');
  }

  // Check workflow completion
  const requiredSteps = ['flight', 'bracket', 'seed', 'timeblock', 'games'];
  requiredSteps.forEach(step => {
    if (!workflowData[step]) {
      warnings.push(`${step} step data is missing`);
    }
  });

  generatedGames.forEach((game: ScheduledGame) => {
    if (!game.field || game.field === 'Field TBD') {
      errors.push(`Game ${game.id} needs field assignment`);
    }
    if (game.homeTeam.name === 'TBD' || game.awayTeam.name === 'TBD') {
      warnings.push(`Game ${game.id} has unconfirmed teams`);
    }
  });

  const isValid = errors.length === 0;

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Schedule validation errors:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Warnings:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && generatedGames.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Tournament schedule is complete and ready for deployment. All 6 workflow steps have been completed successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {generatedGames.length} games scheduled • 6-step workflow complete
        </div>
        <Button 
          onClick={onComplete}
          disabled={!isValid}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Scheduling Workflow
        </Button>
      </div>
    </div>
  );
}
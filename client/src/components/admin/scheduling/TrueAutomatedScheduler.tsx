import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, Calendar, CheckCircle, Loader2, 
  Trophy, Users, Clock, MapPin, AlertTriangle, Settings 
} from 'lucide-react';

interface TrueAutomatedSchedulerProps {
  eventId: string;
  onComplete?: (scheduleData: any) => void;
}

interface GeneratedGame {
  id: number;
  homeTeam: string;
  awayTeam: string;
  ageGroup: string;
  gender: string;
  round: number;
  field: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface GeneratedFlight {
  name: string;
  ageGroup: string;
  gender: string;
  teamCount: number;
  gameCount: number;
  teams: string[];
}

interface GeneratedSchedule {
  totalGames: number;
  totalFlights: number;
  scheduledDays: number;
  gamesByDay: { [key: string]: number };
  conflicts: string[];
  warnings: string[];
  scheduleUrl: string;
  games?: GeneratedGame[];
  flights?: GeneratedFlight[];
  gameFormats?: {
    gameDuration: number;
    restPeriod: number;
    operatingHours: string;
  };
}

export function TrueAutomatedScheduler({ eventId, onComplete }: TrueAutomatedSchedulerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const { toast } = useToast();

  // Enhanced data check - get comprehensive readiness status
  const { data: eventData } = useQuery({
    queryKey: ['event-quick-check', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/quick-check`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch event data');
      return response.json();
    }
  });

  // Get detailed flight readiness
  const { data: flightReadiness } = useQuery({
    queryKey: ['bracket-creation', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/bracket-creation`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch flight data');
      return response.json();
    }
  });

  // True one-click automation
  const generateSchedule = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/generate-complete-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          autoMode: true,
          generateAll: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate schedule');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedSchedule(data);
      toast({
        title: "Schedule Generated Successfully!",
        description: `Created complete tournament schedule with ${data.totalGames} games across ${data.scheduledDays} days.`
      });
      onComplete?.(data);
    },
    onError: (error) => {
      toast({
        title: "Schedule Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setIsGenerating(false);
      setProgress(0);
    }
  });

  const handleGenerateSchedule = async () => {
    if (!eventData?.approvedTeamCount || eventData.approvedTeamCount < 2) {
      toast({
        title: "Cannot Generate Schedule",
        description: "Need at least 2 approved teams to generate a tournament schedule.",
        variant: "destructive"
      });
      return;
    }

    // Check flight readiness
    const configuredFlights = flightReadiness?.flights?.filter((f: any) => f.isConfigured) || [];
    const readyFlights = flightReadiness?.flights?.filter((f: any) => 
      f.isConfigured && f.assignedTeams >= 3 && f.bracketType !== 'Not Configured'
    ) || [];
    
    if (readyFlights.length === 0) {
      toast({
        title: "Flights Not Ready for Scheduling",
        description: `Need at least 1 flight with 3+ teams and configured game format. Currently ${configuredFlights.length} flights configured.`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedSchedule(null);

    // Simulate realistic progress updates
    const progressSteps = [
      { progress: 15, action: 'Analyzing approved teams...' },
      { progress: 30, action: 'Creating flights by age group...' },
      { progress: 45, action: 'Generating optimal brackets...' },
      { progress: 60, action: 'Assigning teams to brackets...' },
      { progress: 75, action: 'Scheduling games and fields...' },
      { progress: 90, action: 'Finalizing tournament schedule...' },
      { progress: 100, action: 'Schedule generation complete!' }
    ];

    // Run progress updates while API call happens
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        const step = progressSteps[stepIndex];
        setProgress(step.progress);
        setCurrentAction(step.action);
        stepIndex++;
      } else {
        clearInterval(progressInterval);
      }
    }, 800);

    // Start the actual API call
    try {
      await generateSchedule.mutateAsync();
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setProgress(100);
      setCurrentAction('');
    }
  };

  const getTeamCountColor = (count: number) => {
    if (count < 4) return 'text-orange-600';
    if (count < 8) return 'text-blue-600';
    return 'text-green-600';
  };

  if (!eventData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading tournament data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <Zap className="h-6 w-6" />
            One-Click Tournament Scheduling
          </CardTitle>
          <p className="text-green-100">
            Generate your complete tournament schedule instantly - no configuration required!
          </p>
        </CardHeader>
      </Card>

      {/* Quick Tournament Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Ready Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTeamCountColor(eventData.approvedTeamCount)}`}>
                {eventData.approvedTeamCount}
              </div>
              <div className="text-sm text-muted-foreground">Approved Teams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {eventData.ageGroupCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Age Groups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {eventData.availableFields || 0}
              </div>
              <div className="text-sm text-muted-foreground">Available Fields</div>
            </div>
          </div>

          {eventData.approvedTeamCount < 2 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need at least 2 approved teams to generate a tournament schedule. 
                Current approved teams: {eventData.approvedTeamCount}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Flight Readiness Display */}
      {flightReadiness?.flights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Flight Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flightReadiness.flights.map((flight: any, index: number) => {
                const isReady = flight.isConfigured && flight.assignedTeams >= 3 && flight.bracketType !== 'Not Configured';
                const statusColor = isReady ? 'text-green-600' : 'text-orange-600';
                const statusIcon = isReady ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {statusIcon}
                      <div>
                        <div className="font-medium">{flight.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {flight.ageGroup} {flight.gender} • {flight.assignedTeams} teams
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isReady ? "default" : "secondary"} className={statusColor}>
                        {flight.bracketType || 'Not Configured'}
                      </Badge>
                      <Badge variant="outline">
                        {isReady ? 'Ready' : 'Needs Setup'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {flightReadiness.flights.length > 0 && (
              <Alert className="mt-4">
                <AlertDescription>
                  {flightReadiness.flights.filter((f: any) => f.isConfigured && f.assignedTeams >= 3 && f.bracketType !== 'Not Configured').length} of {flightReadiness.flights.length} flights are ready for scheduling.
                  Flights need 3+ teams and configured game formats to be schedulable.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {generatedSchedule ? 'Schedule Generated!' : 'Generate Complete Schedule'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!generatedSchedule && !isGenerating && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Click the button below to automatically generate your complete tournament schedule.
                This will create flights, brackets, team assignments, and game times all at once.
              </p>
              
              <Button 
                onClick={handleGenerateSchedule}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                disabled={eventData.approvedTeamCount < 2}
              >
                <Zap className="h-5 w-5 mr-2" />
                Generate Complete Schedule
              </Button>

              <div className="text-xs text-muted-foreground">
                This will automatically handle all scheduling complexities for you
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <div className="font-medium">{currentAction}</div>
                <div className="text-sm text-muted-foreground">
                  Generating your tournament schedule...
                </div>
              </div>
              <Progress value={progress} className="w-full h-3" />
              <div className="text-center text-sm text-muted-foreground">
                {progress}% Complete
              </div>
            </div>
          )}

          {generatedSchedule && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Tournament Schedule Ready!</h3>
                <p className="text-muted-foreground">
                  Your complete tournament schedule has been generated and is ready for review.
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{generatedSchedule.totalGames}</div>
                  <div className="text-sm text-muted-foreground">Total Games</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{generatedSchedule.totalFlights}</div>
                  <div className="text-sm text-muted-foreground">Flights Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{generatedSchedule.scheduledDays}</div>
                  <div className="text-sm text-muted-foreground">Tournament Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {generatedSchedule.conflicts?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Conflicts</div>
                </div>
              </div>

              {/* Flight Organization */}
              {generatedSchedule.flights && generatedSchedule.flights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Flight Organization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {generatedSchedule.flights.map((flight, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{flight.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {flight.teamCount} teams • {flight.gameCount} games
                              </p>
                            </div>
                            <Badge variant={flight.gender === 'Boys' ? 'default' : flight.gender === 'Girls' ? 'secondary' : 'outline'}>
                              {flight.ageGroup}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Teams: </span>
                            {flight.teams.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generated Games */}
              {generatedSchedule.games && generatedSchedule.games.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Generated Games Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {generatedSchedule.games.map((game, index) => (
                        <div key={game.id || index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-lg">
                                {game.homeTeam} vs {game.awayTeam}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {game.ageGroup} {game.gender} • Round {game.round}
                              </div>
                            </div>
                            <Badge variant="outline">{game.ageGroup}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Field: </span>
                              {game.field}
                            </div>
                            <div>
                              <span className="font-medium">Time: </span>
                              {game.startTime !== 'TBD' ? 
                                new Date(game.startTime).toLocaleString() : 
                                'TBD'
                              }
                            </div>
                            <div>
                              <span className="font-medium">Duration: </span>
                              {game.duration} minutes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Game Format Information */}
              {generatedSchedule.gameFormats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Applied Game Formats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Game Duration: </span>
                        {generatedSchedule.gameFormats.gameDuration} minutes
                      </div>
                      <div>
                        <span className="font-medium">Rest Period: </span>
                        {generatedSchedule.gameFormats.restPeriod} minutes
                      </div>
                      <div>
                        <span className="font-medium">Operating Hours: </span>
                        {generatedSchedule.gameFormats.operatingHours}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {generatedSchedule.warnings && generatedSchedule.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Schedule Warnings:</strong>
                    <ul className="mt-2 ml-4 list-disc">
                      {generatedSchedule.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-3">
                <Button 
                  onClick={() => window.open(generatedSchedule.scheduleUrl, '_blank')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  View Complete Schedule
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Schedule is ready to publish to teams and parents
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Clock, Calendar, Zap, Info, Timer, Users } from 'lucide-react';

interface GameSchedulingStepProps {
  eventId: string;
  onComplete: (data: any) => void;
}

interface Game {
  id: number;
  bracketId: string;
  homeTeam: string;
  awayTeam: string;
  gameNumber: number;
  round: number;
  status: string;
  scheduledTime?: string;
  estimatedDuration: number;
}

interface SchedulingParameters {
  startTime: string;
  endTime: string;
  gameDuration: number;
  restPeriod: number;
  simultaneousGames: number;
}

export function GameSchedulingStep({ eventId, onComplete }: GameSchedulingStepProps) {
  const [schedulingParams, setSchedulingParams] = useState<SchedulingParameters>({
    startTime: '08:00',
    endTime: '18:00',
    gameDuration: 90,
    restPeriod: 15,
    simultaneousGames: 4
  });
  
  const queryClient = useQueryClient();

  // Fetch generated games from brackets
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['tournament-games', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    }
  });

  // Fetch event details for date range
  const { data: eventDetails, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch event details');
      return response.json();
    }
  });

  // Generate game schedule mutation
  const generateScheduleMutation = useMutation({
    mutationFn: async (params: SchedulingParameters) => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...params,
          startDate: eventDetails?.startDate,
          endDate: eventDetails?.endDate
        })
      });
      if (!response.ok) throw new Error('Failed to generate schedule');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-games', eventId] });
      toast({ 
        title: 'Schedule generated successfully',
        description: `Scheduled ${data.gamesScheduled} games across ${data.daysUsed} days`
      });
    }
  });

  // Auto-optimize schedule mutation
  const optimizeScheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedulingParams)
      });
      if (!response.ok) throw new Error('Failed to optimize schedule');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-games', eventId] });
      toast({ 
        title: 'Schedule optimized',
        description: `Reduced conflicts by ${data.conflictsReduced}% and improved balance by ${data.balanceImproved}%`
      });
    }
  });

  const handleGenerateSchedule = () => {
    generateScheduleMutation.mutate(schedulingParams);
  };

  const handleOptimizeSchedule = () => {
    optimizeScheduleMutation.mutate();
  };

  const handleComplete = () => {
    if (!games || games.filter((g: Game) => g.scheduledTime).length === 0) {
      toast({ 
        title: 'No scheduled games',
        description: 'Please generate a game schedule before proceeding',
        variant: 'destructive'
      });
      return;
    }

    onComplete({
      scheduledGames: games.length,
      gamesWithTimes: games.filter((g: Game) => g.scheduledTime).length,
      schedulingParameters: schedulingParams
    });
  };

  const calculateSchedulingStats = () => {
    if (!games) return { totalGames: 0, scheduledGames: 0, totalDuration: 0 };
    
    const totalGames = games.length;
    const scheduledGames = games.filter((g: Game) => g.scheduledTime).length;
    const totalDuration = games.reduce((sum: number, g: Game) => sum + (g.estimatedDuration || 90), 0);
    
    return { totalGames, scheduledGames, totalDuration };
  };

  const getEventDurationDays = () => {
    if (!eventDetails?.startDate || !eventDetails?.endDate) return 1;
    const start = new Date(eventDetails.startDate);
    const end = new Date(eventDetails.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (gamesLoading || eventLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading game scheduling interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No games found. Please complete Bracket Generation (Step 3) before scheduling games.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const stats = calculateSchedulingStats();
  const eventDays = getEventDurationDays();

  return (
    <div className="space-y-6">
      {/* Step Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Step 4: Game Scheduling & Time Assignment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Schedule games with intelligent time distribution, conflict detection, and optimal rest periods across tournament days.
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
              <div className="text-sm text-gray-500">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.scheduledGames}</div>
              <div className="text-sm text-gray-500">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{eventDays}</div>
              <div className="text-sm text-gray-500">Tournament Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalDuration / 60)}h</div>
              <div className="text-sm text-gray-500">Total Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduling Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Daily Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={schedulingParams.startTime}
                onChange={(e) => setSchedulingParams(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endTime">Daily End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={schedulingParams.endTime}
                onChange={(e) => setSchedulingParams(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="gameDuration">Game Duration (min)</Label>
              <Input
                id="gameDuration"
                type="number"
                value={schedulingParams.gameDuration}
                onChange={(e) => setSchedulingParams(prev => ({ ...prev, gameDuration: parseInt(e.target.value) || 90 }))}
                min={60}
                max={120}
              />
            </div>
            
            <div>
              <Label htmlFor="restPeriod">Rest Period (min)</Label>
              <Input
                id="restPeriod"
                type="number"
                value={schedulingParams.restPeriod}
                onChange={(e) => setSchedulingParams(prev => ({ ...prev, restPeriod: parseInt(e.target.value) || 15 }))}
                min={10}
                max={60}
              />
            </div>
            
            <div>
              <Label htmlFor="simultaneousGames">Simultaneous Games</Label>
              <Input
                id="simultaneousGames"
                type="number"
                value={schedulingParams.simultaneousGames}
                onChange={(e) => setSchedulingParams(prev => ({ ...prev, simultaneousGames: parseInt(e.target.value) || 4 }))}
                min={1}
                max={8}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Intelligent Schedule Generation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Generate optimal game schedules with conflict detection, balanced rest periods, and fair time distribution.
            </p>
            
            <div className="flex space-x-4">
              <Button 
                onClick={handleGenerateSchedule}
                disabled={generateScheduleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {generateScheduleMutation.isPending ? 'Generating...' : 'Generate Game Schedule'}
              </Button>
              
              <Button 
                onClick={handleOptimizeSchedule}
                disabled={optimizeScheduleMutation.isPending || stats.scheduledGames === 0}
                variant="outline"
                size="lg"
              >
                {optimizeScheduleMutation.isPending ? 'Optimizing...' : 'Optimize Schedule'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Preview */}
      {stats.scheduledGames > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {games
                ?.filter((game: Game) => game.scheduledTime)
                .slice(0, 10)
                .map((game: Game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">
                        {game.homeTeam} vs {game.awayTeam}
                      </div>
                      <div className="text-xs text-gray-600">
                        Game {game.gameNumber} • Round {game.round}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium">
                          {game.scheduledTime && new Date(game.scheduledTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {game.estimatedDuration}min
                      </Badge>
                    </div>
                  </div>
                ))}
              
              {stats.scheduledGames > 10 && (
                <div className="text-center text-gray-500 text-sm py-2">
                  ... and {stats.scheduledGames - 10} more scheduled games
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduling Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduling Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {Math.round((stats.scheduledGames / stats.totalGames) * 100)}%
              </div>
              <div className="text-xs text-blue-700">Games Scheduled</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {Math.round(stats.totalDuration / (eventDays * 60))}h
              </div>
              <div className="text-xs text-green-700">Avg Daily Hours</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {Math.round(stats.totalGames / eventDays)}
              </div>
              <div className="text-xs text-purple-700">Games per Day</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {schedulingParams.simultaneousGames}
              </div>
              <div className="text-xs text-orange-700">Concurrent Games</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Game Scheduling Complete</h3>
              <p className="text-green-700 text-sm">
                {stats.scheduledGames} games scheduled with optimal time distribution.
              </p>
            </div>
            <Button 
              onClick={handleComplete}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Field Assignment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
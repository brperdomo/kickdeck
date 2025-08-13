import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Users, Calendar, Settings, CheckCircle, 
  Clock, AlertTriangle, Play, Pause, RotateCcw,
  Zap, Target, Activity
} from 'lucide-react';

interface TournamentControlCenterProps {
  eventId: string;
}

interface TournamentStatus {
  totalTeams: number;
  approvedTeams: number;
  totalBrackets: number;
  configuredBrackets: number;
  totalFields: number;
  availableFields: number;
  scheduledGames: number;
  totalGames: number;
  status: 'not_started' | 'in_progress' | 'completed';
  readyForScheduling: boolean;
}

interface SchedulingComponents {
  teams: { total: number; ready: number; };
  brackets: { total: number; configured: number; };
  fields: { total: number; available: number; };
  timeSlots: { total: number; configured: number; };
}

export function UnifiedTournamentControlCenter({ eventId }: TournamentControlCenterProps) {
  const [autoMode, setAutoMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch tournament status
  const { data: tournamentStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['tournament-status', eventId],
    queryFn: async (): Promise<TournamentStatus> => {
      const response = await fetch(`/api/admin/tournaments/${eventId}/status`);
      if (!response.ok) throw new Error('Failed to fetch tournament status');
      return response.json();
    },
    refetchInterval: 5000
  });

  // Fetch component readiness
  const { data: components } = useQuery({
    queryKey: ['scheduling-components', eventId],
    queryFn: async (): Promise<SchedulingComponents> => {
      const response = await fetch(`/api/admin/tournaments/${eventId}/components-status`);
      if (!response.ok) throw new Error('Failed to fetch components status');
      return response.json();
    },
    refetchInterval: 10000
  });

  // Fetch flight game counts
  const { data: flightGameCounts } = useQuery({
    queryKey: ['flight-game-counts', eventId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/flight-game-counts`);
        if (!response.ok) return {};
        const data = await response.json();
        return data.flightGameCounts || {};
      } catch (error) {
        console.error('Flight game counts fetch failed:', error);
        return {};
      }
    },
    refetchInterval: 5000,
    retry: 1
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const calculateProgress = () => {
    if (!tournamentStatus) return 0;
    const factors = [
      tournamentStatus.approvedTeams > 0 ? 25 : 0,
      tournamentStatus.configuredBrackets > 0 ? 25 : 0,
      tournamentStatus.availableFields > 0 ? 25 : 0,
      tournamentStatus.scheduledGames > 0 ? 25 : 0
    ];
    return factors.reduce((sum, factor) => sum + factor, 0);
  };

  const handleQuickSchedule = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/quick-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoMode })
      });
      
      if (!response.ok) throw new Error('Failed to generate schedule');
      
      await refetchStatus();
    } catch (error) {
      console.error('Quick schedule failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!tournamentStatus) {
    return (
      <Card className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <span className="ml-3 text-purple-100">Loading tournament status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Overview */}
      <Card className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-purple-400" />
            Tournament Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-100">Setup Progress</span>
              <span className="text-purple-100">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-purple-900/20 border border-purple-400/20">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <div className="text-lg font-semibold text-white">
                {tournamentStatus.approvedTeams}
              </div>
              <div className="text-xs text-purple-200">Approved Teams</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-purple-900/20 border border-purple-400/20">
              <Target className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <div className="text-lg font-semibold text-white">
                {tournamentStatus.configuredBrackets}
              </div>
              <div className="text-xs text-purple-200">Configured Flights</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-purple-900/20 border border-purple-400/20">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <div className="text-lg font-semibold text-white">
                {tournamentStatus.availableFields}
              </div>
              <div className="text-xs text-purple-200">Available Fields</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-purple-900/20 border border-purple-400/20">
              <Activity className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <div className="text-lg font-semibold text-white">
                {tournamentStatus.scheduledGames}
              </div>
              <div className="text-xs text-purple-200">Games Scheduled</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleQuickSchedule}
              disabled={!tournamentStatus.readyForScheduling || isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Schedule
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setAutoMode(!autoMode)}
              className="border-purple-400/30 text-purple-100 hover:bg-purple-900/30"
            >
              {autoMode ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {autoMode ? 'Manual' : 'Auto'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => refetchStatus()}
              className="border-purple-400/30 text-purple-100 hover:bg-purple-900/30"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Messages */}
          {!tournamentStatus.readyForScheduling && (
            <Alert className="border-yellow-400/30 bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-100">
                Tournament setup incomplete. Please ensure teams are approved, flights are configured, and fields are available.
              </AlertDescription>
            </Alert>
          )}

          {tournamentStatus.readyForScheduling && tournamentStatus.scheduledGames === 0 && (
            <Alert className="border-green-400/30 bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-100">
                Ready for scheduling! All requirements met.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Flight Game Counts */}
      {flightGameCounts && Object.keys(flightGameCounts).length > 0 && (
        <Card className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Flight Scheduling Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Object.entries(flightGameCounts).map(([flightName, count]) => (
                <div key={flightName} className="flex justify-between items-center p-3 rounded-lg bg-purple-900/20 border border-purple-400/20">
                  <span className="text-purple-100">{flightName}</span>
                  <Badge variant="secondary" className="bg-purple-700/50 text-purple-100">
                    {count} games
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
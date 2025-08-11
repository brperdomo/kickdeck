/**
 * Unified Tournament Control Center
 * Integrated tournament management for Master Schedule interface
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  Trophy, Settings, Users, Calendar, Zap, Eye, 
  CheckCircle, Clock, AlertTriangle, ArrowRight, 
  Play, Pause, RotateCcw, Download, Share2, Trash2
} from 'lucide-react';

interface TournamentControlCenterProps {
  eventId: string;
}

interface TournamentStatus {
  phase: 'setup' | 'configuration' | 'scheduling' | 'optimization' | 'finalized';
  progress: number;
  nextAction: string;
  canProceed: boolean;
  issues: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    action?: string;
  }>;
}

interface SchedulingComponents {
  gameFormats: boolean;
  flightAssignment: boolean;
  bracketCreation: boolean;
  facilityConstraints: boolean;
  refereeAssignment: boolean;
  scheduleOptimization: boolean;
}

export function UnifiedTournamentControlCenter({ eventId }: TournamentControlCenterProps) {
  const [autoMode, setAutoMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFlightSelector, setShowFlightSelector] = useState(false);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);

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

  // Fetch flight scheduling status (games count per flight)
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

  // Fetch scheduling readiness (configured flights with game formats)
  const { data: schedulingReadiness, error: schedulingError } = useQuery({
    queryKey: ['scheduling-readiness', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!response.ok) {
        console.error('Flight configurations fetch failed:', response.status, response.statusText);
        // Return fallback data when not authenticated or API fails
        return {
          totalFlights: 0,
          configuredFlights: 0,
          readyForScheduling: false,
          error: true,
          flights: []
        };
      }
      const flightConfigs = await response.json();
      
      console.log('Flight configs loaded:', flightConfigs?.length || 0, 'flights');
      
      // Count configured flights (flights with saved game formats and isConfigured = true)
      const configuredFlights = flightConfigs.filter((flight: any) => 
        flight.isConfigured === true &&
        flight.formatName && 
        flight.formatName !== 'Not Configured'
      );
      
      console.log('Configured flights:', configuredFlights.length, 'of', flightConfigs.length);
      
      return {
        totalFlights: flightConfigs.length || 0,
        configuredFlights: configuredFlights.length,
        readyForScheduling: configuredFlights.length > 0,
        error: false,
        flights: configuredFlights.map((flight: any) => ({
          id: flight.id,
          flightName: flight.flightName,
          ageGroup: flight.ageGroup,
          formatName: flight.formatName,
          teamCount: flight.teamCount || 0,
          scheduledGamesCount: flightGameCounts?.[flight.id] || 0
        }))
      };
    },
    refetchInterval: 5000,
    retry: 1
  });

  // Auto-scheduling mutation (all flights)
  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/generate-complete-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeReferees: true, includeFacilities: true })
      });
      if (!response.ok) throw new Error('Auto-scheduling failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tournament Auto-Scheduling Complete",
        description: `${data.message || 'Tournament schedule generated respecting flight configurations, game formats, and bracket structures.'}`,
      });
      refetchStatus();
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Scheduling Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Bulk delete games mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to delete games');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Games Deleted Successfully",
        description: `${data.message || `Deleted ${data.deletedCount} games from the tournament`}`,
      });
      
      // Force refresh of all related queries to clear cache
      refetchStatus();
      
      // Invalidate all schedule-related cache entries
      window.location.reload(); // Force full page refresh to clear any stale cache
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Manual step execution
  const executeStepMutation = useMutation({
    mutationFn: async (step: string) => {
      const response = await fetch(`/api/admin/tournaments/${eventId}/execute-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step })
      });
      if (!response.ok) throw new Error(`Failed to execute ${step}`);
      return response.json();
    },
    onSuccess: (data, step) => {
      toast({
        title: `${step} Complete`,
        description: data.message || "Step completed successfully.",
      });
      refetchStatus();
      setShowFlightSelector(false);
      setSelectedFlights([]);
    }
  });

  // Selective scheduling mutation (selected flights only)
  const selectiveScheduleMutation = useMutation({
    mutationFn: async (flightIds: string[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/generate-selective-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          flightIds, 
          includeReferees: true, 
          includeFacilities: true 
        })
      });
      
      // Better error handling for different response types
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Authentication required. Please log in.');
        }
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Selective scheduling failed');
        } catch (parseError) {
          throw new Error(`Selective scheduling failed (${response.status})`);
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Selective Scheduling Complete",
        description: `${data.message || `Schedule generated for ${selectedFlights.length} selected flights.`}`,
      });
      setIsProcessing(false);
      refetchStatus();
      setShowFlightSelector(false);
      setSelectedFlights([]);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Selective Scheduling Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  const handleAutoSchedule = () => {
    setIsProcessing(true);
    setAutoMode(true);
    autoScheduleMutation.mutate();
  };
  
  const handleSelectiveSchedule = () => {
    if (selectedFlights.length === 0) {
      toast({
        title: "No Flights Selected",
        description: "Please select at least one flight to schedule.",
        variant: "destructive"
      });
      return;
    }
    setIsProcessing(true);
    selectiveScheduleMutation.mutate(selectedFlights);
  };
  
  const toggleFlightSelection = (flightId: string) => {
    setSelectedFlights(prev => 
      prev.includes(flightId) 
        ? prev.filter(id => id !== flightId)
        : [...prev, flightId]
    );
  };
  
  const selectAllFlights = () => {
    // Only select flights that don't already have scheduled games
    const unscheduledFlights = schedulingReadiness?.flights?.filter((f: any) => (f.scheduledGamesCount || 0) === 0) || [];
    const allFlightIds = unscheduledFlights.map((f: any) => f.id);
    setSelectedFlights(allFlightIds);
  };
  
  const clearFlightSelection = () => {
    setSelectedFlights([]);
  };

  const handleManualStep = (step: string) => {
    executeStepMutation.mutate(step);
  };

  const handleBulkDelete = () => {
    if (window.confirm('Are you sure you want to delete ALL games from this tournament? This action cannot be undone.')) {
      bulkDeleteMutation.mutate();
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'setup': return 'bg-blue-100 text-blue-800';
      case 'configuration': return 'bg-yellow-100 text-yellow-800';
      case 'scheduling': return 'bg-purple-100 text-purple-800';
      case 'optimization': return 'bg-orange-100 text-orange-800';
      case 'finalized': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tournament Control Header */}
      <Card className="border-slate-600 bg-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-blue-400" />
              <div>
                <CardTitle className="text-xl text-white">Tournament Control Center</CardTitle>
                <p className="text-sm text-slate-300 mt-1">
                  Unified scheduling with intelligent automation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-slate-300 border-slate-600">
                {tournamentStatus?.phase || 'Initializing'}
              </Badge>
              <Badge variant="outline" className="text-slate-300 border-slate-600">Event {eventId}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2 text-slate-300">
                <span>Tournament Setup Progress</span>
                <span>{tournamentStatus?.progress || 0}%</span>
              </div>
              <Progress value={tournamentStatus?.progress || 0} className="h-2" />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleAutoSchedule}
                disabled={isProcessing || !schedulingReadiness?.readyForScheduling}
                className={`flex items-center gap-2 ${
                  schedulingReadiness?.readyForScheduling 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-gray-600 cursor-not-allowed text-gray-300'
                }`}
              >
                <Zap className="h-4 w-4" />
                {isProcessing ? 'Running Auto-Schedule...' : 
                 schedulingReadiness?.error ? 'Schedule All (Login Required)' :
                 schedulingReadiness?.readyForScheduling 
                   ? `Schedule All (${schedulingReadiness.configuredFlights} Flights)` 
                   : 'Schedule All (No Configured Flights)'}
              </Button>

              <Button
                onClick={() => setShowFlightSelector(!showFlightSelector)}
                disabled={!schedulingReadiness?.readyForScheduling || schedulingReadiness?.error}
                variant="outline"
                className={`flex items-center gap-2 border-slate-600 text-slate-200 hover:bg-slate-700 ${
                  schedulingReadiness?.readyForScheduling ? '' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Users className="h-4 w-4" />
                {showFlightSelector ? 'Hide Flight Selector' : 'Select Flights'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setAutoMode(!autoMode)}
                className="flex items-center gap-2 border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                <Settings className="h-4 w-4" />
                {autoMode ? 'Show Manual Controls' : 'Show Auto Mode'}
              </Button>

              <Button
                variant="outline"
                onClick={() => refetchStatus()}
                size="sm"
                className="flex items-center gap-2 border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>

              <Button
                variant="outline"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex items-center gap-2 border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete All Games'}
              </Button>
            </div>

            {/* Scheduling Readiness Status */}
            {schedulingReadiness && (
              <Alert className={`border-slate-600 ${
                schedulingReadiness.readyForScheduling 
                  ? 'bg-green-900/20 border-green-600' 
                  : schedulingReadiness.error 
                    ? 'bg-blue-900/20 border-blue-600'
                    : 'bg-yellow-900/20 border-yellow-600'
              }`}>
                {schedulingReadiness.readyForScheduling ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : schedulingReadiness.error ? (
                  <AlertTriangle className="h-4 w-4 text-blue-400" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-400" />
                )}
                <AlertDescription className="text-slate-200">
                  {schedulingReadiness.error ? (
                    <span>
                      <strong>Login Required:</strong> Please log in as an admin to view flight configuration status and enable automated scheduling.
                    </span>
                  ) : schedulingReadiness.readyForScheduling ? (
                    <span>
                      <strong>Ready for Scheduling:</strong> {schedulingReadiness.configuredFlights} of {schedulingReadiness.totalFlights} flights have game formats configured and are ready for automated scheduling.
                    </span>
                  ) : (
                    <span>
                      <strong>Setup Required:</strong> Configure game formats for flights in the Flight Assignment tab before using automated scheduling. {schedulingReadiness.totalFlights} flights available, {schedulingReadiness.configuredFlights} configured.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Flight Selection Panel */}
            {showFlightSelector && schedulingReadiness?.flights && schedulingReadiness.flights.length > 0 && (
              <Card className="border-slate-600 bg-slate-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Select Flights to Schedule
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllFlights}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearFlightSelection}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {schedulingReadiness.flights.map((flight: any) => {
                      const hasScheduledGames = (flight.scheduledGamesCount || 0) > 0;
                      const isScheduled = hasScheduledGames;
                      
                      return (
                        <Card 
                          key={flight.id} 
                          className={`border transition-colors cursor-pointer ${
                            isScheduled 
                              ? 'border-slate-500 bg-slate-700/50 opacity-60' // Grayed out for scheduled
                              : selectedFlights.includes(flight.id)
                                ? 'border-blue-500 bg-blue-900/20' 
                                : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                          }`}
                          onClick={() => !isScheduled && toggleFlightSelection(flight.id)}
                          style={{ cursor: isScheduled ? 'not-allowed' : 'pointer' }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Checkbox
                                    checked={selectedFlights.includes(flight.id)}
                                    onChange={() => !isScheduled && toggleFlightSelection(flight.id)}
                                    className="text-blue-500"
                                    disabled={isScheduled}
                                  />
                                  <span className={`font-medium text-sm ${
                                    isScheduled ? 'text-slate-400' : 'text-white'
                                  }`}>
                                    {flight.flightName}
                                  </span>
                                  {isScheduled && (
                                    <Badge variant="secondary" className="text-xs bg-green-900/30 text-green-300 border-green-600">
                                      Scheduled
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-xs ${isScheduled ? 'text-slate-400' : 'text-slate-300'}`}>
                                      <strong>{flight.ageGroup}</strong>
                                    </p>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-1.5 py-0.5 ${
                                        flight.gender === 'Boys' || flight.gender === 'Male' || flight.gender === 'M'
                                          ? 'bg-blue-900/30 text-blue-300 border-blue-600' 
                                          : 'bg-pink-900/30 text-pink-300 border-pink-600'
                                      }`}
                                      title={`Gender: ${flight.gender || 'Unknown'}`}
                                    >
                                      {(flight.gender === 'Boys' || flight.gender === 'Male' || flight.gender === 'M') ? 'B' : 'G'}
                                    </Badge>
                                  </div>
                                  <p className={`text-xs ${isScheduled ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Format: {flight.formatName}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs border-slate-600 ${
                                        isScheduled ? 'text-slate-500' : 'text-slate-300'
                                      }`}
                                    >
                                      {flight.teamCount} teams
                                    </Badge>
                                    {isScheduled && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs text-green-400 border-green-600"
                                      >
                                        {flight.scheduledGamesCount} games
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                    <div className="text-sm text-slate-300">
                      <strong>{selectedFlights.length}</strong> of <strong>{schedulingReadiness.flights.length}</strong> flights selected
                      {schedulingReadiness.flights.some((f: any) => (f.scheduledGamesCount || 0) > 0) && (
                        <span className="ml-2 text-xs text-green-400">
                          ({schedulingReadiness.flights.filter((f: any) => (f.scheduledGamesCount || 0) > 0).length} already scheduled)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowFlightSelector(false)}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSelectiveSchedule}
                        disabled={selectedFlights.length === 0 || isProcessing}
                        className="bg-green-600 hover:bg-green-500 text-white"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Scheduling...' : `Schedule ${selectedFlights.length} Flights`}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Action */}
            {tournamentStatus?.nextAction && (
              <Alert className="border-slate-600 bg-slate-800">
                <ArrowRight className="h-4 w-4" />
                <AlertDescription className="text-slate-200">
                  <strong>Next:</strong> {tournamentStatus.nextAction}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issues & Status Alerts */}
      {tournamentStatus?.issues && tournamentStatus.issues.length > 0 && (
        <Card className="border-slate-600 bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <AlertTriangle className="h-4 w-4" />
              Status Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tournamentStatus.issues.map((issue, index) => (
                <Alert key={index} className={`border-l-4 border-slate-600 bg-slate-800 ${
                  issue.type === 'error' ? 'border-l-red-500' :
                  issue.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIssueIcon(issue.type)}
                      <AlertDescription className="text-slate-200">{issue.message}</AlertDescription>
                    </div>
                    {issue.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualStep(issue.action!)}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        Fix
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
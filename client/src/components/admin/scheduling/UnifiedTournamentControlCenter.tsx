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
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  Trophy, Settings, Users, Calendar, Zap, Eye, 
  CheckCircle, Clock, AlertTriangle, ArrowRight, 
  Play, Pause, RotateCcw, Download, Share2
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

  // Fetch scheduling readiness (configured flights with game formats)
  const { data: schedulingReadiness } = useQuery({
    queryKey: ['scheduling-readiness', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!response.ok) throw new Error('Failed to fetch flight configurations');
      const data = await response.json();
      
      // Count configured flights (flights with saved game formats)
      const configuredFlights = data.flights?.filter((flight: any) => 
        flight.gameFormat && 
        flight.gameFormat.templateName && 
        flight.gameFormat.templateName !== 'Not Configured' &&
        !flight.gameFormat.templateName.includes('Default')
      ) || [];
      
      return {
        totalFlights: data.flights?.length || 0,
        configuredFlights: configuredFlights.length,
        readyForScheduling: configuredFlights.length > 0
      };
    },
    refetchInterval: 5000
  });

  // Auto-scheduling mutation
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
    }
  });

  const handleAutoSchedule = () => {
    setIsProcessing(true);
    setAutoMode(true);
    autoScheduleMutation.mutate();
  };

  const handleManualStep = (step: string) => {
    executeStepMutation.mutate(step);
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
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAutoSchedule}
                disabled={isProcessing || !schedulingReadiness?.readyForScheduling}
                className={`flex items-center gap-2 ${
                  schedulingReadiness?.readyForScheduling 
                    ? 'bg-blue-600 hover:bg-blue-500' 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                <Zap className="h-4 w-4" />
                {isProcessing ? 'Running Auto-Schedule...' : 
                 schedulingReadiness?.readyForScheduling 
                   ? `Auto-Schedule (${schedulingReadiness.configuredFlights} Flights Ready)` 
                   : 'Auto-Schedule (No Configured Flights)'}
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
            </div>

            {/* Scheduling Readiness Status */}
            {schedulingReadiness && (
              <Alert className={`border-slate-600 ${
                schedulingReadiness.readyForScheduling 
                  ? 'bg-green-900/20 border-green-600' 
                  : 'bg-yellow-900/20 border-yellow-600'
              }`}>
                {schedulingReadiness.readyForScheduling ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-400" />
                )}
                <AlertDescription className="text-slate-200">
                  {schedulingReadiness.readyForScheduling ? (
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

      {/* Component Status Overview */}
      <Card className="border-slate-600 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            Scheduling Components Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Component Status Cards */}
              <Card className={`border-l-4 ${components?.gameFormats ? 'border-green-500' : 'border-gray-500'} bg-slate-700`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-slate-300" />
                      <span className="font-medium text-white">Game Formats</span>
                    </div>
                    {components?.gameFormats ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <Clock className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Round-robin, elimination, Swiss system
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-l-4 ${components?.flightAssignment ? 'border-green-500' : 'border-gray-500'} bg-slate-700`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-slate-300" />
                      <span className="font-medium text-white">Flight Assignment</span>
                    </div>
                    {components?.flightAssignment ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <Clock className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Team grouping and bracket creation
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-l-4 ${components?.facilityConstraints ? 'border-green-500' : 'border-gray-500'} bg-slate-700`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-slate-300" />
                      <span className="font-medium text-white">Facility Intelligence</span>
                    </div>
                    {components?.facilityConstraints ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <Clock className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Lighting, parking, concession validation
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-l-4 ${components?.refereeAssignment ? 'border-green-500' : 'border-gray-500'} bg-slate-700`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-slate-300" />
                      <span className="font-medium text-white">Referee Management</span>
                    </div>
                    {components?.refereeAssignment ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <Clock className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Intelligent assignment optimization
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-l-4 ${components?.scheduleOptimization ? 'border-green-500' : 'border-gray-500'} bg-slate-700`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-slate-300" />
                      <span className="font-medium text-white">Schedule Optimization</span>
                    </div>
                    {components?.scheduleOptimization ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <Clock className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Multi-objective constraint solving
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-blue-500 bg-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-slate-300" />
                      <span className="font-medium text-white">Swiss Tournaments</span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Performance-based pairing system
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Manual Execution Controls */}
            {!autoMode && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Manual Step-by-Step Execution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualStep('configure-formats')}
                    className="justify-start text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    1. Configure Formats
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualStep('assign-flights')}
                    className="justify-start text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    2. Assign Flights
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualStep('create-brackets')}
                    className="justify-start text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    3. Create Brackets
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualStep('validate-facilities')}
                    className="justify-start text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    4. Validate Facilities
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualStep('assign-referees')}
                    className="justify-start text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    5. Assign Referees
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualStep('optimize-schedule')}
                    className="justify-start text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    6. Optimize Schedule
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
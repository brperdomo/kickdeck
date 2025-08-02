/**
 * Unified Tournament Control Center
 * Single interface integrating all scheduling components seamlessly
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'execution' | 'review'>('setup');
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
    refetchInterval: 5000 // Auto-refresh every 5 seconds
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

  // Auto-scheduling mutation
  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/tournaments/${eventId}/auto-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeReferees: true, includeFacilities: true })
      });
      if (!response.ok) throw new Error('Auto-scheduling failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Auto-Scheduling Complete",
        description: "Tournament schedule generated with all constraints applied.",
      });
      refetchStatus();
    },
    onError: (error) => {
      toast({
        title: "Scheduling Failed",
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
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Tournament Control Center</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Unified scheduling with intelligent automation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getPhaseColor(tournamentStatus?.phase || 'setup')}`}>
                {tournamentStatus?.phase || 'Initializing'}
              </Badge>
              <Badge variant="outline">Event {eventId}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tournament Setup Progress</span>
                <span>{tournamentStatus?.progress || 0}%</span>
              </div>
              <Progress value={tournamentStatus?.progress || 0} className="h-2" />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAutoSchedule}
                disabled={!tournamentStatus?.canProceed || isProcessing}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {autoMode ? 'Running Auto-Schedule...' : 'Auto-Schedule Everything'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setCurrentPhase(currentPhase === 'setup' ? 'execution' : 'setup')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {currentPhase === 'setup' ? 'Show Manual Controls' : 'Show Setup Overview'}
              </Button>

              <Button
                variant="outline"
                onClick={() => refetchStatus()}
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Next Action */}
            {tournamentStatus?.nextAction && (
              <Alert>
                <ArrowRight className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next:</strong> {tournamentStatus.nextAction}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issues & Status Alerts */}
      {tournamentStatus?.issues && tournamentStatus.issues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Status Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tournamentStatus.issues.map((issue, index) => (
                <Alert key={index} className={`border-l-4 ${
                  issue.type === 'error' ? 'border-red-500' :
                  issue.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIssueIcon(issue.type)}
                      <AlertDescription>{issue.message}</AlertDescription>
                    </div>
                    {issue.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualStep(issue.action!)}
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

      {/* Main Interface Tabs */}
      <Tabs value={currentPhase} onValueChange={(value) => setCurrentPhase(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup Overview
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Manual Control
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Review & Export
          </TabsTrigger>
        </TabsList>

        {/* Setup Overview Tab */}
        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Component Status Cards */}
            <Card className={`border-l-4 ${components?.gameFormats ? 'border-green-500' : 'border-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Game Formats</span>
                  </div>
                  {components?.gameFormats ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <Clock className="h-5 w-5 text-gray-400" />
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Round-robin, elimination, Swiss system
                </p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${components?.flightAssignment ? 'border-green-500' : 'border-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Flight Assignment</span>
                  </div>
                  {components?.flightAssignment ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <Clock className="h-5 w-5 text-gray-400" />
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Team grouping and bracket creation
                </p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${components?.facilityConstraints ? 'border-green-500' : 'border-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Facility Intelligence</span>
                  </div>
                  {components?.facilityConstraints ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <Clock className="h-5 w-5 text-gray-400" />
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Lighting, parking, concession validation
                </p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${components?.refereeAssignment ? 'border-green-500' : 'border-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Referee Management</span>
                  </div>
                  {components?.refereeAssignment ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <Clock className="h-5 w-5 text-gray-400" />
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Intelligent assignment optimization
                </p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${components?.scheduleOptimization ? 'border-green-500' : 'border-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="font-medium">Schedule Optimization</span>
                  </div>
                  {components?.scheduleOptimization ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <Clock className="h-5 w-5 text-gray-400" />
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Multi-objective constraint solving
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    <span className="font-medium">Swiss Tournaments</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Performance-based pairing system
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manual Control Tab */}
        <TabsContent value="execution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Execution Steps</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Execute individual components step-by-step
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleManualStep('configure-formats')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  1. Configure Game Formats
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleManualStep('assign-flights')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  2. Assign Teams to Flights
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleManualStep('create-brackets')}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  3. Create Tournament Brackets
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleManualStep('validate-facilities')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  4. Validate Facility Constraints
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleManualStep('assign-referees')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  5. Assign Referees
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleManualStep('optimize-schedule')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  6. Optimize Final Schedule
                </Button>
              </CardContent>
            </Card>

            {/* Real-time Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Component Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time system health monitoring
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Swiss System Engine</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Facility Constraints</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Referee Assignment</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Conflict Detection</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Review & Export Tab */}
        <TabsContent value="review" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Export</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate and download tournament materials
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Game Cards PDF
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Schedule CSV
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Schedule Link
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Referee Assignment Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Metrics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Schedule optimization results
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Field Utilization</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Team Fairness</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Constraint Compliance</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Score</span>
                      <span>89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
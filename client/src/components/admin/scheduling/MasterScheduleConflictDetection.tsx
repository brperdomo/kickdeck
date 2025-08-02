/**
 * Master Schedule Conflict Detection Panel
 * Unified conflict validation that integrates with all Master Schedule components
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, CheckCircle, XCircle, Users, Clock, 
  MapPin, RefreshCw, Eye, Calendar, Shield
} from 'lucide-react';

interface ConflictDetectionProps {
  eventId: string;
}

interface ConflictSummary {
  totalConflicts: number;
  criticalConflicts: number;
  warnings: number;
  conflictTypes: {
    coachConflicts: number;
    fieldSizeConflicts: number;
    teamRestConflicts: number;
    travelTimeConflicts: number;
  };
  details: Array<{
    type: 'critical' | 'warning' | 'info';
    category: 'coach' | 'field' | 'team' | 'travel';
    message: string;
    gameId?: number;
    timeSlot?: string;
    affectedTeams?: string[];
  }>;
}

interface ValidationMetrics {
  totalGames: number;
  scheduledGames: number;
  unscheduledGames: number;
  fieldUtilization: number;
  averageRestPeriod: number;
  coachCoverage: number;
}

export function MasterScheduleConflictDetection({ eventId }: ConflictDetectionProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  // Fetch conflict detection data
  const { data: conflictData, refetch: refetchConflicts, isLoading } = useQuery({
    queryKey: ['master-schedule-conflicts', eventId],
    queryFn: async (): Promise<ConflictSummary> => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-conflicts`);
      if (!response.ok) throw new Error('Failed to fetch conflict data');
      return response.json();
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Fetch validation metrics
  const { data: metrics } = useQuery({
    queryKey: ['schedule-metrics', eventId],
    queryFn: async (): Promise<ValidationMetrics> => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchInterval: 30000
  });

  const runValidation = async () => {
    setIsValidating(true);
    try {
      await refetchConflicts();
      setLastValidation(new Date());
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-validate on component mount
  useEffect(() => {
    runValidation();
  }, []);

  const getConflictSeverityColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-blue-400 bg-blue-900/20';
    }
  };

  const getConflictIcon = (category: string) => {
    switch (category) {
      case 'coach': return Users;
      case 'field': return MapPin;
      case 'team': return Clock;
      case 'travel': return Calendar;
      default: return AlertTriangle;
    }
  };

  if (isLoading && !conflictData) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasConflicts = conflictData && (conflictData.criticalConflicts > 0 || conflictData.warnings > 0);
  const isHealthy = conflictData && conflictData.totalConflicts === 0;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hasConflicts ? 'bg-red-600' : isHealthy ? 'bg-green-600' : 'bg-yellow-600'}`}>
                {hasConflicts ? (
                  <XCircle className="h-5 w-5 text-white" />
                ) : isHealthy ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-white text-lg">Schedule Conflict Detection</CardTitle>
                <p className="text-slate-400 text-sm">
                  Real-time validation of field assignments, coach conflicts, and scheduling constraints
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastValidation && (
                <span className="text-xs text-slate-400">
                  Last check: {lastValidation.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={runValidation}
                disabled={isValidating}
                className="border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {isValidating ? 'Validating...' : 'Validate Now'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Critical Conflicts</p>
                  <p className="text-2xl font-bold text-red-400">
                    {conflictData?.criticalConflicts || 0}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {conflictData?.warnings || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Games Validated</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {metrics?.scheduledGames || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Detailed Conflict Breakdown */}
          {conflictData?.conflictTypes && (
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">Conflict Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                  <Users className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400">Coach</p>
                    <p className="font-semibold text-white">{conflictData.conflictTypes.coachConflicts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                  <MapPin className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-xs text-slate-400">Field Size</p>
                    <p className="font-semibold text-white">{conflictData.conflictTypes.fieldSizeConflicts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-400">Team Rest</p>
                    <p className="font-semibold text-white">{conflictData.conflictTypes.teamRestConflicts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-slate-400">Travel Time</p>
                    <p className="font-semibold text-white">{conflictData.conflictTypes.travelTimeConflicts}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conflict Details */}
          {conflictData?.details && conflictData.details.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Active Conflicts</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {conflictData.details.map((conflict, index) => {
                  const Icon = getConflictIcon(conflict.category);
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        conflict.type === 'critical' 
                          ? 'bg-red-900/20 border-red-500' 
                          : conflict.type === 'warning'
                          ? 'bg-yellow-900/20 border-yellow-500'
                          : 'bg-blue-900/20 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-4 w-4 mt-0.5 ${
                          conflict.type === 'critical' ? 'text-red-400' :
                          conflict.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{conflict.message}</p>
                          {conflict.timeSlot && (
                            <p className="text-slate-400 text-xs mt-1">Time: {conflict.timeSlot}</p>
                          )}
                          {conflict.affectedTeams && conflict.affectedTeams.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {conflict.affectedTeams.map(team => (
                                <Badge key={team} variant="outline" className="text-xs">
                                  {team}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant={conflict.type === 'critical' ? 'destructive' : 'secondary'}>
                          {conflict.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Conflicts Message */}
          {isHealthy && (
            <Alert className="border-green-600 bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                <strong>Schedule Validated:</strong> No conflicts detected. All games are properly scheduled 
                with appropriate field assignments, coach availability, and team rest periods.
              </AlertDescription>
            </Alert>
          )}

          {/* Schedule Metrics */}
          {metrics && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Field Utilization</p>
                <div className="flex items-center gap-2">
                  <Progress value={metrics.fieldUtilization} className="flex-1" />
                  <span className="text-white font-semibold">{metrics.fieldUtilization}%</span>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Avg Rest Period</p>
                <p className="text-white font-semibold">{metrics.averageRestPeriod} min</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Coach Coverage</p>
                <p className="text-white font-semibold">{metrics.coachCoverage}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
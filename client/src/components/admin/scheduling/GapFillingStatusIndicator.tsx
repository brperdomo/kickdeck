import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, Target, TrendingUp, Clock, Map, 
  CheckCircle, AlertCircle, Activity, Settings 
} from 'lucide-react';

interface GapFillingStatusProps {
  eventId: string;
}

export function GapFillingStatusIndicator({ eventId }: GapFillingStatusProps) {
  // Fetch existing games and field utilization data
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['games-analysis', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games-analysis`, {
        credentials: 'include'
      });
      if (!response.ok) return { totalGames: 0, hasExistingSchedule: false };
      return response.json();
    }
  });

  // Fetch field utilization metrics
  const { data: utilizationData } = useQuery({
    queryKey: ['field-utilization', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/field-utilization`, {
        credentials: 'include'
      });
      if (!response.ok) return { averageUtilization: 0, gapOpportunities: 0 };
      return response.json();
    },
    enabled: gamesData?.hasExistingSchedule || false
  });

  if (isLoading) {
    return (
      <Card className="border-slate-300 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
            <span className="text-slate-600">Analyzing existing schedules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasExistingGames = gamesData?.totalGames > 0;
  const canOptimize = hasExistingGames && utilizationData?.gapOpportunities > 0;

  if (!hasExistingGames) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Target className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Fresh Start Mode:</strong> No existing games detected. 
          New schedules will use optimal field distribution from the beginning.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">
                  🚀 Intelligent Gap-Filling Active
                </h3>
                <p className="text-purple-700 text-sm">
                  Advanced optimization will maximize field utilization
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-600 text-white">
              {gamesData.totalGames} games scheduled
            </Badge>
          </div>

          {/* Optimization Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Field Utilization</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-purple-700">
                  <span>Current Average</span>
                  <span>{utilizationData?.averageUtilization || 0}%</span>
                </div>
                <Progress 
                  value={utilizationData?.averageUtilization || 0} 
                  className="h-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-purple-900">Gap Opportunities</span>
              </div>
              <div className="text-2xl font-bold text-indigo-600">
                {utilizationData?.gapOpportunities || 0}
              </div>
              <div className="text-xs text-purple-700">Available time slots</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-purple-900">Optimization Mode</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  {canOptimize ? 'Active' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Intelligent Features */}
          <div className="space-y-3">
            <h4 className="font-medium text-purple-900 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Active Optimization Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-purple-800">Gap-filling between existing games</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-purple-800">Proximity-based field assignment</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-purple-800">Dynamic rest period enforcement</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-purple-800">Multi-flight conflict resolution</span>
              </div>
            </div>
          </div>

          {/* Smart Algorithm Info */}
          {canOptimize && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Smart Algorithm Active:</strong> The system detected {utilizationData.gapOpportunities} optimization opportunities. 
                New games will be intelligently scheduled to fill gaps during team rest periods, 
                maximizing field usage while maintaining proper rest constraints.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
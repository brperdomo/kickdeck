import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, Target, TrendingUp, AlertCircle, CheckCircle, 
  Clock, Map, Activity, Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GapFillingOptimizerProps {
  eventId: string;
  selectedDate: string;
}

interface OptimizationResult {
  gapsFound: number;
  optimizationsApplied: number;
  fieldUtilizationImproved: number;
  conflictsResolved: number;
  newGamePlacements: Array<{
    gameId: number;
    oldTime: string;
    newTime: string;
    fieldName: string;
  }>;
}

export function GapFillingOptimizer({ eventId, selectedDate }: GapFillingOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Quick analysis to show optimization potential
  const { data: analysisData } = useQuery({
    queryKey: ['gap-analysis', eventId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/quick-gap-analysis?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) return { gapOpportunities: 0, currentUtilization: 0 };
      return response.json();
    }
  });

  // Run intelligent gap-filling optimization
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      // TEMPORARILY USE BYPASS ROUTE FOR DEBUGGING
      const response = await fetch(`/api/test-consolidate-fields/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetDate: selectedDate,
          enableGapFilling: true,
          optimizeFieldUtilization: true,
          resolveConflicts: true,
          minimizeTeamTravel: true,
          proximityBasedScheduling: true
        })
      });
      if (!response.ok) throw new Error('Optimization failed');
      return response.json();
    },
    onSuccess: (result) => {
      console.log('🎯 [OPTIMIZATION SUCCESS] Response received:', result);
      
      // Ensure we have the expected properties
      const safeResult = {
        optimizationsApplied: result.optimizationsApplied || 0,
        fieldUtilizationImproved: result.fieldUtilizationImproved || 0,
        optimizations: result.optimizations || [],
        fieldUtilization: result.fieldUtilization || [],
        ...result
      };
      
      setOptimizationResult(safeResult);
      setIsOptimizing(false);
      
      // Refresh all schedule-related queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-data'] });
      queryClient.invalidateQueries({ queryKey: ['gap-analysis'] });
      
      toast({
        title: 'Schedule Optimized!',
        description: `Applied ${safeResult.optimizationsApplied} optimizations, improved utilization by ${safeResult.fieldUtilizationImproved}%`
      });
    },
    onError: (error) => {
      setIsOptimizing(false);
      toast({
        title: 'Optimization Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const runOptimization = () => {
    setIsOptimizing(true);
    optimizeMutation.mutate();
  };

  const hasGapOpportunities = analysisData?.gapOpportunities > 0;
  const utilizationLevel = analysisData?.currentUtilization || 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            setShowDetails(!showDetails);
          }}
          className={`${hasGapOpportunities 
            ? 'border-purple-400 bg-purple-900/20 text-purple-300 hover:bg-purple-800/30' 
            : 'border-green-400 bg-green-900/20 text-green-300'
          }`}
          disabled={isOptimizing}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Target className="h-3 w-3 mr-1" />
              Smart Fill
              {hasGapOpportunities && (
                <Badge variant="secondary" className="ml-1 bg-purple-600 text-white text-xs">
                  {analysisData.gapOpportunities}
                </Badge>
              )}
            </>
          )}
        </Button>

        {showDetails && (
          <div className="absolute top-full left-0 mt-2 w-80 p-4 border border-slate-600 bg-slate-800 text-slate-200 rounded-lg shadow-lg z-50">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <h4 className="font-medium text-white">Intelligent Gap-Filling</h4>
            </div>

            {/* Current Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Field Utilization</span>
                <span className="text-sm font-medium">{utilizationLevel}%</span>
              </div>
              <Progress value={utilizationLevel} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Gap Opportunities</span>
                <Badge 
                  variant="outline" 
                  className={hasGapOpportunities ? 'border-purple-400 text-purple-300' : 'border-green-400 text-green-300'}
                >
                  {analysisData?.gapOpportunities || 0}
                </Badge>
              </div>
            </div>

            {/* Optimization Features */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-slate-300">Optimization Features:</h5>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>Consolidate games to fields 12, 13 first</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>Move games from fields 14, 15, 20 to priority fields</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>Fill fields to capacity before expanding</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>Minimize total fields in use</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={runOptimization}
              disabled={isOptimizing || !hasGapOpportunities}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing & Optimizing...
                </>
              ) : hasGapOpportunities ? (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Schedule ({analysisData.gapOpportunities} gaps)
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Schedule Already Optimized
                </>
              )}
            </Button>

            {/* Optimization Results */}
            {optimizationResult && (
              <Alert className="border-green-600 bg-green-900/20">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  <div className="space-y-1 text-xs">
                    <div>✅ {optimizationResult.optimizationsApplied} optimizations applied</div>
                    <div>📈 Field utilization improved by {optimizationResult.fieldUtilizationImproved}%</div>
                    <div>🎯 {optimizationResult.conflictsResolved || 0} conflicts resolved</div>
                    <div>🔄 {optimizationResult.newGamePlacements?.length || optimizationResult.optimizationsApplied || 0} games repositioned</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!hasGapOpportunities && analysisData && (
              <Alert className="border-green-600 bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200 text-xs">
                  Schedule is already well-optimized with {utilizationLevel}% field utilization.
                </AlertDescription>
              </Alert>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
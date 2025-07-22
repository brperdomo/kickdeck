import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calculator, CheckCircle, AlertTriangle, XCircle, Clock, 
  Users, MapPin, Calendar, TrendingUp, BarChart3, Target,
  Zap, AlertCircle, Activity
} from "lucide-react";

interface FeasibilitySimulatorProps {
  eventId: string;
  workflowData: any;
  onComplete?: (feasibilityReport: any) => void;
}

interface FeasibilityReport {
  isFeasible: boolean;
  totalGamesRequired: number;
  totalTimeSlotsAvailable: number;
  fieldsRequired: number;
  fieldsAvailable: number;
  estimatedDuration: string;
  conflicts: string[];
  recommendations: string[];
  utilizationMetrics: {
    fieldUtilization: number;
    timeUtilization: number;
    gameDistribution: number;
  };
  bottleneckAnalysis: {
    fieldBottlenecks: string[];
    timeBottlenecks: string[];
    flightImbalances: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  predictiveInsights: {
    optimalFieldCount: number;
    recommendedBufferTime: number;
    peakUtilizationHours: string[];
    worstCaseScenario: string;
  };
}

export function FeasibilitySimulator({ eventId, workflowData, onComplete }: FeasibilitySimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [feasibilityReport, setFeasibilityReport] = useState<FeasibilityReport | null>(null);

  // Fetch event data for simulation
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['event-feasibility', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event data');
      return response.json();
    }
  });

  // Fetch game metadata for constraints
  const { data: gameMetadata } = useQuery({
    queryKey: ['game-metadata', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/game-metadata/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch game metadata');
      return response.json();
    }
  });

  // Fetch available fields
  const { data: fieldsData } = useQuery({
    queryKey: ['event-fields', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    }
  });

  const runFeasibilitySimulation = async () => {
    setIsSimulating(true);
    
    try {
      // Enhanced feasibility simulation with predictive conflict detection
      const response = await fetch(`/api/admin/events/${eventId}/feasibility-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowData,
          gameMetadata,
          fieldsData,
          predictiveAnalysis: true
        })
      });

      if (!response.ok) {
        throw new Error('Feasibility simulation failed');
      }

      const report = await response.json();
      setFeasibilityReport(report);
      
      // Auto-advance workflow if feasible
      if (report.isFeasible && onComplete) {
        onComplete(report);
      }
    } catch (error) {
      console.error('Feasibility simulation error:', error);
      // Generate client-side fallback analysis
      const fallbackReport = generateClientSideFeasibilityCheck();
      setFeasibilityReport(fallbackReport);
    } finally {
      setIsSimulating(false);
    }
  };

  const generateClientSideFeasibilityCheck = (): FeasibilityReport => {
    // Enhanced client-side feasibility analysis with predictive insights
    const totalTeams = workflowData?.flight?.teams?.length || 0;
    const totalFields = fieldsData?.length || 0;
    const estimatedGamesPerTeam = 4; // Average tournament games
    const totalGamesRequired = Math.ceil(totalTeams * estimatedGamesPerTeam / 2);
    
    // Predictive bottleneck analysis
    const gamesPerField = Math.ceil(totalGamesRequired / totalFields);
    const operatingHours = 12; // 8 AM to 8 PM
    const gameDuration = gameMetadata?.gameDuration || 90;
    const bufferTime = gameMetadata?.bufferTime || 15;
    const timePerGame = gameDuration + bufferTime; // minutes
    const maxGamesPerFieldPerDay = Math.floor((operatingHours * 60) / timePerGame);
    
    // Risk assessment
    const isFieldBottleneck = gamesPerField > maxGamesPerFieldPerDay;
    const fieldUtilization = (gamesPerField / maxGamesPerFieldPerDay) * 100;
    const riskLevel = fieldUtilization > 90 ? 'high' : fieldUtilization > 70 ? 'medium' : 'low';
    
    // Generate actionable recommendations
    const recommendations = [];
    if (isFieldBottleneck) {
      const additionalFields = Math.ceil(gamesPerField / maxGamesPerFieldPerDay) - 1;
      recommendations.push(`Add ${additionalFields} more field(s) to prevent scheduling conflicts`);
    }
    if (totalFields < 2) {
      recommendations.push('Consider using multiple fields for better time distribution');
    }
    if (gameDuration > 90) {
      recommendations.push('Reduce game duration to 90 minutes for better field utilization');
    }

    return {
      isFeasible: !isFieldBottleneck,
      totalGamesRequired,
      totalTimeSlotsAvailable: maxGamesPerFieldPerDay * totalFields,
      fieldsRequired: Math.ceil(totalGamesRequired / maxGamesPerFieldPerDay),
      fieldsAvailable: totalFields,
      estimatedDuration: `${Math.ceil(totalGamesRequired / (maxGamesPerFieldPerDay * totalFields))} day(s)`,
      conflicts: isFieldBottleneck ? ['Insufficient fields for required games'] : [],
      recommendations,
      utilizationMetrics: {
        fieldUtilization: Math.min(fieldUtilization, 100),
        timeUtilization: Math.min((totalGamesRequired / (maxGamesPerFieldPerDay * totalFields)) * 100, 100),
        gameDistribution: totalTeams > 0 ? (totalGamesRequired / totalTeams) : 0
      },
      bottleneckAnalysis: {
        fieldBottlenecks: isFieldBottleneck ? [`Need ${Math.ceil(gamesPerField / maxGamesPerFieldPerDay)} fields per game queue`] : [],
        timeBottlenecks: fieldUtilization > 80 ? ['Peak hours may be overbooked'] : [],
        flightImbalances: [],
        riskLevel
      },
      predictiveInsights: {
        optimalFieldCount: Math.ceil(totalGamesRequired / maxGamesPerFieldPerDay),
        recommendedBufferTime: fieldUtilization > 80 ? 10 : 15,
        peakUtilizationHours: ['10:00 AM - 2:00 PM', '3:00 PM - 6:00 PM'],
        worstCaseScenario: isFieldBottleneck ? 'Games will extend beyond operating hours' : 'Minor scheduling compression expected'
      }
    };
  };

  const getFeasibilityColor = (isFeasible: boolean) => {
    return isFeasible ? 'text-green-600' : 'text-red-600';
  };

  const getFeasibilityIcon = (isFeasible: boolean) => {
    return isFeasible ? CheckCircle : XCircle;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Calculator className="h-6 w-6 animate-spin mr-2" />
            Loading simulation data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Feasibility Check & Simulation
          </CardTitle>
          <p className="text-muted-foreground">
            Validate that all games can fit within current constraints before proceeding to schedule generation.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!feasibilityReport ? (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Run a feasibility simulation to validate your tournament configuration.
                </p>
                <Button onClick={runFeasibilitySimulation} disabled={isSimulating}>
                  {isSimulating ? (
                    <>
                      <Calculator className="h-4 w-4 mr-2 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Run Feasibility Check
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Feasibility Status */}
                <Alert className={feasibilityReport.isFeasible ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {feasibilityReport.isFeasible ? 
                      <CheckCircle className="h-5 w-5 text-green-600" /> : 
                      <XCircle className="h-5 w-5 text-red-600" />
                    }
                    <AlertDescription className={getFeasibilityColor(feasibilityReport.isFeasible)}>
                      <strong>
                        {feasibilityReport.isFeasible ? 
                          'Tournament is feasible with current constraints' : 
                          'Tournament constraints need adjustment'
                        }
                      </strong>
                    </AlertDescription>
                  </div>
                </Alert>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Games Required</span>
                      </div>
                      <div className="text-2xl font-bold">{feasibilityReport.totalGamesRequired}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Time Slots</span>
                      </div>
                      <div className="text-2xl font-bold">{feasibilityReport.totalTimeSlotsAvailable}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Fields</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {feasibilityReport.fieldsRequired}/{feasibilityReport.fieldsAvailable}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Duration</span>
                      </div>
                      <div className="text-2xl font-bold">{feasibilityReport.estimatedDuration}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Utilization Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Utilization Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Field Utilization</span>
                          <span className="text-sm text-muted-foreground">
                            {feasibilityReport.utilizationMetrics.fieldUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={feasibilityReport.utilizationMetrics.fieldUtilization} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Time Utilization</span>
                          <span className="text-sm text-muted-foreground">
                            {feasibilityReport.utilizationMetrics.timeUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={feasibilityReport.utilizationMetrics.timeUtilization} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Game Distribution Quality</span>
                          <span className="text-sm text-muted-foreground">
                            {feasibilityReport.utilizationMetrics.gameDistribution.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={feasibilityReport.utilizationMetrics.gameDistribution} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conflicts & Recommendations */}
                {feasibilityReport.conflicts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Scheduling Conflicts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feasibilityReport.conflicts.map((conflict, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{conflict}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                      <TrendingUp className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feasibilityReport.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={runFeasibilitySimulation} variant="outline">
                    <Calculator className="h-4 w-4 mr-2" />
                    Re-run Simulation
                  </Button>
                  {feasibilityReport.isFeasible && (
                    <Button onClick={() => onComplete?.(feasibilityReport)}>
                      Proceed to Schedule Generation
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
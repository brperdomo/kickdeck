import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sliders, Clock, MapPin, Users, Calendar, 
  RefreshCw, TrendingUp, AlertTriangle, CheckCircle
} from "lucide-react";

interface ScenarioPreviewToolProps {
  eventId: string;
  baselineData: any;
  onScenarioSelect?: (scenario: any) => void;
}

interface ScenarioParams {
  bufferTime: number;
  gameDuration: number;
  fieldCount: number;
  operatingHours: number;
  restPeriod: number;
}

interface ScenarioResult {
  feasible: boolean;
  totalGames: number;
  requiredTimeSlots: number;
  availableTimeSlots: number;
  utilizationRate: number;
  compressionRatio: number;
  estimatedDays: number;
  warnings: string[];
}

export function ScenarioPreviewTool({ eventId, baselineData, onScenarioSelect }: ScenarioPreviewToolProps) {
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    bufferTime: 15,
    gameDuration: 90,
    fieldCount: 4,
    operatingHours: 12,
    restPeriod: 60
  });

  const [scenarios, setScenarios] = useState<{[key: string]: ScenarioResult}>({});
  const [currentScenario, setCurrentScenario] = useState<ScenarioResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize with baseline parameters
  useEffect(() => {
    if (baselineData) {
      setScenarioParams({
        bufferTime: baselineData.gameMetadata?.bufferTime || 15,
        gameDuration: baselineData.gameMetadata?.gameDuration || 90,
        fieldCount: baselineData.fields?.length || 4,
        operatingHours: 12,
        restPeriod: baselineData.gameMetadata?.restPeriod || 60
      });
    }
  }, [baselineData]);

  // Recalculate scenarios when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateScenario(scenarioParams);
    }, 300); // Debounce calculations

    return () => clearTimeout(timeoutId);
  }, [scenarioParams]);

  const calculateScenario = async (params: ScenarioParams) => {
    setIsCalculating(true);
    
    try {
      // Enhanced real-time scenario calculation with What-If analysis
      const scenarioKey = JSON.stringify(params);
      
      // Calculate feasibility metrics for current scenario
      const result = calculateScenarioMetrics(params);
      
      // Store scenario result for comparison
      setScenarios(prev => ({
        ...prev,
        [scenarioKey]: result
      }));
      
      setCurrentScenario(result);
      
    } catch (error) {
      console.error('Scenario calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateScenarioMetrics = (params: ScenarioParams): ScenarioResult => {
    // Enhanced scenario calculation with comprehensive metrics
    const totalTeams = baselineData?.teams?.length || 0;
    const estimatedGamesPerTeam = 4;
    const totalGames = Math.ceil(totalTeams * estimatedGamesPerTeam / 2);
    
    // Calculate time slot availability
    const gameTimeTotal = params.gameDuration + params.bufferTime; // minutes
    const gamesPerFieldPerHour = 60 / gameTimeTotal;
    const gamesPerFieldPerDay = gamesPerFieldPerHour * params.operatingHours;
    const totalDailyCapacity = gamesPerFieldPerDay * params.fieldCount;
    
    // Feasibility assessment
    const requiredTimeSlots = totalGames;
    const availableTimeSlots = totalDailyCapacity;
    const utilizationRate = (requiredTimeSlots / availableTimeSlots) * 100;
    const compressionRatio = Math.max(requiredTimeSlots / availableTimeSlots, 1);
    const estimatedDays = Math.ceil(requiredTimeSlots / totalDailyCapacity);
    
    // Generate warnings and insights
    const warnings = [];
    if (utilizationRate > 90) {
      warnings.push('High field utilization - risk of scheduling conflicts');
    }
    if (params.restPeriod < 30) {
      warnings.push('Short rest period may cause team fatigue');
    }
    if (params.fieldCount < 2) {
      warnings.push('Single field creates scheduling bottleneck');
    }
    if (estimatedDays > 3) {
      warnings.push('Tournament may extend beyond typical weekend format');
    }
    
    return {
      feasible: utilizationRate <= 100,
      totalGames,
      requiredTimeSlots,
      availableTimeSlots: Math.floor(availableTimeSlots),
      utilizationRate: Math.min(utilizationRate, 100),
      compressionRatio,
      estimatedDays,
      warnings
    };
  };

  const simulateScenarioImpact = async (params: ScenarioParams): Promise<ScenarioResult> => {
    // This would normally call the backend for complex simulation
    return calculateScenarioMetrics(params);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Target className="h-6 w-6 animate-spin mr-2" />
            Loading scenario data...
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
            <Target className="h-6 w-6" />
            Scenario Preview & What-If Analysis
          </CardTitle>
          <p className="text-muted-foreground">
            Test different scheduling parameters to see their impact on tournament feasibility.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Parameter Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Game Duration (min)</Label>
                <Input
                  type="number"
                  value={scenarioParams.gameDuration}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    gameDuration: parseInt(e.target.value) || 90
                  }))}
                  min="30"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <Label>Buffer Time (min)</Label>
                <Input
                  type="number"
                  value={scenarioParams.bufferTime}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    bufferTime: parseInt(e.target.value) || 15
                  }))}
                  min="5"
                  max="30"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Count</Label>
                <Input
                  type="number"
                  value={scenarioParams.fieldCount}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    fieldCount: parseInt(e.target.value) || 2
                  }))}
                  min="1"
                  max="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <Input
                  type="number"
                  value={scenarioParams.operatingHours}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    operatingHours: parseInt(e.target.value) || 12
                  }))}
                  min="6"
                  max="16"
                />
              </div>
            </div>

            {/* Scenario Results */}
            {currentScenario && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${currentScenario.feasible ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-2xl font-bold ${currentScenario.feasible ? 'text-green-600' : 'text-red-600'}`}>
                      {currentScenario.feasible ? 'Feasible' : 'Not Feasible'}
                    </div>
                    <div className={`text-sm ${currentScenario.feasible ? 'text-green-600' : 'text-red-600'}`}>
                      Tournament Status
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentScenario.utilizationRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-600">Field Utilization</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {currentScenario.estimatedDays}
                    </div>
                    <div className="text-sm text-purple-600">Estimated Days</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {currentScenario.compressionRatio.toFixed(2)}x
                    </div>
                    <div className="text-sm text-orange-600">Compression Ratio</div>
                  </div>
                </div>

                {/* Warnings */}
                {currentScenario.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">Scenario Warnings:</div>
                        {currentScenario.warnings.map((warning, index) => (
                          <div key={index} className="text-sm">• {warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    
    // Calculate time requirements
    const gameSlotDuration = params.gameDuration + params.bufferTime;
    const slotsPerFieldPerDay = Math.floor((params.operatingHours * 60) / gameSlotDuration);
    const availableTimeSlots = slotsPerFieldPerDay * params.fieldCount;
    
    // Factor in rest period constraints
    const restPeriodHours = params.restPeriod / 60;
    const maxGamesPerTeamPerDay = Math.floor(params.operatingHours / (gameSlotDuration / 60 + restPeriodHours));
    const teamConstrainedSlots = Math.floor(teamCount * maxGamesPerTeamPerDay / 2);
    
    const effectiveTimeSlots = Math.min(availableTimeSlots, teamConstrainedSlots);
    const requiredTimeSlots = totalGames;
    
    // Calculate metrics
    const feasible = requiredTimeSlots <= effectiveTimeSlots;
    const utilizationRate = (requiredTimeSlots / effectiveTimeSlots) * 100;
    const compressionRatio = requiredTimeSlots / availableTimeSlots;
    const estimatedDays = Math.ceil(requiredTimeSlots / effectiveTimeSlots);
    
    // Generate warnings
    const warnings: string[] = [];
    
    if (!feasible) {
      warnings.push(`Need ${requiredTimeSlots - effectiveTimeSlots} additional time slots`);
    }
    
    if (utilizationRate > 95) {
      warnings.push('Very tight schedule - minimal flexibility for adjustments');
    }
    
    if (params.restPeriod < 60) {
      warnings.push('Rest period below recommended 60 minutes');
    }
    
    if (gameSlotDuration < 75) {
      warnings.push('Short buffer time may cause delays');
    }
    
    if (estimatedDays > 3) {
      warnings.push('Tournament duration extends beyond typical weekend');
    }
    
    return {
      feasible,
      totalGames,
      requiredTimeSlots,
      availableTimeSlots: effectiveTimeSlots,
      utilizationRate,
      compressionRatio,
      estimatedDays,
      warnings
    };
  };

  const updateParam = (key: keyof ScenarioParams, value: number[]) => {
    setScenarioParams(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  const generateQuickScenarios = () => {
    const quickScenarios = [
      { name: 'Conservative', bufferTime: 20, gameDuration: 90, description: 'More time between games' },
      { name: 'Standard', bufferTime: 15, gameDuration: 90, description: 'Balanced approach' },
      { name: 'Aggressive', bufferTime: 10, gameDuration: 80, description: 'Tight schedule' },
      { name: 'Extended', bufferTime: 15, gameDuration: 90, description: 'Add extra day' }
    ];

    return quickScenarios.map(scenario => ({
      ...scenario,
      onClick: () => setScenarioParams(prev => ({
        ...prev,
        bufferTime: scenario.bufferTime,
        gameDuration: scenario.gameDuration,
        operatingHours: scenario.name === 'Extended' ? 10 : prev.operatingHours
      }))
    }));
  };

  const getFeasibilityColor = (feasible: boolean) => {
    return feasible ? 'text-green-600' : 'text-red-600';
  };

  const getUtilizationColor = (rate: number) => {
    if (rate > 95) return 'text-red-600';
    if (rate > 85) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-6 w-6" />
            Scenario Preview Tool
          </CardTitle>
          <p className="text-muted-foreground">
            Adjust tournament parameters to see how changes affect schedule feasibility and compression.
          </p>
        </CardHeader>
      </Card>

      {/* Quick Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {generateQuickScenarios().map((scenario, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                onClick={scenario.onClick}
              >
                <div className="font-medium">{scenario.name}</div>
                <div className="text-xs text-muted-foreground text-center">
                  {scenario.description}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parameter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timing Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                Buffer Time: {scenarioParams.bufferTime} minutes
              </Label>
              <Slider
                value={[scenarioParams.bufferTime]}
                onValueChange={(value) => updateParam('bufferTime', value)}
                min={5}
                max={30}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Time between games for setup and delays
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Game Duration: {scenarioParams.gameDuration} minutes
              </Label>
              <Slider
                value={[scenarioParams.gameDuration]}
                onValueChange={(value) => updateParam('gameDuration', value)}
                min={60}
                max={120}
                step={10}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Actual playing time per game
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Rest Period: {scenarioParams.restPeriod} minutes
              </Label>
              <Slider
                value={[scenarioParams.restPeriod]}
                onValueChange={(value) => updateParam('restPeriod', value)}
                min={30}
                max={120}
                step={15}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum time between games for same team
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Resource Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                Available Fields: {scenarioParams.fieldCount}
              </Label>
              <Slider
                value={[scenarioParams.fieldCount]}
                onValueChange={(value) => updateParam('fieldCount', value)}
                min={1}
                max={8}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of fields available for games
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Operating Hours: {scenarioParams.operatingHours} hours/day
              </Label>
              <Slider
                value={[scenarioParams.operatingHours]}
                onValueChange={(value) => updateParam('operatingHours', value)}
                min={8}
                max={16}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Daily hours available for games
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">
                Slot Duration
              </div>
              <div className="text-lg font-bold text-blue-900">
                {scenarioParams.gameDuration + scenarioParams.bufferTime} minutes
              </div>
              <div className="text-xs text-blue-600">
                Total time per game slot
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Results */}
      {currentScenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isCalculating ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
              Scenario Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getFeasibilityColor(currentScenario.feasible)}`}>
                  {currentScenario.feasible ? 'YES' : 'NO'}
                </div>
                <div className="text-sm text-muted-foreground">Feasible</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold">{currentScenario.totalGames}</div>
                <div className="text-sm text-muted-foreground">Total Games</div>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold ${getUtilizationColor(currentScenario.utilizationRate)}`}>
                  {currentScenario.utilizationRate.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Utilization</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold">{currentScenario.estimatedDays}</div>
                <div className="text-sm text-muted-foreground">Days Needed</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Time Slot Analysis</div>
                <div className="text-xs text-muted-foreground">
                  Required: {currentScenario.requiredTimeSlots} slots
                </div>
                <div className="text-xs text-muted-foreground">
                  Available: {currentScenario.availableTimeSlots} slots
                </div>
                <div className="text-xs text-muted-foreground">
                  Compression: {(currentScenario.compressionRatio * 100).toFixed(1)}%
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Schedule Density</div>
                <div className="text-xs text-muted-foreground">
                  Games per field per day: {Math.floor(currentScenario.availableTimeSlots / scenarioParams.fieldCount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg games per hour: {(currentScenario.totalGames / (scenarioParams.operatingHours * currentScenario.estimatedDays)).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {currentScenario.warnings.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {currentScenario.warnings.map((warning, index) => (
                      <div key={index} className="text-sm">• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={() => onScenarioSelect?.(scenarioParams)}
                disabled={!currentScenario.feasible}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply This Scenario
              </Button>
              <Button variant="outline" onClick={() => calculateScenario(scenarioParams)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
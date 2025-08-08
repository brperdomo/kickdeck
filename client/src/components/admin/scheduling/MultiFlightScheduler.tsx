import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Clock, Map, Target, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Field {
  id: number;
  name: string;
  sortOrder: number;
  fieldSize: string;
  utilization: number;
}

interface Flight {
  id: number;
  name: string;
  gameCount: number;
  scheduledGames: number;
}

interface SchedulingResult {
  success: boolean;
  scheduledGames: number;
  conflicts: string[];
  fieldUtilization: Array<{ fieldId: number; utilization: number }>;
  averageFieldUtilization: number;
  totalGapsFound: number;
  optimizationOpportunities: number;
}

interface MultiFlightSchedulerProps {
  eventId: number;
}

export default function MultiFlightScheduler({ eventId }: MultiFlightSchedulerProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [existingFlightId, setExistingFlightId] = useState<string>('');
  const [newFlightId, setNewFlightId] = useState<string>('');
  const [schedulingDate, setSchedulingDate] = useState<string>('2025-08-16');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [schedulingResult, setSchedulingResult] = useState<SchedulingResult | null>(null);

  // Load available fields and flights
  useEffect(() => {
    loadFieldProximityData();
    loadFlightData();
  }, [eventId]);

  const loadFieldProximityData = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/field-proximity`);
      if (response.ok) {
        const data = await response.json();
        setFields(data.fields.map((field: any) => ({
          ...field,
          utilization: 0 // Will be updated by analysis
        })));
      }
    } catch (error) {
      console.error('Failed to load field data:', error);
    }
  };

  const loadFlightData = async () => {
    // Mock flight data for demonstration
    setFlights([
      { id: 10027, name: 'U17 Boys - Nike Elite', gameCount: 13, scheduledGames: 13 },
      { id: 10028, name: 'U17 Boys - Nike Premier', gameCount: 10, scheduledGames: 0 },
      { id: 10029, name: 'U16 Girls - Nike Classic', gameCount: 8, scheduledGames: 0 }
    ]);
  };

  const analyzeSchedulingGaps = async () => {
    if (!existingFlightId) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/analyze-scheduling-gaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: parseInt(existingFlightId),
          schedulingDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
        
        // Update field utilization data
        setFields(prevFields => 
          prevFields.map(field => {
            const utilData = data.fieldUtilization.find((util: any) => util.fieldId === field.id);
            return { ...field, utilization: utilData ? utilData.utilization : 0 };
          })
        );
      }
    } catch (error) {
      console.error('Gap analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runIntelligentScheduling = async () => {
    if (!existingFlightId || !newFlightId) return;
    
    setIsScheduling(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/multi-flight-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingFlightId: parseInt(existingFlightId),
          newFlightId: parseInt(newFlightId),
          schedulingDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSchedulingResult(data);
      }
    } catch (error) {
      console.error('Intelligent scheduling failed:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const updateFieldSortOrder = async (fieldId: number, newSortOrder: number) => {
    try {
      await fetch(`/api/admin/fields/${fieldId}/sort-order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newSortOrder })
      });
      
      // Update local state
      setFields(prevFields =>
        prevFields.map(field =>
          field.id === fieldId ? { ...field, sortOrder: newSortOrder } : field
        )
      );
    } catch (error) {
      console.error('Failed to update field sort order:', error);
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'bg-red-500';
    if (utilization >= 60) return 'bg-yellow-500';
    if (utilization >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Multi-Flight Intelligent Scheduler</h1>
        <p className="text-muted-foreground">
          Advanced gap-filling scheduling with conflict resolution and proximity optimization
        </p>
      </div>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Scheduling Configuration
          </CardTitle>
          <CardDescription>
            Select flights and date for intelligent multi-flight scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Existing Flight (with schedule)</label>
              <Select value={existingFlightId} onValueChange={setExistingFlightId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select existing flight" />
                </SelectTrigger>
                <SelectContent>
                  {flights.filter(f => f.scheduledGames > 0).map(flight => (
                    <SelectItem key={flight.id} value={flight.id.toString()}>
                      {flight.name} ({flight.scheduledGames} games scheduled)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Flight (to schedule)</label>
              <Select value={newFlightId} onValueChange={setNewFlightId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new flight" />
                </SelectTrigger>
                <SelectContent>
                  {flights.filter(f => f.scheduledGames === 0).map(flight => (
                    <SelectItem key={flight.id} value={flight.id.toString()}>
                      {flight.name} ({flight.gameCount} games to schedule)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduling Date</label>
              <input
                type="date"
                value={schedulingDate}
                onChange={(e) => setSchedulingDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={analyzeSchedulingGaps}
              disabled={!existingFlightId || isAnalyzing}
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Gaps...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Analyze Scheduling Gaps
                </>
              )}
            </Button>

            <Button 
              onClick={runIntelligentScheduling}
              disabled={!existingFlightId || !newFlightId || isScheduling}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isScheduling ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Intelligent Scheduling
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Field Proximity Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Field Proximity Management
          </CardTitle>
          <CardDescription>
            Drag fields to reorder by proximity. Lower numbers = closer to main area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.sort((a, b) => a.sortOrder - b.sortOrder).map((field) => (
              <div key={field.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{field.name}</span>
                    <Badge variant="outline">{field.fieldSize}</Badge>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Utilization</span>
                      <span>{field.utilization}%</span>
                    </div>
                    <Progress 
                      value={field.utilization} 
                      className="mt-1"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort Order:</span>
                    <input
                      type="number"
                      value={field.sortOrder}
                      onChange={(e) => updateFieldSortOrder(field.id, parseInt(e.target.value))}
                      className="w-16 h-6 text-xs border rounded px-1"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gap Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Gap Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysisResult.totalGapsFound}</div>
                <div className="text-sm text-muted-foreground">Total Gaps Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysisResult.optimizationOpportunities}</div>
                <div className="text-sm text-muted-foreground">Game-Size Gaps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(analysisResult.fieldUtilization.reduce((sum: number, field: any) => sum + field.utilization, 0) / analysisResult.fieldUtilization.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Field Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analysisResult.gaps.length}</div>
                <div className="text-sm text-muted-foreground">Fields with Gaps</div>
              </div>
            </div>

            {analysisResult.gaps.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Available Gaps for Scheduling:</h4>
                {analysisResult.gaps.slice(0, 3).map((fieldGap: any, index: number) => (
                  <div key={index} className="p-2 bg-muted rounded text-sm">
                    <strong>{fieldGap.fieldName}</strong> - {fieldGap.gaps.length} gaps available 
                    ({fieldGap.gaps.filter((gap: any) => gap.canFitGame).length} can fit full games)
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scheduling Results */}
      {schedulingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {schedulingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Intelligent Scheduling Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedulingResult.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Scheduling Successful!</AlertTitle>
                <AlertDescription>
                  Successfully scheduled {schedulingResult.scheduledGames} games with {schedulingResult.averageFieldUtilization}% average field utilization.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Scheduling Conflicts</AlertTitle>
                <AlertDescription>
                  {schedulingResult.conflicts.length} conflicts found. See details below.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{schedulingResult.scheduledGames}</div>
                <div className="text-sm text-muted-foreground">Games Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{schedulingResult.averageFieldUtilization}%</div>
                <div className="text-sm text-muted-foreground">Avg Field Utilization</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{schedulingResult.conflicts.length}</div>
                <div className="text-sm text-muted-foreground">Conflicts</div>
              </div>
            </div>

            {schedulingResult.conflicts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Conflicts:</h4>
                {schedulingResult.conflicts.map((conflict, index) => (
                  <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {conflict}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Algorithm Features */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Advanced Scheduling Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">✅ Gap-Filling Algorithm</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Identifies gaps between existing games</li>
                <li>• Respects team rest periods (90min minimum)</li>
                <li>• Maximizes field utilization</li>
                <li>• Prevents scheduling conflicts</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-blue-600">🎯 Proximity Optimization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Schedules on closest available fields</li>
                <li>• Reduces team travel between games</li>
                <li>• Configurable field sorting order</li>
                <li>• Intelligent field size matching</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-purple-600">⚡ Conflict Resolution</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pushes overlapping games to next slots</li>
                <li>• Maintains minimal rest period impact</li>
                <li>• Multi-objective optimization scoring</li>
                <li>• Real-time occupancy tracking</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-orange-600">📊 Utilization Analytics</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time field utilization metrics</li>
                <li>• Gap identification and analysis</li>
                <li>• Optimization opportunity detection</li>
                <li>• Performance scoring and recommendations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, MapPin, Users } from 'lucide-react';

interface FieldCapacityAnalyzerProps {
  eventId: string;
  teamsData: any[];
  gameMetadata?: {
    gameDuration: number;
    restTime: number;
    fieldOpeningTime: string;
    fieldClosingTime: string;
  };
  onAnalysisComplete: (analysis: FieldAnalysis) => void;
}

interface FieldAnalysis {
  isValid: boolean;
  totalCapacity: number;
  requiredGames: number;
  fieldBreakdown: FieldTypeAnalysis[];
  conflicts: string[];
  warnings: string[];
  recommendations: string[];
}

interface FieldTypeAnalysis {
  fieldSize: string;
  availableFields: number;
  requiredFields: number;
  capacity: number;
  requiredGames: number;
  ageGroups: string[];
  isAdequate: boolean;
}

export function FieldCapacityAnalyzer({ 
  eventId, 
  teamsData, 
  gameMetadata = {
    gameDuration: 90,
    restTime: 15,
    fieldOpeningTime: '08:00',
    fieldClosingTime: '18:00'
  },
  onAnalysisComplete 
}: FieldCapacityAnalyzerProps) {
  const [analysis, setAnalysis] = useState<FieldAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [complexes, setComplexes] = useState<any[]>([]);

  useEffect(() => {
    fetchComplexes();
  }, [eventId]);

  const fetchComplexes = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/complexes`);
      if (response.ok) {
        const data = await response.json();
        setComplexes(data);
      }
    } catch (error) {
      console.error('Error fetching complexes:', error);
    }
  };

  const calculateFieldCapacity = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/analyze-capacity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamsData,
          gameMetadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze field capacity');
      }

      const analysisResult = await response.json();
      setAnalysis(analysisResult);
      onAnalysisComplete(analysisResult);

    } catch (error) {
      console.error('Error analyzing field capacity:', error);
      // Show a basic error analysis
      const errorAnalysis: FieldAnalysis = {
        isValid: false,
        totalCapacity: 0,
        requiredGames: 0,
        fieldBreakdown: [],
        conflicts: ['Failed to analyze field capacity - please check your network connection'],
        warnings: [],
        recommendations: ['Retry the analysis or contact support']
      };
      setAnalysis(errorAnalysis);
      onAnalysisComplete(errorAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFieldSizeForAgeGroup = (ageGroupName: string): string => {
    const ageGroup = ageGroupName.toLowerCase();
    if (ageGroup.includes('u6') || ageGroup.includes('u7') || ageGroup.includes('u8')) {
      return '4v4';
    } else if (ageGroup.includes('u9') || ageGroup.includes('u10')) {
      return '7v7';
    } else if (ageGroup.includes('u11') || ageGroup.includes('u12')) {
      return '9v9';
    } else {
      return '11v11';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Field Capacity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Operating Hours: {gameMetadata.fieldOpeningTime} - {gameMetadata.fieldClosingTime}
            </div>
            <div className="text-sm text-muted-foreground">
              Game Duration: {gameMetadata.gameDuration}min + {gameMetadata.restTime}min rest
            </div>
          </div>

          <Button 
            onClick={calculateFieldCapacity}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Field Capacity...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Analyze Field Capacity
              </>
            )}
          </Button>

          {analysis && (
            <div className="space-y-4">
              {/* Overall Status */}
              <Alert variant={analysis.isValid ? "default" : "destructive"}>
                {analysis.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {analysis.isValid 
                    ? `Field capacity is adequate: ${analysis.totalCapacity} capacity for ${analysis.requiredGames} required games`
                    : `Field capacity issues detected: ${analysis.requiredGames} games needed but only ${analysis.totalCapacity} capacity available`
                  }
                </AlertDescription>
              </Alert>

              {/* Field Type Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.fieldBreakdown.map((fieldType) => (
                  <Card key={fieldType.fieldSize}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {fieldType.fieldSize} Fields
                        <Badge variant={fieldType.isAdequate ? "default" : "destructive"}>
                          {fieldType.isAdequate ? "OK" : "Shortage"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Available Fields:</span>
                        <span>{fieldType.availableFields}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Field Capacity:</span>
                        <span>{fieldType.capacity} games</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Required Games:</span>
                        <span>{fieldType.requiredGames} games</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">Age Groups:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {fieldType.ageGroups.map(ageGroup => (
                            <Badge key={ageGroup} variant="outline" className="text-xs">
                              {ageGroup}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Conflicts */}
              {analysis.conflicts.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Field Capacity Conflicts:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.conflicts.map((conflict, index) => (
                        <li key={index} className="text-sm">{conflict}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {analysis.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Warnings:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Recommendations:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
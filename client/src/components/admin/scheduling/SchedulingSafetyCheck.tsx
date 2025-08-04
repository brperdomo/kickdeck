import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Shield, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface FieldCapacityCheck {
  hasCapacity: boolean;
  totalFieldsNeeded: number;
  totalFieldsAvailable: number;
  daysRequired: number;
  utilizationPercent: number;
  warnings: string[];
  errors: string[];
}

interface DuplicateGameCheck {
  hasDuplicates: boolean;
  existingGamesCount: number;
  affectedFlights: string[];
  affectedBrackets: string[];
  errors: string[];
  warnings: string[];
}

interface ValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  allErrors: string[];
  allWarnings: string[];
  recommendation: string;
}

interface ValidationResult {
  canProceed: boolean;
  fieldCapacity: FieldCapacityCheck;
  duplicateGames: DuplicateGameCheck;
  summary: ValidationSummary;
}

interface SchedulingSafetyCheckProps {
  eventId: string;
  totalGamesNeeded: number;
  onValidationComplete?: (result: ValidationResult) => void;
  onDeleteAllGames?: () => Promise<void>;
}

export function SchedulingSafetyCheck({ 
  eventId, 
  totalGamesNeeded, 
  onValidationComplete,
  onDeleteAllGames
}: SchedulingSafetyCheckProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDeletingGames, setIsDeletingGames] = useState(false);
  const { toast } = useToast();

  const runSafetyCheck = async () => {
    setIsValidating(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/scheduling/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalGamesNeeded })
      });

      const data = await response.json();
      
      if (data.success) {
        setValidation(data.validation);
        onValidationComplete?.(data.validation);
        
        if (data.validation.canProceed) {
          toast({
            title: "Safety Check Passed",
            description: "All systems green - safe to proceed with scheduling",
            variant: "default"
          });
        } else {
          toast({
            title: "Safety Issues Detected",
            description: `${data.validation.summary.totalErrors} critical issues found`,
            variant: "destructive"
          });
        }
      } else {
        throw new Error(data.error || 'Validation failed');
      }
    } catch (error) {
      console.error('Safety check failed:', error);
      toast({
        title: "Safety Check Failed",
        description: "Unable to validate scheduling safety",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteAllGames = async () => {
    if (!onDeleteAllGames) return;
    
    setIsDeletingGames(true);
    try {
      await onDeleteAllGames();
      toast({
        title: "Games Deleted",
        description: "All existing games have been removed",
        variant: "default"
      });
      // Re-run safety check after deletion
      setTimeout(() => runSafetyCheck(), 1000);
    } catch (error) {
      console.error('Failed to delete games:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete games",
        variant: "destructive"
      });
    } finally {
      setIsDeletingGames(false);
    }
  };

  const getCapacityStatus = (capacity: FieldCapacityCheck) => {
    if (capacity.errors.length > 0) return 'error';
    if (capacity.warnings.length > 0) return 'warning';
    return 'success';
  };

  const getCapacityIcon = (status: string) => {
    switch (status) {
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Tournament Scheduling Safety Check
        </CardTitle>
        <CardDescription>
          Validate field capacity and prevent duplicate game generation before scheduling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runSafetyCheck} 
            disabled={isValidating}
            variant="outline"
          >
            {isValidating ? 'Checking...' : 'Run Safety Check'}
          </Button>
          
          {validation?.duplicateGames.hasDuplicates && onDeleteAllGames && (
            <Button 
              onClick={handleDeleteAllGames}
              disabled={isDeletingGames}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingGames ? 'Deleting...' : 'Delete All Games'}
            </Button>
          )}
        </div>

        {validation && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert variant={validation.canProceed ? "default" : "destructive"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {validation.canProceed ? 'Safe to Proceed' : 'BLOCKED - Critical Issues'}
              </AlertTitle>
              <AlertDescription>
                {validation.summary.recommendation}
              </AlertDescription>
            </Alert>

            {/* Field Capacity Check */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {getCapacityIcon(getCapacityStatus(validation.fieldCapacity))}
                  Field Capacity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Fields Available</div>
                    <div className="font-semibold">{validation.fieldCapacity.totalFieldsAvailable}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fields Needed</div>
                    <div className="font-semibold">{validation.fieldCapacity.totalFieldsNeeded}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Days Required</div>
                    <div className="font-semibold">{validation.fieldCapacity.daysRequired}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Utilization</div>
                    <div className="font-semibold">{validation.fieldCapacity.utilizationPercent}%</div>
                  </div>
                </div>

                {validation.fieldCapacity.warnings.map((warning, idx) => (
                  <Alert key={idx} variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}

                {validation.fieldCapacity.errors.map((error, idx) => (
                  <Alert key={idx} variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            {/* Duplicate Games Check */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {validation.duplicateGames.hasDuplicates ? 
                    <XCircle className="h-5 w-5 text-red-500" /> : 
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  }
                  Duplicate Game Prevention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Existing Games:</span>
                  <Badge variant={validation.duplicateGames.existingGamesCount > 0 ? "destructive" : "default"}>
                    {validation.duplicateGames.existingGamesCount} games
                  </Badge>
                </div>

                {validation.duplicateGames.warnings.map((warning, idx) => (
                  <Alert key={idx} variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}

                {validation.duplicateGames.errors.map((error, idx) => (
                  <Alert key={idx} variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Safety Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>{validation.summary.totalErrors} Errors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>{validation.summary.totalWarnings} Warnings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
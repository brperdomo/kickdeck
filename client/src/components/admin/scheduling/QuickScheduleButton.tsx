import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, AlertTriangle, CheckCircle, Users, MapPin, 
  Clock, Calendar, Trophy, Target, Loader2 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuickScheduleButtonProps {
  eventId: string;
  onScheduleComplete?: (scheduleData: any) => void;
}

interface SchedulePreview {
  totalTeams: number;
  totalGames: number;
  fieldsRequired: number;
  fieldsAvailable: number;
  estimatedDuration: string;
  conflicts: string[];
  warnings: string[];
  feasible: boolean;
  ageGroupBreakdown: any[];
}

export function QuickScheduleButton({ eventId, onScheduleComplete }: QuickScheduleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch quick preview for scheduling feasibility
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['schedule-preview', eventId],
    queryFn: async (): Promise<{ preview: SchedulePreview }> => {
      const response = await fetch(`/api/admin/events/${eventId}/scheduling/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeApprovedTeams: true, autoGenerateStructure: true })
      });
      if (!response.ok) throw new Error('Failed to generate preview');
      return response.json();
    },
    enabled: isOpen
  });

  // Generate automated schedule
  const generateSchedule = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      setProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      try {
        const response = await fetch(`/api/admin/events/${eventId}/scheduling/auto-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            includeApprovedTeams: true,
            autoCreateFlights: true,
            autoGenerateBrackets: true,
            autoSeedTeams: true,
            optimizeFieldUsage: true,
            detectConflicts: true,
            respectGameFormatRules: true
          })
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate schedule');
        }

        const result = await response.json();
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Automated Schedule Generated!",
        description: `Successfully created schedule with ${data.totalGames} games across ${data.totalDays} days.`
      });
      setIsOpen(false);
      onScheduleComplete?.(data);
    },
    onError: (error) => {
      toast({
        title: "Schedule Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setProgress(0);
    }
  });

  const handleGenerateSchedule = () => {
    if (!preview?.preview.feasible) {
      toast({
        title: "Cannot Generate Schedule",
        description: "Preview analysis shows this schedule is not feasible with current constraints.",
        variant: "destructive"
      });
      return;
    }
    generateSchedule.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Zap className="h-4 w-4 mr-2" />
          Auto-Generate Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Automated Tournament Scheduling
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {previewLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2">Analyzing tournament requirements...</span>
            </div>
          )}

          {preview && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{preview.preview.totalTeams}</div>
                    <div className="text-sm text-muted-foreground">Approved Teams</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{preview.preview.totalGames}</div>
                    <div className="text-sm text-muted-foreground">Total Games</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold">{preview.preview.fieldsRequired}</div>
                    <div className="text-sm text-muted-foreground">Fields Required</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{preview.preview.estimatedDuration}</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </CardContent>
                </Card>
              </div>

              {/* Feasibility Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Feasibility Analysis</span>
                    <Badge variant={preview.preview.feasible ? "default" : "destructive"}>
                      {preview.preview.feasible ? "Feasible" : "Not Feasible"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Age Group Breakdown */}
                    <div>
                      <h4 className="font-medium mb-2">Age Group Distribution</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {preview.preview.ageGroupBreakdown.map((ag: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm bg-muted p-2 rounded">
                            <span>{ag.ageGroup}</span>
                            <span>{ag.teamCount} teams → {ag.totalGames} games</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conflicts and Warnings */}
                    {preview.preview.conflicts.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Critical Issues:</strong>
                          <ul className="mt-2 ml-4 list-disc">
                            {preview.preview.conflicts.map((conflict, index) => (
                              <li key={index}>{conflict}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {preview.preview.warnings.length > 0 && (
                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important Considerations:</strong>
                          <ul className="mt-2 ml-4 list-disc">
                            {preview.preview.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* What Will Be Generated */}
              <Card>
                <CardHeader>
                  <CardTitle>Automated Process Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Auto-create flights by age group and gender</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Generate optimal tournament brackets</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Automatically seed teams in brackets</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Create optimized time blocks and field assignments</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Detect and resolve coach/team conflicts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Respect game format rules and field capacity</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Progress */}
              {isGenerating && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generating Schedule...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={progress} className="h-3" />
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Processing {progress < 30 ? 'team analysis' : 
                                   progress < 60 ? 'bracket generation' : 
                                   progress < 90 ? 'schedule optimization' : 'finalizing schedule'}...
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleGenerateSchedule}
                  disabled={!preview.preview.feasible || isGenerating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Schedule...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Complete Schedule
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isGenerating}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
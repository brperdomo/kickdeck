import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, Clock, CheckCircle, AlertTriangle, RotateCcw, 
  Play, Pause, Settings, Info
} from 'lucide-react';
import { useWorkflowProgress } from '@/hooks/useWorkflowProgress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WorkflowProgressIndicatorProps {
  eventId: string;
  workflowType?: 'scheduling';
  className?: string;
}

export function WorkflowProgressIndicator({ 
  eventId, 
  workflowType = 'scheduling',
  className = ''
}: WorkflowProgressIndicatorProps) {
  const { toast } = useToast();
  
  const {
    savedProgress,
    isDirty,
    isSaving,
    manualSave,
    clearProgress,
    getCompletionPercentage
  } = useWorkflowProgress(eventId, workflowType);

  const handleManualSave = async () => {
    if (!isDirty || !savedProgress) {
      toast({
        title: "No Changes",
        description: "No changes to save."
      });
      return;
    }

    const result = await manualSave();
    if (result?.success) {
      toast({
        title: "Progress Saved",
        description: result.message,
        variant: "default"
      });
    } else {
      toast({
        title: "Save Failed",
        description: result?.message || "Failed to save progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetProgress = async () => {
    await clearProgress();
    toast({
      title: "Progress Reset",
      description: "Workflow progress has been cleared. You can start fresh."
    });
  };

  const completionPercentage = getCompletionPercentage();
  const lastSaved = savedProgress?.lastSaved ? new Date(savedProgress.lastSaved) : null;

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Workflow Progress
          </span>
          <Badge variant={isDirty ? "destructive" : "default"}>
            {isDirty ? "Unsaved Changes" : "Saved"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Status Information */}
        <div className="space-y-2 text-sm">
          {lastSaved && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          {isDirty && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes that will be lost if you leave the page.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleManualSave}
            disabled={isSaving || !isDirty}
            size="sm"
            className="flex items-center gap-1 bg-[#2E86AB] hover:bg-blue-700"
          >
            <Save className="h-3 w-3" />
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Options
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Progress Management</DialogTitle>
                <DialogDescription>
                  Manage your workflow progress and auto-save settings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Progress Details */}
                {savedProgress && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Workflow Steps</h4>
                    <div className="space-y-2">
                      {savedProgress.steps.map((step: any, index: number) => (
                        <div key={step.stepId} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{step.stepName}</span>
                          <div className="flex items-center gap-2">
                            {step.isComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              Step {index + 1}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Save Info */}
                <div className="space-y-3">
                  <h4 className="font-medium">Save Settings</h4>
                  <div className="text-xs text-muted-foreground bg-[#F8F9FA] p-3 rounded border-l-4 border-l-[#2E86AB]">
                    <Info className="h-3 w-3 inline mr-1" />
                    Manual Save Mode: Use the "Save Progress" button to save your work. Progress is preserved per admin session.
                  </div>
                </div>

                {/* Reset Option */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-red-600">Danger Zone</h4>
                  <Button
                    onClick={handleResetProgress}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset All Progress
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete all saved progress for this workflow.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Session Info */}
        {savedProgress && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Session: {savedProgress.sessionId.split('-').pop()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
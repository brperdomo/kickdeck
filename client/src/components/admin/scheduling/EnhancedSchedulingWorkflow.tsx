import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, Users, Trophy, Target, Clock, Calendar, CheckCircle, 
  Circle, AlertTriangle, ArrowRight, PlayCircle
} from "lucide-react";
import { GameMetadataSetup } from "./GameMetadataSetup";
import { FlightManager } from "./FlightManager";
import { BracketCreator } from "./BracketCreator";
import { TeamSeeding } from "./TeamSeeding";
import { TimeBlockAssignment } from "./TimeBlockAssignment";
import { GameCreation } from "./GameCreation";
import { ScheduleBuilder } from "./ScheduleBuilder";
import { useToast } from "@/hooks/use-toast";

interface EnhancedSchedulingWorkflowProps {
  eventId: string;
  onComplete?: (schedule: any) => void;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: any;
  completed: boolean;
  enabled: boolean;
  data?: any;
}

export function EnhancedSchedulingWorkflow({ eventId, onComplete }: EnhancedSchedulingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define the proper 6-step workflow order
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'metadata',
      title: 'Game Metadata',
      description: 'Define game format rules and schedule constraints',
      icon: Settings,
      component: GameMetadataSetup,
      completed: false,
      enabled: true
    },
    {
      id: 'flight',
      title: 'Flight Management',
      description: 'Organize teams into competitive flights',
      icon: Users,
      component: FlightManager,
      completed: false,
      enabled: false
    },
    {
      id: 'bracket',
      title: 'Bracket Creation',
      description: 'Create tournament brackets for each flight',
      icon: Trophy,
      component: BracketCreator,
      completed: false,
      enabled: false
    },
    {
      id: 'seed',
      title: 'Team Seeding',
      description: 'Seed teams within brackets for fair competition',
      icon: Target,
      component: TeamSeeding,
      completed: false,
      enabled: false
    },
    {
      id: 'timeblock',
      title: 'Time Block Engine',
      description: 'Define game time slots and field assignments',
      icon: Clock,
      component: TimeBlockAssignment,
      completed: false,
      enabled: false
    },
    {
      id: 'schedule',
      title: 'Schedule Generation',
      description: 'Generate and finalize tournament schedule',
      icon: Calendar,
      component: ScheduleBuilder,
      completed: false,
      enabled: false
    }
  ]);

  // Fetch existing workflow progress
  const { data: workflowProgress, isLoading } = useQuery({
    queryKey: ['scheduling-workflow', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/game-metadata/${eventId}/validate`);
      if (!response.ok) throw new Error('Failed to fetch workflow progress');
      return response.json();
    }
  });

  // Load workflow progress
  useEffect(() => {
    if (workflowProgress) {
      const updatedSteps = [...steps];
      
      // Update step completion based on server validation
      if (workflowProgress.gameFormatsConfigured && workflowProgress.constraintsConfigured) {
        updatedSteps[0].completed = true;
        updatedSteps[1].enabled = true;
      }
      
      setSteps(updatedSteps);
    }
  }, [workflowProgress]);

  const handleStepComplete = (stepId: string, data: any) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    // Update workflow data
    setWorkflowData(prev => ({
      ...prev,
      [stepId]: data
    }));

    // Mark step as completed and enable next step
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].completed = true;
    updatedSteps[stepIndex].data = data;
    
    if (stepIndex < steps.length - 1) {
      updatedSteps[stepIndex + 1].enabled = true;
    }
    
    setSteps(updatedSteps);

    // Auto-advance to next step if not on last step
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }

    toast({
      title: "Step Completed",
      description: `${updatedSteps[stepIndex].title} completed successfully!`
    });

    // If this is the last step, trigger completion
    if (stepIndex === steps.length - 1) {
      handleWorkflowComplete();
    }
  };

  const handleWorkflowComplete = () => {
    const completeWorkflowData = {
      ...workflowData,
      workflowCompleted: true,
      completedAt: new Date().toISOString()
    };

    if (onComplete) {
      onComplete(completeWorkflowData);
    }

    toast({
      title: "Scheduling Workflow Complete",
      description: "6-step tournament scheduling workflow completed successfully!"
    });
  };

  const navigateToStep = (stepIndex: number) => {
    if (steps[stepIndex].enabled) {
      setCurrentStep(stepIndex);
    }
  };

  const calculateProgress = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData?.component;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <PlayCircle className="h-6 w-6 animate-spin mr-2" />
            Loading scheduling workflow...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Enhanced Tournament Scheduling Workflow
          </CardTitle>
          <p className="text-muted-foreground">
            Complete 6-step process for comprehensive tournament schedule generation with 
            configurable game rules, constraints, and intelligent automation.
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Workflow Progress</span>
              <span className="text-sm text-muted-foreground">
                {steps.filter(s => s.completed).length} / {steps.length} steps completed
              </span>
            </div>
            <Progress value={calculateProgress()} className="w-full" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4 overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = step.completed;
              const isEnabled = step.enabled;
              
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <Button
                    variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => navigateToStep(index)}
                    disabled={!isEnabled}
                    className={`h-auto p-3 flex-col gap-2 min-w-[120px] ${
                      isActive ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {isCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {!isCompleted && !isEnabled && <Circle className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="text-xs text-center">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-muted-foreground">{step.description}</div>
                    </div>
                  </Button>
                  
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Validation Alert */}
      {currentStepData && !currentStepData.enabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Complete the previous steps to unlock this stage of the workflow.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Step Content */}
      {currentStepData && currentStepData.enabled && CurrentStepComponent && (
        <CurrentStepComponent
          eventId={eventId}
          workflowData={workflowData}
          onComplete={(data: any) => handleStepComplete(currentStepData.id, data)}
        />
      )}

      {/* Workflow Summary */}
      {steps.every(step => step.completed) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Workflow Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                All 6 steps of the tournament scheduling workflow have been completed successfully. 
                Your tournament schedule is ready for management and can be exported or shared with teams.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{step.title}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => window.location.reload()}>
                  Refresh Dashboard
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(steps.length - 1)}>
                  View Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
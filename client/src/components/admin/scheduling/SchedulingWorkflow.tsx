import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, Users, Trophy, Target, Clock, Calendar, Play,
  CheckCircle, Circle, AlertTriangle, ArrowRight
} from "lucide-react";
import { GameMetadataSetup } from "./GameMetadataSetup";
import { FlightManager } from "./FlightManager";
import { BracketCreator } from "./BracketCreator";
import { TeamSeeding } from "./TeamSeeding";
import { TimeBlockAssignment } from "./TimeBlockAssignment";
import { GameCreation } from "./GameCreation";
import { ScheduleBuilder } from "./ScheduleBuilder";
import ScheduleManagement from "./ScheduleManagement";
import { useToast } from "@/hooks/use-toast";

interface SchedulingWorkflowProps {
  eventId: string;
  onComplete?: (schedule: any) => void;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  completedCount?: number;
  totalCount?: number;
}

export function SchedulingWorkflow({ eventId, onComplete }: SchedulingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch event data and teams
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      return response.json();
    },
    enabled: !!eventId
  });

  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: async () => {
      console.log('Fetching teams for event:', eventId);
      const response = await fetch(`/api/admin/teams?eventId=${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      console.log('Teams API response:', data);
      return data;
    },
    enabled: !!eventId
  });

  // Initialize enhanced 6-step workflow in proper order
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'metadata',
      title: 'Game Metadata',
      description: 'Define game format rules and schedule constraints',
      icon: Settings,
      status: 'pending'
    },
    {
      id: 'flight',
      title: 'Flight Management',
      description: 'Organize teams into competitive flights',
      icon: Users,
      status: 'pending'
    },
    {
      id: 'bracket',
      title: 'Bracket Creation',
      description: 'Create tournament brackets for each flight',
      icon: Trophy,
      status: 'pending'
    },
    {
      id: 'seed',
      title: 'Team Seeding',
      description: 'Seed teams within brackets for fair competition',
      icon: Target,
      status: 'pending'
    },
    {
      id: 'timeblock',
      title: 'Time Block Engine',
      description: 'Define game time slots and field assignments',
      icon: Clock,
      status: 'pending'
    },
    {
      id: 'schedule',
      title: 'Schedule Generation',
      description: 'Generate and finalize tournament schedule',
      icon: Calendar,
      status: 'pending'
    }
  ]);

  // Calculate overall progress
  const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / workflowSteps.length) * 100;

  // Update step status
  const updateStepStatus = (stepId: string, status: WorkflowStep['status'], data?: any) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
    
    if (data) {
      setWorkflowData(prev => ({ ...prev, [stepId]: data }));
    }

    // Auto-advance to next step if current step is completed
    if (status === 'completed') {
      const currentStepIndex = workflowSteps.findIndex(step => step.id === stepId);
      if (currentStepIndex < workflowSteps.length - 1) {
        setCurrentStep(currentStepIndex + 1);
        // Mark next step as in-progress
        const nextStepId = workflowSteps[currentStepIndex + 1].id;
        setWorkflowSteps(prev => prev.map(step => 
          step.id === nextStepId ? { ...step, status: 'in-progress' } : step
        ));
      } else {
        // All steps completed
        toast({
          title: "Workflow Complete",
          description: "All scheduling steps have been completed successfully!",
        });
        onComplete?.(workflowData);
      }
    }
  };

  // Validate workflow steps based on actual data
  const validateWorkflowSteps = async () => {
    const validationResults = {
      metadata: false,
      flight: false,
      bracket: false,
      seed: false,
      timeblock: false,
      schedule: false
    };

    try {
      // Step 1: Check if game metadata exists
      try {
        const gameMetadataResponse = await fetch(`/api/admin/game-metadata/${eventId}/game-metadata`);
        if (gameMetadataResponse.ok) {
          const gameMetadata = await gameMetadataResponse.json();
          validationResults.metadata = gameMetadata.gameFormats?.length > 0;
        }
      } catch (error) {
        console.log('Game metadata check failed:', error);
      }

      // Step 2: Check if flights exist - only if Step 1 is complete
      if (validationResults.metadata && teamsData && teamsData.length > 0) {
        // If we have teams and metadata, assume flight management is ready
        validationResults.flight = true;
      }

      // Step 3: Check if brackets exist - only if Step 2 is complete
      if (validationResults.flight) {
        try {
          const bracketResponse = await fetch(`/api/admin/events/${eventId}/brackets`);
          if (bracketResponse.ok) {
            const brackets = await bracketResponse.json();
            validationResults.bracket = brackets?.length > 0;
          }
        } catch (error) {
          console.log('Brackets check failed:', error);
        }
      }

      // Step 4: Check if team seeding exists - only if Step 3 is complete
      if (validationResults.bracket && (workflowData?.seed || workflowData?.bracket?.brackets?.length > 0)) {
        validationResults.seed = true;
      }

      // Step 5: Check if time blocks exist - only if Step 4 is complete
      if (validationResults.seed && workflowData?.timeblock?.timeBlocks?.length > 0) {
        validationResults.timeblock = true;
      }

      // Update step statuses based on validation with proper sequential logic
      setWorkflowSteps(prev => prev.map((step, index) => {
        const isCompleted = validationResults[step.id as keyof typeof validationResults];
        
        // A step can only be completed if all previous steps are completed
        const previousStepsComplete = Object.entries(validationResults)
          .slice(0, index)
          .every(([_, isComplete]) => isComplete);
        
        const finalStatus = isCompleted && previousStepsComplete ? 'completed' : 
                           step.status === 'in-progress' ? 'in-progress' : 'pending';
        
        return {
          ...step,
          status: finalStatus
        };
      }));

      // Find first incomplete step and set as current
      const firstIncompleteIndex = Object.entries(validationResults).findIndex(([_, isComplete]) => !isComplete);
      if (firstIncompleteIndex >= 0) {
        setCurrentStep(firstIncompleteIndex);
        setWorkflowSteps(prev => prev.map((step, index) => 
          index === firstIncompleteIndex ? { ...step, status: 'in-progress' } : step
        ));
      }

      // Log validation results for debugging
      console.log('Workflow validation results:', validationResults);
      console.log('Current workflow data:', workflowData);

    } catch (error) {
      console.error('Error validating workflow steps:', error);
    }
  };

  // Initialize and validate steps
  useEffect(() => {
    if (eventId && teamsData) {
      validateWorkflowSteps();
    }
  }, [eventId, teamsData]);

  const getStepIcon = (step: WorkflowStep) => {
    const IconComponent = step.icon;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <IconComponent className="h-5 w-5 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadge = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const renderStepContent = () => {
    const currentStepData = workflowSteps[currentStep];
    if (!currentStepData) return null;

    // Debug teams data structure
    console.log('SchedulingWorkflow teamsData:', teamsData);
    
    const commonProps = {
      eventId,
      eventData,
      teamsData: Array.isArray(teamsData) ? teamsData : (teamsData?.teams || []),
      workflowData,
      onComplete: (data: any) => updateStepStatus(currentStepData.id, 'completed', data),
      onError: (error: string) => {
        toast({
          title: "Step Error",
          description: error,
          variant: "destructive"
        });
        updateStepStatus(currentStepData.id, 'blocked');
      }
    };

    switch (currentStepData.id) {
      case 'metadata':
        return <GameMetadataSetup {...commonProps} />;
      case 'flight':
        return <FlightManager {...commonProps} />;
      case 'bracket':
        return <BracketCreator {...commonProps} />;
      case 'seed':
        return <TeamSeeding {...commonProps} />;
      case 'timeblock':
        return <TimeBlockAssignment {...commonProps} />;
      case 'schedule':
        return <ScheduleBuilder {...commonProps} />;
      default:
        return <div>Step not implemented</div>;
    }
  };

  if (eventLoading || teamsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading event data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Scheduling Workflow Progress</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={validateWorkflowSteps}
                className="text-xs"
              >
                Re-validate Steps
              </Button>
              <Badge variant="outline">
                {completedSteps} of {workflowSteps.length} steps completed
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full" />
            
            {/* Step Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    currentStep === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : step.status === 'completed'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (step.status !== 'pending') {
                      setCurrentStep(index);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getStepIcon(step)}
                    <h3 className="font-medium text-sm">
                      {index + 1}. {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{step.description}</p>
                  <div className="flex items-center justify-between">
                    {getStepBadge(step)}
                    {currentStep === index && (
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStepIcon(workflowSteps[currentStep])}
            Step {currentStep + 1}: {workflowSteps[currentStep]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous Step
        </Button>
        <Button 
          onClick={() => setCurrentStep(Math.min(workflowSteps.length - 1, currentStep + 1))}
          disabled={
            currentStep === workflowSteps.length - 1 || 
            workflowSteps[currentStep + 1]?.status === 'pending'
          }
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
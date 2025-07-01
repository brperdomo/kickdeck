import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, Trophy, Target, Clock, Calendar, Play,
  CheckCircle, Circle, AlertTriangle, ArrowRight
} from "lucide-react";
import { FlightManager } from "./FlightManager";
import { BracketCreator } from "./BracketCreator";
import { TeamSeeding } from "./TeamSeeding";
import { TimeBlockAssignment } from "./TimeBlockAssignment";
import { GameCreation } from "./GameCreation";
import { ScheduleBuilder } from "./ScheduleBuilder";
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

  console.log('SchedulingWorkflow component mounted with eventId:', eventId);

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
      const response = await fetch(`/api/admin/teams?eventId=${eventId}&status=approved`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      console.log('Teams API response:', data);
      console.log('Teams API response length:', data?.length);
      return data;
    },
    enabled: !!eventId
  });

  // Initialize workflow steps
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'flight',
      title: 'Flight the Teams',
      description: 'Group teams into logical flights based on age and skill level',
      icon: Users,
      status: 'pending'
    },
    {
      id: 'bracket',
      title: 'Create Brackets',
      description: 'Define bracket structure and determine team count per bracket',
      icon: Trophy,
      status: 'pending'
    },
    {
      id: 'seed',
      title: 'Seed the Teams',
      description: 'Place teams in their brackets and set matchup preferences',
      icon: Target,
      status: 'pending'
    },
    {
      id: 'timeblock',
      title: 'Assign Time Blocks',
      description: 'Set game format and time blocks for each age group',
      icon: Clock,
      status: 'pending'
    },
    {
      id: 'games',
      title: 'Create the Games',
      description: 'Generate matchups based on bracket structure and seeding',
      icon: Calendar,
      status: 'pending'
    },
    {
      id: 'schedule',
      title: 'Build Schedule',
      description: 'Assign times and fields to games using drag-and-drop or AI',
      icon: Play,
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

  // Initialize first step
  useEffect(() => {
    if (workflowSteps.length > 0 && workflowSteps[0].status === 'pending') {
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'in-progress' } : step
      ));
    }
  }, []);

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
      case 'flight':
        return <FlightManager {...commonProps} />;
      case 'bracket':
        return <BracketCreator {...commonProps} />;
      case 'seed':
        return <TeamSeeding {...commonProps} />;
      case 'timeblock':
        return <TimeBlockAssignment {...commonProps} />;
      case 'games':
        return <GameCreation {...commonProps} />;
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
            <Badge variant="outline">
              {completedSteps} of {workflowSteps.length} steps completed
            </Badge>
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
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkflowProgress } from '@/hooks/useWorkflowProgress';
import { useToast } from '@/hooks/use-toast';
import { WorkflowProgressIndicator } from './WorkflowProgressIndicator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowRight, CheckCircle, Clock, Users, Trophy, 
  Zap, BarChart3, Settings, Calendar, Target, RotateCcw
} from "lucide-react";

// Import the advanced scheduling components
import { FeasibilitySimulator } from "./FeasibilitySimulator";
import { BracketVisualPreview } from "./BracketVisualPreview";
import { ScenarioPreviewTool } from "./ScenarioPreviewTool";
import { LiveSchedulerView } from "./LiveSchedulerView";
import { ScheduleQualityMetrics } from "./ScheduleQualityMetrics";
import { RefereeAssignmentEngine } from "./RefereeAssignmentEngine";

// Import existing workflow components
import { GameMetadataSetup } from "./GameMetadataSetup";
import { FieldCapacityAnalyzer } from "./FieldCapacityAnalyzer";
import { AutomatedSchedulingEngine } from "./AutomatedSchedulingEngine";
import { TrueAutomatedScheduler } from "./TrueAutomatedScheduler";
import { SchedulingWorkflowGuide } from "./SchedulingWorkflowGuide";

interface EnhancedSchedulingWorkflowProps {
  eventId: string;
  onComplete?: (finalSchedule: any) => void;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  isEnhancement?: boolean;
  requiresCompletion?: boolean;
}

interface WorkflowData {
  gameMetadata?: any;
  flight?: any;
  bracket?: any;
  seed?: any;
  timeBlocks?: any;
  schedule?: any;
  feasibility?: any;
  quality?: any;
  referees?: any;
}

export function EnhancedSchedulingWorkflow({ eventId, onComplete }: EnhancedSchedulingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({});
  const [stepStatuses, setStepStatuses] = useState<{[key: string]: 'pending' | 'active' | 'completed' | 'skipped'}>({});
  const [showGuide, setShowGuide] = useState(true);
  const [selectedPath, setSelectedPath] = useState<'automated' | 'manual' | null>(null);
  const { toast } = useToast();

  // Initialize progress saving
  const {
    savedProgress,
    updateStepData,
    advanceToStep,
    initializeProgress,
    enableAutoSave,
    getStepData,
    isStepComplete,
    getCurrentStep,
    clearProgress
  } = useWorkflowProgress(eventId, 'scheduling');

  // Fetch event data for workflow
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['event-workflow', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event data');
      return response.json();
    }
  });

  // Define the enhanced workflow with TRUE automated scheduling
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'true-automated-scheduling',
      title: 'One-Click Tournament Scheduling',
      description: 'Generate complete tournament schedule instantly - no configuration required',
      component: TrueAutomatedScheduler,
      status: 'pending',
      requiresCompletion: false
    },
    {
      id: 'field-capacity',
      title: 'Field Capacity Analysis',
      description: 'Validate field availability and capacity before scheduling',
      component: FieldCapacityAnalyzer,
      status: 'pending',
      requiresCompletion: true
    },
    {
      id: 'game-metadata',
      title: 'Game Metadata Setup',
      description: 'Configure tournament-specific game format rules and constraints',
      component: GameMetadataSetup,
      status: 'pending',
      requiresCompletion: true
    },
    {
      id: 'flight-management',
      title: 'Flight Management',
      description: 'Organize teams into competitive flights and age groups',
      component: ({ eventId, workflowData, onComplete }) => (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-medium mb-2">Flight Management</h3>
              <p className="text-muted-foreground mb-4">
                Team flight organization will be integrated here.
              </p>
              <Button onClick={() => onComplete?.({})}>
                Continue with Existing Teams
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
      status: 'pending'
    },
    {
      id: 'bracket-preview',
      title: 'Bracket Visual Preview',
      description: 'Review and confirm bracket layouts before game generation',
      component: BracketVisualPreview,
      status: 'pending',
      isEnhancement: true
    },
    {
      id: 'team-seeding',
      title: 'Team Seeding',
      description: 'Seed teams within brackets for fair competition',
      component: ({ eventId, workflowData, onComplete }) => (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="text-lg font-medium mb-2">Team Seeding</h3>
              <p className="text-muted-foreground mb-4">
                Team seeding and bracket assignment will be integrated here.
              </p>
              <Button onClick={() => onComplete?.({})}>
                Continue with Auto-Seeding
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
      status: 'pending'
    },
    {
      id: 'feasibility-check',
      title: 'Feasibility Simulation',
      description: 'Validate that all games can fit within current constraints',
      component: FeasibilitySimulator,
      status: 'pending',
      isEnhancement: true
    },
    {
      id: 'scenario-preview',
      title: 'Scenario Preview Tool',
      description: 'Test different scheduling parameters and see impact on feasibility',
      component: ScenarioPreviewTool,
      status: 'pending',
      isEnhancement: true
    },
    {
      id: 'time-blocks',
      title: 'Time Block Engine',
      description: 'Create and assign time slots based on game metadata rules',
      component: ({ eventId, workflowData, onComplete }) => (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-medium mb-2">Time Block Engine</h3>
              <p className="text-muted-foreground mb-4">
                Time slot generation based on game metadata rules will be integrated here.
              </p>
              <Button onClick={() => onComplete?.({})}>
                Generate Time Blocks
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
      status: 'pending'
    },
    {
      id: 'schedule-generation',
      title: 'Schedule Generation',
      description: 'Generate the complete tournament schedule with all constraints',
      component: ({ eventId, workflowData, onComplete }) => (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-medium mb-2">Schedule Generation</h3>
              <p className="text-muted-foreground mb-4">
                Final schedule generation will create all games with proper timing and field assignments.
              </p>
              <Button onClick={() => onComplete?.({ schedule: { generated: true } })}>
                Generate Complete Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
      status: 'pending'
    },
    {
      id: 'live-scheduler',
      title: 'Live Schedule Manager',
      description: 'Make manual adjustments with drag-and-drop interface',
      component: LiveSchedulerView,
      status: 'pending',
      isEnhancement: true
    },
    {
      id: 'quality-metrics',
      title: 'Schedule Quality Analysis',
      description: 'Evaluate fairness, efficiency, and optimization opportunities',
      component: ScheduleQualityMetrics,
      status: 'pending',
      isEnhancement: true
    },
    {
      id: 'referee-assignment',
      title: 'Referee Assignment Engine',
      description: 'Assign referees with conflict detection and automated scheduling',
      component: RefereeAssignmentEngine,
      status: 'pending',
      isEnhancement: true
    }
  ];

  // Initialize step statuses and progress saving
  useEffect(() => {
    const initialStatuses: {[key: string]: 'pending' | 'active' | 'completed' | 'skipped'} = {};
    
    // Check if we have saved progress
    if (savedProgress && savedProgress.steps.length > 0) {
      // Restore from saved progress
      const savedStep = getCurrentStep();
      setCurrentStep(savedStep);
      
      savedProgress.steps.forEach((step: any) => {
        initialStatuses[step.stepId] = step.isComplete ? 'completed' : 
          savedProgress.currentStep === savedProgress.steps.findIndex((s: any) => s.stepId === step.stepId) ? 'active' : 'pending';
      });
      
      // Restore workflow data from saved progress
      const restoredData: WorkflowData = {};
      savedProgress.steps.forEach((step: any) => {
        if (step.data) {
          restoredData[step.stepId as keyof WorkflowData] = step.data;
        }
      });
      setWorkflowData(restoredData);
    } else {
      // Initialize fresh workflow
      workflowSteps.forEach((step, index) => {
        initialStatuses[step.id] = index === 0 ? 'active' : 'pending';
      });
      
      // Initialize progress tracking
      const initialSteps = workflowSteps.map(step => ({
        stepId: step.id,
        stepName: step.title,
        isComplete: false,
        data: {}
      }));
      initializeProgress(initialSteps);
    }
    
    setStepStatuses(initialStatuses);
    enableAutoSave(30000); // Enable auto-save every 30 seconds
  }, [savedProgress]);

  const handleStepComplete = (stepId: string, stepData: any) => {
    console.log(`Step ${stepId} completed with data:`, stepData);
    
    // Update workflow data
    setWorkflowData(prev => ({
      ...prev,
      [stepId]: stepData
    }));

    // Mark current step as completed
    setStepStatuses(prev => ({
      ...prev,
      [stepId]: 'completed'
    }));

    // Save progress
    updateStepData(stepId, stepData, true);

    // Move to next step
    const currentIndex = workflowSteps.findIndex(step => step.id === stepId);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < workflowSteps.length) {
      setCurrentStep(nextIndex);
      setStepStatuses(prev => ({
        ...prev,
        [workflowSteps[nextIndex].id]: 'active'
      }));
      
      // Advance progress tracking to next step
      advanceToStep(nextIndex);
    } else {
      // Workflow complete
      onComplete?.(workflowData);
    }
  };

  const handleStepSkip = (stepId: string) => {
    setStepStatuses(prev => ({
      ...prev,
      [stepId]: 'skipped'
    }));

    const currentIndex = workflowSteps.findIndex(step => step.id === stepId);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < workflowSteps.length) {
      setCurrentStep(nextIndex);
      setStepStatuses(prev => ({
        ...prev,
        [workflowSteps[nextIndex].id]: 'active'
      }));
    }
  };

  const navigateToStep = (stepIndex: number) => {
    // Only allow navigation to completed steps or the current active step
    const targetStep = workflowSteps[stepIndex];
    const targetStatus = stepStatuses[targetStep.id];
    
    if (targetStatus === 'completed' || targetStatus === 'active' || stepIndex <= currentStep + 1) {
      setCurrentStep(stepIndex);
      setStepStatuses(prev => ({
        ...prev,
        [targetStep.id]: 'active'
      }));
    }
  };

  const handleStartFresh = async () => {
    try {
      // Clear all workflow progress
      await clearProgress();
      
      // Reset all state
      setCurrentStep(0);
      setWorkflowData({});
      
      // Reset step statuses
      const freshStatuses: {[key: string]: 'pending' | 'active' | 'completed' | 'skipped'} = {};
      workflowSteps.forEach((step, index) => {
        freshStatuses[step.id] = index === 0 ? 'active' : 'pending';
      });
      setStepStatuses(freshStatuses);
      
      // Initialize fresh progress tracking
      const initialSteps = workflowSteps.map(step => ({
        stepId: step.id,
        stepName: step.title,
        isComplete: false,
        data: {}
      }));
      initializeProgress(initialSteps);
      
      toast({
        title: "Workflow Reset",
        description: "Started fresh with a clean scheduling workflow.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to start fresh:', error);
      toast({
        title: "Reset Failed",
        description: "Could not reset the workflow. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStepIcon = (step: WorkflowStep) => {
    const status = stepStatuses[step.id];
    
    if (status === 'completed') return CheckCircle;
    if (step.isEnhancement) return Zap;
    
    switch (step.id) {
      case 'game-metadata': return Settings;
      case 'flight-management': return Users;
      case 'bracket-preview': return Trophy;
      case 'team-seeding': return Target;
      case 'time-blocks': return Clock;
      case 'schedule-generation': return Calendar;
      case 'quality-metrics': return BarChart3;
      default: return ArrowRight;
    }
  };

  const getStepColor = (step: WorkflowStep) => {
    const status = stepStatuses[step.id];
    
    if (status === 'completed') return 'text-green-600';
    if (status === 'active') return 'text-blue-600';
    if (status === 'skipped') return 'text-gray-400';
    if (step.isEnhancement) return 'text-purple-600';
    return 'text-gray-500';
  };

  const handlePathSelection = (path: 'automated' | 'manual') => {
    setSelectedPath(path);
    setShowGuide(false);
    
    if (path === 'automated') {
      // Go directly to automated scheduling
      setCurrentStep(0); // First step is automated scheduling
    } else {
      // Start manual workflow from step 2 (skip automated)
      setCurrentStep(1); // Skip automated, start at field capacity
    }
  };

  const handleBackToGuide = () => {
    setShowGuide(true);
    setSelectedPath(null);
  };

  const completedSteps = Object.values(stepStatuses).filter(status => status === 'completed').length;
  const progressPercentage = (completedSteps / workflowSteps.length) * 100;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Calendar className="h-6 w-6 animate-pulse mr-2" />
            Loading enhanced scheduling workflow...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show guide if user hasn't selected a path yet
  if (showGuide && !selectedPath) {
    return (
      <div className="space-y-6">
        <SchedulingWorkflowGuide 
          onSelectPath={handlePathSelection}
        />
      </div>
    );
  }

  const currentWorkflowStep = workflowSteps[currentStep];
  const StepComponent = currentWorkflowStep?.component;

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6" />
                Enhanced Tournament Scheduling Workflow
              </CardTitle>
              <p className="text-muted-foreground">
                Smart, interactive, and scalable scheduling system with advanced features for comprehensive tournament management.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleBackToGuide}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Back to Guide
              </Button>
              <Button 
                variant="outline" 
                onClick={handleStartFresh}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Fresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{completedSteps}/{workflowSteps.length} steps completed</span>
            </div>
            <Progress value={progressPercentage} />
          </div>
          
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              This enhanced workflow includes advanced features: feasibility simulation, 
              live drag-and-drop scheduling, quality metrics, scenario testing, referee assignment, 
              and visual bracket previews for comprehensive tournament management.
            </AlertDescription>
          </Alert>
          
          {/* Progress Saving Indicator */}
          <WorkflowProgressIndicator eventId={eventId} />
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workflowSteps.map((step, index) => {
              const Icon = getStepIcon(step);
              const status = stepStatuses[step.id];
              
              return (
                <Button
                  key={step.id}
                  variant={status === 'active' ? 'default' : 'outline'}
                  className={`h-auto p-3 flex-col gap-2 ${getStepColor(step)}`}
                  onClick={() => navigateToStep(index)}
                  disabled={status === 'pending' && index > currentStep + 1}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.title}</span>
                    {step.isEnhancement && (
                      <Badge variant="secondary" className="text-xs">
                        Enhanced
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-center opacity-75">
                    {step.description}
                  </div>
                  {status === 'completed' && (
                    <Badge variant="default" className="text-xs">
                      Completed
                    </Badge>
                  )}
                  {status === 'skipped' && (
                    <Badge variant="outline" className="text-xs">
                      Skipped
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {StepComponent && currentWorkflowStep && (
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(getStepIcon(currentWorkflowStep), { className: "h-5 w-5" })}
                Step {currentStep + 1}: {currentWorkflowStep.title}
                {currentWorkflowStep.isEnhancement && (
                  <Badge variant="secondary">Enhanced Feature</Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground">
                {currentWorkflowStep.description}
              </p>
            </CardHeader>
          </Card>

          <StepComponent
            eventId={eventId}
            workflowData={workflowData}
            onComplete={(data: any) => handleStepComplete(currentWorkflowStep.id, data)}
            onSkip={() => handleStepSkip(currentWorkflowStep.id)}
            scheduleData={workflowData.schedule}
            baselineData={workflowData}
          />
        </div>
      )}

      {/* Workflow Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enhanced Scheduling Workflow</h3>
              <p className="text-sm text-muted-foreground">
                Complete all steps to generate a comprehensive tournament schedule with advanced features.
              </p>
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => navigateToStep(currentStep - 1)}
                >
                  Previous Step
                </Button>
              )}
              {!currentWorkflowStep?.requiresCompletion && (
                <Button 
                  variant="outline" 
                  onClick={() => handleStepSkip(currentWorkflowStep.id)}
                >
                  Skip Step
                </Button>
              )}
              {currentStep === workflowSteps.length - 1 && (
                <Button onClick={() => onComplete?.(workflowData)}>
                  Complete Workflow
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
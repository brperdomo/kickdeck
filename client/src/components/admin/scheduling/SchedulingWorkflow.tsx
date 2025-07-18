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
  validationDetails?: string;
  validationErrors?: string[];
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
      metadata: { completed: false, errors: [] as string[], details: '' },
      flight: { completed: false, errors: [] as string[], details: '' },
      bracket: { completed: false, errors: [] as string[], details: '' },
      seed: { completed: false, errors: [] as string[], details: '' },
      timeblock: { completed: false, errors: [] as string[], details: '' },
      schedule: { completed: false, errors: [] as string[], details: '' }
    };

    try {
      // Step 1: Check if game metadata exists
      try {
        const gameMetadataResponse = await fetch(`/api/admin/events/${eventId}/game-metadata`);
        if (gameMetadataResponse.ok) {
          const gameMetadata = await gameMetadataResponse.json();
          const hasFormats = gameMetadata.gameFormats?.length > 0;
          const hasConstraints = gameMetadata.constraints;
          
          validationResults.metadata.completed = hasFormats && hasConstraints;
          
          if (!hasFormats) {
            validationResults.metadata.errors.push('No game format rules configured');
          }
          if (!hasConstraints) {
            validationResults.metadata.errors.push('No schedule constraints configured');
          }
          
          validationResults.metadata.details = hasFormats && hasConstraints 
            ? `✓ ${gameMetadata.gameFormats.length} game formats and schedule constraints configured`
            : `Missing: ${validationResults.metadata.errors.join(', ')}`;
        } else {
          validationResults.metadata.errors.push('Failed to fetch game metadata');
          validationResults.metadata.details = 'API request failed';
        }
      } catch (error) {
        console.log('Game metadata check failed:', error);
        validationResults.metadata.errors.push('Connection error checking game metadata');
        validationResults.metadata.details = 'Network or server error';
      }

      // Step 2: Check if flights exist - only if Step 1 is complete
      if (validationResults.metadata.completed) {
        if (teamsData && teamsData.length > 0) {
          validationResults.flight.completed = true;
          validationResults.flight.details = `✓ ${teamsData.length} teams available for flight assignment`;
        } else {
          validationResults.flight.errors.push('No teams found for flight assignment');
          validationResults.flight.details = 'Teams must be registered and approved before flight management';
        }
      } else {
        validationResults.flight.errors.push('Game metadata must be completed first');
        validationResults.flight.details = 'Complete Step 1: Game Metadata Setup';
      }

      // Step 3: Check if brackets exist - only if Step 2 is complete
      if (validationResults.flight.completed) {
        try {
          const bracketResponse = await fetch(`/api/admin/events/${eventId}/brackets`);
          if (bracketResponse.ok) {
            const brackets = await bracketResponse.json();
            if (brackets?.length > 0) {
              validationResults.bracket.completed = true;
              validationResults.bracket.details = `✓ ${brackets.length} brackets created`;
            } else {
              validationResults.bracket.errors.push('No brackets created');
              validationResults.bracket.details = 'Create brackets for age groups in Step 3';
            }
          } else {
            validationResults.bracket.errors.push('Failed to fetch brackets');
            validationResults.bracket.details = 'API request failed';
          }
        } catch (error) {
          console.log('Brackets check failed:', error);
          validationResults.bracket.errors.push('Connection error checking brackets');
          validationResults.bracket.details = 'Network or server error';
        }
      } else {
        validationResults.bracket.errors.push('Flight management must be completed first');
        validationResults.bracket.details = 'Complete Step 2: Flight Management';
      }

      // Step 4: Check if team seeding exists - only if Step 3 is complete
      if (validationResults.bracket.completed) {
        if (workflowData?.seed || workflowData?.bracket?.brackets?.length > 0) {
          validationResults.seed.completed = true;
          validationResults.seed.details = '✓ Team seeding configured';
        } else {
          validationResults.seed.errors.push('Team seeding not configured');
          validationResults.seed.details = 'Assign teams to bracket positions in Step 4';
        }
      } else {
        validationResults.seed.errors.push('Brackets must be created first');
        validationResults.seed.details = 'Complete Step 3: Bracket Creation';
      }

      // Step 5: Check if time blocks exist - only if Step 4 is complete
      if (validationResults.seed.completed) {
        if (workflowData?.timeblock?.timeBlocks?.length > 0) {
          validationResults.timeblock.completed = true;
          validationResults.timeblock.details = `✓ ${workflowData.timeblock.timeBlocks.length} time blocks configured`;
        } else {
          validationResults.timeblock.errors.push('No time blocks configured');
          validationResults.timeblock.details = 'Set up game time slots in Step 5';
        }
      } else {
        validationResults.timeblock.errors.push('Team seeding must be completed first');
        validationResults.timeblock.details = 'Complete Step 4: Team Seeding';
      }

      // Step 6: Check if schedule exists - only if Step 5 is complete
      if (validationResults.timeblock.completed) {
        try {
          const scheduleResponse = await fetch(`/api/admin/events/${eventId}/schedule`);
          if (scheduleResponse.ok) {
            const schedule = await scheduleResponse.json();
            if (schedule?.games?.length > 0) {
              validationResults.schedule.completed = true;
              validationResults.schedule.details = `✓ ${schedule.games.length} games scheduled`;
            } else {
              validationResults.schedule.errors.push('No games generated');
              validationResults.schedule.details = 'Generate final schedule in Step 6';
            }
          } else {
            validationResults.schedule.errors.push('Failed to fetch schedule');
            validationResults.schedule.details = 'Schedule not yet generated';
          }
        } catch (error) {
          validationResults.schedule.errors.push('Connection error checking schedule');
          validationResults.schedule.details = 'Network or server error';
        }
      } else {
        validationResults.schedule.errors.push('Time blocks must be configured first');
        validationResults.schedule.details = 'Complete Step 5: Time Block Engine';
      }

      // Update step statuses based on validation with proper sequential logic
      setWorkflowSteps(prev => prev.map((step, index) => {
        const stepResult = validationResults[step.id as keyof typeof validationResults];
        const isCompleted = stepResult.completed;
        
        // A step can only be completed if all previous steps are completed
        const previousStepsComplete = Object.values(validationResults)
          .slice(0, index)
          .every(result => result.completed);
        
        const finalStatus = isCompleted && previousStepsComplete ? 'completed' : 
                           step.status === 'in-progress' ? 'in-progress' : 'pending';
        
        return {
          ...step,
          status: finalStatus,
          validationDetails: stepResult.details,
          validationErrors: stepResult.errors
        };
      }));

      // Find first incomplete step and set as current
      const firstIncompleteIndex = Object.values(validationResults).findIndex(result => !result.completed);
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
    
    // Ensure teams data is properly formatted
    const processedTeamsData = Array.isArray(teamsData) ? teamsData : (teamsData?.teams || []);
    
    console.log('Processing teams data:', {
      originalLength: teamsData?.length,
      processedLength: processedTeamsData.length,
      firstTeam: processedTeamsData[0]
    });

    const commonProps = {
      eventId,
      eventData,
      teamsData: processedTeamsData,
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
              {workflowSteps.map((step, index) => {
                // Determine if step is accessible
                const canAccess = index === 0 || // First step is always accessible
                  (index === currentStep) || // Current step is always accessible
                  (workflowSteps.slice(0, index).every(prevStep => prevStep.status === 'completed')); // All previous steps must be completed
                
                const isBlocked = !canAccess;
                
                return (
                <div
                  key={step.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isBlocked
                      ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                      : currentStep === index 
                      ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                      : step.status === 'completed'
                      ? 'border-green-500 bg-green-50 cursor-pointer hover:bg-green-100'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => {
                    // Only allow access if all previous steps are completed OR this is the current active step
                    const canAccess = index === 0 || // First step is always accessible
                      (index === currentStep) || // Current step is always accessible
                      (workflowSteps.slice(0, index).every(prevStep => prevStep.status === 'completed')); // All previous steps must be completed
                    
                    if (canAccess) {
                      setCurrentStep(index);
                    } else {
                      // Show error for blocked steps
                      const previousIncompleteStep = workflowSteps.slice(0, index).find(prevStep => prevStep.status !== 'completed');
                      toast({
                        title: "Step Blocked",
                        description: `Complete "${previousIncompleteStep?.title}" before accessing this step.`,
                        variant: "destructive"
                      });
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
                  
                  {/* Validation Details */}
                  {step.validationDetails && (
                    <div className="mb-3">
                      <p className={`text-xs ${step.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                        {step.validationDetails}
                      </p>
                      {step.validationErrors && step.validationErrors.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {step.validationErrors.map((error, errIndex) => (
                            <li key={errIndex} className="text-xs text-red-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  
                  {/* Blocked Step Indicator */}
                  {isBlocked && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Complete previous steps to unlock
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    {getStepBadge(step)}
                    {currentStep === index && !isBlocked && (
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    )}
                    {isBlocked && (
                      <Badge variant="secondary" className="text-xs">Locked</Badge>
                    )}
                  </div>
                </div>
                );
              })}
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
          onClick={() => {
            // Only allow advancing if current step is completed
            if (workflowSteps[currentStep]?.status === 'completed') {
              setCurrentStep(Math.min(workflowSteps.length - 1, currentStep + 1));
            } else {
              toast({
                title: "Step Not Complete",
                description: `Complete "${workflowSteps[currentStep]?.title}" before advancing to the next step.`,
                variant: "destructive"
              });
            }
          }}
          disabled={
            currentStep === workflowSteps.length - 1 || 
            workflowSteps[currentStep]?.status !== 'completed'
          }
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
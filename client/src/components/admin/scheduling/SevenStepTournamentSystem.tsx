import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, Users, Trophy, Calendar, MapPin, FileText, Share2,
  CheckCircle, Clock, ArrowRight, Play
} from 'lucide-react';
import { TournamentParametersSetup } from './TournamentParametersSetup';
import { FlightCreationStep } from './FlightCreationStep';
import { BracketGenerationStep } from './BracketGenerationStep';
import { GameSchedulingStep } from './GameSchedulingStep';
import { FieldAssignmentStep } from './FieldAssignmentStep';
import { SchedulePublicationStep } from './SchedulePublicationStep';

interface SevenStepTournamentSystemProps {
  eventId: string;
}

interface StepDefinition {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  component?: React.ComponentType<any>;
  estimatedTime: string;
}

export function SevenStepTournamentSystem({ eventId }: SevenStepTournamentSystemProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: StepDefinition[] = [
    {
      id: 1,
      title: 'Tournament Parameters Definition',
      description: 'Define age groups, game formats, field requirements, and time constraints with centralized parameter management.',
      icon: <Settings className="h-5 w-5" />,
      status: currentStep === 1 ? 'current' : completedSteps.includes(1) ? 'completed' : 'pending',
      component: TournamentParametersSetup,
      estimatedTime: '15-20 min'
    },
    {
      id: 2,
      title: 'Flight Creation & Organization',
      description: 'Organize teams into flights based on age groups, skill levels, and competitive balance requirements.',
      icon: <Trophy className="h-5 w-5" />,
      status: currentStep === 2 ? 'current' : completedSteps.includes(2) ? 'completed' : 'pending',
      component: FlightCreationStep,
      estimatedTime: '10-15 min'
    },
    {
      id: 3,
      title: 'Bracket Generation & Seeding',
      description: 'Generate tournament brackets with intelligent seeding algorithms and competitive balance optimization.',
      icon: <Calendar className="h-5 w-5" />,
      status: currentStep === 3 ? 'current' : completedSteps.includes(3) ? 'completed' : 'pending',
      component: BracketGenerationStep,
      estimatedTime: '5-10 min'
    },
    {
      id: 4,
      title: 'Game Scheduling & Time Assignment',
      description: 'Schedule games with optimal time distribution, rest periods, and conflict detection across all brackets.',
      icon: <Clock className="h-5 w-5" />,
      status: currentStep === 4 ? 'current' : completedSteps.includes(4) ? 'completed' : 'pending',
      component: GameSchedulingStep,
      estimatedTime: '10-15 min'
    },
    {
      id: 5,
      title: 'Field Assignment & Resource Allocation',
      description: 'Assign games to specific fields with capacity analysis, surface preferences, and geographic optimization.',
      icon: <MapPin className="h-5 w-5" />,
      status: currentStep === 5 ? 'current' : completedSteps.includes(5) ? 'completed' : 'pending',
      component: FieldAssignmentStep,
      estimatedTime: '5-10 min'
    },
    {
      id: 6,
      title: 'Schedule Publication & Distribution',
      description: 'Finalize and publish the complete tournament schedule with team notifications and schedule exports.',
      icon: <Share2 className="h-5 w-5" />,
      status: currentStep === 6 ? 'current' : completedSteps.includes(6) ? 'completed' : 'pending',
      component: SchedulePublicationStep,
      estimatedTime: '5-10 min'
    }
  ];

  const handleStepComplete = (stepId: number, data?: any) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    // Move to next step if not at the end
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
    }
  };

  const handleStepNavigation = (stepId: number) => {
    // Only allow navigation to completed steps or the next step
    if (completedSteps.includes(stepId) || stepId === Math.max(...completedSteps) + 1 || stepId === 1) {
      setCurrentStep(stepId);
    }
  };

  const getProgressPercentage = () => {
    return (completedSteps.length / steps.length) * 100;
  };

  const getCurrentStepComponent = () => {
    const step = steps.find(s => s.id === currentStep);
    if (step?.component) {
      const Component = step.component;
      return (
        <Component 
          eventId={eventId} 
          onComplete={(data: any) => handleStepComplete(currentStep, data)}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* System Overview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-600">
                7-Step Automated Tournament System
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Systematic approach to tournament management with genuine one-click automation
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Overall Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {completedSteps.length}/{steps.length}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Steps Completed: {completedSteps.length}</span>
              <span>Estimated Total Time: 60-90 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <Button
                  variant={step.status === 'current' ? 'default' : step.status === 'completed' ? 'outline' : 'ghost'}
                  size="lg"
                  className={`w-full h-auto p-4 flex flex-col items-center space-y-2 ${
                    step.status === 'completed' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                    step.status === 'current' ? 'bg-blue-600 text-white' :
                    'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => handleStepNavigation(step.id)}
                  disabled={step.status === 'pending' && !completedSteps.includes(step.id - 1) && step.id !== 1}
                >
                  <div className="flex items-center space-x-2">
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      step.icon
                    )}
                    <Badge variant={step.status === 'current' ? 'secondary' : 'outline'}>
                      {step.id}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">{step.title}</div>
                    <div className="text-xs opacity-75">{step.estimatedTime}</div>
                  </div>
                </Button>
                
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <ArrowRight className="absolute -right-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {steps.find(s => s.id === currentStep)?.icon}
              <div>
                <CardTitle>
                  Step {currentStep}: {steps.find(s => s.id === currentStep)?.title}
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  {steps.find(s => s.id === currentStep)?.description}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {steps.find(s => s.id === currentStep)?.estimatedTime}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Current Step Component */}
      {getCurrentStepComponent()}

      {/* Quick Actions */}
      {completedSteps.length === steps.length && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Tournament System Complete!</h3>
                  <p className="text-green-700">All 7 steps completed. Your tournament is ready for operation.</p>
                </div>
              </div>
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Launch Tournament
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
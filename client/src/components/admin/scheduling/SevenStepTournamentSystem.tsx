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
import { FlexibleAgeGroupManager } from './FlexibleAgeGroupManager';
import { FlightCreationStep } from './FlightCreationStep';
import { BracketGenerationStep } from './BracketGenerationStep';
import { GameSchedulingStep } from './GameSchedulingStep';
import { FieldAssignmentStep } from './FieldAssignmentStep';
import { SchedulePublicationStep } from './SchedulePublicationStep';
import { FlexibleSchedulingGuide } from './FlexibleSchedulingGuide';
import { TournamentStatusDisplay } from './TournamentStatusDisplay';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: StepDefinition[] = [
    {
      id: 1,
      title: 'Flexible Age Group Management',
      description: 'Add and schedule individual age groups when ready - no need to configure everything at once',
      icon: <Users className="h-5 w-5" />,
      status: currentStep === 1 ? 'current' : completedSteps.includes(1) ? 'completed' : 'pending',
      component: FlexibleAgeGroupManager,
      estimatedTime: '5-10 min per age group'
    },
    {
      id: 2,
      title: 'Traditional Tournament Configuration',
      description: 'For tournaments requiring all age groups configured at once (alternative to flexible approach)',
      icon: <Settings className="h-5 w-5" />,
      status: currentStep === 2 ? 'current' : completedSteps.includes(2) ? 'completed' : 'pending',
      component: TournamentParametersSetup,
      estimatedTime: '15-30 min (optional)'
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
    switch(currentStep) {
      case 0:
        return <TournamentStatusDisplay eventId={eventId} />;
      case 1:
        return <FlexibleAgeGroupManager eventId={eventId} />;
      case 2:
        return <TournamentParametersSetup eventId={eventId} />;
      case 3:
        return <BracketGenerationStep eventId={eventId} />;
      case 4:
        return <GameSchedulingStep eventId={eventId} />;
      case 5:
        return <FieldAssignmentStep eventId={eventId} />;
      case 6:
        return <SchedulePublicationStep eventId={eventId} />;
      case 7:
        return <FlexibleSchedulingGuide />;
      default:
        return <TournamentStatusDisplay eventId={eventId} />;
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Modern Progress Overview */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStep === 0 ? 'Tournament Status Overview' : '7-Step Tournament System'}
              </h2>
              <p className="text-gray-600">
                {currentStep === 0 ? 'Your tournament scheduling status' : 'Automated tournament scheduling workflow'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentStep === 0 ? (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-4 py-2">
                Tournament Complete
              </Badge>
            ) : (
              <>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-4 py-2">
                  {completedSteps.length}/{steps.length} Complete
                </Badge>
                <div className="text-right text-sm">
                  <div className="font-semibold text-gray-900">{Math.round(getProgressPercentage())}%</div>
                  <div className="text-gray-500">Progress</div>
                </div>
              </>
            )}
            <Button 
              onClick={() => setCurrentStep(currentStep === 0 ? 1 : 0)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {currentStep === 0 ? 'View Steps' : 'View Status'}
            </Button>
          </div>
        </div>
        
        {currentStep > 0 && (
          <div className="relative">
            <Progress value={getProgressPercentage()} className="h-3 bg-gray-100" />
            <div className="absolute -top-1 left-0 right-0 flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                    completedSteps.includes(step.id)
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-500'
                      : currentStep === step.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                  style={{ left: `${(index / (steps.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Step Navigation */}
      {currentStep > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {steps.map((step) => (
          <Card 
            key={step.id}
            className={`group cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl overflow-hidden ${
              step.status === 'current' 
                ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50' 
                : step.status === 'completed'
                ? 'ring-2 ring-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50'
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleStepNavigation(step.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    step.status === 'completed' 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      : step.status === 'current'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : step.icon}
                  </div>
                  <div>
                    <Badge className={`${
                      step.status === 'current' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0' 
                        : step.status === 'completed'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      Step {step.id}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.estimatedTime}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-base leading-tight text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-emerald-600' :
                  step.status === 'current' ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.status === 'completed' ? '✓ Completed' :
                   step.status === 'current' ? '→ In Progress' : '○ Pending'}
                </div>
                {step.status === 'current' && (
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                    <Play className="h-3 w-3 mr-1" />
                    Continue
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Current Step Details */}
      {currentStep > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  {steps.find(s => s.id === currentStep)?.icon && 
                    React.cloneElement(steps.find(s => s.id === currentStep)!.icon as React.ReactElement, {
                      className: "h-6 w-6 text-white"
                    })
                  }
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Step {currentStep}: {steps.find(s => s.id === currentStep)?.title}
                  </CardTitle>
                  <p className="text-gray-600 mt-1 leading-relaxed">
                    {steps.find(s => s.id === currentStep)?.description}
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3 py-1">
                {steps.find(s => s.id === currentStep)?.estimatedTime}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Current Step Component */}
      <div className="mt-8">
        {getCurrentStepComponent()}
      </div>

      {/* Completion Celebration */}
      {completedSteps.length === steps.length && (
        <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 to-teal-50 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Tournament System Complete!
                  </h3>
                  <p className="text-emerald-700 mt-1 text-lg">
                    All 7 steps completed. Your tournament is ready for operation.
                  </p>
                </div>
              </div>
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 px-8 py-3">
                <Play className="h-5 w-5 mr-2" />
                Launch Tournament
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
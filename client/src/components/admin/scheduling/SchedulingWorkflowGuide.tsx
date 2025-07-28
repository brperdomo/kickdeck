import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Info, Zap, Settings, CheckCircle, Clock, ArrowRight,
  Trophy, Target, Calendar, BarChart3, Users
} from 'lucide-react';

interface SchedulingWorkflowGuideProps {
  onSelectPath: (path: 'automated' | 'manual') => void;
  className?: string;
}

export function SchedulingWorkflowGuide({ onSelectPath, className = '' }: SchedulingWorkflowGuideProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="border-[#2E86AB]">
        <CardHeader className="bg-gradient-to-r from-[#2E86AB] to-[#A23B72] text-white">
          <CardTitle className="flex items-center gap-3">
            <Trophy className="h-6 w-6" />
            Tournament Scheduling Workflow
          </CardTitle>
          <p className="text-blue-100">
            Choose your scheduling approach based on your needs and experience level.
          </p>
        </CardHeader>
      </Card>

      {/* Path Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Automated Path */}
        <Card className="border-green-200 hover:border-green-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Zap className="h-5 w-5" />
              Automated Scheduling
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                Recommended
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              One-click complete tournament scheduling with AI-powered optimization.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">What it does:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Analyzes all approved teams
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Creates flights by age group & gender
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Generates optimal brackets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Auto-seeds teams intelligently
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Validates field capacity
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Creates complete schedule
                </li>
              </ul>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Perfect for tournaments with standard formats. Generates professional schedules in minutes.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => onSelectPath('automated')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Automated Scheduling
            </Button>
          </CardContent>
        </Card>

        {/* Manual Path */}
        <Card className="border-blue-200 hover:border-blue-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Settings className="h-5 w-5" />
              Manual Configuration
              <Badge variant="outline" className="ml-auto">
                Advanced
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Step-by-step configuration with granular control over every aspect.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Steps included:</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-3 w-3 text-blue-600" />
                  <span>Game Metadata Setup</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-3 w-3 text-blue-600" />
                  <span>Field Capacity Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span>Flight Management</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-3 w-3 text-blue-600" />
                  <span>Bracket Creation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-3 w-3 text-blue-600" />
                  <span>Team Seeding</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span>Time Block Engine</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-blue-600" />
                  <span>Schedule Generation</span>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                For tournaments with custom requirements or when you need complete control over the process.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => onSelectPath('manual')}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Start Manual Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Process Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Long Does Each Take?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-2">Automated Scheduling</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Setup Time:</span>
                  <span className="font-medium">2-5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing:</span>
                  <span className="font-medium">1-3 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Time:</span>
                  <span className="font-medium text-green-700">5-8 minutes</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Manual Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Configuration:</span>
                  <span className="font-medium">15-30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Review & Adjust:</span>
                  <span className="font-medium">5-15 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Time:</span>
                  <span className="font-medium text-blue-700">20-45 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Don't worry!</strong> You can switch between approaches or restart at any time. 
          Your progress is automatically saved, and you can always make manual adjustments after automated scheduling.
        </AlertDescription>
      </Alert>
    </div>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Users, Calendar, Clock, 
  ArrowRight, Lightbulb, Zap, Star
} from 'lucide-react';

export function FlexibleSchedulingGuide() {
  return (
    <div className="space-y-6">
      {/* Main Benefits Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-emerald-50/30">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Why Flexible Age Group Scheduling?</CardTitle>
              <p className="text-gray-600 mt-1">Real-world tournament management made easy</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 mb-2">Schedule Individual Age Groups</h3>
                <p className="text-emerald-800 text-sm">
                  No need to configure everything at once. Add and schedule age groups 
                  when they're ready, teams have registered, and you have clarity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Handle Late Registrations</h3>
                <p className="text-blue-800 text-sm">
                  Teams register late? No problem. Add new age groups anytime 
                  without disrupting existing schedules or configurations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 mb-2">Phased Tournament Management</h3>
                <p className="text-purple-800 text-sm">
                  Schedule U12 Boys this week, add U14 Girls next week when 
                  their registration closes. Perfect for rolling registrations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Faster Time to Value</h3>
                <p className="text-amber-800 text-sm">
                  Start scheduling immediately with the age groups you have ready. 
                  No waiting for complete tournament configuration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-World Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Real-World Tournament Scenarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Scenario 1</Badge>
              <div>
                <h4 className="font-medium text-gray-900">Rolling Registration Periods</h4>
                <p className="text-gray-600 text-sm mt-1">
                  <strong>Week 1:</strong> U12 registration closes → Schedule U12 divisions<br/>
                  <strong>Week 3:</strong> U14 registration closes → Add and schedule U14 divisions<br/>
                  <strong>Week 5:</strong> Late U16 teams register → Add U16 without disrupting existing schedules
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">Scenario 2</Badge>
              <div>
                <h4 className="font-medium text-gray-900">Uncertain Registration Numbers</h4>
                <p className="text-gray-600 text-sm mt-1">
                  Don't know if you'll have enough U8 teams? Schedule the age groups you're confident about 
                  first (U10, U12, U14). Add U8 later if registration numbers justify it.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">Scenario 3</Badge>
              <div>
                <h4 className="font-medium text-gray-900">Weather or Field Issues</h4>
                <p className="text-gray-600 text-sm mt-1">
                  Field becomes unavailable? Reschedule just the affected age groups. 
                  Other age groups continue with their existing schedules uninterrupted.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Flexible Scheduling Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium">1</div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <h4 className="font-medium">Add Age Groups When Ready</h4>
                <p className="text-sm text-gray-600">Configure individual age groups as teams register or when you're ready to schedule them</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full text-sm font-medium">2</div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <h4 className="font-medium">Generate Independent Schedules</h4>
                <p className="text-sm text-gray-600">Each age group gets its own schedule generation - no dependencies on other age groups</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full text-sm font-medium">3</div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <h4 className="font-medium">Add More Anytime</h4>
                <p className="text-sm text-gray-600">Late registrations or new age groups? Add them without affecting existing schedules</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <CheckCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Traditional vs Flexible Approach:</strong> Traditional systems require ALL age groups 
          configured before scheduling anything. Flexible scheduling lets you start immediately with 
          what you have and expand as needed - perfect for real tournament management workflows.
        </AlertDescription>
      </Alert>
    </div>
  );
}
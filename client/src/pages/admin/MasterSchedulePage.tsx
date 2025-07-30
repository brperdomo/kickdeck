import { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, Zap, Eye, Settings, ArrowRight, 
  CheckCircle, Clock, Users, Trophy 
} from 'lucide-react';
import { UnifiedScheduleSetup } from '@/components/admin/scheduling/UnifiedScheduleSetup';
import { ScheduleViewer } from '@/components/admin/scheduling/ScheduleViewer';
import DragDropCalendarScheduler from '@/components/admin/scheduling/DragDropCalendarScheduler';

export default function MasterSchedulePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [currentView, setCurrentView] = useState<'quick' | 'view' | 'calendar'>('quick');

  if (!eventId) {
    return <div>Event ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tournament Schedule Control Center
              </h1>
              <p className="text-gray-600 mt-1">
                Generate schedules and view complete tournament schedules - all in one place
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Event {eventId}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 mb-6">
          <Button
            variant={currentView === 'quick' ? 'default' : 'outline'}
            onClick={() => setCurrentView('quick')}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Quick Schedule Generator
          </Button>
          <Button
            variant={currentView === 'view' ? 'default' : 'outline'}
            onClick={() => setCurrentView('view')}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Complete Schedule
          </Button>
          <Button
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Calendar Drag & Drop
          </Button>
        </div>

        {/* Content Area */}
        {currentView === 'quick' ? (
          <div className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Quick Start:</strong> Generate schedules for individual age groups. 
                Select an age group, verify teams, and click generate - we'll handle the rest!
              </AlertDescription>
            </Alert>
            <UnifiedScheduleSetup eventId={eventId} />
          </div>
        ) : currentView === 'view' ? (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <Eye className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Schedule Viewer:</strong> View all generated games, filter by date/team/field, 
                and export schedules. All schedules generated via Quick Generator appear here.
              </AlertDescription>
            </Alert>
            <ScheduleViewer eventId={eventId} />
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className="border-purple-200 bg-purple-50">
              <Calendar className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>Drag & Drop Calendar:</strong> Fine-tune your tournament schedule by dragging games 
                between fields and time slots. Perfect for optimizing field usage and resolving conflicts.
              </AlertDescription>
            </Alert>
            <DragDropCalendarScheduler eventId={eventId} />
          </div>
        )}
      </div>

      {/* Quick Reference Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <strong>Generate Schedules:</strong> Use Quick Generator to create schedules 
                  for individual age groups. Each generated schedule is automatically saved.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <strong>View & Manage:</strong> Use Schedule Viewer to see all generated games, 
                  filter by criteria, and export to CSV for distribution.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
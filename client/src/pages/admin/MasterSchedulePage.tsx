import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, Zap, Eye, Settings, ArrowRight, 
  CheckCircle, Clock, Users, Trophy, ArrowLeft, Home 
} from 'lucide-react';
import { UnifiedScheduleSetup } from '@/components/admin/scheduling/UnifiedScheduleSetup';
import { ScheduleViewerFixed as ScheduleViewer } from '@/components/admin/scheduling/ScheduleViewerFixed';
import DragDropCalendarScheduler from '@/components/admin/scheduling/DragDropCalendarScheduler';

export default function MasterSchedulePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<'quick' | 'view' | 'calendar'>('quick');

  if (!eventId) {
    return <div>Event ID not found</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(220 85% 60%) 0%, hsl(270 70% 65%) 50%, hsl(330 75% 60%) 100%)' }}>
      {/* MatchPro Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin')}
                className="flex items-center gap-2 hover:bg-blue-50 border-blue-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Admin Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Master Schedule Control Center
                </h1>
                <p className="text-gray-600 mt-1 font-medium">
                  Professional tournament scheduling with intelligent field distribution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className="text-sm bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200"
              >
                <Trophy className="h-3 w-3 mr-1" />
                Event {eventId}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* MatchPro Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-3 mb-8">
          <Button
            variant={currentView === 'quick' ? 'default' : 'outline'}
            onClick={() => setCurrentView('quick')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              currentView === 'quick' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md border-2 border-gray-200'
            }`}
          >
            <Zap className="h-5 w-5" />
            Quick Generator
          </Button>
          <Button
            variant={currentView === 'view' ? 'default' : 'outline'}
            onClick={() => setCurrentView('view')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              currentView === 'view' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md border-2 border-gray-200'
            }`}
          >
            <Eye className="h-5 w-5" />
            Schedule Viewer
          </Button>
          <Button
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              currentView === 'calendar' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md border-2 border-gray-200'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Calendar Interface
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
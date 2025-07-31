import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, Zap, Eye, Settings, ArrowRight, 
  CheckCircle, Clock, Users, Trophy, ArrowLeft, Home, FileText, Plane 
} from 'lucide-react';
import { UnifiedScheduleSetup } from '@/components/admin/scheduling/UnifiedScheduleSetup';
import { ScheduleViewer } from '@/components/admin/scheduling/ScheduleViewerFixed';
import DragDropCalendarScheduler from '@/components/admin/scheduling/DragDropCalendarScheduler';
import GameCardsGenerator from '@/components/admin/scheduling/GameCardsGenerator';
import AgeGroupManagementPanel from '@/components/admin/scheduling/AgeGroupManagementPanel';
import { FlightReviewDashboard } from '@/components/admin/scheduling/FlightReviewDashboard';
import { GameFormatEngine } from '@/components/admin/scheduling/GameFormatEngine';
import BracketCreationEngine from '@/components/admin/scheduling/BracketCreationEngine';

export default function MasterSchedulePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<'quick' | 'view' | 'calendar' | 'cards' | 'manage' | 'flights' | 'formats' | 'brackets'>('flights');

  if (!eventId) {
    return <div>Event ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* MatchPro Header */}
      <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin')}
                className="flex items-center gap-2 hover:bg-slate-700 border-slate-600 text-slate-200 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4" />
                Admin Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Master Schedule Control Center
                </h1>
                <p className="text-slate-300 mt-1 font-medium">
                  Professional tournament scheduling with intelligent field distribution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className="text-sm bg-blue-600 text-white border-blue-500"
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
        <div className="flex gap-3 mb-8 flex-wrap">
          {/* Phase 1: Flight Management */}
          <Button
            variant={currentView === 'flights' ? 'default' : 'outline'}
            onClick={() => setCurrentView('flights')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              currentView === 'flights' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
            }`}
          >
            <Plane className="h-5 w-5" />
            1. Flight Review
          </Button>
          
          {/* Phase 2: Game Format Configuration */}
          <Button
            variant={currentView === 'formats' ? 'default' : 'outline'}
            onClick={() => setCurrentView('formats')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              currentView === 'formats' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
            }`}
          >
            <Settings className="h-5 w-5" />
            2. Game Formats
          </Button>
          
          {/* Phase 3: Bracket Creation */}
          <Button
            variant={currentView === 'brackets' ? 'default' : 'outline'}
            onClick={() => setCurrentView('brackets')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              currentView === 'brackets' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
            }`}
          >
            <Trophy className="h-5 w-5" />
            3. Create Brackets
          </Button>
          
          {/* Phase 4: Automated Scheduling */}
          <Button
            variant={currentView === 'quick' ? 'default' : 'outline'}
            onClick={() => setCurrentView('quick')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              currentView === 'quick' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
            }`}
          >
            <Zap className="h-5 w-5" />
            4. Auto Schedule
          </Button>
          
          {/* Phase 4+: Schedule Management */}
          <Button
            variant={currentView === 'view' ? 'default' : 'outline'}
            onClick={() => setCurrentView('view')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              currentView === 'view' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
            }`}
          >
            <Eye className="h-5 w-5" />
            Schedule Viewer
          </Button>
          
          <Button
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              currentView === 'calendar' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Calendar Interface
          </Button>
          
          <Button
            variant={currentView === 'cards' ? 'default' : 'outline'}
            onClick={() => setCurrentView('cards')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              currentView === 'cards' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'
            }`}
          >
            <FileText className="h-5 w-5" />
            Game Cards
          </Button>
        </div>

        {/* Content Area */}
        {currentView === 'flights' ? (
          <div className="space-y-6">
            <Alert className="border-slate-600 bg-slate-800">
              <Plane className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                <strong>Phase 1 - Flight Management:</strong> Organize teams into flights based on registration preferences. 
                Review team selections, assign unassigned teams, and prepare for game format configuration.
              </AlertDescription>
            </Alert>
            <FlightReviewDashboard eventId={eventId} />
          </div>
        ) : currentView === 'quick' ? (
          <div className="space-y-6">
            <Alert className="border-slate-600 bg-slate-800">
              <Zap className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                <strong>Phase 4 - Automated Scheduling:</strong> Generate complete tournament schedules automatically. 
                The system will create games for all flights with intelligent field distribution and conflict avoidance.
              </AlertDescription>
            </Alert>
            <UnifiedScheduleSetup eventId={eventId} />
          </div>
        ) : currentView === 'view' ? (
          <div className="space-y-6">
            <Alert className="border-slate-600 bg-slate-800">
              <Eye className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                <strong>Schedule Viewer:</strong> View all generated games, filter by date/team/field, 
                and export schedules. All schedules generated via Quick Generator appear here.
              </AlertDescription>
            </Alert>
            <ScheduleViewer eventId={eventId} />
          </div>
        ) : currentView === 'calendar' ? (
          <div className="space-y-6">
            <Alert className="border-slate-600 bg-slate-800">
              <Calendar className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                <strong>Drag & Drop Calendar:</strong> Fine-tune your tournament schedule by dragging games 
                between fields and time slots. Perfect for optimizing field usage and resolving conflicts.
              </AlertDescription>
            </Alert>
            <DragDropCalendarScheduler eventId={eventId} />
          </div>
        ) : currentView === 'cards' ? (
          <div className="space-y-6">
            <Alert className="border-slate-600 bg-slate-800">
              <FileText className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                <strong>Game Cards Generator:</strong> Create professional PDF game cards with team information, 
                score tracking, disciplinary sections, and QR codes for digital score and card reporting.
              </AlertDescription>
            </Alert>
            <GameCardsGenerator eventId={eventId} />
          </div>
        ) : currentView === 'formats' ? (
          <div className="space-y-6">
            <Alert className="border-slate-600 bg-slate-800">
              <Settings className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                <strong>Phase 2 - Game Format Configuration:</strong> Configure game lengths, field sizes, and rest periods for each flight. 
                Use templates for quick setup or create custom formats for specific competitive levels.
              </AlertDescription>
            </Alert>
            <GameFormatEngine eventId={eventId} />
          </div>
        ) : currentView === 'brackets' ? (
          <div className="space-y-6">
            <Alert className="border-slate-600 bg-slate-800">
              <Trophy className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                <strong>Phase 3 - Bracket Creation:</strong> Assign teams to flights and create tournament brackets. 
                Auto-assign teams for balanced competition or manage assignments manually.
              </AlertDescription>
            </Alert>
            <BracketCreationEngine eventId={eventId} />
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <Settings className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Age Group Management:</strong> Edit team seeding, manage existing age groups, 
                and regenerate schedules for late registrations or waitlisted teams.
              </AlertDescription>
            </Alert>
            <AgeGroupManagementPanel eventId={eventId} />
          </div>
        )}
      </div>

      {/* Quick Reference Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-3">Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-slate-300">
                  <strong className="text-white">Generate Schedules:</strong> Use Quick Generator to create schedules 
                  for individual age groups. Each generated schedule is automatically saved.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-slate-300">
                  <strong className="text-white">View & Manage:</strong> Use Schedule Viewer to see all generated games, 
                  filter by criteria, and export to CSV for distribution.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-slate-300">
                  <strong className="text-white">Age Group Management:</strong> Edit team seeding and regenerate schedules 
                  for late registrations or waitlisted teams using the Manage Age Groups tab.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
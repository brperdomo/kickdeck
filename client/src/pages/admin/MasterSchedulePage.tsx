import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { 
  Calendar, Zap, Eye, Settings, ArrowRight, 
  CheckCircle, Clock, Users, Trophy, ArrowLeft, Home, FileText, Plane, Globe 
} from 'lucide-react';
import { UnifiedScheduleSetup } from '@/components/admin/scheduling/UnifiedScheduleSetup';
import { UnifiedTournamentControlCenter } from '@/components/admin/scheduling/UnifiedTournamentControlCenter';
import { ScheduleViewer } from '@/components/admin/scheduling/ScheduleViewerFixed';
import EnhancedDragDropScheduler from '@/components/admin/scheduling/EnhancedDragDropScheduler';
import GameCardsGenerator from '@/components/admin/scheduling/GameCardsGenerator';
import AgeGroupManagementPanel from '@/components/admin/scheduling/AgeGroupManagementPanel';
import { FlightReviewDashboard } from '@/components/admin/scheduling/FlightReviewDashboard';

import { FormatTemplateManager } from '@/components/admin/templates/FormatTemplateManager';
import { FlightConfigurationTable } from '@/components/admin/scheduling/FlightConfigurationTable';
import { WorkflowDataFlow } from '@/components/admin/scheduling/WorkflowDataFlow';
import { UnifiedBracketManager } from '@/components/admin/scheduling/UnifiedBracketManager';
import { MasterScheduleConflictDetection } from '@/components/admin/scheduling/MasterScheduleConflictDetection';
import { PublishSchedules } from '@/components/admin/scheduling/PublishSchedules';
import FieldSortingManager from '@/components/admin/FieldSortingManager';
import FieldManagementDashboard from '@/components/admin/FieldManagementDashboard';
import AIScheduleGenerator from '@/components/admin/scheduling/AIScheduleGenerator';

export default function MasterSchedulePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<'view' | 'calendar' | 'cards' | 'manage' | 'flights' | 'brackets' | 'overview' | 'workflow' | 'publish' | 'field-sorting' | 'ai-schedule'>('overview');

  if (!eventId) {
    return <div>Event ID not found</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Purple Background */}
      <div className="absolute inset-0 z-0">
        <AnimatedBackground 
          type="particles"
          primaryColor="#3d3a98"
          secondaryColor="#2d2a88"
          speed="slow"
          className="w-full h-full"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* MatchPro Header */}
        <div className="bg-black/20 backdrop-blur-md border-b border-purple-500/20 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin')}
                  className="flex items-center gap-2 bg-purple-900/30 hover:bg-purple-800/40 border-purple-400/30 text-purple-100 font-medium transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Admin Dashboard
                </Button>
                
                {/* MatchPro Logo and Branding */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {/* MatchPro Logo */}
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-white font-bold text-xl">
                      MATCHPRO<span className="text-purple-300">.AI</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-purple-400/30"></div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Master Schedule Control Center
                    </h1>
                    <p className="text-purple-200 mt-1 font-medium">
                      Professional tournament scheduling with intelligent field distribution
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className="text-sm bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-400/30 shadow-lg"
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
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
            {/* Overview Tab */}
            <Button
              variant={currentView === 'overview' ? 'default' : 'outline'}
              onClick={() => setCurrentView('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
                currentView === 'overview' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-purple-600' 
                  : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
              }`}
            >
              <Trophy className="h-4 w-4" />
              Overview
            </Button>
            
            {/* Phase 1: Flight Assignment */}
            <Button
              variant={currentView === 'flights' ? 'default' : 'outline'}
              onClick={() => setCurrentView('flights')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
                currentView === 'flights' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-purple-600' 
                  : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
              }`}
            >
              <Plane className="h-4 w-4" />
              1. Flight Assignment
            </Button>
            
            {/* Phase 2: Unified Bracket Management */}
            <Button
              variant={currentView === 'brackets' ? 'default' : 'outline'}
              onClick={() => setCurrentView('brackets')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
                currentView === 'brackets' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-purple-600' 
                  : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
            }`}
          >
            <Trophy className="h-4 w-4" />
            2. Bracket Management
          </Button>
          
          {/* Schedule Management */}
          <Button
            variant={currentView === 'view' ? 'default' : 'outline'}
            onClick={() => setCurrentView('view')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
              currentView === 'view' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-purple-600' 
                : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
            }`}
          >
            <Eye className="h-4 w-4" />
            Schedule Viewer
          </Button>
          
          <Button
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
              currentView === 'calendar' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-purple-600' 
                : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar Interface
          </Button>
          
          <Button
            variant={currentView === 'cards' ? 'default' : 'outline'}
            onClick={() => setCurrentView('cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
              currentView === 'cards' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-purple-600' 
                : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            Game Cards
          </Button>
          

          
          {/* Post Schedules Tab */}
          <Button
            variant={currentView === 'ai-schedule' ? 'default' : 'outline'}
            onClick={() => setCurrentView('ai-schedule')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
              currentView === 'ai-schedule' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-400 hover:to-blue-500' 
                : 'bg-black/20 text-purple-100 hover:bg-blue-900/30 border border-blue-400/30 hover:border-blue-300/50'
            }`}
          >
            <Zap className="h-4 w-4" />
            Schedule with AI
          </Button>

          <Button
            variant={currentView === 'field-sorting' ? 'default' : 'outline'}
            onClick={() => setCurrentView('field-sorting')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
              currentView === 'field-sorting' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-purple-600' 
                : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
            }`}
          >
            <Settings className="h-4 w-4" />
            Field Order
          </Button>

          <Button
            variant={currentView === 'publish' ? 'default' : 'outline'}
            onClick={() => setCurrentView('publish')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm ${
              currentView === 'publish' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 hover:from-green-400 hover:to-green-500' 
                : 'bg-black/20 text-purple-100 hover:bg-purple-900/30 border border-purple-400/30 hover:border-purple-300/50'
            }`}
          >
            <Globe className="h-4 w-4" />
            Post Schedules
          </Button>
        </div>

        {/* Content Area */}
        {currentView === 'overview' ? (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <Trophy className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
                <strong>Master Schedule Control Center:</strong> Unified tournament management interface. 
                Execute automated scheduling or run manual step-by-step workflow. All phases integrate 
                seamlessly with your existing game formats, flights, and bracket configuration.
              </AlertDescription>
            </Alert>
            
            {/* Unified Tournament Control Center Integration */}
            <UnifiedTournamentControlCenter eventId={eventId} />
            
            {/* Flight Configuration Table */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-4">Flight Configuration Status</h3>
              <FlightConfigurationTable eventId={eventId} />
            </div>
            

            
            {/* Add Data Flow Demo Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={() => setCurrentView('workflow')}
                variant="outline"
                className="border-purple-400/30 text-purple-100 hover:bg-purple-900/30 backdrop-blur-sm"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                See How This Data Flows Through Workflow
              </Button>
            </div>
          </div>
        ) : currentView === 'workflow' ? (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <ArrowRight className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
                <strong>Workflow Data Integration:</strong> This demonstration shows how flight configuration data 
                flows through each phase of the tournament scheduling system. The timing, formats, and team counts 
                you set in the Overview tab directly drive bracket creation and final schedule generation.
              </AlertDescription>
            </Alert>
            <WorkflowDataFlow eventId={eventId} />
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setCurrentView('overview')}
                className="border-purple-400/30 text-purple-100 hover:bg-purple-900/30 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Flight Configuration
              </Button>
            </div>
          </div>
        ) : currentView === 'flights' ? (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <Plane className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
                <strong>Phase 1 - Flight Management:</strong> Organize teams into flights based on registration preferences. 
                Review team selections, assign unassigned teams, and prepare for game format configuration.
              </AlertDescription>
            </Alert>
            <FlightReviewDashboard eventId={eventId} />
          </div>
        ) : currentView === 'view' ? (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <Eye className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
                <strong>Schedule Viewer:</strong> View all generated games, filter by date/team/field, 
                and export schedules. All schedules generated via Quick Generator appear here.
              </AlertDescription>
            </Alert>
            <ScheduleViewer eventId={eventId} />
          </div>
        ) : currentView === 'calendar' ? (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
                <strong>Drag & Drop Calendar:</strong> Fine-tune your tournament schedule by dragging games 
                between fields and time slots. Perfect for optimizing field usage and resolving conflicts.
              </AlertDescription>
            </Alert>
            <EnhancedDragDropScheduler eventId={eventId} />
          </div>
        ) : currentView === 'cards' ? (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <FileText className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
                <strong>Game Cards Generator:</strong> Create professional PDF game cards with team information, 
                score tracking, disciplinary sections, and QR codes for digital score and card reporting.
              </AlertDescription>
            </Alert>
            <GameCardsGenerator eventId={eventId} />
          </div>
        ) : currentView === 'brackets' ? (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <Trophy className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
                <strong>Phase 3 - Bracket Management:</strong> Unified interface for creating brackets and assigning teams. 
                Choose between Group of 4 (round-robin), Group of 6 (crossplay pools), or Group of 8 (crossplay pools) formats. 
                Team assignments persist for fair competition pairing.
              </AlertDescription>
            </Alert>
            <UnifiedBracketManager eventId={eventId} />
          </div>
        ) : currentView === 'publish' ? (
          <div className="space-y-6">
            <Alert className="border-green-400/30 bg-black/30 backdrop-blur-sm">
              <Globe className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-purple-100">
                <strong>Post Schedules:</strong> Publish your finalized tournament schedules and standings for public viewing. 
                Create public links organized by age groups and flights that teams and spectators can access without authentication.
              </AlertDescription>
            </Alert>
            <PublishSchedules eventId={eventId} />
          </div>
        ) : currentView === 'ai-schedule' ? (
          <div className="space-y-6">
            <Alert className="border-blue-400/30 bg-black/30 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                <strong>AI Schedule Generator:</strong> Use OpenAI Realtime API to generate intelligent tournament schedules. 
                Provide natural language instructions and let AI create optimized schedules using your flight configuration.
              </AlertDescription>
            </Alert>
            <AIScheduleGenerator eventId={eventId} />
          </div>
        ) : currentView === 'field-sorting' ? (
          <div className="space-y-6">
            <FieldManagementDashboard eventId={eventId} />
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
              <Settings className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-100">
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
        <Card className="border-purple-400/30 bg-black/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-3">Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 text-purple-400 mt-0.5" />
                <div className="text-purple-200">
                  <strong className="text-white">Generate Schedules:</strong> Use Quick Generator to create schedules 
                  for individual age groups. Each generated schedule is automatically saved.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="h-4 w-4 text-purple-400 mt-0.5" />
                <div className="text-purple-200">
                  <strong className="text-white">View & Manage:</strong> Use Schedule Viewer to see all generated games, 
                  filter by criteria, and export to CSV for distribution.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="h-4 w-4 text-purple-400 mt-0.5" />
                <div className="text-purple-200">
                  <strong className="text-white">Age Group Management:</strong> Edit team seeding and regenerate schedules 
                  for late registrations or waitlisted teams using the Manage Age Groups tab.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
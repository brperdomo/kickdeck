import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TournamentSelectionInterface } from '@/components/admin/scheduling/TournamentSelectionInterface';
import { EnhancedSchedulingWorkflow } from '@/components/admin/scheduling/EnhancedSchedulingWorkflow';
import { QuickScheduleButton } from '@/components/admin/scheduling/QuickScheduleButton';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Calendar, Users, Settings, Trophy, Clock, 
  ChevronRight, RotateCcw, Zap, Target, BarChart3, Brain 
} from 'lucide-react';

interface SelectedTournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  teamsCount: number;
  mode: 'continue' | 'fresh';
}

export default function SchedulingDashboard() {
  const [selectedTournament, setSelectedTournament] = useState<SelectedTournament | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Start scheduling session mutation
  const startSchedulingMutation = useMutation({
    mutationFn: async ({ tournamentId, mode }: { tournamentId: string; mode: 'continue' | 'fresh' }) => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/scheduling/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ mode })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to start scheduling session:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error('Failed to start scheduling session');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedTournament({
        id: data.tournament.id,
        name: data.tournament.name,
        startDate: data.tournament.startDate,
        endDate: data.tournament.endDate,
        teamsCount: data.tournament.teamsCount || 0,
        mode: data.mode
      });
      setIsStarting(false);
      
      toast({
        title: "Scheduling Session Started",
        description: `Ready to schedule ${data.tournament.name} with ${data.tournament.teamsCount} teams.`,
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Failed to start scheduling session:', error);
      setIsStarting(false);
      
      toast({
        title: "Failed to Start Session",
        description: "Could not start the scheduling session. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleTournamentSelect = async (tournamentId: string, mode: 'continue' | 'fresh') => {
    setIsStarting(true);
    startSchedulingMutation.mutate({ tournamentId, mode });
  };

  const handleBackToSelection = () => {
    setSelectedTournament(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (selectedTournament && !isStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-[#2E86AB] via-[#4A90C2] to-[#A23B72] text-white shadow-2xl">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToSelection}
                  className="text-white hover:bg-white/20 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tournament Selection
                </Button>
                <div className="h-8 w-px bg-white/30" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold">{selectedTournament.name}</h1>
                  </div>
                  <div className="flex items-center gap-6 text-blue-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{formatDate(selectedTournament.startDate)} - {formatDate(selectedTournament.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{selectedTournament.teamsCount} teams</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${selectedTournament.mode === 'continue' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : 'bg-blue-500/20 text-blue-100 border-blue-400/30'} px-3 py-1`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedTournament.mode === 'continue' ? 'Continuing Session' : 'Fresh Start'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleTournamentSelect(selectedTournament.id, 'fresh')}
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Fresh
                </Button>
                <QuickScheduleButton 
                  eventId={selectedTournament.id}
                  onScheduleComplete={(data) => {
                    toast({
                      title: "Schedule Generated Successfully!",
                      description: `Created ${data.totalGames} games with optimal field assignments.`
                    });
                  }}
                />
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-3 py-1">
                  ID: {selectedTournament.id}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Scheduling Workflow */}
        <div className="container mx-auto px-6 py-8">
          <EnhancedSchedulingWorkflow 
            eventId={selectedTournament.id}
            onComplete={(data) => {
              toast({
                title: "Tournament Scheduled Successfully!",
                description: "Complete tournament schedule has been generated with all advanced features.",
                variant: "default"
              });
            }}
          />
        </div>
      </div>
    );
  }

  // Tournament Selection View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#2E86AB] via-[#4A90C2] to-[#A23B72] text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-white/20 rounded-xl">
                <Brain className="h-8 w-8" />
              </div>
              <h1 className="text-5xl font-bold">Intelligent Tournament Scheduling</h1>
            </div>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              MatchPro's flagship AI-powered scheduling engine creates optimal tournament schedules 
              with automated conflict detection, field optimization, and referee management.
            </p>
            
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-6 w-6 text-yellow-300" />
                  <h3 className="text-lg font-semibold">One-Click Automation</h3>
                </div>
                <p className="text-blue-100 text-sm">
                  Generate complete tournament schedules instantly with AI-driven optimization and conflict resolution.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-6 w-6 text-green-300" />
                  <h3 className="text-lg font-semibold">Smart Conflict Detection</h3>
                </div>
                <p className="text-blue-100 text-sm">
                  Automatically detect and resolve coach conflicts, field capacity issues, and time constraints.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="h-6 w-6 text-purple-300" />
                  <h3 className="text-lg font-semibold">Quality Analytics</h3>
                </div>
                <p className="text-blue-100 text-sm">
                  Real-time quality metrics, fairness analysis, and optimization recommendations for perfect schedules.
                </p>
              </div>
            </div>

            <Alert className="bg-white/10 border-white/30 text-white max-w-2xl mx-auto">
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-blue-100">
                <strong>Advanced Features:</strong> Feasibility simulation, live drag-and-drop editing, 
                scenario testing, referee assignment, and comprehensive quality analysis.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {/* Tournament Selection */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Tournament to Schedule</h2>
            <p className="text-lg text-gray-600">
              Choose a tournament to begin the intelligent scheduling process with MatchPro's advanced automation.
            </p>
          </div>
          
          <TournamentSelectionInterface 
            onTournamentSelect={handleTournamentSelect}
          />
        </div>
      </div>
    </div>
  );
}
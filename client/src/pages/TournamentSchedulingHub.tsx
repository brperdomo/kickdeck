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
  ArrowLeft, Calendar, Users, Settings, 
  Trophy, Clock, ChevronRight, RotateCcw 
} from 'lucide-react';

interface SelectedTournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  teamsCount: number;
  mode: 'continue' | 'fresh';
}

export default function TournamentSchedulingHub() {
  const [selectedTournament, setSelectedTournament] = useState<SelectedTournament | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Start scheduling session mutation
  const startSchedulingMutation = useMutation({
    mutationFn: async ({ tournamentId, mode }: { tournamentId: string; mode: 'continue' | 'fresh' }) => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/scheduling/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      
      if (!response.ok) throw new Error('Failed to start scheduling session');
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
        description: `${data.mode === 'continue' ? 'Continuing' : 'Starting fresh'} tournament scheduling.`,
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
      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E86AB] to-[#A23B72] text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToSelection}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tournament Selection
                </Button>
                <div className="h-6 w-px bg-white/30" />
                <div>
                  <h1 className="text-2xl font-bold">{selectedTournament.name}</h1>
                  <div className="flex items-center gap-4 text-blue-100 mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(selectedTournament.startDate)} - {formatDate(selectedTournament.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{selectedTournament.teamsCount} teams</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${selectedTournament.mode === 'continue' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedTournament.mode === 'continue' ? 'Continuing' : 'Fresh Start'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleTournamentSelect(selectedTournament.id, 'fresh')}
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
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
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Tournament ID: {selectedTournament.id}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduling Workflow */}
        <div className="container mx-auto px-4 py-6">
          <EnhancedSchedulingWorkflow eventId={selectedTournament.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Loading State */}
      {isStarting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#2E86AB] border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-[#343A40] mb-2">Starting Scheduling Session</h3>
              <p className="text-gray-600">Please wait while we set up your tournament scheduling workspace...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2E86AB] to-[#A23B72] rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#343A40]">Tournament Scheduling Hub</h1>
              <p className="text-[#6C757D] mt-1">
                Advanced scheduling system with manual progress saving and multi-admin session isolation
              </p>
            </div>
          </div>

          {/* Features Overview */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-[#2E86AB]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-[#2E86AB]" />
                  <div>
                    <h3 className="font-medium text-[#343A40]">Manual Save Control</h3>
                    <p className="text-sm text-[#6C757D]">Save progress when you want with full control</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#A23B72]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#A23B72]" />
                  <div>
                    <h3 className="font-medium text-[#343A40]">Session Isolation</h3>
                    <p className="text-sm text-[#6C757D]">Multiple admins work independently</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#FFC107]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ChevronRight className="h-5 w-5 text-[#FFC107]" />
                  <div>
                    <h3 className="font-medium text-[#343A40]">Continue or Start Fresh</h3>
                    <p className="text-sm text-[#6C757D]">Resume existing work or begin anew</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tournament Selection Interface */}
        <TournamentSelectionInterface 
          onTournamentSelect={handleTournamentSelect}
          className="mb-8"
        />

        {/* Instructions */}
        <Alert className="border-[#2E86AB] bg-blue-50">
          <Trophy className="h-4 w-4" />
          <AlertDescription className="text-[#343A40]">
            <strong>Getting Started:</strong> Select a tournament above to begin scheduling. 
            Each admin session is isolated, allowing multiple administrators to work on different tournaments simultaneously. 
            Your progress is saved manually using the "Save Progress" button within the scheduling workflow.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Users, RefreshCw, Settings, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChampionshipGame {
  id: string;
  bracketId: string;
  bracketName: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  isPending: boolean;
  status: string;
  notes: string | null;
}

interface Team {
  id: string;
  name: string;
  bracketId: string;
}

interface ChampionshipManagerProps {
  eventId: string;
}

export default function ChampionshipManager({ eventId }: ChampionshipManagerProps) {
  const [selectedGame, setSelectedGame] = useState<ChampionshipGame | null>(null);
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>('');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch championship games status
  const { data: championshipGames, isLoading: isLoadingGames } = useQuery({
    queryKey: ['championship-status', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/championship/${eventId}/championship-status`);
      if (!response.ok) throw new Error('Failed to fetch championship games');
      return response.json() as ChampionshipGame[];
    }
  });

  // Fetch all teams for manual override
  const { data: allTeams } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/teams/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json() as Team[];
    }
  });

  // Auto-update championship teams based on standings
  const updateChampionshipTeams = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/championship/${eventId}/update-championship-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update championship teams');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['championship-status', eventId] });
      toast({
        title: "Championship Teams Updated",
        description: `Successfully updated ${data.updatedGames?.length || 0} championship games based on current standings.`
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Manual override championship teams
  const manualOverride = useMutation({
    mutationFn: async ({ gameId, homeTeamId, awayTeamId, reason }: {
      gameId: string;
      homeTeamId: string;
      awayTeamId: string;
      reason: string;
    }) => {
      const response = await fetch(`/api/admin/championship/${eventId}/championship/${gameId}/teams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeamId, awayTeamId, reason })
      });
      if (!response.ok) throw new Error('Failed to override championship teams');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championship-status', eventId] });
      setIsOverrideDialogOpen(false);
      setSelectedGame(null);
      setSelectedHomeTeam('');
      setSelectedAwayTeam('');
      setOverrideReason('');
      toast({
        title: "Teams Assigned",
        description: "Championship game teams have been manually assigned."
      });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleManualOverride = (game: ChampionshipGame) => {
    setSelectedGame(game);
    setSelectedHomeTeam(game.homeTeamId || '');
    setSelectedAwayTeam(game.awayTeamId || '');
    setIsOverrideDialogOpen(true);
  };

  const submitManualOverride = () => {
    if (!selectedGame || !selectedHomeTeam || !selectedAwayTeam || !overrideReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select both teams and provide a reason for the override.",
        variant: "destructive"
      });
      return;
    }

    if (selectedHomeTeam === selectedAwayTeam) {
      toast({
        title: "Invalid Selection",
        description: "Home and away teams must be different.",
        variant: "destructive"
      });
      return;
    }

    manualOverride.mutate({
      gameId: selectedGame.id,
      homeTeamId: selectedHomeTeam,
      awayTeamId: selectedAwayTeam,
      reason: overrideReason
    });
  };

  const getGameStatusBadge = (game: ChampionshipGame) => {
    if (game.status === 'completed') {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    } else if (game.isPending) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Teams</Badge>;
    } else if (game.homeTeamId && game.awayTeamId) {
      return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Teams Assigned</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Not Ready</Badge>;
    }
  };

  const getAvailableTeamsForGame = (game: ChampionshipGame) => {
    if (!allTeams) return [];
    // For championship games, show teams from the same bracket
    return allTeams.filter(team => team.bracketId === game.bracketId);
  };

  if (isLoadingGames) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading championship games...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Championship Team Assignment
          </h3>
          <p className="text-purple-200 mt-1">
            Manage team assignments for championship/final games based on standings or manual selection
          </p>
        </div>
        <Button
          onClick={() => updateChampionshipTeams.mutate()}
          disabled={updateChampionshipTeams.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${updateChampionshipTeams.isPending ? 'animate-spin' : ''}`} />
          Update from Standings
        </Button>
      </div>

      <Alert className="border-blue-400/30 bg-blue-900/20 backdrop-blur-sm">
        <Trophy className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-100">
          <strong>How it works:</strong> Championship games are automatically created with TBD placeholders. 
          Click "Update from Standings" to populate teams based on current pool play results, or use manual override 
          for custom assignments. Teams will be assigned as 1st Place vs 2nd Place based on your scoring configuration.
        </AlertDescription>
      </Alert>

      {championshipGames && championshipGames.length > 0 ? (
        <div className="grid gap-4">
          {championshipGames.map((game) => (
            <Card key={game.id} className="border-purple-400/30 bg-black/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    {game.bracketName} Championship
                  </CardTitle>
                  {getGameStatusBadge(game)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Label className="text-purple-200">Home Team</Label>
                    <div className="mt-1 p-3 border border-purple-400/30 rounded-lg bg-black/30">
                      <div className="font-medium text-white">
                        {game.homeTeamName || 'TBD'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-2xl font-bold text-purple-300">VS</div>
                  </div>
                  
                  <div className="text-center">
                    <Label className="text-purple-200">Away Team</Label>
                    <div className="mt-1 p-3 border border-purple-400/30 rounded-lg bg-black/30">
                      <div className="font-medium text-white">
                        {game.awayTeamName || 'TBD'}
                      </div>
                    </div>
                  </div>
                </div>

                {game.notes && (
                  <div className="text-sm text-purple-300 bg-purple-900/20 p-2 rounded">
                    <strong>Notes:</strong> {game.notes}
                  </div>
                )}

                <Separator className="border-purple-400/30" />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualOverride(game)}
                    className="border-purple-400/30 text-purple-100 hover:bg-purple-900/30"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manual Override
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-purple-400/30 bg-black/20 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Trophy className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Championship Games Found</h3>
            <p className="text-purple-200 text-center">
              Championship games will appear here once brackets are created with playoff/final game formats.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Manual Override Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Team Assignment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Home Team</Label>
              <Select value={selectedHomeTeam} onValueChange={setSelectedHomeTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select home team" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGame && getAvailableTeamsForGame(selectedGame).map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Away Team</Label>
              <Select value={selectedAwayTeam} onValueChange={setSelectedAwayTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select away team" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGame && getAvailableTeamsForGame(selectedGame).map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reason for Override</Label>
              <Input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Injury replacement, scheduling conflict"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOverrideDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitManualOverride}
                disabled={manualOverride.isPending}
              >
                {manualOverride.isPending ? 'Assigning...' : 'Assign Teams'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
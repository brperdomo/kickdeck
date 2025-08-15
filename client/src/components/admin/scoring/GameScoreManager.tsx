import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trophy, Clock, AlertTriangle, CheckCircle, History, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: string;
  gameNumber: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  fieldId: string;
  fieldName: string;
  startTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overridden';
  enteredBy: string | null;
  lastUpdated: string | null;
  bracketName: string;
  notes: string | null;
}

interface ScoreEntry {
  gameId: string;
  homeScore: number;
  awayScore: number;
  notes?: string;
}

interface GameScoreManagerProps {
  eventId: string;
}

export default function GameScoreManager({ eventId }: GameScoreManagerProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [scoreNotes, setScoreNotes] = useState<string>('');
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bracketFilter, setBracketFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all games for the event
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games-scores', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/games/${eventId}/scores`);
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      return data.games as Game[];
    }
  });

  // Get unique brackets for filtering
  const brackets = [...new Set(games.map(game => game.bracketName))].filter(Boolean);

  // Filter games based on status and bracket
  const filteredGames = games.filter(game => {
    const statusMatch = statusFilter === 'all' || game.status === statusFilter;
    const bracketMatch = bracketFilter === 'all' || game.bracketName === bracketFilter;
    return statusMatch && bracketMatch;
  });

  // Submit or update score
  const submitScore = useMutation({
    mutationFn: async (scoreData: ScoreEntry) => {
      const response = await fetch(`/api/admin/games/${scoreData.gameId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: scoreData.homeScore,
          awayScore: scoreData.awayScore,
          notes: scoreData.notes
        })
      });
      if (!response.ok) throw new Error('Failed to submit score');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games-scores', eventId] });
      queryClient.invalidateQueries({ queryKey: ['standings', eventId] });
      setIsScoreDialogOpen(false);
      setSelectedGame(null);
      setHomeScore('');
      setAwayScore('');
      setScoreNotes('');
      toast({
        title: "Score Updated",
        description: "Game score has been successfully updated and standings recalculated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update score",
        variant: "destructive",
      });
    }
  });

  const handleEditScore = (game: Game) => {
    setSelectedGame(game);
    setHomeScore(game.homeScore?.toString() || '');
    setAwayScore(game.awayScore?.toString() || '');
    setScoreNotes(game.notes || '');
    setIsScoreDialogOpen(true);
  };

  const handleSubmitScore = () => {
    if (!selectedGame) return;
    
    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);
    
    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast({
        title: "Invalid Score",
        description: "Please enter valid scores (0-20 range)",
        variant: "destructive",
      });
      return;
    }

    if (homeScoreNum > 20 || awayScoreNum > 20) {
      toast({
        title: "Score Out of Range",
        description: "Scores must be between 0 and 20",
        variant: "destructive",
      });
      return;
    }

    submitScore.mutate({
      gameId: selectedGame.id,
      homeScore: homeScoreNum,
      awayScore: awayScoreNum,
      notes: scoreNotes
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default"><Trophy className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Final</Badge>;
      case 'overridden':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overridden</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatScore = (homeScore: number | null, awayScore: number | null) => {
    if (homeScore === null || awayScore === null) {
      return '– vs –';
    }
    return `${homeScore} - ${awayScore}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading games...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-md">Game Score Management</h2>
          <p className="text-gray-100 font-medium drop-shadow-sm">Enter scores and view all scheduled games for your tournament</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-100">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overridden">Overridden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-100">Flight/Bracket</Label>
              <Select value={bracketFilter} onValueChange={setBracketFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by bracket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brackets</SelectItem>
                  {brackets.map(bracket => (
                    <SelectItem key={bracket} value={bracket}>{bracket}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Table */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-white">Games ({filteredGames.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-purple-400/30">
                  <TableHead className="text-gray-100">Game #</TableHead>
                  <TableHead className="text-gray-100">Field</TableHead>
                  <TableHead className="text-gray-100">Teams</TableHead>
                  <TableHead className="text-gray-100">Score</TableHead>
                  <TableHead className="text-gray-100">Status</TableHead>
                  <TableHead className="text-gray-100">Bracket</TableHead>
                  <TableHead className="text-gray-100">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.map((game) => (
                  <TableRow key={game.id} className="border-purple-400/20">
                    <TableCell className="text-gray-100">{game.gameNumber}</TableCell>
                    <TableCell className="text-gray-100">{game.fieldName}</TableCell>
                    <TableCell className="text-gray-100">
                      <div>
                        <div className="font-medium">{game.homeTeamName}</div>
                        <div className="text-sm text-gray-300">vs {game.awayTeamName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-100 font-mono">
                      {formatScore(game.homeScore, game.awayScore)}
                    </TableCell>
                    <TableCell>{getStatusBadge(game.status)}</TableCell>
                    <TableCell className="text-gray-100">{game.bracketName}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditScore(game)}
                        className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {game.homeScore !== null ? 'Edit' : 'Enter'} Score
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Score Entry Dialog */}
      <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedGame?.homeScore !== null ? 'Edit Score' : 'Enter Score'}
            </DialogTitle>
          </DialogHeader>

          {selectedGame && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-lg">
                  {selectedGame.homeTeamName} vs {selectedGame.awayTeamName}
                </div>
                <div className="text-sm text-gray-600">
                  Game #{selectedGame.gameNumber} • {selectedGame.fieldName}
                </div>
              </div>

              {selectedGame.status === 'completed' && (
                <Alert className="border-yellow-400 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    This score has already been finalized. Editing will create an override record for audit purposes.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homeScore">{selectedGame.homeTeamName}</Label>
                  <Input
                    id="homeScore"
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="awayScore">{selectedGame.awayTeamName}</Label>
                  <Input
                    id="awayScore"
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="scoreNotes">Notes (Optional)</Label>
                <Input
                  id="scoreNotes"
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  placeholder="e.g., Penalty shootout, forfeit, etc."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsScoreDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitScore} disabled={submitScore.isPending}>
                  {submitScore.isPending ? 'Saving...' : 'Save Score'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
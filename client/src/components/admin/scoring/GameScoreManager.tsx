import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trophy, Clock, AlertTriangle, CheckCircle, History, Filter, Lock, Unlock, Eye, Download, Trash2, FileText, MoreHorizontal, Link, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { generateGameScoreUrl, generateShareableGameMessage } from '@/lib/gameUrls';

interface Game {
  id: number;
  gameNumber: number;
  homeTeamId: number | null;
  homeTeamName: string | null;
  awayTeamId: number | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  fieldId: number | null;
  fieldName: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overridden';
  scoreEnteredBy: number | null;
  scoreEnteredAt: Date | null;
  scoreNotes: string | null;
  isScoreLocked: boolean;
  bracketName: string | null;
  round: number;
  enteredByName: string | null;
}

interface AuditEntry {
  id: number;
  homeScore: number | null;
  awayScore: number | null;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  changeType: string;
  notes: string | null;
  isOverride: boolean;
  previousValues: any;
  userRole: string;
  enteredAt: Date;
  enteredByName: string | null;
  enteredByEmail: string | null;
}

interface ScoreEntry {
  gameId: string;
  homeScore: number;
  awayScore: number;
  homeYellowCards?: number;
  awayYellowCards?: number;
  homeRedCards?: number;
  awayRedCards?: number;
  notes?: string;
  forceOverride?: boolean;
}

interface GameScoreManagerProps {
  eventId: string;
}

export default function GameScoreManager({ eventId }: GameScoreManagerProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [homeYellowCards, setHomeYellowCards] = useState<string>('0');
  const [awayYellowCards, setAwayYellowCards] = useState<string>('0');
  const [homeRedCards, setHomeRedCards] = useState<string>('0');
  const [awayRedCards, setAwayRedCards] = useState<string>('0');
  const [scoreNotes, setScoreNotes] = useState<string>('');
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bracketFilter, setBracketFilter] = useState<string>('all');
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [bulkOperation, setBulkOperation] = useState<string>('');
  const [bulkReason, setBulkReason] = useState<string>('');
  const [forceOverride, setForceOverride] = useState<boolean>(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all games for the event
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games-scores', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games`);
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      return data.games as Game[];
    }
  });

  // Get unique brackets for filtering
  const brackets = Array.from(new Set(games.map(game => game.bracketName))).filter(Boolean);

  // Fetch audit history for selected game
  const { data: auditHistory = [] } = useQuery({
    queryKey: ['game-audit', selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame?.id) return [];
      const response = await fetch(`/api/admin/score-management/games/${selectedGame.id}/audit-history`);
      if (!response.ok) throw new Error('Failed to fetch audit history');
      const data = await response.json();
      return data.history as AuditEntry[];
    },
    enabled: !!selectedGame?.id && isAuditDialogOpen
  });

  // Filter games based on status and bracket
  const filteredGames = games.filter(game => {
    const statusMatch = statusFilter === 'all' || game.status === statusFilter;
    const bracketMatch = bracketFilter === 'all' || game.bracketName === bracketFilter;
    return statusMatch && bracketMatch;
  });

  // Submit or update score
  const submitScore = useMutation({
    mutationFn: async (scoreData: ScoreEntry) => {
      const response = await fetch(`/api/admin/score-management/games/${scoreData.gameId}/score`, {
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

  // Lock/unlock scores
  const lockScore = useMutation({
    mutationFn: async ({ gameId, locked, reason }: { gameId: number; locked: boolean; reason?: string }) => {
      const response = await fetch(`/api/admin/score-management/games/${gameId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked, reason })
      });
      if (!response.ok) throw new Error('Failed to update lock status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games-scores', eventId] });
      toast({
        title: "Success",
        description: "Score lock status updated successfully",
      });
    }
  });

  // Bulk operations
  const bulkOperations = useMutation({
    mutationFn: async ({ operation, gameIds, data }: { operation: string; gameIds: number[]; data?: any }) => {
      const response = await fetch(`/api/admin/score-management/events/${eventId}/games/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, gameIds, data })
      });
      if (!response.ok) throw new Error('Failed to complete bulk operation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games-scores', eventId] });
      setSelectedGames(new Set());
      setIsBulkDialogOpen(false);
      toast({
        title: "Bulk Operation Complete",
        description: "All selected games have been updated successfully",
      });
    }
  });

  const handleEditScore = (game: Game) => {
    setSelectedGame(game);
    setHomeScore(game.homeScore?.toString() || '');
    setAwayScore(game.awayScore?.toString() || '');
    setHomeYellowCards(game.homeYellowCards?.toString() || '0');
    setAwayYellowCards(game.awayYellowCards?.toString() || '0');
    setHomeRedCards(game.homeRedCards?.toString() || '0');
    setAwayRedCards(game.awayRedCards?.toString() || '0');
    setScoreNotes(game.scoreNotes || '');
    setForceOverride(false);
    setIsScoreDialogOpen(true);
  };

  const handleViewAudit = (game: Game) => {
    setSelectedGame(game);
    setIsAuditDialogOpen(true);
  };

  const handleCopyScoreLink = async (game: Game) => {
    try {
      const scoreUrl = generateGameScoreUrl(game.id);
      await navigator.clipboard.writeText(scoreUrl);
      toast({
        title: "Link Copied!",
        description: "Public score submission link copied to clipboard",
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = generateGameScoreUrl(game.id);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Link Copied!",
        description: "Public score submission link copied to clipboard",
      });
    }
  };

  const handleCopyGameDetails = async (game: Game) => {
    try {
      const gameMessage = generateShareableGameMessage({
        homeTeam: game.homeTeamName || 'TBD',
        awayTeam: game.awayTeamName || 'TBD',
        startTime: game.scheduledDate && game.scheduledTime ? `${game.scheduledDate}T${game.scheduledTime}` : undefined,
        field: game.fieldName || 'TBD',
        gameId: game.id
      });
      
      await navigator.clipboard.writeText(gameMessage);
      toast({
        title: "Game Details Copied!",
        description: "Shareable game message with score link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy game details",
        variant: "destructive",
      });
    }
  };

  const handleSubmitScore = () => {
    if (!selectedGame) return;
    
    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);
    const homeYellowNum = parseInt(homeYellowCards);
    const awayYellowNum = parseInt(awayYellowCards);
    const homeRedNum = parseInt(homeRedCards);
    const awayRedNum = parseInt(awayRedCards);
    
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

    if (homeYellowNum < 0 || awayYellowNum < 0 || homeRedNum < 0 || awayRedNum < 0) {
      toast({
        title: "Invalid Card Count",
        description: "Card counts cannot be negative",
        variant: "destructive",
      });
      return;
    }

    submitScore.mutate({
      gameId: selectedGame.id.toString(),
      homeScore: homeScoreNum,
      awayScore: awayScoreNum,
      homeYellowCards: homeYellowNum,
      awayYellowCards: awayYellowNum,
      homeRedCards: homeRedNum,
      awayRedCards: awayRedNum,
      notes: scoreNotes,
      forceOverride
    });
  };

  const handleBulkOperation = () => {
    if (selectedGames.size === 0 || !bulkOperation) return;

    const gameIds = Array.from(selectedGames);
    const data = bulkReason ? { reason: bulkReason } : undefined;

    bulkOperations.mutate({
      operation: bulkOperation,
      gameIds,
      data
    });
  };

  const toggleGameSelection = (gameId: number) => {
    const newSelection = new Set(selectedGames);
    if (newSelection.has(gameId)) {
      newSelection.delete(gameId);
    } else {
      newSelection.add(gameId);
    }
    setSelectedGames(newSelection);
  };

  const selectAllFiltered = () => {
    const filteredGameIds = new Set(filteredGames.map(game => game.id));
    setSelectedGames(filteredGameIds);
  };

  const clearSelection = () => {
    setSelectedGames(new Set());
  };

  const getStatusBadge = (status: string, isLocked: boolean = false) => {
    const lockIcon = isLocked ? <Lock className="w-3 h-3 mr-1" /> : null;
    
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">{lockIcon}<Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default">{lockIcon}<Trophy className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600">{lockIcon}<CheckCircle className="w-3 h-3 mr-1" />Final</Badge>;
      case 'overridden':
        return <Badge variant="destructive">{lockIcon}<AlertTriangle className="w-3 h-3 mr-1" />Overridden</Badge>;
      default:
        return <Badge variant="secondary">{lockIcon}{status}</Badge>;
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

      {/* Enhanced Games Table with Bulk Selection */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              Games ({filteredGames.length})
              {selectedGames.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedGames.size} selected
                </Badge>
              )}
            </div>
            
            {selectedGames.size > 0 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBulkDialogOpen(true)}
                  className="bg-purple-600/20 border-purple-400/30 text-white hover:bg-purple-500/30"
                >
                  <MoreHorizontal className="w-4 h-4 mr-1" />
                  Bulk Actions
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearSelection}
                  className="text-gray-300 hover:text-white hover:bg-gray-700/30"
                >
                  Clear
                </Button>
              </div>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={selectedGames.size === filteredGames.length ? clearSelection : selectAllFiltered}
              className="bg-purple-600/10 border-purple-400/30 text-purple-200 hover:bg-purple-500/20"
            >
              {selectedGames.size === filteredGames.length ? 'Deselect All' : 'Select All Visible'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-purple-400/30">
                  <TableHead className="text-gray-100 w-10">
                    <Checkbox 
                      checked={selectedGames.size === filteredGames.length && filteredGames.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllFiltered();
                        } else {
                          clearSelection();
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-gray-100">Match ID</TableHead>
                  <TableHead className="text-gray-100">Date/Time</TableHead>
                  <TableHead className="text-gray-100">Field</TableHead>
                  <TableHead className="text-gray-100">Teams</TableHead>
                  <TableHead className="text-gray-100">Score</TableHead>
                  <TableHead className="text-gray-100">Cards</TableHead>
                  <TableHead className="text-gray-100">Status</TableHead>
                  <TableHead className="text-gray-100">Flight</TableHead>
                  <TableHead className="text-gray-100 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.map((game) => (
                  <TableRow key={game.id} className="border-purple-400/20 hover:bg-purple-500/10">
                    <TableCell>
                      <Checkbox 
                        checked={selectedGames.has(game.id)}
                        onCheckedChange={() => toggleGameSelection(game.id)}
                      />
                    </TableCell>
                    <TableCell className="text-gray-100 font-mono">#{game.gameNumber}</TableCell>
                    <TableCell className="text-gray-100 text-sm">
                      {game.scheduledDate ? (
                        <div>
                          <div>{new Date(game.scheduledDate).toLocaleDateString()}</div>
                          <div className="text-gray-300">{game.scheduledTime || 'TBD'}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">TBD</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-100">
                      {game.fieldName || <span className="text-gray-400">TBD</span>}
                    </TableCell>
                    <TableCell className="text-gray-100">
                      <div>
                        <div className="font-medium">{game.homeTeamName || 'TBD'}</div>
                        <div className="text-sm text-gray-300">vs {game.awayTeamName || 'TBD'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-100 font-mono">
                      <div className="text-center">
                        {formatScore(game.homeScore, game.awayScore)}
                        {game.scoreEnteredAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            by {game.enteredByName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-100 text-sm">
                      {(game.homeYellowCards + game.awayYellowCards + game.homeRedCards + game.awayRedCards > 0) ? (
                        <div className="space-y-1">
                          {(game.homeYellowCards > 0 || game.awayYellowCards > 0) && (
                            <div className="text-yellow-400">🟨 {game.homeYellowCards + game.awayYellowCards}</div>
                          )}
                          {(game.homeRedCards > 0 || game.awayRedCards > 0) && (
                            <div className="text-red-400">🟥 {game.homeRedCards + game.awayRedCards}</div>
                          )}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{getStatusBadge(game.status, game.isScoreLocked)}</TableCell>
                    <TableCell className="text-gray-100">{game.bracketName || 'No Flight'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-gray-300 hover:text-white hover:bg-gray-700/30"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuItem onClick={() => handleEditScore(game)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {game.homeScore !== null ? 'Edit Score' : 'Enter Score'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewAudit(game)}>
                            <History className="w-4 h-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyScoreLink(game)}>
                            <Link className="w-4 h-4 mr-2" />
                            Copy Score Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyGameDetails(game)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Game Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => lockScore.mutate({ 
                              gameId: game.id, 
                              locked: !game.isScoreLocked,
                              reason: game.isScoreLocked ? 'Unlocked by admin' : 'Locked by admin'
                            })}
                          >
                            {game.isScoreLocked ? (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Unlock Score
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Lock Score
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

              <Tabs defaultValue="score" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="score">Score</TabsTrigger>
                  <TabsTrigger value="cards">Cards</TabsTrigger>
                </TabsList>
                
                <TabsContent value="score" className="space-y-4">
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
                </TabsContent>
                
                <TabsContent value="cards" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Yellow Cards - {selectedGame.homeTeamName}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={homeYellowCards}
                          onChange={(e) => setHomeYellowCards(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Yellow Cards - {selectedGame.awayTeamName}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={awayYellowCards}
                          onChange={(e) => setAwayYellowCards(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Red Cards - {selectedGame.homeTeamName}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          value={homeRedCards}
                          onChange={(e) => setHomeRedCards(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Red Cards - {selectedGame.awayTeamName}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          value={awayRedCards}
                          onChange={(e) => setAwayRedCards(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="scoreNotes">Notes (Optional)</Label>
                <Textarea
                  id="scoreNotes"
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  placeholder="Add any notes about this score..."
                  rows={3}
                />
              </div>

              {selectedGame.isScoreLocked && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="forceOverride" 
                    checked={forceOverride}
                    onCheckedChange={(checked) => setForceOverride(checked === true)}
                  />
                  <Label htmlFor="forceOverride" className="text-sm">
                    Override locked score (admin action)
                  </Label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsScoreDialogOpen(false)}
                  disabled={submitScore.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitScore}
                  disabled={submitScore.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitScore.isPending ? 'Submitting...' : 'Submit Score'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Score History - Game #{selectedGame?.gameNumber}
            </DialogTitle>
            <DialogDescription>
              Complete audit trail of all score changes and administrative actions
            </DialogDescription>
          </DialogHeader>

          {selectedGame && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">
                  {selectedGame.homeTeamName} vs {selectedGame.awayTeamName}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedGame.fieldName} • Current Score: {formatScore(selectedGame.homeScore, selectedGame.awayScore)}
                </div>
              </div>

              <div className="space-y-3">
                {auditHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No score history available for this game
                  </div>
                ) : (
                  auditHistory.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={entry.isOverride ? "destructive" : "default"}>
                            {entry.changeType.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {entry.isOverride && (
                            <Badge variant="outline" className="text-orange-600">
                              OVERRIDE
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(entry.enteredAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Score:</div>
                          <div className="font-mono">
                            {entry.homeScore !== null && entry.awayScore !== null 
                              ? `${entry.homeScore} - ${entry.awayScore}`
                              : 'Score cleared'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Cards:</div>
                          <div>
                            🟨 {entry.homeYellowCards + entry.awayYellowCards} • 
                            🟥 {entry.homeRedCards + entry.awayRedCards}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="font-medium">By:</div>
                        <div>{entry.enteredByName || 'Unknown'} ({entry.userRole})</div>
                      </div>
                      
                      {entry.notes && (
                        <div className="text-sm">
                          <div className="font-medium">Notes:</div>
                          <div className="text-gray-600">{entry.notes}</div>
                        </div>
                      )}
                      
                      {entry.previousValues && (
                        <div className="text-sm">
                          <div className="font-medium">Previous values:</div>
                          <div className="text-gray-600 font-mono text-xs">
                            {JSON.stringify(entry.previousValues, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MoreHorizontal className="w-5 h-5" />
              Bulk Operations
            </DialogTitle>
            <DialogDescription>
              Apply actions to {selectedGames.size} selected games
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Operation</Label>
              <Select value={bulkOperation} onValueChange={setBulkOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lock">Lock Scores</SelectItem>
                  <SelectItem value="unlock">Unlock Scores</SelectItem>
                  <SelectItem value="clear_scores">Clear Scores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulkReason">Reason (Optional)</Label>
              <Textarea
                id="bulkReason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Provide a reason for this bulk operation..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsBulkDialogOpen(false)}
                disabled={bulkOperations.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkOperation}
                disabled={bulkOperations.isPending || !bulkOperation}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bulkOperations.isPending ? 'Processing...' : 'Apply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
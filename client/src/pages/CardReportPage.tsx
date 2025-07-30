import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, Clock, MapPin, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CardReportPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [cardType, setCardType] = useState<'yellow' | 'red' | ''>('');
  const [minute, setMinute] = useState('');
  const [reason, setReason] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch game details
  const { data: gameData, isLoading } = useQuery({
    queryKey: ['/api/admin/game-reports/games', gameId, 'details'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/game-reports/games/${gameId}/details`);
      if (!response.ok) throw new Error('Failed to fetch game details');
      return response.json();
    },
    enabled: !!gameId
  });

  // Submit card mutation
  const cardSubmission = useMutation({
    mutationFn: async (cardData: any) => {
      const response = await fetch(`/api/admin/game-reports/games/${gameId}/card-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      if (!response.ok) throw new Error('Failed to submit card report');
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Card Report Submitted",
        description: "Disciplinary action has been recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game-reports/games'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit card report",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName || !selectedTeam || !cardType || !minute || !reason || !reporterName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    cardSubmission.mutate({
      playerName,
      playerNumber: playerNumber || 'N/A',
      teamId: parseInt(selectedTeam),
      cardType,
      minute: parseInt(minute),
      reason,
      reportedBy: reporterName
    });
  };

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Invalid game ID. Please check the QR code or link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading game details...</p>
        </div>
      </div>
    );
  }

  const game = gameData?.game;

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Game not found. Please check the QR code or link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Card Report Submitted!</h2>
            <p className="text-green-700 mb-4">
              Thank you for reporting the disciplinary action. The incident has been recorded in the system.
            </p>
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="font-semibold text-orange-800">
                {cardType?.toUpperCase()} CARD - {playerName} (#{playerNumber})
              </p>
              <p className="text-sm text-orange-700 mt-1">Minute {minute}: {reason}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Disciplinary Card Report</h1>
          <p className="text-gray-600">Submit yellow or red card incidents</p>
        </div>

        {/* Game Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-blue-600 mb-2">{game.eventName}</h3>
              <div className="flex items-center justify-center gap-8 text-lg">
                <div className="text-center">
                  <div className="font-semibold">{game.homeTeamName}</div>
                  <Badge variant="outline" className="mt-1">Home</Badge>
                </div>
                <div className="text-2xl font-bold text-gray-400">VS</div>
                <div className="text-center">
                  <div className="font-semibold">{game.awayTeamName}</div>
                  <Badge variant="outline" className="mt-1">Away</Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {new Date(game.gameDate).toLocaleDateString()} at {game.startTime}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {game.fieldName}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                Game #{game.gameId}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Report Disciplinary Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Player Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="playerName">Player Name *</Label>
                  <Input
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player's full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="playerNumber">Jersey Number</Label>
                  <Input
                    id="playerNumber"
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value)}
                    placeholder="Player's jersey number"
                  />
                </div>
              </div>

              {/* Team Selection */}
              <div>
                <Label htmlFor="team">Team *</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={game.homeTeamId.toString()}>
                      {game.homeTeamName} (Home)
                    </SelectItem>
                    <SelectItem value={game.awayTeamId.toString()}>
                      {game.awayTeamName} (Away)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Card Type and Minute */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardType">Card Type *</Label>
                  <Select value={cardType} onValueChange={(value: 'yellow' | 'red') => setCardType(value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yellow">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                          Yellow Card
                        </div>
                      </SelectItem>
                      <SelectItem value="red">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
                          Red Card
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="minute">Minute *</Label>
                  <Input
                    id="minute"
                    type="number"
                    min="1"
                    max="120"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    placeholder="Match minute"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reason">Reason for Card *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the incident that led to the disciplinary action..."
                  rows={3}
                  required
                />
              </div>

              {/* Reporter Information */}
              <div>
                <Label htmlFor="reporterName">Referee Name *</Label>
                <Input
                  id="reporterName"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Enter referee's full name"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg"
                disabled={cardSubmission.isPending}
              >
                {cardSubmission.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Report...
                  </>
                ) : (
                  'Submit Card Report'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
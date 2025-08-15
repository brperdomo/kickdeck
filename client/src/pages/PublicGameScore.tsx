import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Trophy, Clock, Lock, CheckCircle } from 'lucide-react';

interface GameData {
  id: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  homeScore: number | null;
  awayScore: number | null;
  startTime: string;
  field: { name: string };
  status: string;
  ageGroup: { ageGroup: string };
  isCompleted: boolean;
  isScoreLocked: boolean;
  qrCodeUrl: string;
}

interface ScoreSubmission {
  homeScore: number;
  awayScore: number;
}

export default function PublicGameScore() {
  const { gameId } = useParams<{ gameId: string }>();
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch game data
  const { data: game, isLoading, error } = useQuery({
    queryKey: ['public-game', gameId],
    queryFn: async (): Promise<GameData> => {
      const response = await fetch(`/api/public/games/${gameId}`);
      if (!response.ok) {
        throw new Error('Game not found');
      }
      return response.json();
    },
    enabled: !!gameId
  });

  // Initialize scores if game has existing scores
  useEffect(() => {
    if (game && game.homeScore !== null && game.awayScore !== null) {
      setHomeScore(game.homeScore);
      setAwayScore(game.awayScore);
    }
  }, [game]);

  // Submit score mutation
  const submitScore = useMutation({
    mutationFn: async (scores: ScoreSubmission) => {
      const response = await fetch(`/api/public/games/${gameId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scores),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit score');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Score Updated!",
        description: "The game score has been updated successfully.",
      });
      // Refresh game data
      queryClient.invalidateQueries({ queryKey: ['public-game', gameId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitScore = () => {
    if (homeScore < 0 || awayScore < 0) {
      toast({
        title: "Invalid Score",
        description: "Scores must be non-negative numbers.",
        variant: "destructive",
      });
      return;
    }

    submitScore.mutate({ homeScore, awayScore });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">Loading game...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Game not found or could not be loaded.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: 'TBD', time: 'TBD' };
    }
  };

  const { date, time } = formatDateTime(game.startTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Game Score</h1>
          <p className="text-gray-600">Submit or view game results</p>
        </div>

        {/* Game Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {game.homeTeam.name} vs {game.awayTeam.name}
            </CardTitle>
            <CardDescription className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {date} at {time}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {game.field.name}
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {game.ageGroup.ageGroup}
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {game.isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : game.isScoreLocked ? (
                <Lock className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600" />
              )}
              Game Score
            </CardTitle>
            {game.isScoreLocked && (
              <CardDescription className="text-red-600">
                This game's score has been locked by tournament administrators.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Score Display */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-gray-900">
                {game.homeScore ?? homeScore} - {game.awayScore ?? awayScore}
              </div>
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{game.homeTeam.name}</span>
                <span>{game.awayTeam.name}</span>
              </div>
            </div>

            <Separator />

            {/* Score Input Section */}
            {!game.isScoreLocked && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Update Score</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homeScore">{game.homeTeam.name}</Label>
                    <Input
                      id="homeScore"
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                      className="text-center text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="awayScore">{game.awayTeam.name}</Label>
                    <Input
                      id="awayScore"
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                      className="text-center text-lg"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSubmitScore}
                  disabled={submitScore.isPending}
                  className="w-full"
                  size="lg"
                >
                  {submitScore.isPending ? 'Submitting...' : 'Submit Score'}
                </Button>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant={game.isCompleted ? "default" : game.status === "in_progress" ? "secondary" : "outline"}>
                {game.isCompleted ? "Game Complete" : 
                 game.status === "in_progress" ? "In Progress" : 
                 "Scheduled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter the final score for both teams</li>
                <li>Scores will be immediately visible on public schedules</li>
                <li>Standings will be automatically updated</li>
                <li>Contact tournament staff if you need to change a locked score</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
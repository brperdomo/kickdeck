import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ScoreReportPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [halftimeHomeScore, setHalftimeHomeScore] = useState('');
  const [halftimeAwayScore, setHalftimeAwayScore] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [notes, setNotes] = useState('');
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

  // Submit score mutation
  const scoreSubmission = useMutation({
    mutationFn: async (scoreData: any) => {
      const response = await fetch(`/api/admin/game-reports/games/${gameId}/score-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
      });
      if (!response.ok) throw new Error('Failed to submit score');
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Score Submitted",
        description: "Match score has been recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game-reports/games'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit score",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeScore || !awayScore || !reporterName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    scoreSubmission.mutate({
      homeScore: parseInt(homeScore),
      awayScore: parseInt(awayScore),
      halftimeHomeScore: halftimeHomeScore ? parseInt(halftimeHomeScore) : undefined,
      halftimeAwayScore: halftimeAwayScore ? parseInt(halftimeAwayScore) : undefined,
      reportedBy: reporterName,
      notes
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Score Submitted!</h2>
            <p className="text-green-700 mb-4">
              Thank you for reporting the match score. The result has been recorded in the system.
            </p>
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="font-semibold text-green-800">
                {game.homeTeamName} {homeScore} - {awayScore} {game.awayTeamName}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Match Score Report</h1>
          <p className="text-gray-600">Submit the official match result</p>
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

        {/* Score Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Match Score</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Final Score */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Final Score *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeScore">{game.homeTeamName} (Home)</Label>
                    <Input
                      id="homeScore"
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="text-2xl text-center"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="awayScore">{game.awayTeamName} (Away)</Label>
                    <Input
                      id="awayScore"
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="text-2xl text-center"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Halftime Score */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Halftime Score (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="halftimeHome">Home (Halftime)</Label>
                    <Input
                      id="halftimeHome"
                      type="number"
                      min="0"
                      value={halftimeHomeScore}
                      onChange={(e) => setHalftimeHomeScore(e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="halftimeAway">Away (Halftime)</Label>
                    <Input
                      id="halftimeAway"
                      type="number"
                      min="0"
                      value={halftimeAwayScore}
                      onChange={(e) => setHalftimeAwayScore(e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Reporter Information */}
              <div>
                <Label htmlFor="reporterName">Your Name (Coach/Manager) *</Label>
                <Input
                  id="reporterName"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about the match..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                disabled={scoreSubmission.isPending}
              >
                {scoreSubmission.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Score...
                  </>
                ) : (
                  'Submit Match Score'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
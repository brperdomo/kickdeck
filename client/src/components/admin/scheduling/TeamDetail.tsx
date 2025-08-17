import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Edit3, Users, Trophy, Calendar, MapPin, Target, 
  ExternalLink, Save, X, FileText, Eye, AlertTriangle,
  TrendingUp, Award, Download, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamDetailProps {
  teamId: number;
  eventId: number;
  onClose: () => void;
}

interface TeamData {
  team: {
    id: number;
    name: string;
    bracketId: number;
    groupId: number;
    status: string;
    flightName: string;
    ageGroup: string;
    coachName?: string;
  };
  games: Array<{
    id: number;
    date: string;
    time: string;
    field: string;
    opponent: string;
    homeTeamScore: number | null;
    awayTeamScore: number | null;
    status: string;
    isHomeTeam: boolean;
    homeTeamId: number;
    awayTeamId: number;
  }>;
  standings: Array<{
    teamId: number;
    teamName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    rank: number;
  }>;
  teamStats: {
    wins: number;
    losses: number;
    ties: number;
    points: number;
    rank: number;
    totalGames: number;
    gamesRemaining: number;
  };
}

export default function TeamDetail({ teamId, eventId, onClose }: TeamDetailProps) {
  const [editingGame, setEditingGame] = useState<number | null>(null);
  const [scoreInputs, setScoreInputs] = useState<{ home: string; away: string }>({ home: '', away: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ['team-detail', teamId, eventId],
    queryFn: async (): Promise<TeamData> => {
      const response = await fetch(`/api/admin/teams/${teamId}/detail?eventId=${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch team data');
      return response.json();
    },
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ gameId, homeScore, awayScore }: { gameId: number; homeScore: number; awayScore: number }) => {
      const response = await fetch(`/api/admin/games/${gameId}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeamScore: homeScore, awayTeamScore: awayScore }),
      });
      if (!response.ok) throw new Error('Failed to update score');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-detail', teamId, eventId] });
      queryClient.invalidateQueries({ queryKey: ['master-schedule'] });
      setEditingGame(null);
      setScoreInputs({ home: '', away: '' });
      toast({ title: 'Score updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update score', variant: 'destructive' });
    },
  });

  const handleScoreEdit = (game: any) => {
    setEditingGame(game.id);
    setScoreInputs({
      home: game.homeTeamScore?.toString() || '',
      away: game.awayTeamScore?.toString() || '',
    });
  };

  const handleScoreSave = (gameId: number) => {
    const homeScore = parseInt(scoreInputs.home) || 0;
    const awayScore = parseInt(scoreInputs.away) || 0;
    updateScoreMutation.mutate({ gameId, homeScore, awayScore });
  };

  const exportTeamSchedule = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}/export?format=${format}&eventId=${eventId}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-${teamData?.team.name}-schedule.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: `Schedule exported as ${format.toUpperCase()}` });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading team details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p>Failed to load team details</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTeamStanding = teamData.standings.find(s => s.teamId === teamId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">{teamData.team.name}</CardTitle>
                <p className="text-sm text-gray-600">
                  ID: {teamData.team.id} • {teamData.team.ageGroup} • {teamData.team.flightName}
                  {teamData.team.coachName && ` • Coach: ${teamData.team.coachName}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => exportTeamSchedule('csv')}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportTeamSchedule('pdf')}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Team Stats Header */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <Trophy className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{teamData.teamStats.wins}</p>
                <p className="text-xs text-gray-600">Wins</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <X className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{teamData.teamStats.losses}</p>
                <p className="text-xs text-gray-600">Losses</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <Badge variant="secondary" className="mb-1">=</Badge>
                <p className="text-2xl font-bold">{teamData.teamStats.ties}</p>
                <p className="text-xs text-gray-600">Ties</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{teamData.teamStats.points}</p>
                <p className="text-xs text-gray-600">Points</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-600">#{teamData.teamStats.rank}</p>
                <p className="text-xs text-gray-600">Rank</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <Calendar className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-600">{teamData.teamStats.gamesRemaining}</p>
                <p className="text-xs text-gray-600">Remaining</p>
              </div>
            </Card>
          </div>

          {/* Games List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Team Schedule & Results</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Game #</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Time</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Field</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Opponent</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Score</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamData.games.map((game) => (
                    <tr key={game.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm">{game.id}</td>
                      <td className="p-3 text-sm">{new Date(game.date).toLocaleDateString()}</td>
                      <td className="p-3 text-sm">{game.time}</td>
                      <td className="p-3 text-sm">{game.field}</td>
                      <td className="p-3 text-sm font-medium">{game.opponent}</td>
                      <td className="p-3 text-sm">
                        {editingGame === game.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={game.isHomeTeam ? scoreInputs.home : scoreInputs.away}
                              onChange={(e) => setScoreInputs(prev => ({
                                ...prev,
                                [game.isHomeTeam ? 'home' : 'away']: e.target.value
                              }))}
                              className="w-12 h-7 text-center"
                              placeholder="0"
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              value={game.isHomeTeam ? scoreInputs.away : scoreInputs.home}
                              onChange={(e) => setScoreInputs(prev => ({
                                ...prev,
                                [game.isHomeTeam ? 'away' : 'home']: e.target.value
                              }))}
                              className="w-12 h-7 text-center"
                              placeholder="0"
                            />
                            <Button size="sm" onClick={() => handleScoreSave(game.id)} className="h-7 px-2">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingGame(null)} className="h-7 px-2">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-mono">
                            {game.homeTeamScore !== null && game.awayTeamScore !== null
                              ? `${game.isHomeTeam ? game.homeTeamScore : game.awayTeamScore} - ${game.isHomeTeam ? game.awayTeamScore : game.homeTeamScore}`
                              : '- - -'
                            }
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        <Badge variant={game.status === 'completed' ? 'default' : game.status === 'in_progress' ? 'secondary' : 'outline'}>
                          {game.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          {editingGame !== game.id && (
                            <Button size="sm" variant="outline" onClick={() => handleScoreEdit(game)} className="h-7 px-2">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 px-2">
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Standings Snapshot */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Flight Standings</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Rank</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Team</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">GP</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">W</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">L</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">T</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">GF</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">GA</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">GD</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamData.standings.map((team) => (
                    <tr 
                      key={team.teamId} 
                      className={team.teamId === teamId ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                    >
                      <td className="p-3 text-sm font-medium">#{team.rank}</td>
                      <td className="p-3 text-sm font-medium">
                        {team.teamName}
                        {team.teamId === teamId && (
                          <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm">{team.gamesPlayed}</td>
                      <td className="p-3 text-sm">{team.wins}</td>
                      <td className="p-3 text-sm">{team.losses}</td>
                      <td className="p-3 text-sm">{team.ties}</td>
                      <td className="p-3 text-sm">{team.goalsFor}</td>
                      <td className="p-3 text-sm">{team.goalsAgainst}</td>
                      <td className="p-3 text-sm">{team.goalDifference}</td>
                      <td className="p-3 text-sm font-medium">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Utilities */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit3 className="h-4 w-4 mr-1" />
                Edit Team
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                View in Bracket
              </Button>
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Check Conflicts
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
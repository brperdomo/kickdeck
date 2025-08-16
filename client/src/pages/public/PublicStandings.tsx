import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Trophy, Medal, Award, Info, Calendar, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamStanding {
  teamId: number;
  teamName: string;
  position: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsScored: number;
  goalsAllowed: number;
  goalDifferential: number;
  shutouts: number;
  yellowCards: number;
  redCards: number;
  fairPlayPoints: number;
  totalPoints: number;
  winPoints: number;
  tiePoints: number;
  goalPoints: number;
  shutoutPoints: number;
  cardPenaltyPoints: number;
}

interface AgeGroupStandings {
  ageGroupId: number;
  ageGroup: string;
  gender: string;
  birthYear: number;
  divisionCode: string;
  displayName: string;
  teamCount: number;
  standings: TeamStanding[];
}

interface EventInfo {
  name: string;
  startDate: string;
  endDate: string;
  logoUrl?: string;
}

interface ScoringRules {
  title: string;
  systemType: string;
  scoring: {
    win: number;
    loss: number;
    tie: number;
    shutout: number;
    goalScored: number;
    goalCap: number;
    redCard: number;
    yellowCard: number;
  };
  tiebreakers: string[];
}

interface StandingsData {
  success: boolean;
  eventInfo: EventInfo;
  scoringRules: ScoringRules | null;
  standingsByGender: {
    boys: AgeGroupStandings[];
    girls: AgeGroupStandings[];
    coed: AgeGroupStandings[];
  };
  totalAgeGroups: number;
  totalTeams: number;
  lastUpdated: string;
}

const PublicStandings = () => {
  const { eventId } = useParams();
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGender, setActiveGender] = useState('boys');

  useEffect(() => {
    const loadStandings = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/public/standings/${eventId}`);
        if (!response.ok) {
          throw new Error('Failed to load standings data');
        }

        const data = await response.json();
        setStandingsData(data);

        // Set initial active gender to first available gender with data
        if (data.standingsByGender.boys.length > 0) {
          setActiveGender('boys');
        } else if (data.standingsByGender.girls.length > 0) {
          setActiveGender('girls');
        } else if (data.standingsByGender.coed.length > 0) {
          setActiveGender('coed');
        }

      } catch (err) {
        console.error('Error loading standings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load standings');
      } finally {
        setLoading(false);
      }
    };

    loadStandings();
  }, [eventId]);

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">{position}</span>;
  };

  const getTiebreakerLabel = (tiebreaker: string) => {
    const labels: Record<string, string> = {
      'total_points': 'Points',
      'head_to_head': 'Head-to-Head',
      'goal_differential': 'Goal Diff',
      'goals_scored': 'Goals For',
      'goals_allowed': 'Goals Against',
      'shutouts': 'Shutouts',
      'fair_play': 'Fair Play',
      'coin_toss': 'Random'
    };
    return labels[tiebreaker] || tiebreaker;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Loading tournament standings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!standingsData) return null;

  const { eventInfo, scoringRules, standingsByGender, totalAgeGroups, totalTeams } = standingsData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">{eventInfo.name}</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-4">Tournament Standings</p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(eventInfo.startDate).toLocaleDateString()} - {new Date(eventInfo.endDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {totalTeams} Teams in {totalAgeGroups} Divisions
            </div>
          </div>
        </div>

        {/* Scoring Rules Info */}
        {scoringRules && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Scoring System: {scoringRules.title}
              </CardTitle>
              <CardDescription>
                Point values and tiebreaker priorities used for standings calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{scoringRules.scoring.win}</div>
                  <div className="text-sm text-muted-foreground">Win</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{scoringRules.scoring.tie}</div>
                  <div className="text-sm text-muted-foreground">Tie</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{scoringRules.scoring.loss}</div>
                  <div className="text-sm text-muted-foreground">Loss</div>
                </div>
                {scoringRules.scoring.shutout > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{scoringRules.scoring.shutout}</div>
                    <div className="text-sm text-muted-foreground">Shutout Bonus</div>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="font-semibold mb-2">Tiebreaker Order</h4>
                <div className="flex flex-wrap gap-2">
                  {scoringRules.tiebreakers.map((tiebreaker, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      <span className="text-xs">{index + 1}.</span>
                      {getTiebreakerLabel(tiebreaker)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Standings by Gender */}
        <Tabs value={activeGender} onValueChange={setActiveGender}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="boys" disabled={standingsByGender.boys.length === 0}>
              Boys ({standingsByGender.boys.length})
            </TabsTrigger>
            <TabsTrigger value="girls" disabled={standingsByGender.girls.length === 0}>
              Girls ({standingsByGender.girls.length})
            </TabsTrigger>
            <TabsTrigger value="coed" disabled={standingsByGender.coed.length === 0}>
              Co-Ed ({standingsByGender.coed.length})
            </TabsTrigger>
          </TabsList>

          {(['boys', 'girls', 'coed'] as const).map((gender) => (
            <TabsContent key={gender} value={gender} className="space-y-6">
              {standingsByGender[gender].length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No {gender} divisions found in this tournament.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-8">
                  {standingsByGender[gender].map((ageGroup) => (
                    <Card key={ageGroup.ageGroupId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{ageGroup.displayName}</CardTitle>
                          <Badge variant="secondary">{ageGroup.teamCount} Teams</Badge>
                        </div>
                        <CardDescription>Birth Year: {ageGroup.birthYear}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {ageGroup.standings.length === 0 ? (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>No games played yet in this division.</AlertDescription>
                          </Alert>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">#</TableHead>
                                  <TableHead>Team</TableHead>
                                  <TableHead className="text-center">GP</TableHead>
                                  <TableHead className="text-center">W</TableHead>
                                  <TableHead className="text-center">L</TableHead>
                                  <TableHead className="text-center">T</TableHead>
                                  <TableHead className="text-center">PTS</TableHead>
                                  <TableHead className="text-center">GF</TableHead>
                                  <TableHead className="text-center">GA</TableHead>
                                  <TableHead className="text-center">GD</TableHead>
                                  {scoringRules?.scoring.shutout && (
                                    <TableHead className="text-center">SO</TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {ageGroup.standings.map((team) => (
                                  <TableRow key={team.teamId} className={team.position <= 3 ? 'bg-muted/50' : ''}>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center">
                                        {getPositionIcon(team.position)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{team.teamName}</TableCell>
                                    <TableCell className="text-center">{team.gamesPlayed}</TableCell>
                                    <TableCell className="text-center text-green-600 font-semibold">{team.wins}</TableCell>
                                    <TableCell className="text-center text-red-600 font-semibold">{team.losses}</TableCell>
                                    <TableCell className="text-center text-yellow-600 font-semibold">{team.ties}</TableCell>
                                    <TableCell className="text-center font-bold text-blue-600">{team.totalPoints}</TableCell>
                                    <TableCell className="text-center">{team.goalsScored}</TableCell>
                                    <TableCell className="text-center">{team.goalsAllowed}</TableCell>
                                    <TableCell className={`text-center font-semibold ${team.goalDifferential > 0 ? 'text-green-600' : team.goalDifferential < 0 ? 'text-red-600' : ''}`}>
                                      {team.goalDifferential > 0 ? '+' : ''}{team.goalDifferential}
                                    </TableCell>
                                    {scoringRules?.scoring.shutout && (
                                      <TableCell className="text-center">{team.shutouts}</TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Last updated: {new Date(standingsData.lastUpdated).toLocaleString()}</p>
          <p className="mt-1">Standings calculated using {scoringRules?.title || 'default scoring system'}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicStandings;
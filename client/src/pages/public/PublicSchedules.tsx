import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Users, Trophy, Clock, MapPin, 
  ArrowLeft, ExternalLink, RefreshCw, AlertTriangle 
} from 'lucide-react';

interface PublicScheduleData {
  eventInfo: {
    name: string;
    startDate: string;
    endDate: string;
  };
  ageGroups: Array<{
    ageGroup: string;
    flights: Array<{
      flightName: string;
      teamCount: number;
      gameCount: number;
    }>;
  }>;
  games: Array<{
    id: number;
    homeTeam: string;
    awayTeam: string;
    ageGroup: string;
    flightName: string;
    field: string;
    date: string;
    time: string;
    duration: number;
    status: string;
  }>;
  standings: Array<{
    teamName: string;
    ageGroup: string;
    flightName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  }>;
}

export default function PublicSchedules() {
  const { eventId } = useParams<{ eventId: string }>();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [selectedFlight, setSelectedFlight] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'schedules' | 'standings'>('schedules');

  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ['public-schedules', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/public/schedules/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch published schedules');
      }
      return response.json() as PublicScheduleData;
    },
    enabled: !!eventId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-white text-lg">Loading tournament schedules...</span>
        </div>
      </div>
    );
  }

  if (error || !scheduleData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Schedules Not Available</h2>
            <p className="text-slate-400 mb-4">
              Tournament schedules are not currently published or the event was not found.
            </p>
            <Button
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter games and standings based on selection
  const filteredGames = scheduleData.games.filter(game => 
    (!selectedAgeGroup || game.ageGroup === selectedAgeGroup) &&
    (!selectedFlight || game.flightName === selectedFlight)
  );

  const filteredStandings = scheduleData.standings.filter(standing =>
    (!selectedAgeGroup || standing.ageGroup === selectedAgeGroup) &&
    (!selectedFlight || standing.flightName === selectedFlight)
  ).sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {scheduleData.eventInfo.name}
            </h1>
            <div className="flex items-center justify-center gap-4 text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(scheduleData.eventInfo.startDate).toLocaleDateString()} - {' '}
                  {new Date(scheduleData.eventInfo.endDate).toLocaleDateString()}
                </span>
              </div>
              <Badge className="bg-green-600 text-white">
                <Trophy className="h-3 w-3 mr-1" />
                Public Schedules
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Age Groups Overview - Like your screenshot */}
        <div className="grid gap-6 mb-8">
          {scheduleData.ageGroups.map((ageGroup, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {ageGroup.ageGroup}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {ageGroup.flights.map((flight, flightIndex) => (
                    <div key={flightIndex} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="grid grid-cols-3 gap-8 flex-1">
                        <div>
                          <span className="text-white font-medium">FLIGHTS</span>
                          <p className="text-slate-300 mt-1">{flight.flightName}</p>
                        </div>
                        <div>
                          <span className="text-white font-medium">TEAMS</span>
                          <p className="text-blue-400 text-2xl font-bold mt-1">{flight.teamCount}</p>
                        </div>
                        <div>
                          <span className="text-white font-medium">GAMES</span>
                          <p className="text-green-400 text-2xl font-bold mt-1">{flight.gameCount}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAgeGroup(ageGroup.ageGroup);
                            setSelectedFlight(flight.flightName);
                            setActiveTab('schedules');
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          Schedules
                        </Button>
                        <span className="text-slate-400">|</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAgeGroup(ageGroup.ageGroup);
                            setSelectedFlight(flight.flightName);
                            setActiveTab('standings');
                          }}
                          className="border-slate-600 text-slate-200 hover:bg-slate-600"
                        >
                          Standings
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View */}
        {selectedAgeGroup && selectedFlight && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl">
                  {selectedAgeGroup} - {selectedFlight}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedAgeGroup('');
                    setSelectedFlight('');
                  }}
                  className="border-slate-600 text-slate-200 hover:bg-slate-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Overview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'schedules' | 'standings')}>
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger 
                    value="schedules" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedules ({filteredGames.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="standings" 
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Standings ({filteredStandings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="schedules" className="mt-6">
                  <div className="space-y-4">
                    {filteredGames.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">No games scheduled for this flight yet.</p>
                      </div>
                    ) : (
                      filteredGames.map((game, index) => (
                        <div key={index} className="bg-slate-700 p-4 rounded-lg">
                          <div className="grid md:grid-cols-4 gap-4 items-center">
                            <div className="md:col-span-2">
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <p className="text-white font-medium">{game.homeTeam}</p>
                                  <p className="text-slate-400 text-sm">vs</p>
                                  <p className="text-white font-medium">{game.awayTeam}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(game.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-300">
                                <Clock className="h-4 w-4" />
                                <span>{game.time}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-slate-300">
                                <MapPin className="h-4 w-4" />
                                <span>{game.field}</span>
                              </div>
                              <Badge 
                                className={`${
                                  game.status === 'completed' ? 'bg-green-600' :
                                  game.status === 'in_progress' ? 'bg-yellow-600' :
                                  'bg-blue-600'
                                } text-white`}
                              >
                                {game.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="standings" className="mt-6">
                  <div className="overflow-x-auto">
                    {filteredStandings.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">No standings available for this flight yet.</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left p-3 text-white font-medium">Pos</th>
                            <th className="text-left p-3 text-white font-medium">Team</th>
                            <th className="text-center p-3 text-white font-medium">GP</th>
                            <th className="text-center p-3 text-white font-medium">W</th>
                            <th className="text-center p-3 text-white font-medium">L</th>
                            <th className="text-center p-3 text-white font-medium">T</th>
                            <th className="text-center p-3 text-white font-medium">GF</th>
                            <th className="text-center p-3 text-white font-medium">GA</th>
                            <th className="text-center p-3 text-white font-medium">GD</th>
                            <th className="text-center p-3 text-white font-medium">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStandings.map((team, index) => (
                            <tr key={index} className="border-b border-slate-700 hover:bg-slate-600/50">
                              <td className="p-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-black' :
                                  index === 1 ? 'bg-slate-400 text-black' :
                                  index === 2 ? 'bg-amber-600 text-black' :
                                  'bg-slate-600 text-white'
                                }`}>
                                  {index + 1}
                                </div>
                              </td>
                              <td className="p-3 text-white font-medium">{team.teamName}</td>
                              <td className="p-3 text-center text-slate-300">{team.gamesPlayed}</td>
                              <td className="p-3 text-center text-green-400">{team.wins}</td>
                              <td className="p-3 text-center text-red-400">{team.losses}</td>
                              <td className="p-3 text-center text-yellow-400">{team.ties}</td>
                              <td className="p-3 text-center text-slate-300">{team.goalsFor}</td>
                              <td className="p-3 text-center text-slate-300">{team.goalsAgainst}</td>
                              <td className="p-3 text-center text-slate-300">
                                {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}{team.goalsFor - team.goalsAgainst}
                              </td>
                              <td className="p-3 text-center text-blue-400 font-bold">{team.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
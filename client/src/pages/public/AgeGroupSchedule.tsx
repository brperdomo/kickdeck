import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { 
  Calendar, Users, Trophy, Clock, MapPin, 
  ArrowLeft, ExternalLink, RefreshCw, AlertTriangle, ChevronRight 
} from 'lucide-react';

interface AgeGroupScheduleData {
  eventInfo: {
    name: string;
    startDate: string;
    endDate: string;
    logoUrl?: string;
  };
  ageGroupInfo: {
    ageGroup: string;
    gender: string;
    birthYear: number;
    divisionCode: string;
    displayName: string;
  };
  flights: Array<{
    flightId: number;
    flightName: string;
    teamCount: number;
    teams: Array<{
      id: number;
      name: string;
      status: string;
    }>;
    games: Array<{
      id: number;
      homeTeam: string;
      awayTeam: string;
      date: string;
      time: string;
      field: string;
      status: string;
      homeScore?: number;
      awayScore?: number;
    }>;
  }>;
}

export default function AgeGroupSchedule() {
  const { eventId, ageGroupId } = useParams();
  const [activeTab, setActiveTab] = useState('schedule');

  // Fetch age group specific data from the working endpoint
  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ['age-group-schedule', eventId, ageGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/public/schedules/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedule data');
      }
      const data = await response.json();
      
      // Find the specific age group from the data
      const allAgeGroups = [...(data.ageGroupsByGender?.boys || []), ...(data.ageGroupsByGender?.girls || [])];
      const targetAgeGroup = allAgeGroups.find(ag => ag.ageGroupId === parseInt(ageGroupId));
      
      if (!targetAgeGroup) {
        throw new Error('Age group not found');
      }
      
      // Filter games for this specific age group
      const ageGroupGames = data.games?.filter(game => game.ageGroup === targetAgeGroup.ageGroup) || [];
      
      // Transform data to match expected interface
      return {
        eventInfo: data.eventInfo,
        ageGroupInfo: {
          ageGroup: targetAgeGroup.ageGroup,
          gender: targetAgeGroup.gender,
          birthYear: targetAgeGroup.birthYear,
          divisionCode: targetAgeGroup.divisionCode,
          displayName: targetAgeGroup.displayName,
        },
        flights: [{
          flightId: 1,
          flightName: 'Main',
          teamCount: targetAgeGroup.totalTeams,
          teams: [], // Will be populated if needed
          games: ageGroupGames.map(game => ({
            id: game.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            date: game.date,
            time: game.time,
            field: game.field,
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
          }))
        }]
      };
    },
    enabled: !!eventId && !!ageGroupId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-900 text-lg">Loading schedule...</span>
        </div>
      </div>
    );
  }

  if (error || !scheduleData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border border-gray-300 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-gray-900 text-xl font-semibold mb-2">Error Loading Schedule</h2>
            <p className="text-gray-600 mb-4">
              Error: {error?.message || 'Unknown error occurred'}
            </p>
            <div className="space-y-3">
              <Button
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Background Animation */}
      <AnimatedBackground 
        type="particles" 
        speed="slow" 
        primaryColor="#1f3a71" 
        secondaryColor="#1a82c4"
        className="opacity-10"
      />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Tournament Logo and Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Tournament Logo */}
              {scheduleData.eventInfo?.logoUrl ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                  <img 
                    src={scheduleData.eventInfo.logoUrl.startsWith('http') ? scheduleData.eventInfo.logoUrl : `${window.location.origin}${scheduleData.eventInfo.logoUrl}`} 
                    alt={`${scheduleData.eventInfo.name} Logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="w-16 h-16 bg-gradient-to-br from-[#1f3a71] to-[#1a82c4] rounded-lg flex items-center justify-center"><svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div>';
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-[#1f3a71] to-[#1a82c4] rounded-lg flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {scheduleData.eventInfo?.name || 'Tournament'}
                </h1>
                <p className="text-lg text-gray-600">
                  {scheduleData.ageGroupInfo?.displayName} Schedule
                </p>
                <p className="text-sm text-gray-500">
                  {scheduleData.flights?.length || 0} flights • {scheduleData.flights?.reduce((sum: number, f: any) => sum + f.teamCount, 0) || 0} teams
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Schedules
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Schedule & Games</TabsTrigger>
            <TabsTrigger value="brackets">Teams & Brackets</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-6">
            <div className="space-y-6">
              {scheduleData.flights?.map((flight: any) => (
                <Card key={flight.flightId} className="bg-white/95 backdrop-blur-sm shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-[#1f3a71] text-white">
                          {flight.flightName}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {flight.teamCount} teams • {flight.games?.length || 0} games
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {flight.games && flight.games.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 rounded-lg">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Home Team</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Away Team</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {flight.games.map((game: any) => (
                              <tr key={game.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div>
                                    {new Date(`${game.date}T${game.time}`).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500">{game.time}</div>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {game.homeTeam}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {game.awayTeam}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {game.field}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {game.homeScore !== null && game.awayScore !== null ? (
                                    <span className="font-medium">
                                      {game.homeScore} - {game.awayScore}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No games scheduled for this flight yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Brackets Tab */}
          <TabsContent value="brackets" className="mt-6">
            <div className="space-y-6">
              {scheduleData.flights?.map((flight: any) => (
                <Card key={flight.flightId} className="bg-white/95 backdrop-blur-sm shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-[#1a82c4] text-white">
                          {flight.flightName}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {flight.teamCount} teams
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {flight.teams && flight.teams.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {flight.teams.map((team: any, index: number) => (
                          <div key={team.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-[#1f3a71] text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">
                                Status: {team.status === 'approved' ? 'Approved' : team.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No teams assigned to this flight yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Powered by MatchPro Footer */}
        <div className="mt-16 py-8 border-t border-gray-200/50">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Trophy className="h-4 w-4" />
            <span className="text-sm">Powered by</span>
            <span className="text-sm font-semibold text-gray-700">MatchPro</span>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1">
            Intelligent Tournament Management
          </p>
        </div>
      </div>
    </div>
  );
}
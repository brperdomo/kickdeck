import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Users, Trophy, Clock, MapPin, 
  ArrowLeft, ExternalLink, RefreshCw, AlertTriangle, ChevronRight 
} from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

interface PublicScheduleData {
  eventInfo: {
    name: string;
    startDate: string;
    endDate: string;
    logoUrl?: string;
  };
  ageGroupsByGender: {
    boys: Array<{
      ageGroup: string;
      gender: string;
      birthYear: number;
      divisionCode: string;
      displayName: string;
      totalFlights: number;
      totalTeams: number;
      flights: Array<{
        flightName: string;
        teamCount: number;
        gameCount: number;
      }>;
    }>;
    girls: Array<{
      ageGroup: string;
      gender: string;
      birthYear: number;
      divisionCode: string;
      displayName: string;
      totalFlights: number;
      totalTeams: number;
      flights: Array<{
        flightName: string;
        teamCount: number;
        gameCount: number;
      }>;
    }>;
  };
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
      const response = await fetch(`/api/public/schedules-fixed/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament schedules');
      }
      return response.json();
    },
    enabled: !!eventId
  });

  console.log('Frontend Debug - Schedule Data:', scheduleData);
  console.log('Frontend Debug - Boys Age Groups:', scheduleData?.ageGroupsByGender?.boys?.length, scheduleData?.ageGroupsByGender?.boys);
  console.log('Frontend Debug - Girls Age Groups:', scheduleData?.ageGroupsByGender?.girls?.length, scheduleData?.ageGroupsByGender?.girls);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-900 text-lg">Loading tournament schedules...</span>
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
            <h2 className="text-gray-900 text-xl font-semibold mb-2">Error Loading Schedules</h2>
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
              <p className="text-xs text-gray-500">
                Event ID: {eventId}
              </p>
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
      {/* Header - Professional Tournament Style */}
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
                      // Fallback to trophy icon if logo fails to load
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
                  {scheduleData.eventInfo?.name || 'Tournament Schedules'}
                </h1>
                <p className="text-gray-600">
                  {scheduleData.eventInfo?.startDate && scheduleData.eventInfo?.endDate ? (
                    `${new Date(scheduleData.eventInfo.startDate).toLocaleDateString()} - ${new Date(scheduleData.eventInfo.endDate).toLocaleDateString()}`
                  ) : (
                    'Schedule and standings'
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Home
              </Button>
              <Button variant="outline" size="sm">
                Venues
              </Button>
              <Button variant="outline" size="sm">
                Rules
              </Button>
              <Button variant="default" size="sm" className="bg-blue-600">
                Team Registration
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button className="border-b-2 border-blue-600 text-blue-600 py-2 px-1 text-sm font-medium">
                Schedules/Standings
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Schedules</h2>
        
        {/* Boys Age Groups Table */}
        {scheduleData.ageGroupsByGender?.boys && scheduleData.ageGroupsByGender.boys.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Boys</h3>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <tbody className="divide-y divide-gray-200">
                  {scheduleData.ageGroupsByGender.boys.map((ageGroup: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ageGroup.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Flights
                          <div className="text-xs text-gray-500">{ageGroup.totalFlights}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Teams
                          <div className="text-xs text-gray-500">{ageGroup.totalTeams}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <a 
                            href={`/public/schedules/${eventId}/age-group/${ageGroup.ageGroupId}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Schedules
                          </a>
                          <span className="text-gray-400">|</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Standings
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Girls Age Groups Table */}
        {scheduleData.ageGroupsByGender?.girls && scheduleData.ageGroupsByGender.girls.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Girls</h3>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <tbody className="divide-y divide-gray-200">
                  {scheduleData.ageGroupsByGender.girls.map((ageGroup: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ageGroup.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Flights
                          <div className="text-xs text-gray-500">{ageGroup.totalFlights}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Teams
                          <div className="text-xs text-gray-500">{ageGroup.totalTeams}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <a 
                            href={`/public/schedules/${eventId}/age-group/${ageGroup.ageGroupId}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Schedules
                          </a>
                          <span className="text-gray-400">|</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Standings
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Games Display Section */}
        {scheduleData.games && scheduleData.games.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Games</h3>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Home Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Away Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scheduleData.games.slice(0, 10).map((game: any) => (
                    <tr key={game.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(`${game.date}T${game.time}`).toLocaleDateString()}<br />
                        <span className="text-gray-500">{game.time}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{game.homeTeam}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{game.awayTeam}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.ageGroup}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.field}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Debug Info (temporary) */}
        {scheduleData && (
          <div className="mt-8 p-4 bg-gray-100/90 backdrop-blur-sm rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Debug Info:</h4>
            <p className="text-sm text-gray-600">Event: {scheduleData.eventInfo?.name}</p>
            <p className="text-sm text-gray-600">Boys Age Groups: {scheduleData.ageGroupsByGender?.boys?.length || 0}</p>
            <p className="text-sm text-gray-600">Girls Age Groups: {scheduleData.ageGroupsByGender?.girls?.length || 0}</p>
            <p className="text-sm text-gray-600">Games: {scheduleData.games?.length || 0}</p>
            <p className="text-sm text-gray-600">API Response Structure: {JSON.stringify(Object.keys(scheduleData))}</p>
          </div>
        )}


      </div>
    </div>
  );
}
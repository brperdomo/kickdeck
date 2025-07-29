import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SevenStepTournamentSystem } from '@/components/admin/scheduling/SevenStepTournamentSystem';
import { Settings, Trophy, AlertTriangle, Calendar, Users, ArrowRight } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  teamCount: number;
}

export default function TournamentSystemPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Fetch tournaments available for scheduling
  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['scheduling-tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tournaments/scheduling', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading tournament system...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">Tournament Management System</h1>
                    <p className="text-blue-100 text-lg mt-1">
                      AI-powered tournament scheduling with complete automation
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30">
                    Fully Automated
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Tournament Selection */}
        {!selectedEventId && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Select Tournament</CardTitle>
                  <p className="text-gray-600 text-sm mt-1">Choose a tournament to begin automated scheduling</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {tournaments && tournaments.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {tournaments.map((tournament: Event) => (
                      <div
                        key={tournament.id}
                        onClick={() => setSelectedEventId(tournament.id.toString())}
                        className="group relative p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-r from-white to-gray-50/50 hover:from-blue-50/50 hover:to-purple-50/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                              {tournament.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{tournament.teamCount} teams</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                              {tournament.teamCount} teams
                            </Badge>
                            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                              <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    No tournaments found that are ready for scheduling. Create a tournament with registered teams first.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* 7-Step Tournament System */}
        {selectedEventId && (
          <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-500">Tournament System</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {tournaments?.find((t: Event) => t.id.toString() === selectedEventId)?.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedEventId('')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Selection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced System Interface */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
              <SevenStepTournamentSystem eventId={selectedEventId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
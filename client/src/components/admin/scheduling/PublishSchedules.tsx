import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, Eye, Calendar, Users, Trophy, ExternalLink, 
  CheckCircle, Clock, AlertTriangle, Copy, Share2, 
  RefreshCw, Database, ArrowRight 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublishSchedulesProps {
  eventId: string;
}

interface ScheduleData {
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
  ageGroups: Array<{
    ageGroup: string;
    flights: Array<{
      flightName: string;
      teamCount: number;
      gameCount: number;
    }>;
  }>;
  eventInfo: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

interface PublishedSchedule {
  id: number;
  eventId: number;
  publishedAt: string;
  publishedBy: number;
  isActive: boolean;
  scheduleData: ScheduleData;
}

export function PublishSchedules({ eventId }: PublishSchedulesProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current schedule data for preview
  const { data: schedulePreview, isLoading: loadingPreview } = useQuery({
    queryKey: ['schedule-preview', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-preview`);
      if (!response.ok) throw new Error('Failed to fetch schedule preview');
      return response.json() as ScheduleData;
    }
  });

  // Fetch published schedules status
  const { data: publishedSchedules, isLoading: loadingPublished } = useQuery({
    queryKey: ['published-schedules', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/published-schedules`);
      if (!response.ok) throw new Error('Failed to fetch published schedules');
      return response.json() as { schedules: PublishedSchedule[] };
    }
  });

  // Publish schedules mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/publish-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to publish schedules');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Schedules Published Successfully",
        description: `Tournament schedules are now publicly available. Public URL: ${data.publicUrl}`,
      });
      queryClient.invalidateQueries({ queryKey: ['published-schedules', eventId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Publish Schedules",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Unpublish schedules mutation
  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/unpublish-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to unpublish schedules');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Schedules Unpublished",
        description: "Tournament schedules are no longer publicly accessible.",
      });
      queryClient.invalidateQueries({ queryKey: ['published-schedules', eventId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Unpublish Schedules",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishMutation.mutateAsync();
    } finally {
      setIsPublishing(false);
    }
  };

  const copyPublicUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied",
      description: "Public schedule URL copied to clipboard",
    });
  };

  const currentPublishedSchedule = publishedSchedules?.schedules?.find(s => s.isActive);
  const publicUrl = currentPublishedSchedule ? `/public/schedules/${eventId}` : null;

  if (loadingPreview || loadingPublished) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-300">Loading schedule data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Publication Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-400" />
            Publication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPublishedSchedule ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Published
                </Badge>
                <span className="text-slate-300">
                  Published {new Date(currentPublishedSchedule.publishedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Public Schedule URL:</p>
                    <p className="text-blue-400 font-mono text-sm">{window.location.origin}{publicUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPublicUrl(window.location.origin + publicUrl)}
                      className="border-slate-600 text-slate-200 hover:bg-slate-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(publicUrl, '_blank')}
                      className="border-slate-600 text-slate-200 hover:bg-slate-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Published Schedule
                </Button>
                <Button
                  onClick={() => unpublishMutation.mutate()}
                  disabled={unpublishMutation.isPending}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Unpublish
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Not Published
                </Badge>
                <span className="text-slate-400">Schedules are not currently public</span>
              </div>
              
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !schedulePreview}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isPublishing ? 'Publishing...' : 'Publish Schedules'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Preview */}
      {schedulePreview && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-white font-medium">Games</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{schedulePreview.games?.length || 0}</p>
                <p className="text-slate-400 text-sm">Total scheduled games</p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-green-400" />
                  <span className="text-white font-medium">Teams</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{schedulePreview.standings?.length || 0}</p>
                <p className="text-slate-400 text-sm">Teams with standings</p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-medium">Age Groups</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{schedulePreview.ageGroups?.length || 0}</p>
                <p className="text-slate-400 text-sm">With active flights</p>
              </div>
            </div>

            {/* Age Groups and Flights Preview */}
            {schedulePreview.ageGroups && schedulePreview.ageGroups.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Age Groups & Flights</h4>
                <div className="grid gap-3">
                  {schedulePreview.ageGroups.map((ageGroup, index) => (
                    <div key={index} className="bg-slate-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{ageGroup.ageGroup}</span>
                        <Badge className="bg-blue-600 text-white">
                          {ageGroup.flights.length} Flight{ageGroup.flights.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {ageGroup.flights.map((flight, flightIndex) => (
                          <div key={flightIndex} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{flight.flightName}</span>
                            <div className="flex gap-4 text-slate-400">
                              <span>{flight.teamCount} teams</span>
                              <span>{flight.gameCount} games</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Publishing Instructions */}
      <Alert className="border-slate-600 bg-slate-800">
        <ArrowRight className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-slate-200">
          <strong>How it works:</strong> Publishing creates a public webpage organized by age groups and flights (like your screenshot). 
          Each flight will have "Schedules | Standings" links that teams and spectators can access without logging in. 
          The public page automatically updates when you republish with schedule changes.
        </AlertDescription>
      </Alert>
    </div>
  );
}
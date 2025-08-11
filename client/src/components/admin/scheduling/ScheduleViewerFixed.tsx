import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  Search,
  Eye,
  Edit,
  Download,
  Loader2,
  AlertCircle,
  Database,
  Trash2,
  X,
  AlertTriangle,
  ArrowLeftRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  ageGroup: string;
  field: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamId?: number;
  awayTeamId?: number;
  bracketId?: number;
  flightName?: string;
}

interface ScheduleData {
  games: Game[];
  fields: Array<{ name: string; surface: string; size: string }>;
  ageGroups: string[];
  dates: string[];
  totalGames: number;
  scheduleStatus: string;
  isPreview: boolean;
  actualData: {
    gamesInDatabase: number;
    teamsInDatabase: number;
    ageGroupsConfigured: number;
    realTeamsFound: number;
    scheduledGamesFound: number;
    scheduleType: string;
  };
  teamsList: Array<{ id: number; name: string; club: string }>;
  eventId: number;
  eventDetails: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

interface EditingGameState {
  gameId: number;
  editingPosition: 'home' | 'away';
  availableTeams: Array<{ id: number; name: string; club: string }>;
}

interface ScheduleViewerProps {
  eventId: string;
}

export function ScheduleViewer({ eventId }: ScheduleViewerProps) {
  // Use useMemo for initial state to ensure stable references
  const initialState = useMemo(() => ({
    searchTerm: '',
    selectedDate: 'all',
    selectedField: 'all', 
    selectedAgeGroup: 'all',
    selectedGames: [] as number[],
    showDeleteConfirm: false,
    deleteType: 'single' as 'single' | 'bulk' | 'all',
    deleteGameId: undefined as number | undefined
  }), []);

  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm);
  const [selectedDate, setSelectedDate] = useState(initialState.selectedDate);
  const [selectedField, setSelectedField] = useState(initialState.selectedField);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(initialState.selectedAgeGroup);
  const [selectedGames, setSelectedGames] = useState(initialState.selectedGames);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialState.showDeleteConfirm);
  const [deleteType, setDeleteType] = useState(initialState.deleteType);
  const [deleteGameId, setDeleteGameId] = useState(initialState.deleteGameId);
  
  // Team editing state
  const [editingGame, setEditingGame] = useState<EditingGameState | null>(null);
  const [swappingTeam, setSwappingTeam] = useState<{ gameId: number; teamId: number; teamName: string; position: 'home' | 'away' } | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Array<{id: number, name: string, flightName: string}>>([]);
  
  // Date/Time editing state
  const [editingDateTime, setEditingDateTime] = useState<{ gameId: number; currentDate: string; currentTime: string } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // CRITICAL: Clear cache on mount to prevent stale data multiplication
  useEffect(() => {
    console.log('[ScheduleViewer] Clearing cache to prevent data multiplication');
    queryClient.removeQueries({ queryKey: ['schedule-data'] });
    queryClient.removeQueries({ queryKey: ['enhanced-schedule'] });
  }, [eventId, queryClient]);

  const { data: scheduleData, isLoading, error, refetch } = useQuery<ScheduleData>({
    queryKey: ['schedule-data', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-calendar`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required - please log in as admin');
        } else if (response.status === 500) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
          throw new Error(`Server error: ${errorData.error || errorData.details || 'Unknown error'}`);
        } else {
          throw new Error(`Failed to fetch schedule data: ${response.status} ${response.statusText}`);
        }
      }
      const data = await response.json();
      
      // CRITICAL: Check for data multiplication at the API level
      if (data.games && Array.isArray(data.games)) {
        console.log(`[ScheduleViewer] API returned ${data.games.length} games`);
        
        // Check for duplicate game IDs
        const gameIds = data.games.map((g: any) => g.id);
        const uniqueGameIds = [...new Set(gameIds)];
        if (gameIds.length !== uniqueGameIds.length) {
          console.error(`[ScheduleViewer] DUPLICATION DETECTED: API returned ${gameIds.length} games but only ${uniqueGameIds.length} unique IDs`);
          // Deduplicate by game ID
          const uniqueGames = data.games.filter((game: any, index: number) => 
            gameIds.indexOf(game.id) === index
          );
          console.log(`[ScheduleViewer] Deduplicated to ${uniqueGames.length} games`);
          data.games = uniqueGames;
        }
      }
      
      // Transform the API response to match the expected format
      const transformedGames = data.games?.map((game: any, index: number) => {
        // Simplified logging - removed excessive debug output to prevent console spam
        if (index === 0) {
          console.log(`[ScheduleViewer] Processing ${data.games.length} games for event ${eventId}`);
        }
        
        // Handle team names - the API is returning them directly as strings in homeTeam/awayTeam
        const homeTeamName = game.homeTeam || game.homeTeamName || `Team ${game.homeTeamId || 'Unknown'}`;
        const awayTeamName = game.awayTeam || game.awayTeamName || `Team ${game.awayTeamId || 'Unknown'}`;
        
        // Handle field names - extract from the "Field null" format or use direct field name
        const fieldName = game.fieldName || game.field?.name || game.field || 'Unassigned';
        
        // Format times properly - use new date/time fields from API
        let startTime, endTime, dateDisplay, timeDisplay;
        
        // Check if we have the new date/time format from the enhanced API
        if (game.date && game.date !== 'TBD' && game.time && game.time !== 'TBD') {
          // Use the new separated date/time fields
          dateDisplay = game.date; // Already in YYYY-MM-DD format
          timeDisplay = game.time; // Already in HH:MM format
          
          // Create startTime for sorting/calculations
          startTime = new Date(`${game.date}T${game.time}:00`);
          endTime = new Date(startTime.getTime() + (game.duration || 90) * 60 * 1000);
        } else if (game.startTime && game.startTime !== 'TBD') {
          // Fallback to old startTime format
          startTime = new Date(game.startTime);
          endTime = game.endTime ? new Date(game.endTime) : null;
          dateDisplay = startTime.toLocaleDateString();
          timeDisplay = startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        } else {
          // No valid time data
          startTime = null;
          endTime = null;
          dateDisplay = 'TBD';
          timeDisplay = 'TBD';
        }
        
        const transformed = {
          id: game.id,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          ageGroup: game.ageGroup || 'Unknown',
          field: fieldName,
          date: dateDisplay,
          time: timeDisplay,
          duration: game.duration || 90,
          status: game.status || 'scheduled',
          startTime: game.startTime,
          endTime: game.endTime,
          fieldName: fieldName,
          bracketId: game.bracketId,
          flightName: game.flightName
        };
        
        return transformed;
      }) || [];

      // Extract unique values for filters
      const uniqueFields = new Set(transformedGames.map((g: any) => g.field).filter((f: string) => f && f !== 'Unassigned'));
      const fields = Array.from(uniqueFields).map((name) => ({ name: name as string, surface: 'grass', size: '11v11' }));
      
      const uniqueAgeGroups = new Set(transformedGames.map((g: any) => g.ageGroup).filter(Boolean));
      const ageGroups = Array.from(uniqueAgeGroups) as string[];
      
      const uniqueDates = new Set(transformedGames.map((g: any) => g.date).filter((d: string) => d !== 'TBD'));
      const dates = Array.from(uniqueDates) as string[];

      // Calculate unique teams from games
      const uniqueTeams = new Set();
      transformedGames.forEach((game: any) => {
        if (game.homeTeam && !game.homeTeam.includes('Team Unknown')) {
          uniqueTeams.add(game.homeTeam);
        }
        if (game.awayTeam && !game.awayTeam.includes('Team Unknown')) {
          uniqueTeams.add(game.awayTeam);
        }
      });

      return {
        games: transformedGames,
        fields,
        ageGroups,
        dates,
        totalGames: transformedGames.length,
        scheduleStatus: 'active',
        isPreview: false,
        actualData: {
          gamesInDatabase: transformedGames.length,
          teamsInDatabase: uniqueTeams.size,
          ageGroupsConfigured: ageGroups.length,
          realTeamsFound: uniqueTeams.size,
          scheduledGamesFound: transformedGames.length,
          scheduleType: 'Tournament Schedule'
        },
        teamsList: [],
        eventId: parseInt(eventId),
        eventDetails: {
          name: 'Tournament',
          startDate: dates[0] || new Date().toISOString(),
          endDate: dates[dates.length - 1] || new Date().toISOString()
        }
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    // CRITICAL: Force fresh data and prevent cache corruption
    refetchOnMount: 'always',
    retry: (failureCount, error) => {
      // Don't retry auth errors, but retry others
      if (error.message.includes('Authentication required')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Fetch available teams for a specific flight when editing - moved after scheduleData declaration
  const { data: flightTeams } = useQuery({
    queryKey: ['flight-teams', eventId, editingGame],
    queryFn: async () => {
      if (!editingGame) return [];
      const game = scheduleData?.games.find(g => g.id === editingGame);
      if (!game?.bracketId) return [];
      
      const response = await fetch(`/api/admin/events/${eventId}/brackets/${game.bracketId}/teams`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: !!editingGame && !!scheduleData
  });

  // Memoize filtered games to prevent unnecessary recalculations
  const filteredGames = useMemo(() => {
    if (!scheduleData?.games) return [];
    
    return scheduleData.games.filter(game => {
      const matchesSearch = !searchTerm || 
        game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = selectedDate === 'all' || game.date === selectedDate;
      const matchesField = selectedField === 'all' || game.field === selectedField;
      const matchesAgeGroup = selectedAgeGroup === 'all' || game.ageGroup === selectedAgeGroup;
      
      return matchesSearch && matchesDate && matchesField && matchesAgeGroup;
    });
  }, [scheduleData?.games, searchTerm, selectedDate, selectedField, selectedAgeGroup]);

  // Delete mutations
  const deleteSingleGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/${gameId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete game failed:', response.status, errorData);
        throw new Error(`Failed to delete game: ${response.status}`);
      }
      return response.json();
    },
    retry: false, // Disable retries to prevent exponential requests
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ title: 'Game deleted successfully', variant: 'default' });
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Delete game mutation error:', error);
      toast({ title: 'Failed to delete game', variant: 'destructive' });
      setShowDeleteConfirm(false); // Close dialog even on error
    }
  });

  const deleteBulkGamesMutation = useMutation({
    mutationFn: async (gameIds: number[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameIds })
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Bulk delete games failed:', response.status, errorData);
        throw new Error(`Failed to delete games: ${response.status}`);
      }
      return response.json();
    },
    retry: false, // Disable retries to prevent exponential requests
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ title: `Successfully deleted games`, variant: 'default' });
      setSelectedGames([]);
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Bulk delete games mutation error:', error);
      toast({ title: 'Failed to delete selected games', variant: 'destructive' });
      setShowDeleteConfirm(false); // Close dialog even on error
    }
  });

  const deleteAllGamesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete all games failed:', response.status, errorData);
        throw new Error(`Failed to delete all games: ${response.status}`);
      }
      return response.json();
    },
    retry: false, // Disable retries to prevent exponential requests
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ 
        title: 'Games Deleted Successfully', 
        description: `${data.message || `Deleted ${data.deletedCount} games from the tournament`}`,
        variant: 'default' 
      });
      setShowDeleteConfirm(false);
      
      // Force refresh to clear any cached data
      window.location.reload();
    },
    onError: (error) => {
      console.error('Delete all games mutation error:', error);
      toast({ title: 'Failed to delete all games', variant: 'destructive' });
      setShowDeleteConfirm(false); // Close dialog even on error
    }
  });

  // Team editing mutation
  const updateGameTeamsMutation = useMutation({
    mutationFn: async ({ gameId, homeTeamId, awayTeamId }: { gameId: number, homeTeamId: number, awayTeamId: number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/${gameId}/teams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ homeTeamId, awayTeamId })
      });
      if (!response.ok) throw new Error('Failed to update game teams');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setEditingGame(null);
      toast({ title: 'Game teams updated successfully', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update game teams', variant: 'destructive' });
    }
  });

  // Team swapping mutation
  const swapTeamsMutation = useMutation({
    mutationFn: async ({ game1Id, team1Id, team1Position, game2Id, team2Id, team2Position }: {
      game1Id: number; team1Id: number; team1Position: 'home' | 'away';
      game2Id: number; team2Id: number; team2Position: 'home' | 'away';
    }) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/swap-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          game1Id, team1Id, team1Position,
          game2Id, team2Id, team2Position
        })
      });
      if (!response.ok) throw new Error('Failed to swap teams');
      return response.json();
    },
    onSuccess: () => {
      console.log('SWAP SUCCESS: Teams swapped successfully');
      // Use optimistic update instead of full invalidation to prevent game cards from moving
      queryClient.setQueryData(['schedule-data', eventId], (oldData: ScheduleData | undefined) => {
        if (!oldData) return oldData;
        // The data will be updated by the server response, no need to manually update here
        return oldData;
      });
      // Only invalidate after a short delay to let the UI stabilize
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      }, 100);
      setSwappingTeam(null);
      toast({ title: 'Teams swapped successfully', variant: 'default' });
    },
    onError: (error) => {
      console.error('SWAP ERROR:', error);
      toast({ title: 'Failed to swap teams', description: error.message, variant: 'destructive' });
    }
  });

  // Date/Time editing mutation
  const updateGameDateTimeMutation = useMutation({
    mutationFn: async ({ gameId, date, time }: { gameId: number; date: string; time: string }) => {
      const startTime = `${date}T${time}:00`;
      const response = await fetch(`/api/admin/games/${gameId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          startTime,
          eventId: eventId
        })
      });
      if (!response.ok) throw new Error('Failed to update game date/time');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-data', eventId] });
      setEditingDateTime(null);
      toast({ title: 'Game date and time updated successfully', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update date/time', description: error.message, variant: 'destructive' });
    }
  });

  const handleDeleteGame = (gameId: number) => {
    setDeleteType('single');
    setDeleteGameId(gameId);
    setShowDeleteConfirm(true);
  };

  const handleBulkDelete = () => {
    if (selectedGames.length === 0) return;
    setDeleteType('bulk');
    setDeleteGameId(undefined);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
    setDeleteGameId(undefined);
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (deleteType === 'single' && deleteGameId) {
      deleteSingleGameMutation.mutate(deleteGameId);
    } else if (deleteType === 'bulk') {
      deleteBulkGamesMutation.mutate(selectedGames);
    } else if (deleteType === 'all') {
      deleteAllGamesMutation.mutate();
    }
  };

  const toggleGameSelection = (gameId: number) => {
    setSelectedGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGames.length === filteredGames.length) {
      setSelectedGames([]);
    } else {
      setSelectedGames(filteredGames.map(g => g.id));
    }
  };

  // Generate tooltip message for TBD/unassigned games
  const getUnassignedTooltip = (game: Game) => {
    const issues = [];
    
    if (game.time === 'TBD' || !game.time) {
      issues.push('No time assigned - scheduling algorithm couldn\'t find suitable time slot');
    }
    
    if (game.field === 'Unassigned' || game.field === 'TBD' || !game.field) {
      issues.push('No field assigned - field requirements may conflict with availability');
    }
    
    if (game.date === 'TBD' || !game.date) {
      issues.push('No date assigned - tournament dates may be incomplete');
    }

    if (issues.length === 0) return null;
    
    return `⚠️ Assignment Issues:\n${issues.map(issue => `• ${issue}`).join('\n')}\n\nSolutions:\n• Use Calendar Interface to manually assign\n• Check field availability and size requirements\n• Verify tournament dates are properly configured`;
  };

  const handleExportSchedule = () => {
    // Simple CSV export
    const csvContent = [
      ['Date', 'Time', 'Home Team', 'Away Team', 'Age Group', 'Field', 'Status'].join(','),
      ...filteredGames.map(game => [
        game.date,
        game.time,
        game.homeTeam,
        game.awayTeam,
        game.ageGroup,
        game.field,
        game.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-schedule-${eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Schedule exported successfully', variant: 'default' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading tournament schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Schedule</h3>
          <p className="text-red-600">Unable to load tournament schedule. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Schedule Data</h3>
          <p className="text-gray-600">Tournament schedule data is not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {scheduleData.actualData.scheduleType || 'Database Games'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.actualData.gamesInDatabase}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Teams</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.actualData.teamsInDatabase}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Age Groups</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.actualData.ageGroupsConfigured}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Fields</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.fields.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Tournament Schedule ({filteredGames.length} games)
            </CardTitle>
            
            {/* Management Actions */}
            <div className="flex flex-wrap gap-2">
              {selectedGames.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGames([])}
                    className="text-gray-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear ({selectedGames.length})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={deleteBulkGamesMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSchedule}
                disabled={filteredGames.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              
              {scheduleData.games.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={deleteAllGamesMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All Games
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {scheduleData.dates.map(date => (
                  <SelectItem key={date} value={date}>{date}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="All Fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {scheduleData.fields.map(field => (
                  <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger>
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {scheduleData.ageGroups.map(ageGroup => (
                  <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredGames.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedGames.length === filteredGames.length}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All
                </Label>
              </div>
            )}
          </div>

          {/* Games List */}
          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Games Found</h3>
              <p className="text-gray-600">
                {scheduleData.games.length === 0 
                  ? "No games have been scheduled yet. Use the Quick Generator to create a schedule."
                  : "No games match your current filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredGames.map((game) => {
                const tooltipMessage = getUnassignedTooltip(game);
                const hasUnassignedFields = game.time === 'TBD' || game.field === 'Unassigned' || game.field === 'TBD' || game.date === 'TBD';
                
                return (
                <Card 
                  key={game.id} 
                  className={`border transition-colors ${
                    selectedGames.includes(game.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  } ${hasUnassignedFields ? 'border-yellow-300 bg-yellow-50' : ''}`}
                  title={tooltipMessage || undefined}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedGames.includes(game.id)}
                          onCheckedChange={() => toggleGameSelection(game.id)}
                        />
                        {editingGame?.gameId === game.id ? (
                          // Team Editing Interface
                          <div className="space-y-3 w-full">
                            <div className="text-sm font-medium text-gray-700">Edit Game Teams</div>
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">Home Team</Label>
                                <Select 
                                  defaultValue={
                                    editingGame?.editingPosition === 'home' 
                                      ? game.homeTeamId?.toString() 
                                      : editingGame?.editingPosition === 'away' 
                                      ? game.awayTeamId?.toString()
                                      : game.homeTeamId?.toString()
                                  }
                                  onValueChange={(value) => {
                                    if (editingGame?.editingPosition === 'home') {
                                      updateGameTeamsMutation.mutate({
                                        gameId: game.id,
                                        homeTeamId: parseInt(value),
                                        awayTeamId: game.awayTeamId || null
                                      });
                                    } else if (editingGame?.editingPosition === 'away') {
                                      updateGameTeamsMutation.mutate({
                                        gameId: game.id,
                                        homeTeamId: game.homeTeamId || null,
                                        awayTeamId: parseInt(value)
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder={
                                      editingGame?.editingPosition === 'home' ? "Select home team" : "Select team"
                                    } />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {editingGame?.availableTeams?.map((team: any) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Away Team</Label>
                                <Select 
                                  defaultValue={game.awayTeamId?.toString()}
                                  onValueChange={(value) => {
                                    const homeTeamId = game.homeTeamId;
                                    if (homeTeamId && value !== homeTeamId.toString()) {
                                      updateGameTeamsMutation.mutate({
                                        gameId: game.id,
                                        homeTeamId: homeTeamId,
                                        awayTeamId: parseInt(value)
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select away team" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {flightTeams?.map((team: any) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingGame(null)}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Normal Game Display
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <span 
                                  className={`cursor-pointer hover:bg-blue-100 px-1 rounded ${
                                    swappingTeam?.teamId === game.homeTeamId ? 'bg-blue-200' : ''
                                  }`}
                                  onClick={() => {
                                    console.log('HOME TEAM CLICKED:', {
                                      gameId: game.id,
                                      homeTeamId: game.homeTeamId,
                                      homeTeam: game.homeTeam,
                                      swappingTeam: swappingTeam
                                    });
                                    
                                    if (!game.homeTeamId || game.homeTeam.includes('TBD') || game.homeTeam.includes('Place')) {
                                      console.log('TBD/Placeholder team clicked - opening edit dialog');
                                      // For TBD teams, open edit dialog instead of swapping
                                      setEditingGame({ 
                                        gameId: game.id,
                                        editingPosition: 'home',
                                        availableTeams: scheduleData?.teamsList?.filter(team => 
                                          team.name !== game.awayTeam // Don't allow same team in both positions
                                        ) || []
                                      });
                                      return;
                                    }
                                    
                                    if (swappingTeam) {
                                      // Complete the swap
                                      if (swappingTeam.teamId === game.homeTeamId) {
                                        console.log('Canceling swap - same team clicked');
                                        setSwappingTeam(null); // Cancel if clicking same team
                                      } else {
                                        console.log('Executing swap:', {
                                          game1Id: swappingTeam.gameId,
                                          team1Id: swappingTeam.teamId,
                                          team1Position: swappingTeam.position,
                                          game2Id: game.id,
                                          team2Id: game.homeTeamId,
                                          team2Position: 'home'
                                        });
                                        swapTeamsMutation.mutate({
                                          game1Id: swappingTeam.gameId,
                                          team1Id: swappingTeam.teamId,
                                          team1Position: swappingTeam.position,
                                          game2Id: game.id,
                                          team2Id: game.homeTeamId,
                                          team2Position: 'home'
                                        });
                                      }
                                    } else {
                                      // Start swapping
                                      console.log('Starting swap mode with home team');
                                      setSwappingTeam({
                                        gameId: game.id,
                                        teamId: game.homeTeamId,
                                        teamName: game.homeTeam,
                                        position: 'home'
                                      });
                                    }
                                  }}
                                >
                                  {game.homeTeam}
                                </span>
                                vs
                                <span 
                                  className={`cursor-pointer hover:bg-blue-100 px-1 rounded ${
                                    swappingTeam?.teamId === game.awayTeamId ? 'bg-blue-200' : ''
                                  }`}
                                  onClick={() => {
                                    console.log('AWAY TEAM CLICKED:', {
                                      gameId: game.id,
                                      awayTeamId: game.awayTeamId,
                                      awayTeam: game.awayTeam,
                                      swappingTeam: swappingTeam
                                    });
                                    
                                    if (!game.awayTeamId || game.awayTeam.includes('TBD') || game.awayTeam.includes('Place')) {
                                      console.log('TBD/Placeholder team clicked - opening edit dialog');
                                      // For TBD teams, open edit dialog instead of swapping
                                      setEditingGame({ 
                                        gameId: game.id,
                                        editingPosition: 'away',
                                        availableTeams: scheduleData?.teamsList?.filter(team => 
                                          team.name !== game.homeTeam // Don't allow same team in both positions
                                        ) || []
                                      });
                                      return;
                                    }
                                    
                                    if (swappingTeam) {
                                      // Complete the swap
                                      if (swappingTeam.teamId === game.awayTeamId) {
                                        console.log('Canceling swap - same team clicked');
                                        setSwappingTeam(null); // Cancel if clicking same team
                                      } else {
                                        console.log('Executing swap:', {
                                          game1Id: swappingTeam.gameId,
                                          team1Id: swappingTeam.teamId,
                                          team1Position: swappingTeam.position,
                                          game2Id: game.id,
                                          team2Id: game.awayTeamId,
                                          team2Position: 'away'
                                        });
                                        swapTeamsMutation.mutate({
                                          game1Id: swappingTeam.gameId,
                                          team1Id: swappingTeam.teamId,
                                          team1Position: swappingTeam.position,
                                          game2Id: game.id,
                                          team2Id: game.awayTeamId,
                                          team2Position: 'away'
                                        });
                                      }
                                    } else {
                                      // Start swapping
                                      console.log('Starting swap mode with away team');
                                      setSwappingTeam({
                                        gameId: game.id,
                                        teamId: game.awayTeamId,
                                        teamName: game.awayTeam,
                                        position: 'away'
                                      });
                                    }
                                  }}
                                >
                                  {game.awayTeam}
                                </span>
                              </div>
                              {hasUnassignedFields && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            {editingDateTime?.gameId === game.id ? (
                              // Date/Time Editing Interface
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-700">Edit Date & Time</div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs text-gray-600">Date</Label>
                                    <Input
                                      type="date"
                                      defaultValue={editingDateTime.currentDate !== 'TBD' ? editingDateTime.currentDate : new Date().toISOString().split('T')[0]}
                                      className="h-8 text-xs"
                                      onChange={(e) => {
                                        setEditingDateTime(prev => prev ? { ...prev, currentDate: e.target.value } : null);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600">Time</Label>
                                    <Input
                                      type="time"
                                      defaultValue={editingDateTime.currentTime !== 'TBD' ? editingDateTime.currentTime : '09:00'}
                                      className="h-8 text-xs"
                                      onChange={(e) => {
                                        setEditingDateTime(prev => prev ? { ...prev, currentTime: e.target.value } : null);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (editingDateTime) {
                                        updateGameDateTimeMutation.mutate({
                                          gameId: editingDateTime.gameId,
                                          date: editingDateTime.currentDate,
                                          time: editingDateTime.currentTime
                                        });
                                      }
                                    }}
                                    className="h-7 text-xs"
                                    disabled={updateGameDateTimeMutation.isPending}
                                  >
                                    {updateGameDateTimeMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : null}
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingDateTime(null)}
                                    className="h-7 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Normal Date/Time Display (clickable to edit)
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span 
                                  className={`flex items-center cursor-pointer hover:bg-blue-100 px-1 rounded ${game.date === 'TBD' ? 'text-yellow-600 font-medium' : ''}`}
                                  onClick={() => setEditingDateTime({
                                    gameId: game.id,
                                    currentDate: game.date !== 'TBD' ? game.date : new Date().toISOString().split('T')[0],
                                    currentTime: game.time !== 'TBD' ? game.time : '09:00'
                                  })}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {game.date}
                                </span>
                                <span 
                                  className={`flex items-center cursor-pointer hover:bg-blue-100 px-1 rounded ${game.time === 'TBD' ? 'text-yellow-600 font-medium' : ''}`}
                                  onClick={() => setEditingDateTime({
                                    gameId: game.id,
                                    currentDate: game.date !== 'TBD' ? game.date : new Date().toISOString().split('T')[0],
                                    currentTime: game.time !== 'TBD' ? game.time : '09:00'
                                  })}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {game.time}
                                </span>
                                <span className={`flex items-center ${(game.field === 'Unassigned' || game.field === 'TBD') ? 'text-yellow-600 font-medium' : ''}`}>
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {game.field}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {game.ageGroup}
                              </Badge>
                              <Badge 
                                variant={game.status === 'scheduled' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {game.status}
                              </Badge>
                              {game.flightName && (
                                <Badge variant="secondary" className="text-xs">
                                  {game.flightName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {editingGame !== game.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGame(game.id)}
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGame(game.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Swapping Indicator */}
      {swappingTeam && (
        <div className="fixed top-4 right-4 z-40">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <ArrowLeftRight className="h-4 w-4" />
                <div className="text-sm">
                  <div className="font-medium">Swapping Mode Active</div>
                  <div className="text-xs">
                    Selected: {swappingTeam.teamName} ({swappingTeam.position})
                  </div>
                  <div className="text-xs text-blue-600">
                    Click another team to complete swap
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSwappingTeam(null)}
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                {deleteType === 'single' && 'Are you sure you want to delete this game? This action cannot be undone.'}
                {deleteType === 'bulk' && `Are you sure you want to delete ${selectedGames.length} selected games? This action cannot be undone.`}
                {deleteType === 'all' && `Are you sure you want to delete ALL ${scheduleData.games.length} games? This will completely clear the tournament schedule and cannot be undone.`}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={executeDelete}
                  disabled={deleteSingleGameMutation.isPending || deleteBulkGamesMutation.isPending || deleteAllGamesMutation.isPending}
                >
                  {(deleteSingleGameMutation.isPending || deleteBulkGamesMutation.isPending || deleteAllGamesMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {deleteType === 'single' && 'Delete Game'}
                  {deleteType === 'bulk' && `Delete ${selectedGames.length} Games`}
                  {deleteType === 'all' && 'Delete All Games'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
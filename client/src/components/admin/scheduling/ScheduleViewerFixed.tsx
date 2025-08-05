import React, { useState, useMemo } from 'react';
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
  AlertTriangle
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduleData, isLoading, error } = useQuery<ScheduleData>({
    queryKey: ['/api/admin/events', eventId, 'schedule'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schedule data');
      }
      const data = await response.json();
      console.log('Schedule API Response:', data);
      
      // Transform the API response to match the expected format
      const transformedGames = data.games?.map((game: any, index: number) => {
        console.log(`Game ${index + 1} transformation debug:`, {
          raw: game,
          homeTeamStructure: game.homeTeam,
          awayTeamStructure: game.awayTeam,
          fieldStructure: game.fieldName || game.field,
          rawFieldName: game.fieldName,
          rawField: game.field
        });
        
        console.log(`Game ${index + 1} API data:`, JSON.stringify(game, null, 2));
        
        // Handle team names - the API is returning them directly as strings in homeTeam/awayTeam
        const homeTeamName = game.homeTeam || game.homeTeamName || `Team ${game.homeTeamId || 'Unknown'}`;
        const awayTeamName = game.awayTeam || game.awayTeamName || `Team ${game.awayTeamId || 'Unknown'}`;
        
        // Handle field names - extract from the "Field null" format or use direct field name
        const fieldName = game.fieldName || game.field?.name || game.field || 'Unassigned';
        
        // Format times properly - handle "TBD" strings from backend
        let startTime, endTime, dateDisplay, timeDisplay;
        
        if (game.startTime === 'TBD' || !game.startTime) {
          startTime = null;
          endTime = null;
          dateDisplay = 'TBD';
          timeDisplay = 'TBD';
        } else {
          startTime = new Date(game.startTime);
          endTime = game.endTime ? new Date(game.endTime) : null;
          dateDisplay = startTime.toLocaleDateString();
          timeDisplay = startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
        
        const transformed = {
          id: game.id,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          ageGroup: game.ageGroup || 'Unknown',
          field: fieldName,
          date: dateDisplay,
          time: timeDisplay,
          duration: game.duration || 90,
          status: game.status || 'scheduled',
          startTime: game.startTime,
          endTime: game.endTime,
          fieldName: fieldName
        };
        
        console.log(`Game ${index + 1} transformed:`, transformed);
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
    }
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
      const response = await fetch(`/api/admin/events/${eventId}/games/delete-all`, {
        method: 'DELETE',
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
      toast({ title: 'Successfully deleted all games', variant: 'default' });
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Delete all games mutation error:', error);
      toast({ title: 'Failed to delete all games', variant: 'destructive' });
      setShowDeleteConfirm(false); // Close dialog even on error
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
              {filteredGames.map((game) => (
                <Card key={game.id} className={`border transition-colors ${
                  selectedGames.includes(game.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedGames.includes(game.id)}
                          onCheckedChange={() => toggleGameSelection(game.id)}
                        />
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {game.homeTeam} vs {game.awayTeam}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {game.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {game.time}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {game.field}
                            </span>
                          </div>
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
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGame(game.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
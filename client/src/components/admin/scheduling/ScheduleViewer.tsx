import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk' | 'all', gameId?: number }>({ type: 'single' });
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
      return response.json();
    }
  });

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
          <p className="text-gray-600">No schedule data found for this tournament.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter games based on search and filters
  const filteredGames = scheduleData.games.filter(game => {
    const matchesSearch = searchTerm === '' || 
      game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.ageGroup.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = selectedDate === 'all' || game.date === selectedDate;
    const matchesField = selectedField === 'all' || game.field === selectedField;
    const matchesAgeGroup = selectedAgeGroup === 'all' || game.ageGroup === selectedAgeGroup;
    
    return matchesSearch && matchesDate && matchesField && matchesAgeGroup;
  });

  // Delete mutations
  const deleteSingleGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/${gameId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete game');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ title: 'Game deleted successfully', variant: 'default' });
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast({ title: 'Failed to delete game', variant: 'destructive' });
    }
  });

  const deleteBulkGamesMutation = useMutation({
    mutationFn: async (gameIds: number[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/games/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameIds }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete games');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ title: `Successfully deleted ${data.deletedCount} games`, variant: 'default' });
      setSelectedGames([]);
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast({ title: 'Failed to delete games', variant: 'destructive' });
    }
  });

  const deleteAllGamesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games/all`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete all games');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      toast({ title: `Successfully deleted all ${data.deletedCount} games`, variant: 'default' });
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast({ title: 'Failed to delete all games', variant: 'destructive' });
    }
  });

  const handleDeleteGame = (gameId: number) => {
    setDeleteTarget({ type: 'single', gameId });
    setShowDeleteConfirm(true);
  };

  const handleBulkDelete = () => {
    if (selectedGames.length === 0) return;
    setDeleteTarget({ type: 'bulk' });
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    setDeleteTarget({ type: 'all' });
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (deleteTarget.type === 'single' && deleteTarget.gameId) {
      deleteSingleGameMutation.mutate(deleteTarget.gameId);
    } else if (deleteTarget.type === 'bulk') {
      deleteBulkGamesMutation.mutate(selectedGames);
    } else if (deleteTarget.type === 'all') {
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
    a.download = `tournament-${eventId}-schedule.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Schedule Exported",
      description: "Tournament schedule has been exported as CSV file."
    });
  };

  return (
    <div className="space-y-6">
      {/* Schedule Status Warning */}
      {scheduleData.isPreview && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">
                  Auto-Generated Schedule Preview
                </h3>
                <p className="text-amber-700 text-sm mb-2">
                  This is a <strong>preview of automatically generated games</strong> created by the scheduling system. 
                  These games were created on {new Date(2025, 6, 11).toLocaleDateString()} and distributed across the tournament dates 
                  ({new Date(scheduleData.eventDetails.startDate).toLocaleDateString()} - {new Date(scheduleData.eventDetails.endDate).toLocaleDateString()}).
                </p>
                <p className="text-amber-700 text-sm">
                  <strong>Note:</strong> Times and field assignments are algorithmic estimates. 
                  Use the Tournament System to generate the official schedule with proper time slots.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Enhanced Toolbar with MatchPro Styling */}
      <Card className="bg-gradient-to-r from-white to-blue-50 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Schedule Management
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs border-blue-200 hover:bg-blue-50"
              >
                <Checkbox 
                  checked={selectedGames.length === filteredGames.length && filteredGames.length > 0}
                  className="mr-1 h-3 w-3"
                />
                Select All
              </Button>
              {scheduleData.games.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="text-xs"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Clear All Games
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Selection and Action Bar */}
          {selectedGames.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedGames.length} games selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGames([])}
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear Selection
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-8 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete Selected ({selectedGames.length})
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search" className="text-gray-700 font-semibold">Search Teams</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <Label>Date</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {scheduleData.dates.map(date => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Field</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="All fields" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  {scheduleData.fields.map(field => (
                    <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Age Group</Label>
              <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="All age groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {scheduleData.ageGroups.map(ageGroup => (
                    <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleExportSchedule} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Tournament Schedule
            </span>
            <Badge variant="secondary">
              {filteredGames.length} of {scheduleData.games.length} games
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Games Found</h3>
              <p className="text-gray-600">No games match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGames.map((game) => (
                <Card key={game.id} className={`border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200 ${
                  selectedGames.includes(game.id) ? 'bg-blue-50 border-blue-300' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedGames.includes(game.id)}
                          onCheckedChange={() => toggleGameSelection(game.id)}
                          className="mr-3"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{game.homeTeam}</span>
                          <span className="text-gray-500">vs</span>
                          <span className="font-medium">{game.awayTeam}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span>{game.date}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span>{game.time}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span>{game.field}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{game.ageGroup}</Badge>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={game.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {game.status}
                          </Badge>
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
                {deleteTarget.type === 'single' && 'Are you sure you want to delete this game? This action cannot be undone.'}
                {deleteTarget.type === 'bulk' && `Are you sure you want to delete ${selectedGames.length} selected games? This action cannot be undone.`}
                {deleteTarget.type === 'all' && `Are you sure you want to delete ALL ${scheduleData.games.length} games? This will completely clear the tournament schedule and cannot be undone.`}
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
                  {deleteTarget.type === 'single' && 'Delete Game'}
                  {deleteTarget.type === 'bulk' && `Delete ${selectedGames.length} Games`}
                  {deleteTarget.type === 'all' && 'Delete All Games'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
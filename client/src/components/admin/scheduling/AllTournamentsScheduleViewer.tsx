import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, Search, Filter, Download, ExternalLink, 
  Trophy, Users, MapPin, Clock, Loader2, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalGames: number;
  totalTeams: number;
  ageGroups: number;
  status: 'active' | 'upcoming' | 'completed';
}

interface Game {
  id: string;
  eventId: string;
  eventName: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  ageGroup: string;
  field: string;
  complex: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export function AllTournamentsScheduleViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const { toast } = useToast();

  // Fetch all tournaments with schedule data
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/admin/tournaments/with-schedules'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tournaments/with-schedules', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    }
  });

  // Fetch all games across tournaments
  const { data: allGames, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ['/api/admin/games/all-tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/games/all-tournaments', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    }
  });

  if (tournamentsLoading || gamesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading tournament schedules...</p>
        </div>
      </div>
    );
  }

  // Filter games based on search and filters
  const filteredGames = allGames?.filter(game => {
    const matchesSearch = searchTerm === '' || 
      game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.ageGroup.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = selectedEvent === 'all' || game.eventId === selectedEvent;
    const matchesStatus = selectedStatus === 'all' || game.status === selectedStatus;
    const matchesDate = selectedDate === 'all' || game.date === selectedDate;
    
    return matchesSearch && matchesEvent && matchesStatus && matchesDate;
  }) || [];

  // Get unique dates for filter
  const uniqueDates = [...new Set(allGames?.map(game => game.date) || [])].sort();

  const handleExportAll = () => {
    const csvContent = [
      ['Tournament', 'Date', 'Time', 'Home Team', 'Away Team', 'Age Group', 'Field', 'Complex', 'Status'].join(','),
      ...filteredGames.map(game => [
        game.eventName,
        game.date,
        game.time,
        game.homeTeam,
        game.awayTeam,
        game.ageGroup,
        game.field,
        game.complex,
        game.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-tournaments-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Schedule Exported",
      description: "All tournament schedules exported as CSV file."
    });
  };

  const getTotalStats = () => {
    const totalGames = tournaments?.reduce((sum, t) => sum + t.totalGames, 0) || 0;
    const totalTeams = tournaments?.reduce((sum, t) => sum + t.totalTeams, 0) || 0;
    const totalTournaments = tournaments?.length || 0;
    
    return { totalGames, totalTeams, totalTournaments };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Tournaments</p>
                <p className="text-2xl font-bold">{stats.totalTournaments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Games</p>
                <p className="text-2xl font-bold">{stats.totalGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold">{stats.totalTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Filtered Games</p>
                <p className="text-2xl font-bold">{filteredGames.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            Tournament Overview & Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments?.map((tournament) => (
              <Card key={tournament.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{tournament.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={tournament.status === 'active' ? 'default' : tournament.status === 'upcoming' ? 'secondary' : 'outline'}>
                      {tournament.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {tournament.totalGames} games
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {tournament.totalTeams} teams
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/admin/events/${tournament.id}/master-schedule`, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedEvent(tournament.id);
                        toast({
                          title: "Filter Applied",
                          description: `Showing games for ${tournament.name}`
                        });
                      }}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              All Tournament Games ({filteredGames.length})
            </CardTitle>
            <Button onClick={handleExportAll} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search teams, tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="All Tournaments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tournaments</SelectItem>
                {tournaments?.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Games Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Tournament</th>
                    <th className="text-left p-3 font-medium text-gray-700">Date & Time</th>
                    <th className="text-left p-3 font-medium text-gray-700">Teams</th>
                    <th className="text-left p-3 font-medium text-gray-700">Age Group</th>
                    <th className="text-left p-3 font-medium text-gray-700">Venue</th>
                    <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No games found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredGames.map((game) => (
                      <tr key={game.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{game.eventName}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-900">{new Date(game.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600">{game.time}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{game.homeTeam}</div>
                          <div className="text-sm text-gray-600">vs {game.awayTeam}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">{game.ageGroup}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-gray-900">{game.field}</div>
                          <div className="text-sm text-gray-600">{game.complex}</div>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={
                              game.status === 'completed' ? 'default' :
                              game.status === 'in_progress' ? 'secondary' :
                              game.status === 'cancelled' ? 'destructive' : 'outline'
                            }
                          >
                            {game.status.replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
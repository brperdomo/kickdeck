import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Trophy, Users, Play, Plus, 
  Search, Filter, RefreshCw, Clock
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  teamsCount: number;
  status: 'draft' | 'active' | 'completed';
  hasProgress?: boolean;
  lastModified?: string;
  adminSession?: string;
}

interface TournamentSelectionInterfaceProps {
  onTournamentSelect: (tournamentId: string, mode: 'continue' | 'fresh') => void;
  className?: string;
}

export function TournamentSelectionInterface({ 
  onTournamentSelect, 
  className = '' 
}: TournamentSelectionInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showWithProgress, setShowWithProgress] = useState(false);

  // Fetch tournaments with progress information
  const { data: tournaments, isLoading, refetch } = useQuery({
    queryKey: ['tournaments-with-progress', statusFilter, showWithProgress],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (showWithProgress) params.append('hasProgress', 'true');
      
      const response = await fetch(`/api/admin/tournaments/scheduling?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    }
  });

  const filteredTournaments = tournaments?.filter((tournament: Tournament) =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading tournaments...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="border-[#2E86AB]">
        <CardHeader className="bg-gradient-to-r from-[#2E86AB] to-[#A23B72] text-white">
          <CardTitle className="flex items-center gap-3">
            <Trophy className="h-6 w-6" />
            Tournament Scheduling Management
          </CardTitle>
          <p className="text-blue-100">
            Select a tournament to schedule or continue existing work with session isolation for multiple administrators.
          </p>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tournaments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowWithProgress(!showWithProgress)}
                className={showWithProgress ? 'bg-[#2E86AB] text-white' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                With Progress
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTournaments.map((tournament: Tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-[#2E86AB]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-[#343A40] line-clamp-2">
                    {tournament.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getTournamentStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
                    {tournament.hasProgress && (
                      <Badge variant="secondary" className="bg-[#FFC107] text-black">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-[#343A40]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#2E86AB]" />
                  <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#A23B72]" />
                  <span>{tournament.teamsCount} teams registered</span>
                </div>
                {tournament.lastModified && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Modified {new Date(tournament.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tournament.adminSession && (
                  <div className="text-xs text-[#A23B72] bg-purple-50 p-2 rounded">
                    Active session: {tournament.adminSession}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                {tournament.hasProgress ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onTournamentSelect(tournament.id, 'continue')}
                      className="flex-1 bg-[#28A745] hover:bg-green-600"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTournamentSelect(tournament.id, 'fresh')}
                      className="flex-1 border-[#FFC107] text-[#343A40] hover:bg-amber-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Start Fresh
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onTournamentSelect(tournament.id, 'fresh')}
                    className="w-full bg-[#2E86AB] hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Scheduling
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-[#343A40] mb-2">No tournaments found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || showWithProgress
                ? 'Try adjusting your search or filter criteria.'
                : 'No tournaments available for scheduling.'}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setShowWithProgress(false);
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Admin Session Info */}
      <Alert className="border-[#2E86AB] bg-blue-50">
        <Clock className="h-4 w-4" />
        <AlertDescription className="text-[#343A40]">
          <strong>Session Isolation:</strong> Multiple administrators can work independently on different tournaments. 
          Your progress is saved per session and tournament, preventing conflicts with other admin work.
        </AlertDescription>
      </Alert>
    </div>
  );
}
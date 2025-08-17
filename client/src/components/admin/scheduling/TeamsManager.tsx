import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, Search, Trophy, Calendar, TrendingUp, 
  Eye, RefreshCw, AlertTriangle, Filter, ArrowUpDown
} from 'lucide-react';
import TeamDetail from './TeamDetail';

interface TeamsManagerProps {
  eventId: number;
}

interface TeamData {
  id: number;
  name: string;
  ageGroup: string;
  gender: string;
  flightName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  rank: number;
  status: string;
  nextGameDate?: string;
  coachName?: string;
  totalGames: number;
}

export default function TeamsManager({ eventId }: TeamsManagerProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'rank' | 'games'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['teams-manager', eventId],
    queryFn: async (): Promise<{ teams: TeamData[], ageGroups: string[], genders: string[] }> => {
      const response = await fetch(`/api/admin/events/${eventId}/teams/overview`);
      if (!response.ok) throw new Error('Failed to fetch teams data');
      return response.json();
    },
  });

  // Filter and sort teams
  const filteredAndSortedTeams = React.useMemo(() => {
    if (!teamsData?.teams) return [];

    let filtered = teamsData.teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.coachName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAgeGroup = ageGroupFilter === 'all' || team.ageGroup === ageGroupFilter;
      const matchesGender = genderFilter === 'all' || team.gender === genderFilter;
      
      return matchesSearch && matchesAgeGroup && matchesGender;
    });

    // Sort teams
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'games':
          aValue = a.gamesPlayed;
          bValue = b.gamesPlayed;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [teamsData?.teams, searchTerm, ageGroupFilter, genderFilter, sortBy, sortOrder]);

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
        <p className="text-purple-200">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
        <p className="text-red-200">Failed to load teams data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-400/30">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-purple-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{teamsData?.teams.length || 0}</p>
            <p className="text-sm text-purple-200">Total Teams</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-400/30">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-green-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {teamsData?.teams.reduce((sum, team) => sum + team.gamesPlayed, 0) || 0}
            </p>
            <p className="text-sm text-green-200">Games Played</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-400/30">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 text-blue-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {teamsData?.ageGroups.length || 0}
            </p>
            <p className="text-sm text-blue-200">Age Groups</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border-orange-400/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-orange-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {Math.round((teamsData?.teams.reduce((sum, team) => sum + team.gamesPlayed, 0) || 0) / (teamsData?.teams.length || 1))}
            </p>
            <p className="text-sm text-orange-200">Avg Games/Team</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-black/30 border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-purple-200 mb-1 block">Search Teams</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Team name or coach..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/50 border-purple-400/30 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-purple-200 mb-1 block">Age Group</label>
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="w-full p-2 rounded-md bg-black/50 border border-purple-400/30 text-white"
              >
                <option value="all">All Age Groups</option>
                {teamsData?.ageGroups.map(ageGroup => (
                  <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-purple-200 mb-1 block">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full p-2 rounded-md bg-black/50 border border-purple-400/30 text-white"
              >
                <option value="all">All Genders</option>
                {teamsData?.genders.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-purple-200 mb-1 block">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="w-full p-2 rounded-md bg-black/50 border border-purple-400/30 text-white"
              >
                <option value="rank-asc">Rank (Best First)</option>
                <option value="rank-desc">Rank (Worst First)</option>
                <option value="points-desc">Points (High to Low)</option>
                <option value="points-asc">Points (Low to High)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="games-desc">Games Played (Most)</option>
                <option value="games-asc">Games Played (Least)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <Card className="bg-black/30 border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teams Overview ({filteredAndSortedTeams.length} teams)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-900/20">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleSort('rank')}
                      className="text-purple-200 hover:text-white p-0"
                    >
                      Rank <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleSort('name')}
                      className="text-purple-200 hover:text-white p-0"
                    >
                      Team <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">Age Group</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">Flight</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">Record</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleSort('points')}
                      className="text-purple-200 hover:text-white p-0"
                    >
                      Points <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">GD</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleSort('games')}
                      className="text-purple-200 hover:text-white p-0"
                    >
                      Games <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-purple-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-400/20">
                {filteredAndSortedTeams.map((team) => (
                  <tr 
                    key={team.id} 
                    className="hover:bg-purple-800/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <td className="p-4">
                      <Badge 
                        variant={team.rank <= 3 ? 'default' : 'secondary'}
                        className={team.rank <= 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : ''}
                      >
                        #{team.rank}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{team.name}</p>
                        {team.coachName && (
                          <p className="text-xs text-purple-300">Coach: {team.coachName}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-purple-200">{team.ageGroup}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-cyan-400/50 text-cyan-300">
                        {team.flightName}
                      </Badge>
                    </td>
                    <td className="p-4 text-purple-200">
                      <span className="font-mono">
                        {team.wins}-{team.losses}-{team.ties}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white">{team.points}</span>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${team.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {team.goalDifference >= 0 ? '+' : ''}{team.goalDifference}
                      </span>
                    </td>
                    <td className="p-4 text-purple-200">
                      <span className="font-mono">{team.gamesPlayed}/{team.totalGames}</span>
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamId(team.id);
                        }}
                        className="border-cyan-400/50 text-cyan-300 hover:bg-cyan-900/30"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Team Detail Modal */}
      {selectedTeamId && (
        <TeamDetail 
          teamId={selectedTeamId}
          eventId={eventId}
          onClose={() => setSelectedTeamId(null)}
        />
      )}
    </div>
  );
}
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Check, X, Calendar, Clock, Users, Trophy, Search, Filter, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditableInput } from './EditableInput';

interface FlightConfig {
  id: string;
  divisionName: string;
  startDate: string;
  endDate: string;
  matchCount: number;
  matchTime: number; // Half time length in minutes (will be doubled for total game time)
  breakTime: number; // in minutes
  paddingTime: number; // in minutes
  restPeriod: number; // in minutes - rest time between games for the same team
  totalTime: number; // calculated: (matchTime × 2) + breakTime + paddingTime
  formatName: string;
  teamCount: number;
  ageGroupId: number;
  isConfigured: boolean;
  status: 'scheduled' | 'ready' | 'needs_setup'; // New status field
  scheduledGames: number; // Number of scheduled games
  ageGroup: string;
  gender: string;
  birthYear: string;
  fieldSize: string;
}

interface EditingState {
  id: string | null;
  field: string | null;
  value: string | number;
}

const formatOptions = [
  { value: 'group_of_4', label: '4-Team Single Bracket' },
  { value: 'group_of_6', label: '6-Team Crossover Brackets' },
  { value: 'group_of_8', label: '8-Team Dual Brackets' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
];

const fieldSizeOptions = [
  { value: '3v3', label: '3v3' },
  { value: '4v4', label: '4v4' },
  { value: '5v5', label: '5v5' },
  { value: '7v7', label: '7v7' },
  { value: '9v9', label: '9v9' },
  { value: '11v11', label: '11v11' },
];

export function FlightConfigurationTable({ eventId }: { eventId: string }) {
  const [editing, setEditing] = useState<EditingState>({ id: null, field: null, value: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showReadyOnly, setShowReadyOnly] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allFlights, isLoading } = useQuery({
    queryKey: ['flight-configurations', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!response.ok) throw new Error('Failed to fetch flight configurations');
      const data = await response.json();
      return data as FlightConfig[];
    },
  });

  // Filter and search functionality
  const filteredFlights = useMemo(() => {
    if (!allFlights) return [];
    
    // Filter out flights with no teams first
    let flights = allFlights.filter(flight => flight.teamCount > 0);
    
    // Apply search filter
    if (searchTerm) {
      flights = flights.filter(flight =>
        flight.divisionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.ageGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(flight.birthYear || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.formatName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply ready filter
    if (showReadyOnly) {
      flights = flights.filter(flight => flight.status === 'ready' || flight.status === 'scheduled');
    }
    
    return flights;
  }, [allFlights, searchTerm, showReadyOnly]);

  const readyFlights = useMemo(() => {
    return allFlights?.filter(flight => (flight.status === 'ready' || flight.status === 'scheduled') && flight.teamCount > 0) || [];
  }, [allFlights]);

  const updateFlightMutation = useMutation({
    mutationFn: async ({ flightId, field, value }: { flightId: string; field: string; value: string | number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations/${flightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('Failed to update flight configuration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-configurations', eventId] });
      toast({ title: 'Flight configuration updated successfully' });
      setEditing({ id: null, field: null, value: '' });
    },
    onError: () => {
      toast({ title: 'Failed to update flight configuration', variant: 'destructive' });
    },
  });

  const handleEdit = (flightId: string, field: string, currentValue: string | number) => {
    setEditing({ id: flightId, field, value: currentValue });
  };

  const handleSave = () => {
    if (editing.id && editing.field) {
      updateFlightMutation.mutate({
        flightId: editing.id,
        field: editing.field,
        value: editing.value,
      });
    }
  };

  const handleCancel = () => {
    setEditing({ id: null, field: null, value: '' });
  };

  const calculateTotalTime = (halfTimeLength: number, breakTime: number, paddingTime: number) => {
    // Total time = (Half Time Length × 2) + Break Time + Padding Time
    const fullGameTime = halfTimeLength * 2;
    return fullGameTime + breakTime + paddingTime;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Flight Configuration Overview</CardTitle>
              <p className="text-slate-400 text-sm">
                Showing {filteredFlights.length} flights with teams • {readyFlights.length} ready for scheduling
              </p>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search flights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-slate-700 border-slate-600 !text-white !placeholder-slate-400 focus:bg-slate-600 focus:border-blue-400"
                style={{ 
                  backgroundColor: '#334155', 
                  color: '#ffffff',
                  borderColor: '#475569'
                }}
              />
            </div>
            
            {/* Ready Flights Dropdown */}
            <Select value={showReadyOnly ? "ready" : "all"} onValueChange={(value) => setShowReadyOnly(value === "ready")}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Flights ({filteredFlights.length})</SelectItem>
                <SelectItem value="ready">Ready Only ({readyFlights.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-300 font-medium">DIVISIONS/FLIGHTS</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">FIELD SIZE</TableHead>
                <TableHead className="text-slate-300 font-medium">START DATE</TableHead>
                <TableHead className="text-slate-300 font-medium">END DATE</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">MATCH</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">HALF TIME LENGTH</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">BREAK</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">PADDING</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">REST PERIOD</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">TOTAL TIME</TableHead>
                <TableHead className="text-slate-300 font-medium">FORMAT NAME</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">TEAMS</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">EDIT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-slate-500" />
                      <p>No flights found with teams</p>
                      {searchTerm && (
                        <p className="text-sm">Try adjusting your search term</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFlights.map((flight) => (
                <TableRow key={flight.id} className="border-slate-700 hover:bg-slate-700/30">
                  {/* Division/Flight Name with Birth Year */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-600">
                          {flight.gender} {flight.birthYear} - {flight.divisionName}
                        </Badge>
                        {flight.status === 'scheduled' ? (
                          <Badge variant="outline" className="bg-purple-600/20 text-purple-400 border-purple-600">
                            📅 Scheduled ({flight.scheduledGames || 0} games)
                          </Badge>
                        ) : flight.status === 'ready' ? (
                          <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600">
                            ✓ Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600">
                            ⚠ Needs Setup
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {flight.ageGroup} • {flight.teamCount} teams
                      </div>
                    </div>
                  </TableCell>

                  {/* Field Size */}
                  <TableCell className="text-center">
                    {editing.id === flight.id && editing.field === 'fieldSize' ? (
                      <div className="flex items-center gap-1 justify-center">
                        <Select
                          value={editing.value as string}
                          onValueChange={(value) => setEditing({ ...editing, value })}
                        >
                          <SelectTrigger className="w-20 h-8 bg-slate-800 border-slate-500 text-white focus:bg-slate-700 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldSizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'fieldSize', flight.fieldSize || '7v7')}
                        className="px-2 py-1 bg-slate-700 rounded text-center hover:bg-slate-600 transition-colors text-white font-medium"
                      >
                        {flight.fieldSize || '7v7'}
                      </button>
                    )}
                  </TableCell>

                  {/* Start Date */}
                  <TableCell className="text-slate-300">
                    {editing.id === flight.id && editing.field === 'startDate' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={editing.value as string}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-36 h-8 bg-slate-800 border-slate-500 text-white focus:bg-slate-700 focus:border-blue-400 focus:text-white"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'startDate', flight.startDate)}
                        className="flex items-center gap-1 hover:text-blue-400 transition-colors text-slate-300"
                      >
                        {formatDate(flight.startDate)}
                        <Calendar className="h-3 w-3" />
                      </button>
                    )}
                  </TableCell>

                  {/* End Date */}
                  <TableCell className="text-slate-300">
                    {editing.id === flight.id && editing.field === 'endDate' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={editing.value as string}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-36 h-8 bg-slate-800 border-slate-500 text-white focus:bg-slate-700 focus:border-blue-400 focus:text-white"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'endDate', flight.endDate)}
                        className="flex items-center gap-1 hover:text-blue-400 transition-colors text-slate-300"
                      >
                        {formatDate(flight.endDate)}
                        <Calendar className="h-3 w-3" />
                      </button>
                    )}
                  </TableCell>

                  {/* Match Count */}
                  <TableCell className="text-center">
                    {editing.id === flight.id && editing.field === 'matchCount' ? (
                      <div className="flex items-center gap-1 justify-center">
                        <EditableInput
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 text-center"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'matchCount', flight.matchCount)}
                        className="px-2 py-1 bg-slate-700 rounded text-center hover:bg-slate-600 transition-colors text-white"
                      >
                        {flight.matchCount}
                      </button>
                    )}
                  </TableCell>

                  {/* Half Time Length */}
                  <TableCell className="text-center">
                    {editing.id === flight.id && editing.field === 'matchTime' ? (
                      <div className="flex items-center gap-1 justify-center">
                        <EditableInput
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 text-center"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'matchTime', flight.matchTime)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded hover:bg-slate-600 transition-colors text-white"
                      >
                        {flight.matchTime} min
                        <Clock className="h-3 w-3" />
                      </button>
                    )}
                  </TableCell>

                  {/* Break Time */}
                  <TableCell className="text-center">
                    {editing.id === flight.id && editing.field === 'breakTime' ? (
                      <div className="flex items-center gap-1 justify-center">
                        <EditableInput
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 text-center"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'breakTime', flight.breakTime)}
                        className="px-2 py-1 bg-slate-700 rounded text-center hover:bg-slate-600 transition-colors text-white"
                      >
                        {flight.breakTime} min
                      </button>
                    )}
                  </TableCell>

                  {/* Padding Time */}
                  <TableCell className="text-center">
                    {editing.id === flight.id && editing.field === 'paddingTime' ? (
                      <div className="flex items-center gap-1 justify-center">
                        <EditableInput
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 text-center"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'paddingTime', flight.paddingTime)}
                        className="px-2 py-1 bg-slate-700 rounded text-center hover:bg-slate-600 transition-colors text-white"
                      >
                        {flight.paddingTime} min
                      </button>
                    )}
                  </TableCell>

                  {/* Rest Period */}
                  <TableCell className="text-center">
                    {editing.id === flight.id && editing.field === 'restPeriod' ? (
                      <div className="flex items-center gap-1 justify-center">
                        <EditableInput
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 text-center"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'restPeriod', flight.restPeriod)}
                        className="px-2 py-1 bg-slate-700 rounded text-center hover:bg-slate-600 transition-colors text-white"
                      >
                        {flight.restPeriod} min
                      </button>
                    )}
                  </TableCell>

                  {/* Total Time */}
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600">
                      {calculateTotalTime(flight.matchTime, flight.breakTime, flight.paddingTime)} min
                    </Badge>
                  </TableCell>

                  {/* Format Name */}
                  <TableCell>
                    {editing.id === flight.id && editing.field === 'formatName' ? (
                      <div className="flex items-center gap-1">
                        <Select
                          value={editing.value as string}
                          onValueChange={(value) => setEditing({ ...editing, value })}
                        >
                          <SelectTrigger className="w-36 h-8 bg-slate-800 border-slate-500 text-white focus:bg-slate-700 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {formatOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(flight.id, 'formatName', flight.formatName)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {flight.formatName}
                      </button>
                    )}
                  </TableCell>

                  {/* Team Count - Removed since it's shown in flight name section */}
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                      <Users className="h-3 w-3 mr-1" />
                      {flight.teamCount}
                    </Badge>
                  </TableCell>

                  {/* Edit Button */}
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-slate-600"
                      onClick={() => handleEdit(flight.id, 'formatName', flight.formatName)}
                    >
                      <Pencil className="h-4 w-4 text-slate-400" />
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Check, X, Calendar, Clock, Users, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FlightConfig {
  id: string;
  divisionName: string;
  startDate: string;
  endDate: string;
  matchCount: number;
  matchTime: number; // in minutes
  breakTime: number; // in minutes
  paddingTime: number; // in minutes
  totalTime: number; // calculated
  formatName: string;
  teamCount: number;
  ageGroupId: number;
  isConfigured: boolean;
  ageGroup: string;
  gender: string;
}

interface EditingState {
  id: string | null;
  field: string | null;
  value: string | number;
}

const formatOptions = [
  { value: 'group_of_4', label: 'Group of 4' },
  { value: 'group_of_6', label: 'Group of 6' },
  { value: 'group_of_8', label: 'Group of 8' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
];

export function FlightConfigurationTable({ eventId }: { eventId: string }) {
  const [editing, setEditing] = useState<EditingState>({ id: null, field: null, value: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: flights, isLoading } = useQuery({
    queryKey: ['flight-configurations', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!response.ok) throw new Error('Failed to fetch flight configurations');
      const data = await response.json();
      return data as FlightConfig[];
    },
  });

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

  const calculateTotalTime = (matchTime: number, breakTime: number, paddingTime: number) => {
    return matchTime + breakTime + paddingTime;
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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white text-lg">Flight Configuration Overview</CardTitle>
            <p className="text-slate-400 text-sm">Manage divisions, timing, and format settings</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-300 font-medium">DIVISIONS/FLIGHTS</TableHead>
                <TableHead className="text-slate-300 font-medium">START DATE</TableHead>
                <TableHead className="text-slate-300 font-medium">END DATE</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">MATCH</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">HALF TIME LENGTH</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">BREAK</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">PADDING</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">TOTAL TIME</TableHead>
                <TableHead className="text-slate-300 font-medium">FORMAT NAME</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">TEAMS</TableHead>
                <TableHead className="text-slate-300 font-medium text-center">EDIT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights?.map((flight) => (
                <TableRow key={flight.id} className="border-slate-700 hover:bg-slate-700/30">
                  {/* Division/Flight Name */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-600">
                        {flight.divisionName}
                      </Badge>
                      {flight.isConfigured ? (
                        <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600">
                          ✓ Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600">
                          ⚠ Needs Setup
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Start Date */}
                  <TableCell className="text-slate-300">
                    {editing.id === flight.id && editing.field === 'startDate' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={editing.value as string}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-36 h-8 bg-slate-700 border-slate-600 text-white"
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
                          className="w-36 h-8 bg-slate-700 border-slate-600 text-white"
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
                        <Input
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 bg-slate-700 border-slate-600 text-white text-center"
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
                        <Input
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 bg-slate-700 border-slate-600 text-white text-center"
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
                        <Input
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 bg-slate-700 border-slate-600 text-white text-center"
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
                        <Input
                          type="number"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 bg-slate-700 border-slate-600 text-white text-center"
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
                          <SelectTrigger className="w-36 h-8 bg-slate-700 border-slate-600 text-white">
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

                  {/* Team Count */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300">{flight.teamCount}</span>
                    </div>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
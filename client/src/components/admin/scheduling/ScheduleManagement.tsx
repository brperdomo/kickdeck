import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Clock, MapPin, Move, Calendar, Users, Timer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatGameTimeWithTimezone, getFieldTimezone, getTimezoneAbbreviation } from '@/utils/timezone';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Game {
  id: number;
  gameNumber: number;
  bracket: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  awayTeamId?: number;
  startTime: string;
  endTime: string;
  fieldId?: number;
  fieldName?: string;
  complexName?: string;
  fieldSize?: string;
}

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  hasLights: boolean;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

interface Complex {
  id: number;
  name: string;
  address: string;
  openTime?: string;
  closeTime?: string;
  timezone?: string;
  fields: Field[];
}

interface Conflict {
  type: 'coach_conflict' | 'time_conflict' | 'field_conflict';
  gameId?: number;
  games?: number[];
  coach?: string;
  teams?: number[];
  message: string;
}

interface ScheduleManagementProps {
  eventId: string;
}

export default function ScheduleManagement({ eventId }: ScheduleManagementProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showGameEditor, setShowGameEditor] = useState(false);
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  
  const queryClient = useQueryClient();

  // Enable drag functionality after component mount to avoid SSR issues
  useEffect(() => {
    setIsDragEnabled(true);
  }, []);

  // Handle drag and drop operations for schedule adjustments
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Get the game that was dragged
    const gameId = parseInt(draggableId.replace('game-', ''));
    const game = games?.find((g: Game) => g.id === gameId);
    
    if (!game) return;

    // If dropped on a field, update the game's field assignment
    if (destination.droppableId.startsWith('field-')) {
      const fieldId = parseInt(destination.droppableId.replace('field-', ''));
      const field = complexes?.flatMap((c: any) => c.fields)?.find((f: any) => f.id === fieldId);
      const complex = complexes?.find((c: any) => c.fields.some((f: any) => f.id === fieldId));
      
      if (field && complex) {
        updateGameMutation.mutate({
          gameId: game.id,
          fieldId,
          complexId: complex.id,
          startTime: game.startTime,
          endTime: game.endTime
        });
      }
    }
  };

  // Function to get age group color coding
  const getAgeGroupColor = (ageGroup: string) => {
    const colors = {
      'U17': 'bg-blue-100 border-blue-300 text-blue-800',
      'U16': 'bg-green-100 border-green-300 text-green-800',
      'U15': 'bg-purple-100 border-purple-300 text-purple-800',
      'U14': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'U13': 'bg-red-100 border-red-300 text-red-800',
      'U12': 'bg-indigo-100 border-indigo-300 text-indigo-800',
      'U11': 'bg-pink-100 border-pink-300 text-pink-800',
      'U10': 'bg-orange-100 border-orange-300 text-orange-800',
    };
    
    const ageKey = Object.keys(colors).find(age => ageGroup.includes(age));
    return ageKey ? colors[ageKey as keyof typeof colors] : 'bg-gray-100 border-gray-300 text-gray-800';
  };

  // Fetch current schedule
  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['schedule-games', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule`);
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      console.log('Schedule Management - Fetched games data:', data);
      return data;
    }
  });

  // Fetch available complexes and fields
  const { data: complexesData, isLoading: complexesLoading } = useQuery({
    queryKey: ['schedule-complexes', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schedule/complexes/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch complexes');
      const data = await response.json();
      console.log('Schedule Management - Fetched complexes data:', data);
      return data;
    }
  });

  // Check for conflicts
  const checkConflictsMutation = useMutation({
    mutationFn: async (gameSchedule: Game[]) => {
      const response = await fetch('/api/admin/schedule/conflicts/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, gameSchedule })
      });
      if (!response.ok) throw new Error('Failed to check conflicts');
      return response.json();
    },
    onSuccess: (data) => {
      setConflicts(data.conflicts || []);
      if (data.conflicts?.length > 0) {
        setShowConflicts(true);
      }
    }
  });

  // Update game field assignment
  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, fieldId, complexId, startTime, endTime }: {
      gameId: number;
      fieldId: number;
      complexId: number;
      startTime: string;
      endTime: string;
    }) => {
      const response = await fetch(`/api/admin/schedule/games/${gameId}/field`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId, complexId, startTime, endTime })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update game');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-games', eventId] });
      setSelectedGame(null);
    }
  });

  // Handle game editing
  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setShowGameEditor(true);
    
    if (game.fieldId) {
      setSelectedField(game.fieldId.toString());
    }
    
    if (game.startTime) {
      const gameTime = new Date(game.startTime);
      const timeSlot = `${gameTime.getHours().toString().padStart(2, '0')}:00`;
      setSelectedTimeSlot(timeSlot);
    }
  };

  const handleGameUpdate = () => {
    if (!selectedGame || !selectedField || !selectedTimeSlot) return;

    const fieldId = parseInt(selectedField);
    const field = complexesData?.complexes
      ?.flatMap((c: Complex) => c.fields)
      ?.find((f: Field) => f.id === fieldId);
    
    const complex = complexesData?.complexes
      ?.find((c: Complex) => c.fields.some((f: Field) => f.id === fieldId));

    if (!field || !complex) return;

    // Calculate new start/end times based on time slot
    const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2); // 2-hour games

    updateGameMutation.mutate({
      gameId: selectedGame.id,
      fieldId,
      complexId: complex.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });
    
    setShowGameEditor(false);
    setSelectedGame(null);
  };

  if (gamesLoading || complexesLoading) {
    return <div className="flex justify-center p-8">Loading schedule management...</div>;
  }

  const games = gamesData?.games || [];
  const complexes = complexesData?.complexes || [];

  // SCHEDULE DEBUG: Log the raw data structure
  console.log("SCHEDULE DEBUG - Raw games data:", gamesData);
  console.log("SCHEDULE DEBUG - Games array:", games);
  console.log("SCHEDULE DEBUG - Games count:", games.length);
  console.log("SCHEDULE DEBUG - First game structure:", games[0]);
  console.log("SCHEDULE DEBUG - Complexes data:", complexes);

  // Group games by date and get time slots for multi-day display
  const getGamesByDate = () => {
    const gamesByDate = new Map();
    
    console.log('DATE GROUPING DEBUG - Processing games:', games.length);
    
    games.forEach((game, index) => {
      console.log(`Game ${index + 1}:`, {
        id: game.id,
        gameNumber: game.gameNumber,
        startTime: game.startTime,
        rawStartTime: game.startTime
      });
      
      if (game.startTime) {
        // Parse the UTC time and convert to Pacific Time
        const gameTime = new Date(game.startTime);
        console.log(`Game ${index + 1} parsed date:`, gameTime);
        
        // Get the date in Pacific Time (venue timezone)
        const pacificDate = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(gameTime);
        
        console.log(`Game ${index + 1} Pacific date:`, pacificDate);
        
        if (!gamesByDate.has(pacificDate)) {
          gamesByDate.set(pacificDate, []);
        }
        gamesByDate.get(pacificDate).push(game);
      } else {
        console.log(`Game ${index + 1} has no startTime`);
      }
    });
    
    console.log('Final gamesByDate:', Array.from(gamesByDate.entries()));
    return gamesByDate;
  };

  // Generate time slots based on actual game times to ensure all games show up
  const generateTimeSlots = () => {
    const slots = [];
    
    // Get unique start times from actual games using Pacific Time
    const gameStartTimes = games
      .filter(game => game.startTime)
      .map(game => {
        const gameTime = new Date(game.startTime);
        // Get exact time in Pacific Time (HH:MM format)
        const pacificTime = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(gameTime);
        return pacificTime;
      })
      .filter((time, index, arr) => arr.indexOf(time) === index)
      .sort();
    
    console.log('Actual game start times (Pacific Time):', gameStartTimes);
    
    // If we have games, use their actual start times
    if (gameStartTimes.length > 0) {
      slots.push(...gameStartTimes);
    } else {
      // Fallback to standard business hours
      for (let hour = 8; hour <= 18; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        slots.push(timeStr);
      }
    }
    
    console.log('Generated time slots:', slots);
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const gamesByDate = getGamesByDate();
  
  // Debug: Show key data to identify why games aren't displaying
  console.log('SCHEDULE DEBUG:', {
    gamesCount: games.length,
    gamesByDate: Array.from(gamesByDate.entries()),
    firstGame: games[0] ? {
      id: games[0].id,
      fieldId: games[0].fieldId,
      startTime: games[0].startTime,
      gameNumber: games[0].gameNumber
    } : null,
    fieldIds: complexes.flatMap(c => c.fields.map(f => f.id)),
    timeSlots: timeSlots
  });

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Schedule Management</h2>
          <p className="text-gray-600">
            {games.length > 0 
              ? "Drag games between time slots and fields to adjust schedule"
              : "Generate a schedule first to see games that can be rearranged"
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          {games.length === 0 ? (
            <Button
              onClick={() => {
                // Navigate to schedule builder
                window.location.href = `/admin/events/${eventId}/schedule-builder`;
              }}
              size="lg"
            >
              Generate Schedule
            </Button>
          ) : (
            <>
              <Button
                onClick={() => checkConflictsMutation.mutate(games)}
                variant="outline"
                disabled={checkConflictsMutation.isPending}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Check Conflicts
              </Button>
              
              <Button
                onClick={() => setShowConflicts(true)}
                variant={conflicts.length > 0 ? "destructive" : "secondary"}
              >
                {conflicts.length > 0 ? `${conflicts.length} Conflicts` : 'No Conflicts'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Complex and Field Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available Complexes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complexes.length}</div>
            <div className="text-xs text-gray-500">
              {complexesData?.summary?.totalFields || 0} total fields
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Field Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              {Object.entries(complexesData?.summary?.fieldSizes || {}).map(([size, count]) => (
                <div key={size} className="flex justify-between">
                  <span>{size}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{games.length}</div>
            <div className="text-xs text-gray-500">
              {games.filter((g: Game) => g.fieldId).length} assigned
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State when no games exist */}
      {games.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No Games Generated Yet</h3>
                <p className="text-gray-600 mt-2">
                  To manage and arrange game schedules, you first need to generate games from your tournament brackets.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    window.location.href = `/admin/events/${eventId}/schedule-builder`;
                  }}
                  size="lg"
                >
                  Go to Schedule Builder
                </Button>
                <p className="text-sm text-gray-500">
                  Complete your tournament setup: Flight Teams → Create Brackets → Generate Games
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Schedule Grid - Click to Edit */}
      {games.length > 0 && (
        <div className="space-y-6">
          {/* Assigned Games by Date */}
          {Array.from(gamesByDate.entries()).map(([date, dateGames]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <p className="text-sm text-gray-600">{dateGames.length} games scheduled</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {/* Proper table layout with time column on left */}
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr>
                        <th className="font-semibold text-sm p-3 border text-left bg-gray-50">Time</th>
                        {/* Only show fields that have games assigned to them for this date */}
                        {complexes.flatMap((complex: Complex) => complex.fields)
                          .filter((field: Field) => dateGames.some((game: Game) => game.fieldId === field.id))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((field: Field) => (
                          <th key={field.id} className="font-semibold text-sm text-center p-3 border bg-gray-50">
                            <div>{field.name}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {field.fieldSize}
                            </Badge>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((timeSlot) => (
                        <tr key={timeSlot}>
                          <td className="text-sm py-4 px-3 font-medium border bg-gray-50 whitespace-nowrap">
                            {timeSlot} {getTimezoneAbbreviation('America/Los_Angeles')}
                          </td>
                          {/* Only show fields that have games assigned for this date, sorted for consistent column alignment */}
                          {complexes.flatMap((complex: Complex) => complex.fields)
                            .filter((field: Field) => dateGames.some((game: Game) => game.fieldId === field.id))
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((field: Field) => {
                            const assignedGame = dateGames.find((game: Game) => {
                              console.log(`GAME MATCHING DEBUG - Checking game ${game.gameNumber}:`, {
                                gameFieldId: game.fieldId,
                                targetFieldId: field.id,
                                gameStartTime: game.startTime,
                                timeSlot: timeSlot
                              });
                              
                              if (game.fieldId !== field.id) {
                                console.log(`Game ${game.gameNumber} field mismatch: ${game.fieldId} !== ${field.id}`);
                                return false;
                              }
                              
                              // Check if game has startTime data
                              if (!game.startTime) {
                                console.log(`Game ${game.gameNumber} has no startTime data`);
                                return false;
                              }
                              
                              // Get exact time from game start time in Pacific Time
                              const gameTime = new Date(game.startTime);
                              const gameTimeStr = new Intl.DateTimeFormat('en-US', {
                                timeZone: 'America/Los_Angeles',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              }).format(gameTime);
                              
                              console.log(`Field ${field.id}: Game ${game.gameNumber} time ${gameTimeStr} (PT) vs slot time ${timeSlot}`);
                              
                              const match = gameTimeStr === timeSlot;
                              if (match) {
                                console.log(`MATCH FOUND: Game ${game.gameNumber} matches time slot ${timeSlot} on field ${field.id}`);
                              }
                              
                              return match;
                            });

                            return (
                              <td key={`field-${field.id}-${timeSlot}`} className="p-2 border">
                                <div className="min-h-[80px] border-2 border-dashed border-gray-200 bg-gray-50 rounded-lg">
                                  {assignedGame ? (
                                    <div
                                      className="p-2 bg-white border rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow h-full"
                                      onClick={() => handleGameClick(assignedGame)}
                                    >
                                      <div className="text-xs font-semibold">
                                        Game {assignedGame.gameNumber}
                                      </div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div>
                                          {typeof assignedGame.homeTeam === 'object' ? (assignedGame.homeTeam?.name || 'Team') : String(assignedGame.homeTeam || 'Team')}
                                          {assignedGame.homeTeamId && (
                                            <span className="text-blue-600 font-mono ml-1">(#{assignedGame.homeTeamId})</span>
                                          )}
                                        </div>
                                        <div className="text-center">vs</div>
                                        <div>
                                          {typeof assignedGame.awayTeam === 'object' ? (assignedGame.awayTeam?.name || 'Team') : String(assignedGame.awayTeam || 'Team')}
                                          {assignedGame.awayTeamId && (
                                            <span className="text-blue-600 font-mono ml-1">(#{assignedGame.awayTeamId})</span>
                                          )}
                                        </div>
                                      </div>
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        {assignedGame.bracket}
                                      </Badge>
                                      <div className="text-xs text-blue-600 mt-1 flex items-center">
                                        <Move className="h-3 w-3 mr-1" />
                                        Click to edit
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-gray-500">
                                      Available
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Unassigned Games */}
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Games</CardTitle>
              <p className="text-sm text-gray-600">Click on games to assign them to time slots and fields</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {games
                  .filter((game: Game) => !game.fieldId)
                  .map((game: Game) => (
                    <div
                      key={game.id}
                      className="p-3 bg-white border rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleGameClick(game)}
                    >
                      <div className="font-semibold">Game {game.gameNumber}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          {typeof game.homeTeam === 'object' ? (game.homeTeam?.name || 'Team') : String(game.homeTeam || 'Team')}
                          {game.homeTeamId && (
                            <span className="text-blue-600 font-mono ml-1">(#{game.homeTeamId})</span>
                          )}
                        </div>
                        <div className="text-center">vs</div>
                        <div>
                          {typeof game.awayTeam === 'object' ? (game.awayTeam?.name || 'Team') : String(game.awayTeam || 'Team')}
                          {game.awayTeamId && (
                            <span className="text-blue-600 font-mono ml-1">(#{game.awayTeamId})</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {game.bracket}
                      </Badge>
                      <div className="text-xs text-blue-600 mt-2 flex items-center">
                        <Move className="h-3 w-3 mr-1" />
                        Click to assign
                      </div>
                    </div>
                  ))}
              </div>
              
              {games.filter((game: Game) => !game.fieldId).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  All games have been assigned to fields and time slots
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Editor Dialog */}
      <Dialog open={showGameEditor} onOpenChange={setShowGameEditor}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedGame ? `Edit Game ${selectedGame.gameNumber}` : 'Edit Game'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGame && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold space-y-1">
                  <div>
                    {typeof selectedGame.homeTeam === 'object' ? (selectedGame.homeTeam?.name || 'Team') : String(selectedGame.homeTeam || 'Team')}
                    {selectedGame.homeTeamId && (
                      <span className="text-blue-600 font-mono ml-1">(#{selectedGame.homeTeamId})</span>
                    )}
                  </div>
                  <div className="text-center text-sm">vs</div>
                  <div>
                    {typeof selectedGame.awayTeam === 'object' ? (selectedGame.awayTeam?.name || 'Team') : String(selectedGame.awayTeam || 'Team')}
                    {selectedGame.awayTeamId && (
                      <span className="text-blue-600 font-mono ml-1">(#{selectedGame.awayTeamId})</span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="mt-1">{selectedGame.bracket}</Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Field Assignment</label>
                  <Select value={selectedField} onValueChange={setSelectedField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {complexes.flatMap((complex: Complex) => 
                        complex.fields.map((field: Field) => (
                          <SelectItem key={field.id} value={field.id.toString()}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{complex.name} - {field.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {field.fieldSize}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Time Slot</label>
                  <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => {
                        // Get timezone from the selected field's complex
                        const fieldComplexTimezone = selectedField 
                          ? complexes.find(c => c.fields.some(f => f.id.toString() === selectedField))?.timezone 
                          : 'America/New_York';
                        const timezoneAbbr = getTimezoneAbbreviation(fieldComplexTimezone);
                        const endHour = (parseInt(slot.split(':')[0]) + 2).toString().padStart(2, '0');
                        
                        return (
                          <SelectItem key={slot} value={slot}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{slot} - {endHour}:00 {timezoneAbbr}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowGameEditor(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGameUpdate}
                  disabled={!selectedField || !selectedTimeSlot || updateGameMutation.isPending}
                >
                  {updateGameMutation.isPending ? 'Updating...' : 'Update Game'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conflicts Dialog */}
      <Dialog open={showConflicts} onOpenChange={setShowConflicts}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Conflicts</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {conflicts.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>No conflicts detected in current schedule</span>
              </div>
            ) : (
              conflicts.map((conflict, index) => (
                <Alert key={index} className="border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <div className="font-semibold capitalize">
                      {conflict.type.replace('_', ' ')} Conflict
                    </div>
                    <div className="text-sm">{conflict.message}</div>
                    {conflict.coach && (
                      <Badge variant="destructive" className="mt-1">
                        Coach: {conflict.coach}
                      </Badge>
                    )}
                  </div>
                </Alert>
              ))
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConflicts(false)}>
              Close
            </Button>
            {conflicts.length > 0 && (
              <Button onClick={() => {
                // Implement auto-resolve functionality
                console.log('Auto-resolving conflicts...');
              }}>
                Auto-Resolve
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
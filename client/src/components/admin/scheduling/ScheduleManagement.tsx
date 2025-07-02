import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Clock, MapPin, Move } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Game {
  id: number;
  gameNumber: number;
  bracket: string;
  homeTeam: string;
  awayTeam: string;
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
  
  const queryClient = useQueryClient();

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

  // Generate time slots based on actual field opening hours and game data
  const generateTimeSlots = () => {
    const slots = [];
    
    // Start from field opening time (8 AM for Galway Downs)
    const startHour = 8;
    const endHour = 22; // 10 PM (22:00)
    
    // Generate hourly slots to accommodate different game lengths
    for (let hour = startHour; hour < endHour; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeStr);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (gamesLoading || complexesLoading) {
    return <div className="flex justify-center p-8">Loading schedule management...</div>;
  }

  const games = gamesData?.games || [];
  const complexes = complexesData?.complexes || [];
  
  console.log('Schedule Management - Games array:', games);
  console.log('Schedule Management - Games length:', games.length);
  console.log('Schedule Management - Complexes array:', complexes);

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
          {/* Assigned Games by Complex */}
          {complexes.map((complex: Complex) => (
            <Card key={complex.id}>
              <CardHeader>
                <CardTitle className="text-lg">{complex.name}</CardTitle>
                <p className="text-sm text-gray-600">{complex.address}</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                    {/* Time headers */}
                    <div className="font-semibold text-sm">Time</div>
                    {complex.fields.map((field: Field) => (
                      <div key={field.id} className="font-semibold text-sm text-center">
                        <div>{field.name}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {field.fieldSize}
                        </Badge>
                      </div>
                    ))}
                    
                    {/* Time slots with games */}
                    {timeSlots.map((timeSlot) => (
                      <React.Fragment key={timeSlot}>
                        <div className="text-sm py-2 font-medium">{timeSlot}</div>
                        {complex.fields.map((field: Field) => {
                          const assignedGame = games.find((game: Game) => {
                            if (game.fieldId !== field.id) return false;
                            // Handle both ISO strings and simple date strings
                            let gameHour;
                            if (game.startTime.includes('T')) {
                              // New format: YYYY-MM-DDTHH:MM:SS
                              const timePart = game.startTime.split('T')[1];
                              gameHour = parseInt(timePart.split(':')[0]);
                            } else {
                              // Legacy format: full ISO string
                              const gameTime = new Date(game.startTime);
                              gameHour = gameTime.getHours();
                            }
                            const slotTime = `${gameHour.toString().padStart(2, '0')}:00`;
                            return slotTime === timeSlot;
                          });

                          return (
                            <div
                              key={`field-${field.id}-${timeSlot}`}
                              className="min-h-[80px] p-2 border-2 border-dashed border-gray-200 bg-gray-50 rounded-lg"
                            >
                              {assignedGame ? (
                                <div
                                  className="p-2 bg-white border rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => handleGameClick(assignedGame)}
                                >
                                  <div className="text-xs font-semibold">
                                    Game {assignedGame.gameNumber}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {typeof assignedGame.homeTeam === 'object' ? assignedGame.homeTeam?.name || 'Team' : assignedGame.homeTeam} vs {typeof assignedGame.awayTeam === 'object' ? assignedGame.awayTeam?.name || 'Team' : assignedGame.awayTeam}
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
                                <div className="text-xs text-gray-400 text-center py-4">
                                  Available
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
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
                      <div className="text-sm text-gray-600">
                        {game.homeTeam} vs {game.awayTeam}
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
                <div className="font-semibold">{selectedGame.homeTeam} vs {selectedGame.awayTeam}</div>
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
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{slot} - {(parseInt(slot.split(':')[0]) + 2).toString().padStart(2, '0')}:00</span>
                          </div>
                        </SelectItem>
                      ))}
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
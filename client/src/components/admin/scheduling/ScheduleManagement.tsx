import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
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
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  
  const queryClient = useQueryClient();

  // Enable drag after component mounts to avoid SSR issues
  useEffect(() => {
    setIsDragEnabled(true);
  }, []);

  // Fetch current schedule
  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['schedule-games', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/games/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    }
  });

  // Fetch available complexes and fields
  const { data: complexesData, isLoading: complexesLoading } = useQuery({
    queryKey: ['schedule-complexes', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schedule/complexes/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json();
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

  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const gameId = parseInt(draggableId.split('-')[1]);
    const game = gamesData?.games?.find((g: Game) => g.id === gameId);
    
    if (!game) return;

    // Parse destination (format: "field-{fieldId}-{timeSlot}")
    const [, fieldIdStr, timeSlot] = destination.droppableId.split('-');
    const fieldId = parseInt(fieldIdStr);
    
    const field = complexesData?.complexes
      ?.flatMap((c: Complex) => c.fields)
      ?.find((f: Field) => f.id === fieldId);
    
    const complex = complexesData?.complexes
      ?.find((c: Complex) => c.fields.some((f: Field) => f.id === fieldId));

    if (!field || !complex) return;

    // Calculate new start/end times based on time slot
    const [startHour, startMinute] = timeSlot.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2); // 2-hour games

    updateGameMutation.mutate({
      gameId,
      fieldId,
      complexId: complex.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });
  };

  // Generate time slots based on actual field opening hours and game data
  const generateTimeSlots = () => {
    const slots = [];
    
    // Start from field opening time (8 AM for Galway Downs)
    const startHour = 8;
    const endHour = 20; // 8 PM
    
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

      {/* Drag and Drop Schedule Grid */}
      {isDragEnabled ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6">
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
                    
                    {/* Time slots and drop zones */}
                    {timeSlots.map((timeSlot) => (
                      <React.Fragment key={timeSlot}>
                        <div className="text-sm py-2 font-medium">{timeSlot}</div>
                        {complex.fields.map((field: Field) => (
                          <Droppable
                            key={`field-${field.id}-${timeSlot}`}
                            droppableId={`field-${field.id}-${timeSlot}`}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`
                                  min-h-[80px] p-2 border-2 border-dashed rounded-lg
                                  ${snapshot.isDraggingOver 
                                    ? 'border-blue-400 bg-blue-50' 
                                    : 'border-gray-200 bg-gray-50'
                                  }
                                `}
                              >
                                {/* Find game assigned to this field and time */}
                                {games
                                  .filter((game: Game) => {
                                    if (game.fieldId !== field.id) return false;
                                    const gameTime = new Date(game.startTime);
                                    const slotTime = `${gameTime.getHours().toString().padStart(2, '0')}:00`;
                                    return slotTime === timeSlot;
                                  })
                                  .map((game: Game, index: number) => (
                                    <Draggable
                                      key={`game-${game.id}`}
                                      draggableId={`game-${game.id}`}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`
                                            p-2 bg-white border rounded shadow-sm cursor-move
                                            ${snapshot.isDragging ? 'rotate-3 shadow-lg' : ''}
                                          `}
                                        >
                                          <div className="text-xs font-semibold">
                                            Game {game.gameNumber}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {game.homeTeam} vs {game.awayTeam}
                                          </div>
                                          <Badge variant="secondary" className="text-xs mt-1">
                                            {game.bracket}
                                          </Badge>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>

          {/* Unassigned Games */}
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Games</CardTitle>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="unassigned-games">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 md:grid-cols-3 gap-2"
                  >
                    {games
                      .filter((game: Game) => !game.fieldId)
                      .map((game: Game, index: number) => (
                        <Draggable
                          key={`game-${game.id}`}
                          draggableId={`game-${game.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                p-3 bg-white border rounded-lg shadow cursor-move
                                ${snapshot.isDragging ? 'rotate-2 shadow-xl' : ''}
                              `}
                            >
                              <div className="font-semibold">Game {game.gameNumber}</div>
                              <div className="text-sm text-gray-600">
                                {game.homeTeam} vs {game.awayTeam}
                              </div>
                              <Badge variant="outline" className="mt-1">
                                {game.bracket}
                              </Badge>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </DragDropContext>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-8 text-gray-500">
            Loading scheduling interface...
          </div>
        </div>
      )}

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
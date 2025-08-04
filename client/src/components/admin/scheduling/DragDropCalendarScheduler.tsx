import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Edit3, Save, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Game {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  ageGroup: string;
  startTime: string;
  endTime: string;
  fieldName: string;
  fieldId: number;
  status: string;
  duration: number;
  homeTeamCoach?: string;
  awayTeamCoach?: string;
}

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  complexName: string;
  isOpen: boolean;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  games: Game[];
}

interface DragDropCalendarSchedulerProps {
  eventId: string;
}

export default function DragDropCalendarScheduler({ eventId }: DragDropCalendarSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('2025-08-16'); // Use actual tournament start date
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [coachColorMap, setCoachColorMap] = useState<Map<string, string>>(new Map());
  const queryClient = useQueryClient();

  // Fetch games and fields data from schedule calendar API (bypass auth for now)
  const { data: gamesData, isLoading: gamesLoading, error } = useQuery({
    queryKey: ['/api/schedule-calendar', eventId, 'schedule-calendar'],
    queryFn: async () => {
      console.log('[Calendar] Fetching real schedule calendar data for event:', eventId);
      const response = await fetch(`/api/schedule-calendar/${eventId}/schedule-calendar`);
      console.log('[Calendar] Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('[Calendar] Error response:', errorText);
        throw new Error(`Failed to fetch schedule calendar data: ${response.status}`);
      }
      const data = await response.json();
      console.log('[Calendar] Received schedule calendar data:', data);
      
      // Data is already processed by the API, return both games and fields
      const processedGames = data.games?.map((game: any) => ({
        id: game.id,
        homeTeamName: game.homeTeamName,
        awayTeamName: game.awayTeamName,
        ageGroup: game.ageGroup,
        startTime: game.startTime,
        endTime: game.endTime,
        fieldName: game.fieldName,
        fieldId: game.fieldId,
        status: game.status,
        duration: game.duration,
        homeTeamCoach: game.homeTeamCoach,
        awayTeamCoach: game.awayTeamCoach
      })) || [];

      const processedFields = data.fields?.map((field: any) => ({
        id: field.id,
        name: field.name,
        fieldSize: field.fieldSize,
        complexName: field.complexName,
        isOpen: true
      })) || [];
      
      return { games: processedGames, fields: processedFields, success: true };
    },
    retry: false
  });

  // Fields data comes from the same API call as games data
  const fieldsData = gamesData?.fields ? { fields: gamesData.fields, success: true } : null;
  const fieldsError: Error | null = null;

  // Color palette for coach coding
  const coachColors = [
    'bg-purple-100 border-purple-400 text-purple-800', // Purple
    'bg-blue-100 border-blue-400 text-blue-800',       // Blue
    'bg-green-100 border-green-400 text-green-800',    // Green
    'bg-orange-100 border-orange-400 text-orange-800', // Orange
    'bg-pink-100 border-pink-400 text-pink-800',       // Pink
    'bg-indigo-100 border-indigo-400 text-indigo-800', // Indigo
    'bg-yellow-100 border-yellow-400 text-yellow-800', // Yellow
    'bg-red-100 border-red-400 text-red-800',          // Red
    'bg-teal-100 border-teal-400 text-teal-800',       // Teal
    'bg-cyan-100 border-cyan-400 text-cyan-800',       // Cyan
  ];

  // Function to get color for a coach (stable, non-mutating)
  const getCoachColor = (coachName: string): string => {
    if (!coachName) return 'bg-gray-100 border-gray-400 text-gray-800';
    
    // Return existing color from stable map, or default if not found
    return coachColorMap.get(coachName) || 'bg-gray-100 border-gray-400 text-gray-800';
  };

  // Function to get primary coach for a game (for color coding)
  const getPrimaryCoach = (game: Game): string => {
    return game.homeTeamCoach || game.awayTeamCoach || `Team-${game.homeTeamName}`;
  };

  // Conflict detection functions
  const detectConflicts = (game: Game, timeSlot: TimeSlot): string[] => {
    const conflicts: string[] = [];
    
    // Check for coach conflicts (same coach, same time, different games)
    const sameTimeGames = timeSlots
      .find(slot => slot.startTime === timeSlot.startTime)?.games || [];
    
    const gameCoach = getPrimaryCoach(game);
    const conflictingCoachGames = sameTimeGames.filter(g => 
      g.id !== game.id && getPrimaryCoach(g) === gameCoach
    );
    
    if (conflictingCoachGames.length > 0) {
      conflicts.push(`COACH CONFLICT: ${gameCoach} has ${conflictingCoachGames.length + 1} games at ${timeSlot.startTime}`);
    }

    // Check for team rest period conflicts (same team playing within 90 minutes)
    const teamNames = [game.homeTeamName, game.awayTeamName];
    const currentSlotIndex = timeSlots.findIndex(slot => slot.startTime === timeSlot.startTime);
    
    // Check previous and next time slots (90-minute intervals)
    [currentSlotIndex - 1, currentSlotIndex + 1].forEach(checkIndex => {
      if (checkIndex >= 0 && checkIndex < timeSlots.length) {
        const checkSlot = timeSlots[checkIndex];
        const conflictingTeamGames = checkSlot.games.filter(g => 
          g.id !== game.id && (
            teamNames.includes(g.homeTeamName) || 
            teamNames.includes(g.awayTeamName)
          )
        );
        
        if (conflictingTeamGames.length > 0) {
          const conflictTime = checkIndex < currentSlotIndex ? 'previous' : 'next';
          conflicts.push(`TEAM REST: Teams have back-to-back games (${conflictTime} slot)`);
        }
      }
    });

    return conflicts;
  };

  // Get conflict severity for styling
  const getConflictSeverity = (conflicts: string[]): 'none' | 'warning' | 'error' => {
    if (conflicts.some(c => c.includes('COACH CONFLICT'))) return 'error';
    if (conflicts.some(c => c.includes('TEAM REST'))) return 'warning';
    return 'none';
  };

  // Get conflict styling classes
  const getConflictStyling = (severity: 'none' | 'warning' | 'error'): string => {
    switch (severity) {
      case 'error':
        return 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 text-yellow-900 ring-2 ring-yellow-200';
      default:
        return '';
    }
  };

  // Swap mutation for handling game position swaps
  const swapGamesMutation = useMutation({
    mutationFn: async ({ game1Id, game2Id, game1Field, game1Time, game2Field, game2Time }: {
      game1Id: number;
      game2Id: number;
      game1Field: number;
      game1Time: string;
      game2Field: number;
      game2Time: string;
    }) => {
      // Update both games simultaneously
      const response1 = await fetch(`/api/admin/games/${game1Id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fieldId: game2Field, startTime: game2Time })
      });
      
      const response2 = await fetch(`/api/admin/games/${game2Id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fieldId: game1Field, startTime: game1Time })
      });

      if (!response1.ok || !response2.ok) {
        throw new Error('Failed to swap games');
      }

      return { game1: await response1.json(), game2: await response2.json() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-calendar', eventId, 'schedule-calendar'] });
      toast({ title: 'Games swapped successfully' });
    },
    onError: (error) => {
      console.error('[Game Swap] Error:', error);
      toast({ 
        title: 'Failed to swap games', 
        description: error.message || 'Please check the console for details', 
        variant: 'destructive' 
      });
    }
  });

  // Update game assignment mutation
  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, fieldId, startTime }: { gameId: number; fieldId: number; startTime: string }) => {
      const response = await fetch(`/api/admin/games/${gameId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fieldId, startTime })
      });
      if (!response.ok) throw new Error('Failed to update game');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant schedule queries
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-calendar', eventId, 'schedule-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule-viewer'] });
      toast({ title: 'Game rescheduled successfully' });
    },
    onError: (error) => {
      console.error('[Drag Drop] Reschedule error:', error);
      toast({ 
        title: 'Failed to reschedule game', 
        description: error.message || 'Please check the console for details', 
        variant: 'destructive' 
      });
    }
  });

  // Generate time slots (8:00 AM to 8:00 PM, 1.5 hour intervals)
  useEffect(() => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 20;
    const intervalMinutes = 90;

    for (let hour = startHour; hour < endHour; hour += intervalMinutes / 60) {
      const wholeHour = Math.floor(hour);
      const minutes = (hour % 1) * 60;
      const startTime = `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const endHour = hour + intervalMinutes / 60;
      const endWholeHour = Math.floor(endHour);
      const endMinutes = (endHour % 1) * 60;
      const endTimeStr = `${endWholeHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      slots.push({
        id: `${selectedDate}-${startTime}`,
        startTime,
        endTime: endTimeStr,
        games: []
      });
    }
    setTimeSlots(slots);
  }, [selectedDate]);

  // Initialize coach colors when games data first loads
  useEffect(() => {
    if (gamesData?.games && coachColorMap.size === 0) {
      console.log('[Coach Colors] Initializing coach color assignments');
      const newCoachColorMap = new Map<string, string>();
      
      // Collect all unique coaches from games
      const allCoaches = new Set<string>();
      gamesData.games.forEach((game: Game) => {
        const primaryCoach = game.homeTeamCoach || game.awayTeamCoach || `Team-${game.homeTeamName}`;
        allCoaches.add(primaryCoach);
      });
      
      // Assign stable colors to each coach
      Array.from(allCoaches).forEach((coach, index) => {
        const colorIndex = index % coachColors.length;
        newCoachColorMap.set(coach, coachColors[colorIndex]);
        console.log(`[Coach Colors] Assigned ${coachColors[colorIndex]} to ${coach}`);
      });
      
      setCoachColorMap(newCoachColorMap);
    }
  }, [gamesData?.games, coachColorMap.size]); // Remove coachColors dependency

  // Organize games into time slots - REMOVE INFINITE LOOP
  useEffect(() => {
    // Only log once per effect run to prevent console spam
    if (gamesData?.games && gamesData?.fields) {
      setFields(gamesData.fields);
      
      // Create fresh time slots with games assigned
      const slots: TimeSlot[] = [];
      const startHour = 8;
      const endHour = 20;
      const intervalMinutes = 90;

      for (let hour = startHour; hour < endHour; hour += intervalMinutes / 60) {
        const wholeHour = Math.floor(hour);
        const minutes = (hour % 1) * 60;
        const startTime = `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        const endHour = hour + intervalMinutes / 60;
        const endWholeHour = Math.floor(endHour);
        const endMinutes = (endHour % 1) * 60;
        const endTimeStr = `${endWholeHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

        // Find games for this time slot
        const gamesInSlot = gamesData.games.filter((game: Game) => {
          const gameDate = game.startTime?.split('T')[0] || game.startTime?.split(' ')[0];
          const gameTime = game.startTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                          game.startTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');
          return gameDate === selectedDate && gameTime === startTime;
        });

        slots.push({
          id: `${selectedDate}-${startTime}`,
          startTime,
          endTime: endTimeStr,
          games: gamesInSlot
        });
      }
      
      setTimeSlots(slots);
    }
  }, [gamesData?.games, gamesData?.fields, selectedDate]); // Fix dependencies to prevent infinite loop

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const draggedGameId = parseInt(draggableId.split('-')[1]);
    
    // Extract field ID and time slot from destination
    const [destFieldId, destTimeSlot] = destination.droppableId.split('-time-');
    const destFieldIdNum = parseInt(destFieldId.replace('field-', ''));
    const destStartTime = `${selectedDate}T${destTimeSlot}:00.000Z`;

    console.log(`[Drag Drop] Game ${draggedGameId} dropped on field ${destFieldIdNum} at ${destStartTime}`);
    console.log(`[Drag Drop] Source:`, source);
    console.log(`[Drag Drop] Destination:`, destination);

    // Check if there's already a game in the destination slot
    const destTimeSlotObj = timeSlots.find(slot => slot.id === `${selectedDate}-${destTimeSlot}`);
    const destFieldGames = destTimeSlotObj?.games?.filter(game => game.fieldId === destFieldIdNum) || [];
    
    if (destFieldGames.length > 0) {
      // There's a game in the destination slot - perform a swap
      const targetGame = destFieldGames[0];
      
      // Get source game info
      const [sourceFieldId, sourceTimeSlot] = source.droppableId.split('-time-');
      const sourceFieldIdNum = parseInt(sourceFieldId.replace('field-', ''));
      const sourceStartTime = `${selectedDate}T${sourceTimeSlot}:00.000Z`;
      
      console.log(`[Drag Drop] Swapping games: ${draggedGameId} <-> ${targetGame.id}`);
      console.log(`[Drag Drop] Game ${draggedGameId}: ${sourceFieldIdNum}@${sourceTimeSlot} -> ${destFieldIdNum}@${destTimeSlot}`);
      console.log(`[Drag Drop] Game ${targetGame.id}: ${destFieldIdNum}@${destTimeSlot} -> ${sourceFieldIdNum}@${sourceTimeSlot}`);
      
      // Perform swap
      swapGamesMutation.mutate({
        game1Id: draggedGameId,
        game2Id: targetGame.id,
        game1Field: sourceFieldIdNum,
        game1Time: sourceStartTime,
        game2Field: destFieldIdNum,
        game2Time: destStartTime
      });
    } else {
      // Empty slot - simple move
      console.log(`[Drag Drop] Simple move: Game ${draggedGameId} -> ${destFieldIdNum}@${destTimeSlot}`);
      updateGameMutation.mutate({ 
        gameId: draggedGameId, 
        fieldId: destFieldIdNum, 
        startTime: destStartTime 
      });
    }
  };

  const getAvailableDates = () => {
    const dates = ['2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04'];
    return dates;
  };

  if (gamesLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Loading calendar scheduler...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || fieldsError) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading calendar data</p>
            <p className="text-sm mt-2">
              Games Error: {error?.message || 'None'}<br/>
              Fields Error: {fieldsError?.message || 'None'}
            </p>
            <p className="text-sm mt-2 text-gray-600">
              Check browser console for detailed error information
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gamesData?.games || gamesData.games.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <p>No games found for calendar display</p>
            <p className="text-sm mt-2 text-gray-600">
              Generate schedules using Quick Schedule Generator first
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall conflict summary
  const getConflictSummary = () => {
    let totalCritical = 0;
    let totalWarnings = 0;
    const conflictDetails: { [key: string]: string[] } = {};

    timeSlots.forEach(slot => {
      slot.games.forEach(game => {
        const conflicts = detectConflicts(game, slot);
        const severity = getConflictSeverity(conflicts);
        
        if (severity === 'error') totalCritical++;
        if (severity === 'warning') totalWarnings++;
        
        if (conflicts.length > 0) {
          const key = `${game.homeTeamName} vs ${game.awayTeamName} (${slot.startTime})`;
          conflictDetails[key] = conflicts;
        }
      });
    });

    return { totalCritical, totalWarnings, conflictDetails };
  };

  const conflictSummary = getConflictSummary();

  return (
    <div className="w-full space-y-6">
      {/* Conflict Alert Panel */}
      {(conflictSummary.totalCritical > 0 || conflictSummary.totalWarnings > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-red-900">
                  {conflictSummary.totalCritical} Critical Conflicts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-semibold text-yellow-900">
                  {conflictSummary.totalWarnings} Warnings
                </span>
              </div>
            </div>
            <Badge variant="destructive" className="animate-bounce">
              NEEDS ATTENTION
            </Badge>
          </div>
          <div className="text-sm text-gray-700">
            <p className="mb-2 font-medium">Active Scheduling Conflicts:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {Object.entries(conflictSummary.conflictDetails).map(([game, conflicts]) => (
                <div key={game} className="bg-white/60 rounded p-2 border-l-4 border-orange-400">
                  <div className="font-medium text-xs mb-1">{game}</div>
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                      {conflict.includes('COACH CONFLICT') ? '🔴' : '🟡'} {conflict}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Drag & Drop Schedule Calendar
            {conflictSummary.totalCritical === 0 && conflictSummary.totalWarnings === 0 && (
              <Badge variant="default" className="bg-green-600">
                ✓ No Conflicts
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag games between fields and time slots to fine-tune your tournament schedule.
            Games with conflicts are highlighted in red (critical) or yellow (warnings).
          </p>
        </CardHeader>
        <CardContent>
          {/* Date Selector */}
          <Tabs value={selectedDate} onValueChange={setSelectedDate} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              {getAvailableDates().map(date => (
                <TabsTrigger key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              {/* Time Column */}
              <div className="space-y-4">
                <div className="h-12 flex items-center justify-center font-semibold text-sm bg-muted rounded">
                  Time
                </div>
                {timeSlots.map(slot => (
                  <div key={slot.id} className="h-24 flex items-center justify-center text-sm border rounded">
                    <div className="text-center">
                      <div className="font-medium">{slot.startTime}</div>
                      <div className="text-xs text-muted-foreground">-{slot.endTime}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Field Columns */}
              {fields.slice(0, 5).map(field => (
                <div key={field.id} className="space-y-4">
                  <div className="h-12 flex items-center justify-center bg-muted rounded p-2">
                    <div className="text-center">
                      <div className="font-semibold text-sm">{field.name}</div>
                      <div className="text-xs text-muted-foreground">{field.fieldSize}</div>
                    </div>
                  </div>
                  
                  {timeSlots.map(slot => (
                    <Droppable key={`${field.id}-${slot.id}`} droppableId={`field-${field.id}-time-${slot.startTime}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-24 border-2 border-dashed rounded p-2 transition-colors ${
                            snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-muted'
                          }`}
                        >
                          {slot.games
                            .filter(game => game.fieldId === field.id)
                            .map((game, index) => (
                              <Draggable
                                key={`game-${game.id}`}
                                draggableId={`game-${game.id}`}
                                index={index}
                              >
                                {(provided, snapshot) => {
                                  const primaryCoach = getPrimaryCoach(game);
                                  const coachColorClass = getCoachColor(primaryCoach);
                                  const conflicts = detectConflicts(game, slot);
                                  const conflictSeverity = getConflictSeverity(conflicts);
                                  const conflictStyling = getConflictStyling(conflictSeverity);
                                  
                                  return (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`border-2 rounded p-2 mb-2 shadow-sm cursor-move transition-all ${
                                        snapshot.isDragging ? 'shadow-lg scale-105' : 'hover:shadow-md'
                                      } ${conflictSeverity === 'none' ? coachColorClass : conflictStyling}`}
                                      title={conflicts.length > 0 ? conflicts.join('\n') : `Coach: ${primaryCoach}`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className="text-xs bg-white/50">
                                          {game.ageGroup}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                          {conflictSeverity === 'error' && (
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Critical Conflict" />
                                          )}
                                          {conflictSeverity === 'warning' && (
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Warning: Potential Issue" />
                                          )}
                                          <Edit3 className="h-3 w-3 opacity-60" />
                                        </div>
                                      </div>
                                      <div className="text-xs font-medium mb-1">
                                        {game.homeTeamName} vs {game.awayTeamName}
                                      </div>
                                      {(game.homeTeamCoach || game.awayTeamCoach) && (
                                        <div className="text-xs opacity-75 mb-1">
                                          Coach: {game.homeTeamCoach || game.awayTeamCoach}
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between text-xs opacity-60">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {game.duration}min
                                        </div>
                                        {conflicts.length > 0 && (
                                          <div className="text-xs font-bold">
                                            ⚠️ {conflicts.length}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              ))}
            </div>
          </DragDropContext>

          {/* Conflict Detection Legend */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coach Color Legend */}
            {coachColorMap.size > 0 && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Coach Color Coding</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from(coachColorMap.entries()).slice(0, 6).map(([coach, colorClass]) => (
                    <div key={coach} className={`px-2 py-1 rounded text-xs border-2 ${colorClass}`}>
                      {coach.startsWith('Team-') ? coach.replace('Team-', '') : coach}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Games are color-coded by coach when no conflicts are detected.
                </p>
              </div>
            )}

            {/* Conflict Detection Legend */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Conflict Detection</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">Critical: Coach conflicts (same coach, multiple games)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs">Warning: Team rest period issues (back-to-back games)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded"></div>
                  <span className="text-xs">Normal: No conflicts detected</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Hover over games to see detailed conflict information. Red indicates critical issues that must be resolved.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {gamesData?.games?.length || 0} games scheduled
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {fields.length} fields available
              </div>
              <div className="flex items-center gap-1">
                <Edit3 className="h-4 w-4" />
                Drag to swap games
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Changes
              </Button>
              <Button size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
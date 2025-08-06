import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  bracketName?: string;
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
  displayTime: string;
  timestampMinutes: number; // Minutes from start of day for easy calculations
}

interface ConflictInfo {
  type: 'coach' | 'team_rest' | 'field_size' | 'capacity';
  severity: 'warning' | 'error';
  message: string;
  gameIds: number[];
}

interface EnhancedDragDropSchedulerProps {
  eventId: string;
}

export default function EnhancedDragDropScheduler({ eventId }: EnhancedDragDropSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('2025-08-16');
  const [timeInterval, setTimeInterval] = useState<number>(15); // 5, 10, 15 minute intervals
  const [draggedGame, setDraggedGame] = useState<Game | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ fieldId: number; timeSlot: string } | null>(null);
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [gamePositions, setGamePositions] = useState<Map<number, { fieldId: number; startTime: string }>>(new Map());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch games and fields data
  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ['enhanced-schedule', eventId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/schedule-calendar/${eventId}/schedule-calendar`);
      if (!response.ok) throw new Error('Failed to fetch schedule data');
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Generate time slots with fine-grained intervals
  const generateTimeSlots = useCallback((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM
    const intervalMinutes = timeInterval;

    for (let totalMinutes = startHour * 60; totalMinutes < endHour * 60; totalMinutes += intervalMinutes) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Calculate end time
      const endTotalMinutes = totalMinutes + intervalMinutes;
      const endHours = Math.floor(endTotalMinutes / 60);
      const endMinutes = endTotalMinutes % 60;
      const endTimeString = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      slots.push({
        id: `${selectedDate}-${timeString}`,
        startTime: timeString,
        endTime: endTimeString,
        displayTime: formatDisplayTime(timeString),
        timestampMinutes: totalMinutes
      });
    }

    return slots;
  }, [timeInterval, selectedDate]);

  const formatDisplayTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get games for a specific field and time slot
  const getGamesForSlot = useCallback((fieldId: number, timeSlot: TimeSlot): Game[] => {
    if (!scheduleData?.games) return [];

    return scheduleData.games.filter((game: Game) => {
      // Check if game has been moved optimistically
      const position = gamePositions.get(game.id);
      const effectiveFieldId = position?.fieldId ?? game.fieldId;
      const effectiveStartTime = position?.startTime ?? game.startTime;

      if (effectiveFieldId !== fieldId) return false;

      // Parse the game's effective start time
      const gameDate = effectiveStartTime?.split('T')[0] || effectiveStartTime?.split(' ')[0];
      const gameTime = effectiveStartTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                      effectiveStartTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');

      return gameDate === selectedDate && gameTime === timeSlot.startTime;
    });
  }, [scheduleData?.games, selectedDate, gamePositions]);

  // Detect scheduling conflicts
  const detectConflicts = useCallback((games: Game[]): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    const timeSlots = generateTimeSlots();

    timeSlots.forEach(slot => {
      const slotGames = games.filter(game => {
        const position = gamePositions.get(game.id);
        const effectiveStartTime = position?.startTime ?? game.startTime;
        const gameTime = effectiveStartTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                        effectiveStartTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');
        return gameTime === slot.startTime;
      });

      // Coach conflict detection
      const coachGames = new Map<string, Game[]>();
      slotGames.forEach(game => {
        const coach = game.homeTeamCoach || game.awayTeamCoach || 'Unknown';
        if (!coachGames.has(coach)) coachGames.set(coach, []);
        coachGames.get(coach)!.push(game);
      });

      coachGames.forEach((games, coach) => {
        if (games.length > 1) {
          conflicts.push({
            type: 'coach',
            severity: 'error',
            message: `Coach ${coach} has ${games.length} overlapping games at ${slot.displayTime}`,
            gameIds: games.map(g => g.id)
          });
        }
      });

      // Team rest period conflicts (90 minutes minimum)
      const restPeriodMinutes = 90;
      slotGames.forEach(game => {
        const teams = [game.homeTeamName, game.awayTeamName];
        
        // Check if same teams play within rest period
        const conflictingSlots = timeSlots.filter(checkSlot => {
          const timeDiff = Math.abs(checkSlot.timestampMinutes - slot.timestampMinutes);
          return timeDiff > 0 && timeDiff < restPeriodMinutes;
        });

        conflictingSlots.forEach(conflictSlot => {
          const conflictGames = games.filter(g => {
            const position = gamePositions.get(g.id);
            const effectiveStartTime = position?.startTime ?? g.startTime;
            const gameTime = effectiveStartTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                            effectiveStartTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');
            return gameTime === conflictSlot.startTime && 
                   (teams.includes(g.homeTeamName) || teams.includes(g.awayTeamName));
          });

          if (conflictGames.length > 0) {
            conflicts.push({
              type: 'team_rest',
              severity: 'warning',
              message: `Teams have insufficient rest between ${slot.displayTime} and ${conflictSlot.displayTime}`,
              gameIds: [game.id, ...conflictGames.map(g => g.id)]
            });
          }
        });
      });
    });

    return conflicts;
  }, [generateTimeSlots, gamePositions]);

  // Update game position mutation
  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, fieldId, startTime }: { gameId: number; fieldId: number; startTime: string }) => {
      const response = await fetch(`/api/admin/games/${gameId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fieldId, startTime, eventId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update game position');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-schedule', eventId, selectedDate] });
      setIsOptimisticUpdate(false);
      toast({ title: 'Game moved successfully' });
    },
    onError: (error) => {
      // Revert optimistic update
      setGamePositions(prev => {
        const updated = new Map(prev);
        if (draggedGame) {
          updated.delete(draggedGame.id);
        }
        return updated;
      });
      setIsOptimisticUpdate(false);
      toast({ 
        title: 'Failed to move game', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, game: Game) => {
    setDraggedGame(game);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', game.id.toString());
    
    // Add visual feedback
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.7';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, fieldId: number, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ fieldId, timeSlot });
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, fieldId: number, timeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedGame) return;

    const newStartTime = `${selectedDate}T${timeSlot}:00.000Z`;
    
    // Optimistic update
    setIsOptimisticUpdate(true);
    setGamePositions(prev => new Map(prev.set(draggedGame.id, { fieldId, startTime: newStartTime })));

    // Update backend
    updateGameMutation.mutate({
      gameId: draggedGame.id,
      fieldId,
      startTime: newStartTime
    });

    setDraggedGame(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedGame(null);
    setDragOverSlot(null);
  };

  // Update conflicts when games or positions change
  useEffect(() => {
    if (scheduleData?.games) {
      const detectedConflicts = detectConflicts(scheduleData.games);
      setConflicts(detectedConflicts);
    }
  }, [scheduleData?.games, gamePositions, detectConflicts]);

  const timeSlots = generateTimeSlots();
  const fields = scheduleData?.fields || [];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading enhanced scheduler...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading schedule data</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="border-slate-600 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Enhanced Schedule Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Date Selection */}
            <div className="flex items-center gap-2">
              <label className="text-slate-200 text-sm">Date:</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-08-16">Saturday, Aug 16</SelectItem>
                  <SelectItem value="2025-08-17">Sunday, Aug 17</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Interval Selection */}
            <div className="flex items-center gap-2">
              <label className="text-slate-200 text-sm">Time Intervals:</label>
              <Select value={timeInterval.toString()} onValueChange={(value) => setTimeInterval(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Conflict</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="border-orange-600 bg-orange-900/20">
          <CardHeader>
            <CardTitle className="text-orange-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Schedule Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {conflicts.slice(0, 5).map((conflict, index) => (
                <div key={index} className={`p-2 rounded text-sm ${
                  conflict.severity === 'error' ? 'bg-red-900/30 text-red-200' : 'bg-yellow-900/30 text-yellow-200'
                }`}>
                  {conflict.message}
                </div>
              ))}
              {conflicts.length > 5 && (
                <div className="text-orange-300 text-sm">+ {conflicts.length - 5} more conflicts</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <Card className="border-slate-600 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Schedule Grid - {selectedDate} ({timeInterval} min intervals)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={gridRef} className="overflow-auto max-h-[800px]">
            <div className="grid gap-1" style={{ gridTemplateColumns: `150px repeat(${fields.length}, 1fr)` }}>
              {/* Header Row */}
              <div className="sticky top-0 bg-slate-700 p-3 border border-slate-600 font-medium text-slate-200">
                Time
              </div>
              {fields.map((field: Field) => (
                <div
                  key={field.id}
                  className="sticky top-0 bg-slate-700 p-3 border border-slate-600 text-center"
                >
                  <div className="font-medium text-white">{field.name}</div>
                  <div className="text-sm text-slate-300">{field.fieldSize}</div>
                </div>
              ))}

              {/* Time Slot Rows */}
              {timeSlots.map((slot) => (
                <React.Fragment key={slot.id}>
                  {/* Time Label */}
                  <div className="bg-slate-750 p-2 border border-slate-600 text-slate-300 text-sm font-medium">
                    {slot.displayTime}
                  </div>

                  {/* Field Columns */}
                  {fields.map((field: Field) => {
                    const games = getGamesForSlot(field.id, slot);
                    const hasConflict = conflicts.some(c => 
                      games.some(game => c.gameIds.includes(game.id))
                    );
                    const isDragOver = dragOverSlot?.fieldId === field.id && dragOverSlot?.timeSlot === slot.startTime;

                    return (
                      <div
                        key={`${field.id}-${slot.id}`}
                        className={`
                          min-h-[60px] p-1 border border-slate-600 transition-colors relative
                          ${games.length > 0 ? 'bg-blue-900/30' : 'bg-slate-800'}
                          ${hasConflict ? 'bg-red-900/30 border-red-500' : ''}
                          ${isDragOver ? 'bg-green-900/30 border-green-500 border-2' : ''}
                          hover:bg-slate-700/50
                        `}
                        onDragOver={(e) => handleDragOver(e, field.id, slot.startTime)}
                        onDrop={(e) => handleDrop(e, field.id, slot.startTime)}
                        onDragLeave={() => setDragOverSlot(null)}
                      >
                        {games.map((game) => {
                          const isBeingDragged = draggedGame?.id === game.id;
                          const gameConflicts = conflicts.filter(c => c.gameIds.includes(game.id));
                          
                          return (
                            <div
                              key={game.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, game)}
                              onDragEnd={handleDragEnd}
                              className={`
                                p-2 rounded cursor-move text-xs transition-all
                                ${isBeingDragged ? 'opacity-50 scale-95' : 'opacity-100'}
                                ${gameConflicts.length > 0 
                                  ? gameConflicts.some(c => c.severity === 'error') 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-yellow-600 text-white'
                                  : 'bg-blue-600 text-white'
                                }
                                hover:scale-105 hover:shadow-lg
                              `}
                              title={`${game.homeTeamName} vs ${game.awayTeamName}\nAge Group: ${game.ageGroup}\nDrag to move`}
                            >
                              <div className="font-medium truncate">
                                {game.homeTeamName} vs {game.awayTeamName}
                              </div>
                              <div className="text-xs opacity-80 truncate">
                                {game.ageGroup} • {game.bracketName}
                              </div>
                              {gameConflicts.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">{gameConflicts.length} conflict{gameConflicts.length > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Drop Zone Indicator */}
                        {games.length === 0 && isDragOver && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-green-300 text-sm font-medium">Drop here</div>
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

      {/* Legend */}
      <Card className="border-slate-600 bg-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">How to Use</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• Drag games between time slots and fields</li>
                <li>• Use 5/10/15 minute intervals for precise timing</li>
                <li>• Conflicts are highlighted in red/yellow</li>
                <li>• Changes are saved automatically</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Conflict Types</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• <span className="text-red-300">Red:</span> Coach conflicts (critical)</li>
                <li>• <span className="text-yellow-300">Yellow:</span> Team rest period issues</li>
                <li>• <span className="text-blue-300">Blue:</span> Normal scheduled games</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
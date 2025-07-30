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
  const [selectedDate, setSelectedDate] = useState<string>('2025-10-01');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const queryClient = useQueryClient();

  // Fetch games and fields data (using test endpoints temporarily)
  const { data: gamesData, isLoading: gamesLoading, error } = useQuery({
    queryKey: ['/api/test-games', eventId],
    queryFn: async () => {
      console.log('[Calendar] Fetching test games data for event:', eventId);
      const response = await fetch(`/api/test-games/${eventId}`);
      console.log('[Calendar] Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('[Calendar] Error response:', errorText);
        throw new Error(`Failed to fetch games data: ${response.status}`);
      }
      const data = await response.json();
      console.log('[Calendar] Received games data:', data);
      
      // Transform basic games data into calendar format
      const processedGames = data.games?.map((game: any) => ({
        id: game.id,
        homeTeamName: `Team ${game.homeTeamId}`,
        awayTeamName: `Team ${game.awayTeamId}`,
        ageGroup: 'U19',
        startTime: '2025-10-01T08:00:00',
        endTime: '2025-10-01T09:30:00',
        fieldName: `Field ${game.fieldId || 8}`,
        fieldId: game.fieldId || 8,
        status: game.status || 'scheduled',
        duration: 90
      })) || [];
      
      return { games: processedGames, success: true };
    },
    retry: false
  });

  const { data: fieldsData, error: fieldsError } = useQuery({
    queryKey: ['/api/test-fields'],
    queryFn: async () => {
      console.log('[Calendar] Fetching test fields data');
      const response = await fetch('/api/test-fields');
      console.log('[Calendar] Fields response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('[Calendar] Fields error response:', errorText);
        throw new Error(`Failed to fetch fields: ${response.status}`);
      }
      const data = await response.json();
      console.log('[Calendar] Received fields data:', data);
      
      // Transform basic fields data into calendar format
      const processedFields = data.fields?.map((field: any) => ({
        id: field.id,
        name: field.name || `Field ${field.id}`,
        fieldSize: field.fieldSize || '11v11',
        complexName: field.complexName || 'Main Complex',
        isOpen: field.isOpen !== false
      })) || [];
      
      return { fields: processedFields, success: true };
    },
    retry: false
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'schedule-calendar'] });
      toast({ title: 'Game updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update game', variant: 'destructive' });
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

  // Organize games into time slots
  useEffect(() => {
    console.log('[Calendar Effect] gamesData:', gamesData);
    console.log('[Calendar Effect] fieldsData:', fieldsData);
    console.log('[Calendar Effect] selectedDate:', selectedDate);
    
    if (gamesData?.games && fieldsData?.fields) {
      console.log('[Calendar Effect] Setting fields:', fieldsData.fields);
      setFields(fieldsData.fields);
      
      const updatedSlots = timeSlots.map(slot => {
        const gamesInSlot = gamesData.games.filter((game: Game) => {
          const gameDate = game.startTime?.split('T')[0] || game.startTime?.split(' ')[0];
          const gameTime = game.startTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                          game.startTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');
          const matches = gameDate === selectedDate && gameTime === slot.startTime;
          if (matches) {
            console.log(`[Calendar Effect] Game ${game.id} matches slot ${slot.startTime}:`, game);
          }
          return matches;
        });
        
        return {
          ...slot,
          games: gamesInSlot
        };
      });
      
      console.log('[Calendar Effect] Updated slots:', updatedSlots);
      setTimeSlots(updatedSlots);
    } else if (gamesData?.games) {
      console.log('[Calendar Effect] Games available but no fields data');
    } else if (fieldsData?.fields) {
      console.log('[Calendar Effect] Fields available but no games data');
    }
  }, [gamesData, fieldsData, selectedDate, timeSlots.length]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const gameId = parseInt(draggableId.split('-')[1]);
    
    // Extract field ID and time slot from destination
    const [destFieldId, destTimeSlot] = destination.droppableId.split('-time-');
    const fieldId = parseInt(destFieldId.replace('field-', ''));
    const startTime = `${selectedDate}T${destTimeSlot}:00`;

    // Update game assignment
    updateGameMutation.mutate({ gameId, fieldId, startTime });
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

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Drag & Drop Schedule Calendar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag games between fields and time slots to fine-tune your tournament schedule
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
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-card border rounded p-2 mb-2 shadow-sm cursor-move transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {game.ageGroup}
                                      </Badge>
                                      <Edit3 className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <div className="text-xs font-medium">
                                      {game.homeTeamName} vs {game.awayTeamName}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {game.duration}min
                                    </div>
                                  </div>
                                )}
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

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {gamesData?.totalGames || 0} games scheduled
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {fields.length} fields available
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
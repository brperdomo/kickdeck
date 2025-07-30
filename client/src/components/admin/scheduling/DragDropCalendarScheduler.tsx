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

  // Fetch games and fields data
  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'schedule-calendar'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-calendar`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch schedule data');
      return response.json();
    }
  });

  const { data: fieldsData } = useQuery({
    queryKey: ['/api/admin/fields'],
    queryFn: async () => {
      const response = await fetch('/api/admin/fields', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
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
    if (gamesData?.games && fieldsData?.fields) {
      setFields(fieldsData.fields);
      
      const updatedSlots = timeSlots.map(slot => ({
        ...slot,
        games: gamesData.games.filter((game: Game) => {
          const gameDate = game.startTime?.split('T')[0] || game.startTime?.split(' ')[0];
          const gameTime = game.startTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || 
                          game.startTime?.split(' ')[1]?.split(':').slice(0, 2).join(':');
          return gameDate === selectedDate && gameTime === slot.startTime;
        })
      }));
      setTimeSlots(updatedSlots);
    }
  }, [gamesData, fieldsData, selectedDate]);

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
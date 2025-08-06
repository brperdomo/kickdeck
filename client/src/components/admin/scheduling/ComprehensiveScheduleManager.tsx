import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Shuffle,
  Edit,
  Save,
  RefreshCw
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EnhancedDragDropScheduler from './EnhancedDragDropScheduler';

interface Team {
  id: number;
  name: string;
  ageGroupId: number;
  ageGroup: string;
  coach: {
    name: string;
    email: string;
  };
  fieldSize: string;
}

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  complexName: string;
  openTime: string;
  closeTime: string;
  hasLights: boolean;
}

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  fieldId: number;
  field: Field;
  startTime: string;
  endTime: string;
  date: string;
  duration: number;
  conflicts: Conflict[];
  status: 'scheduled' | 'conflict' | 'pending';
}

interface Conflict {
  type: 'coach' | 'field' | 'time' | 'team';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
}

interface ComprehensiveScheduleManagerProps {
  eventId: string;
}

export function ComprehensiveScheduleManager({ eventId }: ComprehensiveScheduleManagerProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadScheduleData();
  }, [eventId]);

  const loadScheduleData = async () => {
    try {
      // Load teams, fields, and existing games
      const [teamsRes, fieldsRes, gamesRes] = await Promise.all([
        fetch(`/api/admin/events/${eventId}/teams`, { credentials: 'include' }),
        fetch(`/api/admin/events/${eventId}/fields`, { credentials: 'include' }),
        fetch(`/api/admin/events/${eventId}/games`, { credentials: 'include' })
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        setFields(fieldsData);
      }

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setGames(gamesData);
        detectConflicts(gamesData);
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }
  };

  const generateIntelligentSchedule = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/generate-intelligent-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teams,
          fields,
          constraints: {
            startTime: '08:00',
            endTime: '18:00',
            gameDuration: 90,
            restTime: 15,
            maxGamesPerTeam: 3,
            preventCoachConflicts: true,
            respectFieldSizes: true
          }
        })
      });

      if (response.ok) {
        const scheduleData = await response.json();
        setGames(scheduleData.games);
        detectConflicts(scheduleData.games);
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const detectConflicts = (gamesList: Game[]) => {
    const detectedConflicts: Conflict[] = [];
    
    // Check for coaching conflicts
    const coachGameMap = new Map<string, Game[]>();
    gamesList.forEach(game => {
      const homeCoach = game.homeTeam.coach.email;
      const awayCoach = game.awayTeam.coach.email;
      
      if (!coachGameMap.has(homeCoach)) coachGameMap.set(homeCoach, []);
      if (!coachGameMap.has(awayCoach)) coachGameMap.set(awayCoach, []);
      
      coachGameMap.get(homeCoach)?.push(game);
      coachGameMap.get(awayCoach)?.push(game);
    });

    // Detect overlapping games for same coach
    coachGameMap.forEach((coachGames, coachEmail) => {
      for (let i = 0; i < coachGames.length; i++) {
        for (let j = i + 1; j < coachGames.length; j++) {
          const game1 = coachGames[i];
          const game2 = coachGames[j];
          
          if (game1.date === game2.date) {
            const start1 = new Date(`${game1.date} ${game1.startTime}`);
            const end1 = new Date(`${game1.date} ${game1.endTime}`);
            const start2 = new Date(`${game2.date} ${game2.startTime}`);
            const end2 = new Date(`${game2.date} ${game2.endTime}`);
            
            if (start1 < end2 && start2 < end1) {
              detectedConflicts.push({
                type: 'coach',
                severity: 'high',
                description: `Coach ${coachEmail} has overlapping games`,
                suggestion: 'Reschedule one of the games to a different time slot'
              });
            }
          }
        }
      }
    });

    // Check field conflicts
    const fieldGameMap = new Map<number, Game[]>();
    gamesList.forEach(game => {
      if (!fieldGameMap.has(game.fieldId)) fieldGameMap.set(game.fieldId, []);
      fieldGameMap.get(game.fieldId)?.push(game);
    });

    fieldGameMap.forEach((fieldGames, fieldId) => {
      for (let i = 0; i < fieldGames.length; i++) {
        for (let j = i + 1; j < fieldGames.length; j++) {
          const game1 = fieldGames[i];
          const game2 = fieldGames[j];
          
          if (game1.date === game2.date) {
            const start1 = new Date(`${game1.date} ${game1.startTime}`);
            const end1 = new Date(`${game1.date} ${game1.endTime}`);
            const start2 = new Date(`${game2.date} ${game2.startTime}`);
            const end2 = new Date(`${game2.date} ${game2.endTime}`);
            
            if (start1 < end2 && start2 < end1) {
              const field = fields.find(f => f.id === fieldId);
              detectedConflicts.push({
                type: 'field',
                severity: 'high',
                description: `Field ${field?.name} has overlapping games`,
                suggestion: 'Move one game to a different field or time slot'
              });
            }
          }
        }
      }
    });

    setConflicts(detectedConflicts);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !editMode) return;

    const { source, destination, draggableId } = result;
    
    // Handle game rescheduling via drag and drop
    const gameId = draggableId;
    const newTimeSlot = destination.droppableId;
    
    // Update game time/field based on drop target
    const updatedGames = games.map(game => {
      if (game.id === gameId) {
        return {
          ...game,
          startTime: newTimeSlot,
          // Add logic to update field if dropped on different field
        };
      }
      return game;
    });
    
    setGames(updatedGames);
    detectConflicts(updatedGames);
  };

  const saveScheduleChanges = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/save-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ games })
      });

      if (response.ok) {
        setEditMode(false);
        // Show success message
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const filteredGames = games.filter(game => {
    const dateMatch = !selectedDate || game.date === selectedDate;
    const fieldMatch = selectedField === 'all' || game.fieldId.toString() === selectedField;
    return dateMatch && fieldMatch;
  });

  const uniqueDates = Array.from(new Set(games.map(game => game.date))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tournament Schedule Manager</h1>
          <p className="text-muted-foreground">
            Professional scheduling with real-time conflict detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={generateIntelligentSchedule}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4 mr-2" />
                Generate Schedule
              </>
            )}
          </Button>
          {games.length > 0 && (
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={() => editMode ? saveScheduleChanges() : setEditMode(true)}
            >
              {editMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Conflict Alerts */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">
              {conflicts.length} scheduling conflicts detected
            </div>
            <div className="space-y-1">
              {conflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="text-sm">
                  • {conflict.description} - {conflict.suggestion}
                </div>
              ))}
              {conflicts.length > 3 && (
                <div className="text-sm font-medium">
                  + {conflicts.length - 3} more conflicts
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{games.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Teams</p>
                <p className="text-2xl font-bold">{teams.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Fields</p>
                <p className="text-2xl font-bold">{fields.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold text-red-500">{conflicts.length}</p>
              </div>
              {conflicts.length === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {games.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Filter by Date:</label>
                <select 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="ml-2 px-3 py-1 border rounded"
                >
                  <option value="">All Dates</option>
                  {uniqueDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Filter by Field:</label>
                <select 
                  value={selectedField} 
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="ml-2 px-3 py-1 border rounded"
                >
                  <option value="all">All Fields</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id.toString()}>
                      {field.name} ({field.complexName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Display */}
      {games.length > 0 ? (
        <Tabs defaultValue="grid" className="w-full">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar Interface</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-4">
                {uniqueDates.map(date => {
                  const dateGames = filteredGames.filter(game => game.date === date);
                  if (dateGames.length === 0) return null;
                  
                  return (
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
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dateGames
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((game, index) => (
                              <Draggable
                                key={game.id}
                                draggableId={game.id}
                                index={index}
                                isDragDisabled={!editMode}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`
                                      p-4 border rounded-lg bg-card
                                      ${snapshot.isDragging ? 'shadow-lg' : ''}
                                      ${editMode ? 'cursor-move' : ''}
                                      ${game.conflicts.length > 0 ? 'border-red-300 bg-red-50' : ''}
                                    `}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <div className="font-medium">
                                          {game.homeTeam.name} vs {game.awayTeam.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {game.startTime} - {game.endTime}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {game.field.name} ({game.field.complexName})
                                          </span>
                                          <Badge variant="outline">
                                            {game.homeTeam.ageGroup}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {game.conflicts.length > 0 && (
                                          <Badge variant="destructive">
                                            {game.conflicts.length} conflict{game.conflicts.length > 1 ? 's' : ''}
                                          </Badge>
                                        )}
                                        <Badge 
                                          variant={game.status === 'scheduled' ? 'default' : 'secondary'}
                                        >
                                          {game.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    {game.conflicts.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-red-200">
                                        {game.conflicts.map((conflict, i) => (
                                          <div key={i} className="text-sm text-red-600">
                                            {conflict.description}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </DragDropContext>
          </TabsContent>
          
          <TabsContent value="calendar">
            {/* Enhanced Calendar Interface with Drag & Drop */}
            <EnhancedDragDropScheduler eventId={eventId} />
          </TabsContent>
          
          <TabsContent value="timeline">
            {/* Timeline view implementation */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Timeline view implementation coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="conflicts">
            <Card>
              <CardHeader>
                <CardTitle>Conflict Analysis & Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                {conflicts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">No Conflicts Detected</p>
                    <p className="text-muted-foreground">Your schedule is optimized and conflict-free</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-red-600">
                              {conflict.description}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Suggestion: {conflict.suggestion}
                            </div>
                          </div>
                          <Badge 
                            variant={conflict.severity === 'high' ? 'destructive' : 'secondary'}
                          >
                            {conflict.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Schedule Generated</h3>
            <p className="text-muted-foreground mb-4">
              Generate an intelligent schedule using your approved teams, available fields, and coaching information.
            </p>
            <Button 
              onClick={generateIntelligentSchedule}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Generate Intelligent Schedule
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
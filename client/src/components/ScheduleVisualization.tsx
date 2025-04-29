import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, CheckSquare } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Game {
  id: string;
  homeTeam: { id: number; name: string; coach: string; clubName?: string };
  awayTeam: { id: number; name: string; coach: string; clubName?: string };
  field: string;
  complexName?: string;
  startTime: string;
  endTime: string;
  bracket: string;
  round: string;
  ageGroup?: string;
}

interface BracketSchedule {
  bracketId: number;
  bracketName: string;
  format: string;
  games: string[];
}

interface ScheduleVisualizationProps {
  games: Game[];
  conflicts?: Array<{
    type: 'coach_conflict' | 'field_overbooked' | 'rest_period' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedGames: string[];
  }>;
  bracketSchedules?: BracketSchedule[];
  qualityScore?: number;
  onDeleteGame?: (gameId: string) => Promise<void>;
  onBulkDeleteGames?: (gameIds: string[]) => Promise<void>;
  allowEditing?: boolean;
}

export function ScheduleVisualization({
  games,
  conflicts = [],
  bracketSchedules = [],
  qualityScore,
  onDeleteGame,
  onBulkDeleteGames,
  allowEditing = false
}: ScheduleVisualizationProps) {
  const [selectedGames, setSelectedGames] = React.useState<{ [key: string]: boolean }>({});
  const [showBulkActions, setShowBulkActions] = React.useState(false);
  
  // Handle select all games for a day
  const handleSelectAllGames = (day: string, isSelected: boolean) => {
    const newSelectedGames = { ...selectedGames };
    gamesByDay[day].forEach(game => {
      newSelectedGames[game.id] = isSelected;
    });
    setSelectedGames(newSelectedGames);
    setShowBulkActions(Object.values(newSelectedGames).some(v => v));
  };
  
  // Handle selection of individual game
  const handleSelectGame = (gameId: string, isSelected: boolean) => {
    setSelectedGames(prev => ({ ...prev, [gameId]: isSelected }));
    
    // If at least one game is selected, show bulk actions
    if (isSelected) {
      setShowBulkActions(true);
    } else {
      // If no games are selected after this change, hide bulk actions
      const updatedSelected = { ...selectedGames, [gameId]: isSelected };
      setShowBulkActions(Object.values(updatedSelected).some(v => v));
    }
  };
  
  // Get all selected game IDs
  const getSelectedGameIds = (): string[] => {
    return Object.entries(selectedGames)
      .filter(([_, isSelected]) => isSelected)
      .map(([gameId, _]) => gameId);
  };
  
  // Handle bulk delete action
  const handleBulkDelete = async () => {
    if (!onBulkDeleteGames) return;
    
    const selectedIds = getSelectedGameIds();
    if (selectedIds.length === 0) return;
    
    try {
      await onBulkDeleteGames(selectedIds);
      toast.success(`Successfully deleted ${selectedIds.length} games`);
      // Reset selections after successful delete
      setSelectedGames({});
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk deleting games:', error);
      toast.error('Failed to delete selected games');
    }
  };
  if (!games || games.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No games scheduled yet.</p>
      </div>
    );
  }

  // Group games by day
  const gamesByDay = games.reduce((acc, game) => {
    let day = 'Unknown';
    try {
      day = format(parseISO(game.startTime), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  // Sort each day's games by start time
  Object.keys(gamesByDay).forEach(day => {
    gamesByDay[day].sort((a, b) => {
      try {
        return parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime();
      } catch (error) {
        return 0;
      }
    });
  });

  // Get sorted days
  const sortedDays = Object.keys(gamesByDay).sort((a, b) => {
    try {
      return parseISO(gamesByDay[a][0].startTime).getTime() - parseISO(gamesByDay[b][0].startTime).getTime();
    } catch (error) {
      return 0;
    }
  });

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {qualityScore !== undefined && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Schedule Quality</h3>
          <div className="flex items-center">
            <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  qualityScore >= 80 ? 'bg-green-500' : 
                  qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${qualityScore}%` }}
              ></div>
            </div>
            <span className="ml-2 font-medium">{qualityScore}%</span>
          </div>
        </div>
      )}

      {conflicts.length > 0 && (
        <Accordion type="single" collapsible className="mb-6">
          <AccordionItem value="conflicts">
            <AccordionTrigger>
              <div className="flex items-center">
                <span>Potential Conflicts</span>
                <Badge variant="outline" className="ml-2">{conflicts.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 mt-2">
                {conflicts.map((conflict, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-md ${getSeverityColor(conflict.severity)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{conflict.type.replace('_', ' ')}</div>
                        <div>{conflict.description}</div>
                      </div>
                      <Badge variant="outline" className="capitalize">{conflict.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {bracketSchedules.length > 0 && (
        <Accordion type="single" collapsible className="mb-6">
          <AccordionItem value="brackets">
            <AccordionTrigger>Bracket Schedules</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 mt-2">
                {bracketSchedules.map(bracket => (
                  <div key={bracket.bracketId} className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">{bracket.bracketName}</h4>
                    <div className="text-sm text-muted-foreground mb-2">
                      Format: {bracket.format.replace('_', ' ')}
                    </div>
                    <div className="text-sm">
                      Games: {bracket.games.length}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Group games by age group for easier viewing */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Schedule Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-1">Age Groups</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {[...new Set(games.map(game => game.ageGroup))].filter(Boolean).map((ageGroup, index) => (
                <Badge key={index} variant="outline">{ageGroup}</Badge>
              ))}
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-1">Brackets</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {[...new Set(games.map(game => game.bracket))].filter(Boolean).map((bracket, index) => (
                <Badge key={index} variant="outline">{bracket}</Badge>
              ))}
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-1">Facilities</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {[...new Set(games.map(game => game.complexName))].filter(Boolean).map((complex, index) => (
                <Badge key={index} variant="outline">{complex}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Display games by day with additional information */}
      {sortedDays.map(day => (
        <div key={day} className="border rounded-md overflow-hidden mb-6">
          <div className="bg-muted px-4 py-2 font-medium">{day}</div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {allowEditing && onBulkDeleteGames && (
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={gamesByDay[day].every(game => selectedGames[game.id])}
                        onCheckedChange={(checked) => {
                          handleSelectAllGames(day, checked === true);
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[120px]">Time</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Bracket</TableHead>
                  <TableHead className="hidden md:table-cell">Round</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead className="hidden md:table-cell">Complex</TableHead>
                  {allowEditing && onDeleteGame && (
                    <TableHead className="w-[80px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {gamesByDay[day].map(game => (
                  <TableRow key={game.id}>
                    {allowEditing && onBulkDeleteGames && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedGames[game.id] || false}
                          onCheckedChange={(checked) => {
                            handleSelectGame(game.id, checked === true);
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono whitespace-nowrap">
                      {formatTime(game.startTime)} - {formatTime(game.endTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                          <span className="font-medium truncate max-w-[160px]">{game.homeTeam.name}</span>
                          {game.homeTeam.clubName && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({game.homeTeam.clubName})
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">vs</span>
                        <div className="flex items-center">
                          <span className="font-medium truncate max-w-[160px]">{game.awayTeam.name}</span>
                          {game.awayTeam.clubName && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({game.awayTeam.clubName})
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{game.ageGroup || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{game.bracket || 'Default'}</TableCell>
                    <TableCell className="hidden md:table-cell">{game.round || 'Group Stage'}</TableCell>
                    <TableCell>
                      <span className="font-medium">{game.field}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {game.complexName || 'Unknown Facility'}
                    </TableCell>
                    {allowEditing && onDeleteGame && (
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Game</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this game? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    await onDeleteGame(game.id);
                                    toast.success('Game successfully deleted');
                                  } catch (error) {
                                    console.error('Error deleting game:', error);
                                    toast.error('Failed to delete game');
                                  }
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
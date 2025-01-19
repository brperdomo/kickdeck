import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Game {
  id: number;
  startTime: string;
  endTime: string;
  fieldName: string;
  ageGroup: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
}

interface AgeGroup {
  id: string;
  ageGroup: string;
  gender: string;
}

interface ScheduleVisualizationProps {
  games: Game[];
  ageGroups: AgeGroup[];
  selectedAgeGroup: string;
  onAgeGroupChange: (ageGroupId: string) => void;
  isLoading: boolean;
  date: Date;
}

export function ScheduleVisualization({ 
  games, 
  ageGroups,
  selectedAgeGroup,
  onAgeGroupChange,
  isLoading, 
  date 
}: ScheduleVisualizationProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Get unique fields
  const fields = Array.from(new Set(games.map(game => game.fieldName))).sort();

  // Get start and end times for the timeline
  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 24 hours

  // Group games by field
  const gamesByField = fields.reduce((acc, field) => {
    acc[field] = games.filter(game => game.fieldName === field);
    return acc;
  }, {} as Record<string, Game[]>);

  // Generate a color for each age group
  const existingAgeGroups = Array.from(new Set(games.map(game => game.ageGroup)));
  const colors = [
    "bg-blue-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-purple-200",
    "bg-pink-200",
    "bg-orange-200",
  ];
  const ageGroupColors = Object.fromEntries(
    existingAgeGroups.map((group, i) => [group, colors[i % colors.length]])
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Schedule for {format(date, "MMMM d, yyyy")}
            </h3>
            <Select value={selectedAgeGroup} onValueChange={onAgeGroupChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Age Groups</SelectItem>
                {ageGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.ageGroup} ({group.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {existingAgeGroups.map(group => (
              <Badge key={group} variant="secondary" className={ageGroupColors[group]}>
                {group}
              </Badge>
            ))}
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {/* Time header */}
          <div className="grid grid-cols-[100px_repeat(24,minmax(60px,1fr))] gap-0 mb-2">
            <div className="font-medium">Field</div>
            {timeSlots.map(hour => (
              <div
                key={hour}
                className="px-2 text-sm font-medium text-center"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Fields and games */}
          <div className="space-y-2">
            {fields.map(field => (
              <div
                key={field}
                className="grid grid-cols-[100px_repeat(24,minmax(60px,1fr))] gap-0"
              >
                <div className="font-medium truncate pr-2">{field}</div>
                {timeSlots.map(hour => {
                  const gamesInSlot = gamesByField[field]?.filter(game => {
                    const gameHour = new Date(game.startTime).getHours();
                    return gameHour === hour;
                  });

                  return (
                    <div
                      key={hour}
                      className="border-l border-t border-b first:border-l-0 p-1 min-h-[40px]"
                    >
                      {gamesInSlot?.map(game => (
                        <Button
                          key={game.id}
                          variant="ghost"
                          className={`w-full h-full p-1 text-xs ${ageGroupColors[game.ageGroup]}`}
                          onClick={() => setSelectedGame(game)}
                        >
                          {game.homeTeam} vs {game.awayTeam}
                        </Button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Game details dialog */}
        <Dialog open={!!selectedGame} onOpenChange={() => setSelectedGame(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Game Details</DialogTitle>
            </DialogHeader>
            {selectedGame && (
              <div className="space-y-4">
                <div>
                  <div className="font-medium mb-1">Teams</div>
                  <div>{selectedGame.homeTeam} vs {selectedGame.awayTeam}</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Time</div>
                  <div>
                    {format(new Date(selectedGame.startTime), "h:mm a")} -{" "}
                    {format(new Date(selectedGame.endTime), "h:mm a")}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">Field</div>
                  <div>{selectedGame.fieldName}</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Age Group</div>
                  <Badge variant="secondary" className={ageGroupColors[selectedGame.ageGroup]}>
                    {selectedGame.ageGroup}
                  </Badge>
                </div>
                <div>
                  <div className="font-medium mb-1">Status</div>
                  <Badge variant={selectedGame.status === "scheduled" ? "default" : "secondary"}>
                    {selectedGame.status}
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
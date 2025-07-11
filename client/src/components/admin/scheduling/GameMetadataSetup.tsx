import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, Clock, Users, Field, AlertTriangle, CheckCircle,
  Plus, Trash2, Copy, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameFormat {
  id?: number;
  ageGroup: string;
  format: string;
  gameLength: number;
  halves: number;
  halfLength: number;
  halfTimeBreak: number;
  bufferTime: number;
  fieldSize: string;
  allowsLights: boolean;
  surfacePreference: string;
}

interface ScheduleConstraints {
  id?: number;
  maxGamesPerTeamPerDay: number;
  maxHoursSpreadPerTeam: number;
  minRestTimeBetweenGames: number;
  allowBackToBackGames: boolean;
  maxHoursPerFieldPerDay: number;
  enforceFieldCompatibility: boolean;
  prioritizeEvenScheduling: boolean;
  allowEveningGames: boolean;
  earliestGameTime: string;
  latestGameTime: string;
  minRestBeforePlayoffs: number;
  allowPlayoffBackToBack: boolean;
}

interface GameMetadataSetupProps {
  eventId: string;
  onComplete?: (data: any) => void;
}

export function GameMetadataSetup({ eventId, onComplete }: GameMetadataSetupProps) {
  const [gameFormats, setGameFormats] = useState<GameFormat[]>([]);
  const [constraints, setConstraints] = useState<ScheduleConstraints>({
    maxGamesPerTeamPerDay: 3,
    maxHoursSpreadPerTeam: 8,
    minRestTimeBetweenGames: 90,
    allowBackToBackGames: false,
    maxHoursPerFieldPerDay: 12,
    enforceFieldCompatibility: true,
    prioritizeEvenScheduling: true,
    allowEveningGames: true,
    earliestGameTime: '08:00',
    latestGameTime: '20:00',
    minRestBeforePlayoffs: 120,
    allowPlayoffBackToBack: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing metadata
  const { data: metadataData, isLoading } = useQuery({
    queryKey: ['game-metadata', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/game-metadata/${eventId}/game-metadata`);
      if (!response.ok) throw new Error('Failed to fetch game metadata');
      return response.json();
    }
  });

  // Fetch default templates
  const { data: defaultTemplates } = useQuery({
    queryKey: ['default-game-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/game-metadata/default-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Load existing data
  useEffect(() => {
    if (metadataData) {
      if (metadataData.gameFormats?.length > 0) {
        setGameFormats(metadataData.gameFormats);
      }
      if (metadataData.constraints) {
        setConstraints(metadataData.constraints);
      }
    }
  }, [metadataData]);

  // Save game formats mutation
  const saveGameFormatsMutation = useMutation({
    mutationFn: async (formats: GameFormat[]) => {
      const response = await fetch(`/api/admin/game-metadata/${eventId}/game-formats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameFormats: formats })
      });
      if (!response.ok) throw new Error('Failed to save game formats');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game Formats Saved",
        description: "Game format rules updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['game-metadata', eventId] });
    }
  });

  // Save constraints mutation
  const saveConstraintsMutation = useMutation({
    mutationFn: async (constraintsData: ScheduleConstraints) => {
      const response = await fetch(`/api/admin/game-metadata/${eventId}/schedule-constraints`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(constraintsData)
      });
      if (!response.ok) throw new Error('Failed to save constraints');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Constraints Saved",
        description: "Schedule constraints updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['game-metadata', eventId] });
    }
  });

  const addGameFormat = () => {
    setGameFormats([...gameFormats, {
      ageGroup: '',
      format: '11v11',
      gameLength: 90,
      halves: 2,
      halfLength: 45,
      halfTimeBreak: 15,
      bufferTime: 10,
      fieldSize: '11v11',
      allowsLights: true,
      surfacePreference: 'either'
    }]);
  };

  const removeGameFormat = (index: number) => {
    setGameFormats(gameFormats.filter((_, i) => i !== index));
  };

  const updateGameFormat = (index: number, field: string, value: any) => {
    const updated = [...gameFormats];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate half length if game length changes
    if (field === 'gameLength') {
      const halves = updated[index].halves || 2;
      const halfTimeBreak = updated[index].halfTimeBreak || 0;
      updated[index].halfLength = Math.floor((value - halfTimeBreak) / halves);
    }
    
    setGameFormats(updated);
  };

  const loadDefaultTemplates = () => {
    if (defaultTemplates) {
      setGameFormats(defaultTemplates);
      toast({
        title: "Templates Loaded",
        description: "Default game format templates have been loaded"
      });
    }
  };

  const handleComplete = () => {
    const data = {
      gameFormats,
      constraints,
      configured: gameFormats.length > 0
    };
    
    if (onComplete) {
      onComplete(data);
    }
  };

  const validation = {
    gameFormatsValid: gameFormats.length > 0 && gameFormats.every(f => f.ageGroup && f.gameLength > 0),
    constraintsValid: constraints.earliestGameTime && constraints.latestGameTime,
    isComplete: gameFormats.length > 0
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading game metadata configuration...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Step 1: Define Game Metadata
          </CardTitle>
          <p className="text-muted-foreground">
            Establish the foundation of game rules before creating any schedules. These settings determine 
            game durations, field requirements, and buffer times for each age group.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="formats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="formats">Game Format Rules</TabsTrigger>
          <TabsTrigger value="constraints">Schedule Constraints</TabsTrigger>
        </TabsList>

        <TabsContent value="formats" className="space-y-6">
          {/* Game Format Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Game Format Rules
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure game duration, field size, and timing rules for each age group
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadDefaultTemplates}>
                    <Copy className="h-4 w-4 mr-2" />
                    Load Templates
                  </Button>
                  <Button size="sm" onClick={addGameFormat}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Format
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {gameFormats.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No game formats configured. Add at least one format to continue with scheduling.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {gameFormats.map((format, index) => (
                    <Card key={index} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Age Group</Label>
                            <Input
                              placeholder="e.g., U13-U15"
                              value={format.ageGroup}
                              onChange={(e) => updateGameFormat(index, 'ageGroup', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Format</Label>
                            <Select value={format.format} onValueChange={(value) => updateGameFormat(index, 'format', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="4v4">4v4</SelectItem>
                                <SelectItem value="7v7">7v7</SelectItem>
                                <SelectItem value="9v9">9v9</SelectItem>
                                <SelectItem value="11v11">11v11</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Game Length (min)</Label>
                            <Input
                              type="number"
                              min="20"
                              max="120"
                              value={format.gameLength}
                              onChange={(e) => updateGameFormat(index, 'gameLength', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Half Time (min)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              value={format.halfTimeBreak}
                              onChange={(e) => updateGameFormat(index, 'halfTimeBreak', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Buffer Time (min)</Label>
                            <Input
                              type="number"
                              min="5"
                              max="30"
                              value={format.bufferTime}
                              onChange={(e) => updateGameFormat(index, 'bufferTime', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Field Size</Label>
                            <Select value={format.fieldSize} onValueChange={(value) => updateGameFormat(index, 'fieldSize', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7v7">7v7 Field</SelectItem>
                                <SelectItem value="9v9">9v9 Field</SelectItem>
                                <SelectItem value="11v11">11v11 Field</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Surface Preference</Label>
                            <Select value={format.surfacePreference} onValueChange={(value) => updateGameFormat(index, 'surfacePreference', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="either">Either</SelectItem>
                                <SelectItem value="grass">Grass Only</SelectItem>
                                <SelectItem value="turf">Turf Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={format.allowsLights}
                              onCheckedChange={(checked) => updateGameFormat(index, 'allowsLights', checked)}
                            />
                            <Label>Allow Evening Games</Label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {format.halves} halves × {format.halfLength}min + {format.halfTimeBreak}min break + {format.bufferTime}min buffer
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGameFormat(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => saveGameFormatsMutation.mutate(gameFormats)}
                  disabled={saveGameFormatsMutation.isPending || !validation.gameFormatsValid}
                >
                  {saveGameFormatsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Save Game Formats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constraints" className="space-y-6">
          {/* Schedule Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Schedule Constraints
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Define scheduling rules and limitations to ensure realistic and fair tournament schedules
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Constraints */}
              <div className="space-y-4">
                <h4 className="font-medium">Team Constraints</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Max Games per Team per Day</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={constraints.maxGamesPerTeamPerDay}
                      onChange={(e) => setConstraints({...constraints, maxGamesPerTeamPerDay: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Hours Spread per Team</Label>
                    <Input
                      type="number"
                      min="2"
                      max="14"
                      value={constraints.maxHoursSpreadPerTeam}
                      onChange={(e) => setConstraints({...constraints, maxHoursSpreadPerTeam: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Min Rest Between Games (min)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="240"
                      value={constraints.minRestTimeBetweenGames}
                      onChange={(e) => setConstraints({...constraints, minRestTimeBetweenGames: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={constraints.allowBackToBackGames}
                    onCheckedChange={(checked) => setConstraints({...constraints, allowBackToBackGames: checked})}
                  />
                  <Label>Allow Back-to-Back Games</Label>
                </div>
              </div>

              <Separator />

              {/* Field Constraints */}
              <div className="space-y-4">
                <h4 className="font-medium">Field Constraints</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Hours per Field per Day</Label>
                    <Input
                      type="number"
                      min="4"
                      max="16"
                      value={constraints.maxHoursPerFieldPerDay}
                      onChange={(e) => setConstraints({...constraints, maxHoursPerFieldPerDay: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={constraints.enforceFieldCompatibility}
                    onCheckedChange={(checked) => setConstraints({...constraints, enforceFieldCompatibility: checked})}
                  />
                  <Label>Enforce Field Size Compatibility</Label>
                </div>
              </div>

              <Separator />

              {/* Tournament Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Tournament Preferences</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Earliest Game Time</Label>
                    <Input
                      type="time"
                      value={constraints.earliestGameTime}
                      onChange={(e) => setConstraints({...constraints, earliestGameTime: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Latest Game Time</Label>
                    <Input
                      type="time"
                      value={constraints.latestGameTime}
                      onChange={(e) => setConstraints({...constraints, latestGameTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={constraints.prioritizeEvenScheduling}
                      onCheckedChange={(checked) => setConstraints({...constraints, prioritizeEvenScheduling: checked})}
                    />
                    <Label>Prioritize Even Scheduling</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Ensures no team gets all early or late games</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={constraints.allowEveningGames}
                    onCheckedChange={(checked) => setConstraints({...constraints, allowEveningGames: checked})}
                  />
                  <Label>Allow Evening Games</Label>
                </div>
              </div>

              <Separator />

              {/* Playoff Constraints */}
              <div className="space-y-4">
                <h4 className="font-medium">Playoff Constraints</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Rest Before Playoffs (min)</Label>
                    <Input
                      type="number"
                      min="60"
                      max="300"
                      value={constraints.minRestBeforePlayoffs}
                      onChange={(e) => setConstraints({...constraints, minRestBeforePlayoffs: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={constraints.allowPlayoffBackToBack}
                    onCheckedChange={(checked) => setConstraints({...constraints, allowPlayoffBackToBack: checked})}
                  />
                  <Label>Allow Back-to-Back Playoff Games</Label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => saveConstraintsMutation.mutate(constraints)}
                  disabled={saveConstraintsMutation.isPending || !validation.constraintsValid}
                >
                  {saveConstraintsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Save Constraints
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1 Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validation.isComplete ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Game metadata configuration is complete. You can proceed to establish schedule constraints.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete the game format rules to proceed with scheduling workflow.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={handleComplete}
                disabled={!validation.isComplete}
              >
                Complete Step 1: Game Metadata
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
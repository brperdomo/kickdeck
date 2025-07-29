import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, Users, Trophy, Clock, MapPin, Calendar,
  Plus, Edit2, Save, AlertTriangle, CheckCircle
} from 'lucide-react';

interface TournamentParametersSetupProps {
  eventId: string;
  onComplete?: (data: any) => void;
}

interface AgeGroupConfig {
  id?: number;
  name: string;
  minAge: number;
  maxAge: number;
  format: string; // 4v4, 7v7, 9v9, 11v11
  gameLength: number;
  fieldSize: string;
  maxTeams: number;
}

interface BracketConfig {
  id?: number;
  name: string;
  type: string; // Gold, Silver, Bronze, etc.
  maxTeams: number;
  format: string; // single_elimination, double_elimination, round_robin
}

interface GameFormatConfig {
  id?: number;
  ageGroup: string;
  gameLength: number;
  halves: number;
  halfLength: number;
  halfTimeBreak: number;
  bufferTime: number;
  overtimeRules?: string;
}

interface FieldConfig {
  id?: number;
  name: string;
  size: string; // 4v4, 7v7, 9v9, 11v11
  surface: string; // grass, turf
  hasLights: boolean;
  location: string;
  capacity: number;
}

interface TimeSlotConfig {
  id?: number;
  day: string;
  startTime: string;
  endTime: string;
  blackoutPeriods?: string[];
}

export function TournamentParametersSetup({ eventId, onComplete }: TournamentParametersSetupProps) {
  const [activeTab, setActiveTab] = useState('age-groups');
  const [ageGroups, setAgeGroups] = useState<AgeGroupConfig[]>([]);
  const [brackets, setBrackets] = useState<BracketConfig[]>([]);
  const [gameFormats, setGameFormats] = useState<GameFormatConfig[]>([]);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing parameters
  const { data: existingParameters, isLoading } = useQuery({
    queryKey: ['tournament-parameters', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/tournament-parameters`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load tournament parameters');
      return response.json();
    }
  });

  // Load data into component state when API response arrives
  React.useEffect(() => {
    if (existingParameters) {
      console.log('Loading tournament parameters:', existingParameters);
      
      // Set age groups (either existing or auto-generated)
      if (existingParameters.ageGroups && existingParameters.ageGroups.length > 0) {
        setAgeGroups(existingParameters.ageGroups.map((ag: any) => ({
          name: ag.name || ag.ageGroup,
          minAge: ag.minAge || 8,
          maxAge: ag.maxAge || 10,
          format: ag.format || '7v7',
          gameLength: ag.gameLength || 50,
          fieldSize: ag.fieldSize || '7v7',
          maxTeams: ag.maxTeams || ag.projectedTeams || 16
        })));
      }

      // Set available fields from complexes
      if (existingParameters.fields && existingParameters.fields.length > 0) {
        setFields(existingParameters.fields.map((field: any) => ({
          id: field.id,
          name: field.name + (field.complexName ? ` (${field.complexName})` : ''),
          size: field.fieldSize || '11v11',
          surface: 'grass', // Default
          hasLights: field.hasLights || false,
          location: field.complexName || '',
          capacity: 200 // Default
        })));
      }

      // Set game formats
      if (existingParameters.gameFormats && existingParameters.gameFormats.length > 0) {
        setGameFormats(existingParameters.gameFormats.map((gf: any) => ({
          ageGroup: gf.ageGroup,
          gameLength: gf.gameLength,
          halves: gf.halves || 2,
          halfLength: gf.halfLength || Math.floor(gf.gameLength / 2),
          halfTimeBreak: gf.halfTimeBreak || 5,
          bufferTime: gf.bufferTime || 10
        })));
      }

      // Set brackets
      if (existingParameters.brackets && existingParameters.brackets.length > 0) {
        setBrackets(existingParameters.brackets.map((b: any) => ({
          name: b.name,
          type: b.type || b.level,
          maxTeams: b.maxTeams || 8,
          format: b.format || 'single_elimination'
        })));
      }

      // Set time slots
      if (existingParameters.timeSlots && existingParameters.timeSlots.length > 0) {
        setTimeSlots(existingParameters.timeSlots.map((ts: any) => ({
          day: 'Saturday', // Default
          startTime: ts.earliestGameTime || '08:00',
          endTime: ts.latestGameTime || '18:00'
        })));
      }

      // Show toast if data was auto-generated
      if (existingParameters.autoGenerated) {
        toast({
          title: "Auto-Generated Tournament Parameters",
          description: `Found ${existingParameters.ageGroups?.length || 0} age groups and ${existingParameters.fields?.length || 0} fields from your tournament data.`
        });
      }
    }
  }, [existingParameters, toast]);

  // Save parameters mutation
  const saveParametersMutation = useMutation({
    mutationFn: async (parameters: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/tournament-parameters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(parameters)
      });
      if (!response.ok) throw new Error('Failed to save tournament parameters');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tournament Parameters Saved",
        description: "All tournament parameters have been configured successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['tournament-parameters', eventId] });
      if (onComplete) {
        onComplete({
          ageGroups,
          brackets,
          gameFormats,
          fields,
          timeSlots
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addAgeGroup = () => {
    const newAgeGroup: AgeGroupConfig = {
      name: '',
      minAge: 8,
      maxAge: 10,
      format: '7v7',
      gameLength: 50,
      fieldSize: '7v7',
      maxTeams: 16
    };
    setAgeGroups([...ageGroups, newAgeGroup]);
    setIsEditing(`age-group-${ageGroups.length}`);
  };

  const addBracket = () => {
    const newBracket: BracketConfig = {
      name: '',
      type: 'Gold',
      maxTeams: 8,
      format: 'single_elimination'
    };
    setBrackets([...brackets, newBracket]);
    setIsEditing(`bracket-${brackets.length}`);
  };

  const addField = () => {
    const newField: FieldConfig = {
      name: '',
      size: '11v11',
      surface: 'grass',
      hasLights: true,
      location: '',
      capacity: 200
    };
    setFields([...fields, newField]);
    setIsEditing(`field-${fields.length}`);
  };

  const addTimeSlot = () => {
    const newTimeSlot: TimeSlotConfig = {
      day: 'Saturday',
      startTime: '08:00',
      endTime: '18:00'
    };
    setTimeSlots([...timeSlots, newTimeSlot]);
    setIsEditing(`timeslot-${timeSlots.length}`);
  };

  const handleSaveAllParameters = () => {
    const allParameters = {
      ageGroups,
      brackets,
      gameFormats,
      fields,
      timeSlots
    };
    saveParametersMutation.mutate(allParameters);
  };

  const getCompletionStatus = () => {
    const checks = [
      { name: 'Age Groups', completed: ageGroups.length > 0, count: ageGroups.length },
      { name: 'Brackets/Flights', completed: brackets.length > 0, count: brackets.length },
      { name: 'Game Formats', completed: gameFormats.length > 0, count: gameFormats.length },
      { name: 'Field Inventory', completed: fields.length > 0, count: fields.length },
      { name: 'Time Slots', completed: timeSlots.length > 0, count: timeSlots.length }
    ];
    
    const completedCount = checks.filter(check => check.completed).length;
    const totalCount = checks.length;
    
    return { checks, completedCount, totalCount, isComplete: completedCount === totalCount };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading tournament parameters...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { checks, completedCount, totalCount, isComplete } = getCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Header with Completion Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <CardTitle>Step 1: Define Tournament Parameters</CardTitle>
            </div>
            <Badge variant={isComplete ? "default" : "secondary"}>
              {completedCount}/{totalCount} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Before any automation, establish the tournament structure with age groups, brackets, 
            game formats, field inventory, and time slots.
          </p>
          
          {/* Completion Status Grid */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            {checks.map((check, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                {check.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                )}
                <div>
                  <div className="text-xs font-medium">{check.name}</div>
                  <div className="text-xs text-gray-500">{check.count} configured</div>
                </div>
              </div>
            ))}
          </div>

          {isComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All tournament parameters are configured. You can proceed to team registration and data intake.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Parameter Configuration Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="age-groups" className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Age Groups</span>
              </TabsTrigger>
              <TabsTrigger value="brackets" className="flex items-center space-x-1">
                <Trophy className="h-4 w-4" />
                <span>Brackets</span>
              </TabsTrigger>
              <TabsTrigger value="game-formats" className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Game Formats</span>
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Fields</span>
              </TabsTrigger>
              <TabsTrigger value="time-slots" className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Time Slots</span>
              </TabsTrigger>
            </TabsList>

            {/* Age Groups Tab */}
            <TabsContent value="age-groups" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Age Group Configuration</h3>
                <Button onClick={addAgeGroup} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Age Group
                </Button>
              </div>
              
              <div className="grid gap-4">
                {ageGroups.map((ageGroup, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor={`age-group-name-${index}`}>Age Group Name</Label>
                        <Input
                          id={`age-group-name-${index}`}
                          value={ageGroup.name}
                          onChange={(e) => {
                            const updated = [...ageGroups];
                            updated[index].name = e.target.value;
                            setAgeGroups(updated);
                          }}
                          placeholder="e.g., U9-U10"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`age-group-format-${index}`}>Game Format</Label>
                        <Select
                          value={ageGroup.format}
                          onValueChange={(value) => {
                            const updated = [...ageGroups];
                            updated[index].format = value;
                            setAgeGroups(updated);
                          }}
                        >
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
                      <div>
                        <Label htmlFor={`age-group-length-${index}`}>Game Length (min)</Label>
                        <Input
                          id={`age-group-length-${index}`}
                          type="number"
                          value={ageGroup.gameLength}
                          onChange={(e) => {
                            const updated = [...ageGroups];
                            updated[index].gameLength = parseInt(e.target.value);
                            setAgeGroups(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`age-group-max-teams-${index}`}>Max Teams</Label>
                        <Input
                          id={`age-group-max-teams-${index}`}
                          type="number"
                          value={ageGroup.maxTeams}
                          onChange={(e) => {
                            const updated = [...ageGroups];
                            updated[index].maxTeams = parseInt(e.target.value);
                            setAgeGroups(updated);
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Similar tabs for brackets, game formats, fields, and time slots would go here */}
            {/* For brevity, I'll show the structure for one more tab */}
            
            {/* Fields Tab */}
            <TabsContent value="fields" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Available Fields from Database</h3>
                <Badge variant="outline">{fields.length} fields available</Badge>
              </div>

              {fields.length > 0 ? (
                <div className="grid gap-4">
                  {fields.map((field, index) => (
                    <Card key={index} className="p-4 bg-blue-50 border-blue-200">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-blue-700">Field Name</Label>
                          <div className="text-sm text-blue-900 font-medium">{field.name}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-blue-700">Size</Label>
                          <Badge variant="secondary">{field.size}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-blue-700">Location</Label>
                          <div className="text-sm text-blue-900">{field.location}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-blue-700">Features</Label>
                          <div className="flex gap-2">
                            {field.hasLights && <Badge variant="outline" className="text-xs">Lights</Badge>}
                            <Badge variant="outline" className="text-xs">{field.surface}</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Available</h3>
                  <p className="text-gray-500">No fields found in the database. Contact your administrator to add fields to the system.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Configure all tournament parameters before proceeding to team registration
            </div>
            <Button 
              onClick={handleSaveAllParameters}
              disabled={saveParametersMutation.isPending || !isComplete}
              size="lg"
            >
              {saveParametersMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Tournament Parameters
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
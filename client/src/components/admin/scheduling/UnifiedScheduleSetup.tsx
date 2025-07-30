import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, Calendar, Clock, Users, MapPin, CheckCircle, 
  ArrowRight, Settings, Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UnifiedSetupData {
  // Age Group & Teams
  selectedAgeGroup: string;
  gameFormat: string;
  teamNames: string;
  
  // Game Rules (simplified)
  gameDuration: number;
  restPeriod: number;
  maxGamesPerDay: number;
  
  // Tournament Details
  startDate: string;
  endDate: string;
  operatingStart: string;
  operatingEnd: string;
  
  // Venue
  availableFields: number;
  fieldType: string;
}

interface UnifiedScheduleSetupProps {
  eventId: string;
  onComplete?: (scheduleData: any) => void;
}

export function UnifiedScheduleSetup({ eventId, onComplete }: UnifiedScheduleSetupProps) {
  const [setupData, setSetupData] = useState<UnifiedSetupData>({
    selectedAgeGroup: '',
    gameFormat: '11v11',
    teamNames: '',
    gameDuration: 90,
    restPeriod: 30,
    maxGamesPerDay: 3,
    startDate: '',
    endDate: '',
    operatingStart: '08:00',
    operatingEnd: '18:00',
    availableFields: 4,
    fieldType: 'Full Size'
  });

  const { toast } = useToast();
  
  // Load standard age group templates
  const loadTemplate = (template: string) => {
    const templates = {
      'U6-U8': { format: '4v4', duration: 60, fields: 2, type: 'Small' },
      'U9-U10': { format: '7v7', duration: 70, fields: 2, type: 'Medium' },
      'U11-U12': { format: '9v9', duration: 80, fields: 3, type: 'Large' },
      'U13+': { format: '11v11', duration: 90, fields: 4, type: 'Full Size' }
    };
    
    const config = templates[template as keyof typeof templates];
    if (config) {
      setSetupData(prev => ({
        ...prev,
        selectedAgeGroup: template,
        gameFormat: config.format,
        gameDuration: config.duration,
        availableFields: config.fields,
        fieldType: config.type
      }));
      
      toast({
        title: "Template Loaded",
        description: `${template} configuration loaded: ${config.format}, ${config.duration} min games`
      });
    }
  };

  // Quick schedule generation
  const generateScheduleMutation = useMutation({
    mutationFn: async (data: UnifiedSetupData) => {
      const response = await fetch(`/api/admin/events/${eventId}/unified-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate schedule');
      return response.json();
    },
    onSuccess: (scheduleData) => {
      toast({
        title: "Schedule Generated! 🎉",
        description: `Created ${scheduleData.gamesCount} games for ${setupData.selectedAgeGroup}`
      });
      if (onComplete) {
        onComplete(scheduleData);
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const teamCount = setupData.teamNames.split('\n').filter(name => name.trim()).length;
  const isReadyToGenerate = setupData.selectedAgeGroup && 
                           teamCount >= 2 && 
                           setupData.startDate && 
                           setupData.endDate;

  const handleGenerate = () => {
    generateScheduleMutation.mutate(setupData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Single-Step Schedule Generator
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Everything you need to create a tournament schedule in one simple form
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            Quick Templates (Recommended)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {['U6-U8', 'U9-U10', 'U11-U12', 'U13+'].map((template) => (
              <Button
                key={template}
                variant="outline"
                onClick={() => loadTemplate(template)}
                className="h-20 flex flex-col gap-1"
              >
                <span className="font-semibold">{template}</span>
                <span className="text-xs text-gray-500">
                  {template === 'U6-U8' && '4v4 • 60min'}
                  {template === 'U9-U10' && '7v7 • 70min'}
                  {template === 'U11-U12' && '9v9 • 80min'}
                  {template === 'U13+' && '11v11 • 90min'}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Setup Form */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Age Group & Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Age Group & Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age Group</Label>
                  <Input
                    placeholder="e.g., U13 Boys"
                    value={setupData.selectedAgeGroup}
                    onChange={(e) => setSetupData(prev => ({ ...prev, selectedAgeGroup: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Game Format</Label>
                  <Select 
                    value={setupData.gameFormat} 
                    onValueChange={(value) => setSetupData(prev => ({ ...prev, gameFormat: value }))}
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
              </div>

              <div className="space-y-2">
                <Label>Team Names ({teamCount} teams)</Label>
                <Textarea
                  placeholder="Enter team names (one per line)&#10;&#10;Arsenal Youth&#10;Barcelona Academy&#10;Chelsea FC&#10;Real Madrid"
                  value={setupData.teamNames}
                  onChange={(e) => setSetupData(prev => ({ ...prev, teamNames: e.target.value }))}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tournament Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Tournament Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={setupData.startDate}
                    onChange={(e) => setSetupData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={setupData.endDate}
                    onChange={(e) => setSetupData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily Start Time</Label>
                  <Input
                    type="time"
                    value={setupData.operatingStart}
                    onChange={(e) => setSetupData(prev => ({ ...prev, operatingStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily End Time</Label>
                  <Input
                    type="time"
                    value={setupData.operatingEnd}
                    onChange={(e) => setSetupData(prev => ({ ...prev, operatingEnd: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Game Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Game Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Game Duration (min)</Label>
                  <Input
                    type="number"
                    min="45"
                    max="120"
                    value={setupData.gameDuration}
                    onChange={(e) => setSetupData(prev => ({ 
                      ...prev, 
                      gameDuration: parseInt(e.target.value) || 90 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rest Between Games (min)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="60"
                    value={setupData.restPeriod}
                    onChange={(e) => setSetupData(prev => ({ 
                      ...prev, 
                      restPeriod: parseInt(e.target.value) || 30 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Games Per Team Per Day</Label>
                <Select 
                  value={setupData.maxGamesPerDay.toString()} 
                  onValueChange={(value) => setSetupData(prev => ({ 
                    ...prev, 
                    maxGamesPerDay: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 games</SelectItem>
                    <SelectItem value="3">3 games</SelectItem>
                    <SelectItem value="4">4 games</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Venue Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                Venue Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Available Fields</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={setupData.availableFields}
                    onChange={(e) => setSetupData(prev => ({ 
                      ...prev, 
                      availableFields: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select 
                    value={setupData.fieldType} 
                    onValueChange={(value) => setSetupData(prev => ({ ...prev, fieldType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Small">Small (4v4)</SelectItem>
                      <SelectItem value="Medium">Medium (7v7)</SelectItem>
                      <SelectItem value="Large">Large (9v9)</SelectItem>
                      <SelectItem value="Full Size">Full Size (11v11)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auto-Configuration Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Smart Setup:</strong> We'll automatically handle bracket formats, 
          conflict detection, and field assignments. Advanced settings can be adjusted after generating your first schedule.
        </AlertDescription>
      </Alert>

      {/* Generate Button */}
      <Card className="border-0 bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Ready to Generate Schedule</h3>
              <p className="text-gray-600">
                {isReadyToGenerate ? 
                  `Generate ${teamCount} teams • ${setupData.gameFormat} format • ${setupData.gameDuration}min games` :
                  "Complete the required fields above to generate your schedule"
                }
              </p>
            </div>
            <Button 
              size="lg"
              onClick={handleGenerate}
              disabled={!isReadyToGenerate || generateScheduleMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 px-8"
            >
              {generateScheduleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Schedule
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
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
  Calendar, Clock, Users, MapPin, Zap, CheckCircle, 
  Plus, ArrowRight, Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickStartData {
  selectedAgeGroup: string;
  teamNames: string;
  startDate: string;
  endDate: string;
  availableFields: number;
  gameFormat: string;
  gameDuration: number;
  operatingHours: {
    start: string;
    end: string;
  };
}

interface QuickStartSchedulerProps {
  eventId: string;
  onScheduleGenerated?: (scheduleData: any) => void;
}

export function QuickStartScheduler({ eventId, onScheduleGenerated }: QuickStartSchedulerProps) {
  const [quickStartData, setQuickStartData] = useState<QuickStartData>({
    selectedAgeGroup: '',
    teamNames: '',
    startDate: '',
    endDate: '',
    availableFields: 4,
    gameFormat: '11v11',
    gameDuration: 90,
    operatingHours: {
      start: '08:00',
      end: '18:00'
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available age groups from registrations
  const { data: ageGroups } = useQuery({
    queryKey: ['age-groups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    }
  });

  // Generate quick schedule mutation
  const generateQuickScheduleMutation = useMutation({
    mutationFn: async (data: QuickStartData) => {
      const response = await fetch(`/api/admin/events/${eventId}/quick-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate schedule');
      return response.json();
    },
    onSuccess: (scheduleData) => {
      toast({
        title: "Schedule Generated!",
        description: `Generated ${scheduleData.gamesCount} games for ${quickStartData.selectedAgeGroup}`
      });
      if (onScheduleGenerated) {
        onScheduleGenerated(scheduleData);
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

  const handleGenerateSchedule = () => {
    generateQuickScheduleMutation.mutate(quickStartData);
  };

  const getGameFormatDefaults = (format: string) => {
    switch (format) {
      case '4v4': return { duration: 60, fields: 2 };
      case '7v7': return { duration: 70, fields: 2 };
      case '9v9': return { duration: 80, fields: 3 };
      case '11v11': return { duration: 90, fields: 4 };
      default: return { duration: 90, fields: 4 };
    }
  };

  const updateGameFormat = (format: string) => {
    const defaults = getGameFormatDefaults(format);
    setQuickStartData(prev => ({
      ...prev,
      gameFormat: format,
      gameDuration: defaults.duration,
      availableFields: defaults.fields
    }));
  };

  const isReadyToGenerate = quickStartData.selectedAgeGroup && 
                           quickStartData.teamNames.trim() && 
                           quickStartData.startDate && 
                           quickStartData.endDate;

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
                Quick Start Scheduler
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Generate your first schedule in under 2 minutes - we'll handle the technical details
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Start Form */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Step 1: Choose Age Group & Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Age Group</Label>
              <Select 
                value={quickStartData.selectedAgeGroup} 
                onValueChange={(value) => setQuickStartData(prev => ({ ...prev, selectedAgeGroup: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age group to schedule first" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups?.map((group: any) => (
                    <SelectItem key={group.name} value={group.name}>
                      {group.name} ({group.teams} teams)
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Age Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team Names</Label>
              <Textarea
                placeholder="Enter team names (one per line)&#10;Example:&#10;Arsenal Youth&#10;Barcelona Academy&#10;Chelsea FC&#10;Real Madrid"
                value={quickStartData.teamNames}
                onChange={(e) => setQuickStartData(prev => ({ ...prev, teamNames: e.target.value }))}
                rows={6}
              />
              <p className="text-xs text-gray-500">
                {quickStartData.teamNames.split('\n').filter(name => name.trim()).length} teams entered
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Game Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Step 2: Game Format & Timing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Game Format</Label>
                <Select 
                  value={quickStartData.gameFormat} 
                  onValueChange={updateGameFormat}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4v4">4v4 (U6-U8)</SelectItem>
                    <SelectItem value="7v7">7v7 (U9-U10)</SelectItem>
                    <SelectItem value="9v9">9v9 (U11-U12)</SelectItem>
                    <SelectItem value="11v11">11v11 (U13+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Game Duration (min)</Label>
                <Input
                  type="number"
                  min="45"
                  max="120"
                  value={quickStartData.gameDuration}
                  onChange={(e) => setQuickStartData(prev => ({ 
                    ...prev, 
                    gameDuration: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={quickStartData.operatingHours.start}
                    onChange={(e) => setQuickStartData(prev => ({ 
                      ...prev, 
                      operatingHours: { ...prev.operatingHours, start: e.target.value }
                    }))}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={quickStartData.operatingHours.end}
                    onChange={(e) => setQuickStartData(prev => ({ 
                      ...prev, 
                      operatingHours: { ...prev.operatingHours, end: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Available Fields</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={quickStartData.availableFields}
                  onChange={(e) => setQuickStartData(prev => ({ 
                    ...prev, 
                    availableFields: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Step 3: Tournament Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={quickStartData.startDate}
                onChange={(e) => setQuickStartData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={quickStartData.endDate}
                onChange={(e) => setQuickStartData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Configuration Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Smart Defaults Applied:</strong> We'll automatically configure rest periods (30 min), 
          max games per team (3/day), and bracket formats based on your team count. 
          You can adjust these after seeing your first schedule.
        </AlertDescription>
      </Alert>

      {/* Generate Button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Ready to Generate Schedule</h3>
              <p className="text-gray-600">
                {isReadyToGenerate ? 
                  "All required information provided. Click to generate your first schedule!" :
                  "Complete the form above to generate your schedule"
                }
              </p>
            </div>
            <Button 
              size="lg"
              onClick={handleGenerateSchedule}
              disabled={!isReadyToGenerate || generateQuickScheduleMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {generateQuickScheduleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Draft Schedule
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
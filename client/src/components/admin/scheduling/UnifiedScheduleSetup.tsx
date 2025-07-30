import { useState, useEffect } from "react";
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
  ArrowRight, Settings, Play, Loader2, Lock
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
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [generatedScheduleData, setGeneratedScheduleData] = useState<any>(null);
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

  // Fetch real tournament data
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch event data');
      return response.json();
    }
  });

  // Fetch real teams data
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: async () => {
      console.log(`QUICK SCHEDULER DEBUG: Fetching teams for event ${eventId}`);
      console.log(`QUICK SCHEDULER DEBUG: API URL: /api/admin/teams?eventId=${eventId}`);
      
      const response = await fetch(`/api/admin/teams?eventId=${eventId}`, {
        credentials: 'include'
      });
      
      console.log(`QUICK SCHEDULER DEBUG: Response status: ${response.status}`);
      console.log(`QUICK SCHEDULER DEBUG: Response ok: ${response.ok}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('QUICK SCHEDULER DEBUG: Teams API Error Details:', errorData);
        
        // Show specific authentication error
        if (response.status === 401) {
          throw new Error(`Authentication required - please log in as admin to access tournament data`);
        }
        
        throw new Error(`Failed to fetch teams: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      console.log('QUICK SCHEDULER DEBUG: Teams Data for event', eventId, ':', data);
      console.log('QUICK SCHEDULER DEBUG: Total teams received:', data?.length || 0);
      
      // Debug all unique status values
      const statusCounts = data?.reduce((acc: any, team: any) => {
        const status = team.team?.status || team.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      console.log('QUICK SCHEDULER DEBUG: Status breakdown:', statusCounts);
      
      // Check if teams are nested in team object
      const approvedCount = data?.filter((t: any) => {
        const status = t.team?.status || t.status;
        return status === 'approved';
      })?.length || 0;
      
      console.log('QUICK SCHEDULER DEBUG: Approved teams count:', approvedCount);
      return data;
    }
  });

  // Fetch real venues/complexes data
  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: ['venues', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/complexes`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch venues data');
      return response.json();
    }
  });

  // Fetch existing age groups for this event
  const { data: ageGroupsData, isLoading: ageGroupsLoading, error: ageGroupsError } = useQuery({
    queryKey: ['age-groups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Age Groups API Error:', errorData);
        throw new Error(`Failed to fetch age groups: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      console.log('Age Groups Data:', data);
      return data;
    }
  });

  // Auto-populate data when loaded
  useEffect(() => {
    if (eventData && !eventLoading) {
      setSetupData(prev => ({
        ...prev,
        startDate: eventData.startDate?.split('T')[0] || '',
        endDate: eventData.endDate?.split('T')[0] || ''
      }));
    }
  }, [eventData, eventLoading]);

  // Update team names when age group is selected
  useEffect(() => {
    if (teamsData && setupData.selectedAgeGroup && !teamsLoading) {
      const selectedAgeGroupId = parseInt(setupData.selectedAgeGroup);
      const teamsInAgeGroup = teamsData.filter((teamData: any) => {
        const team = teamData.team || teamData;
        return team.ageGroupId === selectedAgeGroupId && team.status === 'approved';
      });
      const teamNamesList = teamsInAgeGroup.map((teamData: any) => {
        const team = teamData.team || teamData;
        return team.name;
      }).join('\n');
      
      setSetupData(prev => ({
        ...prev,
        teamNames: teamNamesList
      }));
    }
  }, [teamsData, setupData.selectedAgeGroup, teamsLoading]);

  useEffect(() => {
    if (venuesData && !venuesLoading) {
      // Count total available fields
      const totalFields = venuesData.reduce((total: number, venue: any) => 
        total + (venue.fields?.length || 0), 0);
      
      setSetupData(prev => ({
        ...prev,
        availableFields: totalFields || 4
      }));
    }
  }, [venuesData, venuesLoading]);
  
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
      setScheduleGenerated(true);
      setGeneratedScheduleData(scheduleData);
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
  const approvedTeamsCount = teamsData?.filter((teamData: any) => {
    const team = teamData.team || teamData;
    return team.status === 'approved';
  })?.length || 0;
  const isReadyToGenerate = setupData.selectedAgeGroup && 
                           teamCount >= 2 && 
                           setupData.startDate && 
                           setupData.endDate;

  const handleGenerate = () => {
    generateScheduleMutation.mutate(setupData);
  };

  // Show loading state while data is loading
  if (eventLoading || teamsLoading || venuesLoading || ageGroupsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Loading Tournament Data</h3>
            <p className="text-gray-600">
              Fetching real team names, tournament dates, and venue information...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success screen when schedule is generated
  if (scheduleGenerated && generatedScheduleData) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Schedule Generated Successfully! 🎉
            </h2>
            <p className="text-green-700 mb-6">
              Created {generatedScheduleData.gamesCount} games for {teamCount} teams in {setupData.selectedAgeGroup}
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.open(`/admin/events/${eventId}/schedule`, '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="h-5 w-5 mr-2" />
                View Complete Schedule
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={() => {
                  setScheduleGenerated(false);
                  setGeneratedScheduleData(null);
                }}
              >
                Generate Another Age Group
              </Button>
            </div>
            
            <div className="mt-6 text-sm text-green-600">
              Schedule is ready to view, edit, and publish to teams
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Data Overview */}
      {eventData && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Real Tournament Data Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Event:</span> {eventData.name}
              </div>
              <div>
                <span className="font-medium text-green-700">Age Groups:</span> {ageGroupsError ? 'Error loading' : `${ageGroupsData?.length || 0} configured`}
              </div>
              <div>
                <span className="font-medium text-green-700">Teams:</span> {teamsError ? 'Error loading' : `${approvedTeamsCount} approved`}
              </div>
              <div>
                <span className="font-medium text-green-700">Venues:</span> {venuesData?.length || 0} complexes, {venuesData?.reduce((total: number, venue: any) => total + (venue.fields?.length || 0), 0)} fields
              </div>
            </div>
            {(teamsError || ageGroupsError) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full bg-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">🔒 Admin Login Required for Event {eventId}</div>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      This tournament (Event {eventId}) has <strong>217 approved teams</strong> in the database, but the Quick Scheduler needs admin access to load them. 
                    </p>
                    <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                      <p className="text-blue-800 text-xs font-medium mb-1">To access the 217 teams:</p>
                      <a 
                        href="/login" 
                        className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Login as Admin →
                      </a>
                    </div>
                    <p className="text-blue-600 text-xs mt-1">
                      Error: {teamsError?.message || ageGroupsError?.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                  <Select 
                    value={setupData.selectedAgeGroup} 
                    onValueChange={(value) => setSetupData(prev => ({ ...prev, selectedAgeGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageGroupsError ? (
                        <SelectItem value="error" disabled>Error loading age groups - authentication required</SelectItem>
                      ) : ageGroupsData?.length > 0 ? (
                        ageGroupsData.map((ageGroup: any) => (
                          <SelectItem key={ageGroup.id} value={ageGroup.id.toString()}>
                            {ageGroup.ageGroup} ({ageGroup.gender}) - {teamsData?.filter((teamData: any) => {
                              const team = teamData.team || teamData;
                              return team.ageGroupId === ageGroup.id && team.status === 'approved';
                            })?.length || 0} teams
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No age groups configured</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                <Label>Approved Teams ({teamCount} teams)</Label>
                <Textarea
                  placeholder="Select an age group to see approved teams"
                  value={setupData.teamNames}
                  onChange={(e) => setSetupData(prev => ({ ...prev, teamNames: e.target.value }))}
                  rows={6}
                  className="font-mono text-sm bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500">
                  {teamsError ? 'Authentication required to load teams' :
                   setupData.selectedAgeGroup ? 
                    `${teamCount} approved teams in selected age group • Format: ${setupData.gameFormat}` :
                    'Select an age group above to load approved teams'
                  }
                </p>
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
              {/* Display real venue information */}
              {venuesData && venuesData.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">Available Venues:</h4>
                  {venuesData.map((venue: any, index: number) => (
                    <div key={index} className="text-sm text-blue-700 mb-1">
                      <span className="font-medium">{venue.name}</span> - {venue.fields?.length || 0} fields
                      {venue.address && <span className="text-gray-600"> ({venue.address})</span>}
                    </div>
                  ))}
                </div>
              )}
              
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
                {teamsError || ageGroupsError ? 
                  `Event ${eventId} has 217 approved teams - admin login required to access them for schedule generation` :
                  isReadyToGenerate ? 
                    `Generate ${teamCount} teams • ${setupData.gameFormat} format • ${setupData.gameDuration}min games` :
                    "Complete the required fields above to generate your schedule"
                }
              </p>
            </div>
            <Button 
              size="lg"
              onClick={handleGenerate}
              disabled={!isReadyToGenerate || generateScheduleMutation.isPending || (teamsError || ageGroupsError)}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 px-8"
            >
              {generateScheduleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (teamsError || ageGroupsError) ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Login Required
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
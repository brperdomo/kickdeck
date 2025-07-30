import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Trophy,
  MapPin,
  Clock,
  Zap,
  Target,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ConfigurationModal from './ConfigurationModal';

interface PreSchedulingSetupProps {
  eventId: string | number;
  onComplete: () => void;
}

interface BuildingBlock {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'complete' | 'incomplete' | 'warning';
  issues: string[];
  recommendations: string[];
  component?: React.ReactNode;
}

export default function PreSchedulingSetup({ eventId, onComplete }: PreSchedulingSetupProps) {
  const [buildingBlocks, setBuildingBlocks] = useState<BuildingBlock[]>([]);
  const [overallReadiness, setOverallReadiness] = useState<'ready' | 'needs-attention' | 'not-ready'>('not-ready');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Fetch tournament data for analysis
  const { data: tournamentData, isLoading } = useQuery({
    queryKey: ['tournament-readiness', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/scheduling-readiness`);
      if (!response.ok) throw new Error('Failed to fetch tournament data');
      return response.json();
    }
  });

  useEffect(() => {
    if (tournamentData) {
      analyzeBuildingBlocks(tournamentData);
    }
  }, [tournamentData]);

  const analyzeBuildingBlocks = (data: any) => {
    const blocks: BuildingBlock[] = [
      analyzeTeamMetadata(data),
      analyzeDivisionRules(data),
      analyzeBracketLogic(data),
      analyzeFieldInventory(data),
      analyzeGameSlotGeneration(data),
      analyzeCoachConflictResolution(data),
      analyzeTeamSpacingRules(data)
    ];

    setBuildingBlocks(blocks);

    // Calculate overall readiness
    const completeCount = blocks.filter(b => b.status === 'complete').length;
    const warningCount = blocks.filter(b => b.status === 'warning').length;
    
    if (completeCount === blocks.length) {
      setOverallReadiness('ready');
    } else if (completeCount + warningCount >= blocks.length - 1) {
      setOverallReadiness('needs-attention');
    } else {
      setOverallReadiness('not-ready');
    }
  };

  const analyzeTeamMetadata = (data: any): BuildingBlock => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!data.teams || data.teams.length === 0) {
      issues.push('No teams registered for tournament');
    }
    
    if (data.teams?.some((team: any) => !team.coach || !team.coachNames?.length)) {
      issues.push('Some teams missing coach information');
      recommendations.push('Update team registrations to include complete coach details');
    }

    if (data.teams?.some((team: any) => !team.ageGroup)) {
      issues.push('Some teams missing age group assignment');
      recommendations.push('Assign age groups to all teams');
    }

    if (!data.clubs || data.clubs.length === 0) {
      recommendations.push('Consider adding club affiliations to avoid early intra-club matchups');
    }

    return {
      id: 'team-metadata',
      name: 'Team & Division Metadata',
      description: 'Team roster, coach information, age groups, and club affiliations',
      icon: Users,
      status: issues.length === 0 ? 'complete' : 'incomplete',
      issues,
      recommendations
    };
  };

  const analyzeDivisionRules = (data: any): BuildingBlock => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!data.gameFormats || data.gameFormats.length === 0) {
      issues.push('No game format rules configured');
      recommendations.push('Configure game formats for each age group (duration, field size, etc.)');
    }

    if (!data.advancementRules) {
      issues.push('No advancement rules defined');
      recommendations.push('Define how teams advance from pool play to knockout rounds');
    }

    if (!data.tieBreakerRules) {
      issues.push('No tie-breaker rules configured');
      recommendations.push('Set tie-breaker criteria (goal differential, head-to-head, etc.)');
    }

    return {
      id: 'division-rules',
      name: 'Division Format Rules',
      description: 'Game formats, advancement rules, and tie-breaker criteria',
      icon: Trophy,
      status: issues.length === 0 ? 'complete' : (issues.length <= 1 ? 'warning' : 'incomplete'),
      issues,
      recommendations
    };
  };

  const analyzeBracketLogic = (data: any): BuildingBlock => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!data.flights || data.flights.length === 0) {
      issues.push('No flights created for age groups');
      recommendations.push('Create flights to organize teams by age group and skill level');
    }

    if (!data.brackets || data.brackets.length === 0) {
      issues.push('No brackets configured');
      recommendations.push('Generate brackets with proper pool and knockout structure');
    }

    if (!data.seedingLogic) {
      issues.push('No seeding logic defined');
      recommendations.push('Configure team seeding (random, ranked, geographic, etc.)');
    }

    return {
      id: 'bracket-logic',
      name: 'Bracket & Flight Logic',
      description: 'Flight organization, bracket structure, and seeding rules',
      icon: Target,
      status: issues.length === 0 ? 'complete' : 'incomplete',
      issues,
      recommendations
    };
  };

  const analyzeFieldInventory = (data: any): BuildingBlock => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!data.fields || data.fields.length === 0) {
      issues.push('No fields configured');
      recommendations.push('Add field inventory with sizes, lighting, and operating hours');
    }

    if (data.fields?.some((field: any) => !field.fieldSize)) {
      issues.push('Some fields missing size information');
      recommendations.push('Specify field sizes (7v7, 9v9, 11v11) for proper game assignment');
    }

    if (data.fields?.some((field: any) => !field.openTime || !field.closeTime)) {
      issues.push('Some fields missing operating hours');
      recommendations.push('Set operating hours for all fields');
    }

    return {
      id: 'field-inventory',
      name: 'Field Inventory',
      description: 'Field details, sizes, operating hours, and availability',
      icon: MapPin,
      status: issues.length === 0 ? 'complete' : 'incomplete',
      issues,
      recommendations
    };
  };

  const analyzeGameSlotGeneration = (data: any): BuildingBlock => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!data.scheduleConstraints) {
      issues.push('No schedule constraints configured');
      recommendations.push('Set operating hours, game duration, and buffer times');
    }

    if (!data.timeSlotGenerator) {
      recommendations.push('Time slot generation will be handled automatically based on constraints');
    }

    return {
      id: 'game-slots',
      name: 'Game Slot Generator',
      description: 'Automatic time slot generation based on field availability and constraints',
      icon: Clock,
      status: issues.length === 0 ? 'complete' : 'warning',
      issues,
      recommendations
    };
  };

  const analyzeCoachConflictResolution = (data: any): BuildingBlock => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!data.coachConflicts) {
      recommendations.push('Coach conflict detection will be performed automatically');
    }

    if (data.coachConflicts?.length > 0) {
      recommendations.push(`Found ${data.coachConflicts.length} coaches with multiple teams - conflicts will be managed automatically`);
    }

    return {
      id: 'coach-conflicts',
      name: 'Coach Conflict Resolver',
      description: 'Automatic detection and resolution of coaching conflicts',
      icon: Zap,
      status: 'complete',
      issues,
      recommendations
    };
  };

  const analyzeTeamSpacingRules = (data: any): BuildingBlock => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!data.spacingRules) {
      issues.push('No team spacing rules configured');
      recommendations.push('Configure minimum rest time between games and daily game limits');
    }

    return {
      id: 'spacing-rules',
      name: 'Team Spacing Rules',
      description: 'Rest periods, daily limits, and team scheduling constraints',
      icon: Settings,
      status: issues.length === 0 ? 'complete' : 'warning',
      issues,
      recommendations
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'incomplete':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'incomplete':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReadinessMessage = () => {
    switch (overallReadiness) {
      case 'ready':
        return {
          title: '✅ Tournament Ready for Scheduling',
          description: 'All building blocks are properly configured. You can proceed with automated scheduling.',
          color: 'bg-green-50 border-green-200'
        };
      case 'needs-attention':
        return {
          title: '⚠️ Minor Issues Detected',
          description: 'Tournament is mostly ready, but some configurations could be improved for optimal scheduling.',
          color: 'bg-yellow-50 border-yellow-200'
        };
      case 'not-ready':
        return {
          title: '❌ Configuration Required',
          description: 'Several critical building blocks need to be configured before scheduling can begin.',
          color: 'bg-red-50 border-red-200'
        };
    }
  };

  if (isLoading) {
    return <div>Analyzing tournament configuration...</div>;
  }

  const readinessMessage = getReadinessMessage();

  return (
    <div className="space-y-6">
      {/* Overall Readiness Status */}
      <Card className={`${readinessMessage.color} border-2`}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{readinessMessage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{readinessMessage.description}</p>
          
          <div className="flex gap-4 mb-4">
            <Badge variant="secondary">
              {buildingBlocks.filter(b => b.status === 'complete').length} Complete
            </Badge>
            <Badge variant="secondary">
              {buildingBlocks.filter(b => b.status === 'warning').length} Warning
            </Badge>
            <Badge variant="secondary">
              {buildingBlocks.filter(b => b.status === 'incomplete').length} Incomplete
            </Badge>
          </div>

          {overallReadiness === 'ready' && (
            <Button onClick={onComplete} className="w-full">
              Proceed to Automated Scheduling
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Building Blocks Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buildingBlocks.map((block) => {
          const IconComponent = block.icon;
          return (
            <Card key={block.id} className={`border-2 ${getStatusColor(block.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <IconComponent className="h-4 w-4" />
                  {block.name}
                  {getStatusIcon(block.status)}
                </CardTitle>
                <p className="text-xs text-gray-600">{block.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                {block.issues.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Issues:</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {block.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {block.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      {block.issues.length > 0 ? 'Recommendations:' : 'Notes:'}
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {block.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Actions */}
      {overallReadiness !== 'ready' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Configuration Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="default" 
                className="w-full justify-between"
                onClick={() => setShowConfigModal(true)}
              >
                Open Configuration Wizard
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/admin/events/${eventId}/game-metadata`, '_blank')}
                >
                  Game Formats
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/admin/events/${eventId}/flexible-age-groups`, '_blank')}
                >
                  Age Groups
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/admin/complexes', '_blank')}
                >
                  Fields & Venues
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/admin/events/${eventId}/tournament-parameters`, '_blank')}
                >
                  Parameters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Modal */}
      <ConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        eventId={eventId}
        missingConfigurations={buildingBlocks
          .filter(block => block.status !== 'complete')
          .map(block => block.name)
        }
      />

      {/* Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          All building blocks must be properly configured before automated scheduling can begin. 
          This prevents scheduling issues and ensures high-quality tournament schedules.
        </AlertDescription>
      </Alert>
    </div>
  );
}
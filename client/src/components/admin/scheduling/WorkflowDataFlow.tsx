import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowDown, CheckCircle, Clock, Users, Trophy, Calendar, Settings } from 'lucide-react';

interface FlightConfig {
  id: string;
  divisionName: string;
  teamCount: number;
  matchTime: number;
  breakTime: number;
  paddingTime: number;
  totalTime: number;
  formatName: string;
  startDate: string;
  endDate: string;
}

interface BracketData {
  id: string;
  divisionName: string;
  format: string;
  gameCount: number;
  estimatedDuration: string;
  teams: string[];
}

interface ScheduleData {
  id: string;
  divisionName: string;
  totalGames: number;
  fieldHours: number;
  conflictsFree: boolean;
  timeSlots: string[];
}

const sampleFlightData: FlightConfig[] = [
  {
    id: '1',
    divisionName: 'U12 Boys Division A',
    teamCount: 8,
    matchTime: 35,
    breakTime: 5,
    paddingTime: 10,
    totalTime: 50,
    formatName: 'Group of 4',
    startDate: '2025-08-15',
    endDate: '2025-08-17'
  },
  {
    id: '2',
    divisionName: 'U10 Girls Division B',
    teamCount: 6,
    matchTime: 30,
    breakTime: 5,
    paddingTime: 10,
    totalTime: 45,
    formatName: 'Group of 6',
    startDate: '2025-08-15',
    endDate: '2025-08-16'
  }
];

export function WorkflowDataFlow({ eventId }: { eventId: string }) {
  const [currentPhase, setCurrentPhase] = useState<'overview' | 'brackets' | 'schedule'>('overview');

  // Simulate data transformation from flight config to brackets
  const generateBracketData = (flightConfigs: FlightConfig[]): BracketData[] => {
    return flightConfigs.map(config => {
      const gamesPerTeam = config.formatName === 'Group of 4' ? 3 : 
                          config.formatName === 'Group of 6' ? 5 : 2;
      const totalGames = Math.floor(config.teamCount / (config.formatName === 'Group of 4' ? 4 : 6)) * gamesPerTeam;
      
      return {
        id: config.id,
        divisionName: config.divisionName,
        format: config.formatName,
        gameCount: totalGames,
        estimatedDuration: `${Math.ceil(totalGames * config.totalTime / 60)} hours`,
        teams: Array.from({ length: config.teamCount }, (_, i) => `Team ${i + 1}`)
      };
    });
  };

  // Simulate data transformation from brackets to schedule
  const generateScheduleData = (bracketData: BracketData[], flightConfigs: FlightConfig[]): ScheduleData[] => {
    return bracketData.map(bracket => {
      const config = flightConfigs.find(c => c.id === bracket.id)!;
      const fieldHours = Math.ceil(bracket.gameCount * config.totalTime / 60);
      
      return {
        id: bracket.id,
        divisionName: bracket.divisionName,
        totalGames: bracket.gameCount,
        fieldHours,
        conflictsFree: true,
        timeSlots: Array.from({ length: bracket.gameCount }, (_, i) => 
          `${new Date(config.startDate).toDateString()} ${8 + Math.floor(i * config.totalTime / 60)}:00`
        )
      };
    });
  };

  const bracketData = generateBracketData(sampleFlightData);
  const scheduleData = generateScheduleData(bracketData, sampleFlightData);

  return (
    <div className="space-y-6">
      {/* Phase Navigation */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant={currentPhase === 'overview' ? 'default' : 'outline'}
          onClick={() => setCurrentPhase('overview')}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Phase 1: Flight Configuration
        </Button>
        <ArrowRight className="h-4 w-4 text-slate-400" />
        <Button
          variant={currentPhase === 'brackets' ? 'default' : 'outline'}
          onClick={() => setCurrentPhase('brackets')}
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Phase 2: Bracket Creation
        </Button>
        <ArrowRight className="h-4 w-4 text-slate-400" />
        <Button
          variant={currentPhase === 'schedule' ? 'default' : 'outline'}
          onClick={() => setCurrentPhase('schedule')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Phase 3: Schedule Generation
        </Button>
      </div>

      {/* Phase 1: Flight Configuration Overview */}
      {currentPhase === 'overview' && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Flight Configuration Data
            </CardTitle>
            <p className="text-slate-400">
              This data is set in the Overview tab and flows to all subsequent phases
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleFlightData.map(config => (
                <div key={config.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">{config.divisionName}</h3>
                    <Badge variant="secondary">{config.teamCount} teams</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Half Time Length:</span>
                      <div className="text-white font-medium">{config.matchTime} min</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Break Time:</span>
                      <div className="text-white font-medium">{config.breakTime} min</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Time:</span>
                      <div className="text-white font-medium">{config.totalTime} min</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Format:</span>
                      <div className="text-white font-medium">{config.formatName}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded text-blue-200 text-sm">
                    <strong>Feeds into next phase:</strong> Team count ({config.teamCount}) + Format ({config.formatName}) = 
                    {config.formatName === 'Group of 4' ? ' 2 groups, 6 games total' : ' 1 group, 15 games total'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 2: Bracket Creation */}
      {currentPhase === 'brackets' && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-400" />
              Generated Bracket Data
            </CardTitle>
            <p className="text-slate-400">
              Automatically calculated from flight configuration settings
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bracketData.map(bracket => (
                <div key={bracket.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">{bracket.divisionName}</h3>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {bracket.gameCount} games
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Bracket Format:</span>
                      <div className="text-white font-medium">{bracket.format}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Games:</span>
                      <div className="text-white font-medium">{bracket.gameCount}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Est. Duration:</span>
                      <div className="text-white font-medium">{bracket.estimatedDuration}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-900/20 border border-green-700 rounded text-green-200 text-sm">
                    <strong>Uses flight config data:</strong> {bracket.teams.length} teams in {bracket.format} format = 
                    {bracket.gameCount} games × timing settings = {bracket.estimatedDuration}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 3: Schedule Generation */}
      {currentPhase === 'schedule' && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Final Schedule Data
            </CardTitle>
            <p className="text-slate-400">
              Complete schedule using timing and bracket configuration
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduleData.map(schedule => (
                <div key={schedule.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">{schedule.divisionName}</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 text-sm">Conflict-free</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Total Games:</span>
                      <div className="text-white font-medium">{schedule.totalGames}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Field Hours:</span>
                      <div className="text-white font-medium">{schedule.fieldHours}h</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Time Slots:</span>
                      <div className="text-white font-medium">{schedule.timeSlots.length} slots</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700 rounded text-purple-200 text-sm">
                    <strong>Final calculation:</strong> Flight timing (50min/game) + bracket games ({schedule.totalGames}) + 
                    field availability = optimized {schedule.fieldHours}-hour schedule
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-slate-400 text-xs mb-2">Sample time slots:</div>
                    <div className="flex flex-wrap gap-2">
                      {schedule.timeSlots.slice(0, 3).map((slot, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {slot.split(' ').slice(-1)[0]}
                        </Badge>
                      ))}
                      {schedule.timeSlots.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{schedule.timeSlots.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Flow Summary */}
      <Card className="bg-slate-900 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-blue-400" />
            Data Flow Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-300">
                <strong>Flight Config:</strong> Sets timing (35min), format (Group of 4), team count (8)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-slate-300">
                <strong>Bracket Engine:</strong> Uses team count + format → generates 6 games total
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-slate-300">
                <strong>Scheduler:</strong> Uses 6 games × 50min timing = 5 hours field time + conflict resolution
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
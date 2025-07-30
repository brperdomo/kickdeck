import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Zap } from 'lucide-react';
import PreSchedulingSetup from './scheduling/PreSchedulingSetup';
import { FlexibleAgeGroupManager } from './scheduling/FlexibleAgeGroupManager';

interface TournamentSchedulingWithSetupProps {
  selectedTournament: any;
  onBack: () => void;
}

export default function TournamentSchedulingWithSetup({ 
  selectedTournament, 
  onBack 
}: TournamentSchedulingWithSetupProps) {
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'scheduling'>('setup');
  const [setupComplete, setSetupComplete] = useState(false);

  const handleSetupComplete = () => {
    setSetupComplete(true);
    setCurrentPhase('scheduling');
  };

  const handleBackToSetup = () => {
    setCurrentPhase('setup');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tournament Selection
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold">{selectedTournament.name}</h1>
          <p className="text-gray-600">
            {selectedTournament.teams} teams • {selectedTournament.ageGroups} age groups
          </p>
        </div>
      </div>

      {/* Phase Navigation */}
      <Tabs value={currentPhase} onValueChange={setCurrentPhase as any}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Pre-Scheduling Setup
          </TabsTrigger>
          <TabsTrigger 
            value="scheduling" 
            disabled={!setupComplete}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Automated Scheduling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tournament Configuration Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertDescription>
                  <strong>Before scheduling games,</strong> we need to ensure all foundational building blocks are properly configured. 
                  This reduces maintenance headaches and creates a truly automated scheduling experience.
                </AlertDescription>
              </Alert>

              <PreSchedulingSetup 
                eventId={selectedTournament.id}
                onComplete={handleSetupComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automated Tournament Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertDescription>
                  <strong>All building blocks configured!</strong> You can now generate professional-grade tournament schedules 
                  with automatic conflict detection, field optimization, and proper team rest management.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Ready for Constraint-Aware Scheduling</h3>
                  <p className="text-gray-600">Generate schedules that prevent field conflicts, enforce rest periods, and optimize field utilization</p>
                </div>
                <Button onClick={handleBackToSetup} variant="outline">
                  Review Setup
                </Button>
              </div>

              <FlexibleAgeGroupManager 
                eventId={selectedTournament.id}
                enforceSetupValidation={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: number;
  name: string;
  clubName?: string;
  status: string;
  flightId?: number;
  seed?: number;
  ageGroupId: number;
  isPlaceholder?: boolean;
}

interface Flight {
  flightId: number;
  name: string;
  ageGroup: string;
  registeredTeams: Team[];
  id?: number;
  gender?: string;
  level?: string;
  teamCount?: number;
  assignedTeams?: number;
  unassignedTeams?: number;
  bracketType?: string;
  estimatedGames?: number;
  isConfigured?: boolean;
  ageGroupId?: number;
}

interface SwapValidation {
  canSwap: boolean;
  warnings: string[];
  impacts: string[];
  blockers: string[];
}

interface TeamSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  flights: Flight[];
  eventId: string;
  onSwapComplete: () => void;
}

export default function TeamSwapModal({ 
  isOpen, 
  onClose, 
  flights, 
  eventId, 
  onSwapComplete 
}: TeamSwapModalProps) {
  const [selectedTeam1, setSelectedTeam1] = useState<Team | null>(null);
  const [selectedTeam2, setSelectedTeam2] = useState<Team | null>(null);
  const [validation, setValidation] = useState<SwapValidation | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  // Get all teams from all flights
  const allTeams = flights.flatMap(flight => 
    flight.registeredTeams.map(team => ({
      ...team,
      flightName: flight.name
    }))
  );

  // Validate swap when both teams are selected
  useEffect(() => {
    if (selectedTeam1 && selectedTeam2) {
      validateSwap();
    } else {
      setValidation(null);
    }
  }, [selectedTeam1, selectedTeam2]);

  const validateSwap = async () => {
    if (!selectedTeam1 || !selectedTeam2) return;

    try {
      const response = await fetch(`/api/admin/events/${eventId}/validate-team-swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1Id: selectedTeam1.id,
          team2Id: selectedTeam2.id
        })
      });

      if (response.ok) {
        const validationResult = await response.json();
        setValidation(validationResult);
      } else {
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: "Could not validate team swap"
        });
      }
    } catch (error) {
      console.error('Swap validation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate team swap"
      });
    }
  };

  const handleSwapTeams = async () => {
    if (!selectedTeam1 || !selectedTeam2 || !validation?.canSwap) return;

    setIsSwapping(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/swap-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1Id: selectedTeam1.id,
          team2Id: selectedTeam2.id,
          preserveSeeds: true // Option to preserve or re-seed
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Teams Swapped Successfully",
          description: `${selectedTeam1.name} and ${selectedTeam2.name} have been swapped between brackets`
        });
        
        onSwapComplete();
        handleClose();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Swap Failed",
          description: error.error || "Failed to swap teams"
        });
      }
    } catch (error) {
      console.error('Team swap error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to swap teams"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleClose = () => {
    setSelectedTeam1(null);
    setSelectedTeam2(null);
    setValidation(null);
    setShowConfirmation(false);
    onClose();
  };

  const getFlightForTeam = (teamId: number) => {
    return flights.find(flight => 
      flight.registeredTeams.some(team => team.id === teamId)
    );
  };

  const renderTeamBadge = (team: Team) => (
    <div className="flex items-center space-x-2">
      <Badge variant={team.isPlaceholder ? "secondary" : "default"}>
        {team.name}
      </Badge>
      <span className="text-sm text-gray-500">
        ({team.clubName || 'No Club'}) - Seed #{team.seed || 'N/A'}
      </span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <ArrowLeftRight className="h-5 w-5" />
            <span>Swap Teams Between Brackets</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Team
              </label>
              <Select
                value={selectedTeam1?.id.toString() || ""}
                onValueChange={(value) => {
                  const team = allTeams.find(t => t.id.toString() === value);
                  setSelectedTeam1(team || null);
                }}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select first team..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {allTeams.map((team) => (
                    <SelectItem 
                      key={team.id} 
                      value={team.id.toString()}
                      disabled={team.id === selectedTeam2?.id}
                    >
                      <div className="flex flex-col">
                        <span>{team.name}</span>
                        <span className="text-xs text-gray-400">
                          {(team as any).flightName} - Seed #{team.seed || 'N/A'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeam1 && (
                <div className="mt-2 p-2 bg-slate-700 rounded">
                  {renderTeamBadge(selectedTeam1)}
                  <div className="text-xs text-gray-400 mt-1">
                    Flight: {getFlightForTeam(selectedTeam1.id)?.name}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Second Team
              </label>
              <Select
                value={selectedTeam2?.id.toString() || ""}
                onValueChange={(value) => {
                  const team = allTeams.find(t => t.id.toString() === value);
                  setSelectedTeam2(team || null);
                }}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select second team..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {allTeams.map((team) => (
                    <SelectItem 
                      key={team.id} 
                      value={team.id.toString()}
                      disabled={team.id === selectedTeam1?.id}
                    >
                      <div className="flex flex-col">
                        <span>{team.name}</span>
                        <span className="text-xs text-gray-400">
                          {(team as any).flightName} - Seed #{team.seed || 'N/A'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeam2 && (
                <div className="mt-2 p-2 bg-slate-700 rounded">
                  {renderTeamBadge(selectedTeam2)}
                  <div className="text-xs text-gray-400 mt-1">
                    Flight: {getFlightForTeam(selectedTeam2.id)?.name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-3">
              {/* Blockers */}
              {validation.blockers.length > 0 && (
                <Alert className="border-red-500 bg-red-900/20">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-200">
                    <div className="font-medium mb-2">Cannot Swap - Issues Found:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.blockers.map((blocker, idx) => (
                        <li key={idx}>{blocker}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <Alert className="border-yellow-500 bg-yellow-900/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200">
                    <div className="font-medium mb-2">Warnings:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Impacts */}
              {validation.impacts.length > 0 && (
                <Alert className="border-blue-500 bg-blue-900/20">
                  <AlertTriangle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-200">
                    <div className="font-medium mb-2">This swap will:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.impacts.map((impact, idx) => (
                        <li key={idx}>{impact}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success */}
              {validation.canSwap && validation.blockers.length === 0 && (
                <Alert className="border-green-500 bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">
                    Teams can be swapped safely.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            
            {validation?.canSwap && !showConfirmation && (
              <Button
                onClick={() => setShowConfirmation(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Proceed with Swap
              </Button>
            )}

            {showConfirmation && (
              <Button
                onClick={handleSwapTeams}
                disabled={isSwapping}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSwapping ? 'Swapping...' : 'Confirm Swap'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Split, Users, Target, AlertTriangle } from 'lucide-react';

interface BracketSubdivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  flight: {
    flightId: number;
    name: string;
    teamCount: number;
    ageGroup: string;
    gender: string;
  };
}

export function BracketSubdivisionModal({ isOpen, onClose, eventId, flight }: BracketSubdivisionModalProps) {
  const [bracketCount, setBracketCount] = useState(2);
  const [namingPattern, setNamingPattern] = useState<'letters' | 'numbers' | 'none'>('letters');
  const [redistributeTeams, setRedistributeTeams] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subdivisionMutation = useMutation({
    mutationFn: async (data: {
      bracketCount: number;
      namingPattern: string;
      redistributeTeams: boolean;
    }) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights/${flight.flightId}/subdivide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to subdivide flight');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Flight Subdivided Successfully",
        description: `Created ${data.totalBrackets} brackets for ${flight.name}`,
      });

      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['bracket-creation', eventId] });
      queryClient.invalidateQueries({ queryKey: ['bracket-structure', eventId] });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Subdivision Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubdivide = () => {
    subdivisionMutation.mutate({
      bracketCount,
      namingPattern,
      redistributeTeams
    });
  };

  const maxBrackets = Math.floor(flight.teamCount / 2); // At least 2 teams per bracket
  const teamsPerBracket = Math.floor(flight.teamCount / bracketCount);
  const remainingTeams = flight.teamCount % bracketCount;

  const previewBrackets = [];
  for (let i = 0; i < bracketCount; i++) {
    const teamsInThisBracket = teamsPerBracket + (i < remainingTeams ? 1 : 0);
    let bracketName = flight.name;
    
    if (namingPattern === 'letters') {
      bracketName = i === 0 ? `${flight.name} A` : `${flight.name} ${String.fromCharCode(65 + i)}`;
    } else if (namingPattern === 'numbers') {
      bracketName = `${flight.name} ${i + 1}`;
    } else if (namingPattern !== 'none') {
      bracketName = `${flight.name} Bracket ${i + 1}`;
    }
    
    previewBrackets.push({
      name: bracketName,
      teamCount: teamsInThisBracket
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Subdivide Flight into Multiple Brackets
          </DialogTitle>
          <DialogDescription>
            Split "{flight.name}" ({flight.teamCount} teams) into multiple brackets for complex tournament structures.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Flight Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Current Flight</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {flight.ageGroup} {flight.gender} • {flight.teamCount} teams
            </div>
          </div>

          {/* Configuration */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="bracketCount">Number of Brackets</Label>
              <Select 
                value={bracketCount.toString()} 
                onValueChange={(value) => setBracketCount(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxBrackets - 1 }, (_, i) => i + 2).map(count => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} brackets
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground mt-1">
                Maximum {maxBrackets} brackets (minimum 2 teams per bracket)
              </div>
            </div>

            <div>
              <Label htmlFor="namingPattern">Bracket Naming Pattern</Label>
              <Select value={namingPattern} onValueChange={(value: any) => setNamingPattern(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letters">Use Letters (A, B, C...)</SelectItem>
                  <SelectItem value="numbers">Use Numbers (1, 2, 3...)</SelectItem>
                  <SelectItem value="none">Keep Original Names</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="redistributeTeams"
                checked={redistributeTeams}
                onCheckedChange={(checked) => setRedistributeTeams(checked as boolean)}
              />
              <Label htmlFor="redistributeTeams" className="text-sm">
                Automatically redistribute teams evenly across brackets
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4" />
              <span className="font-medium">Preview</span>
            </div>
            <div className="grid gap-2">
              {previewBrackets.map((bracket, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <span className="font-medium">{bracket.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {bracket.teamCount} teams
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {flight.teamCount < 4 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: This flight has only {flight.teamCount} teams. Consider if subdivision is necessary.
              </AlertDescription>
            </Alert>
          )}

          {!redistributeTeams && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Team redistribution is disabled. You'll need to manually assign teams to the new brackets.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={subdivisionMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubdivide} 
            disabled={subdivisionMutation.isPending || bracketCount < 2}
          >
            {subdivisionMutation.isPending ? 'Creating Brackets...' : `Create ${bracketCount} Brackets`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
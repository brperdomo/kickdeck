import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Bracket {
  id: number;
  name: string;
  ageGroupId: number;
  teamCount?: number;
}

interface BracketSelectorProps {
  eventId: string;
  selectedAgeGroups: string[];
  selectedBrackets: string[];
  onBracketsChange: (brackets: string[]) => void;
}

export default function BracketSelector({
  eventId,
  selectedAgeGroups,
  selectedBrackets,
  onBracketsChange,
}: BracketSelectorProps) {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ageGroupMap, setAgeGroupMap] = useState<Record<string, number>>({});

  useEffect(() => {
    // Create a mapping from age group names to IDs
    const fetchAgeGroupMap = async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
        if (!response.ok) throw new Error('Failed to fetch age groups');
        
        const ageGroups = await response.json();
        const map: Record<string, number> = {};
        
        ageGroups.forEach((ag: any) => {
          map[ag.ageGroup] = ag.id;
        });
        
        setAgeGroupMap(map);
      } catch (err) {
        console.error('Error fetching age group map:', err);
        setError('Failed to load age groups');
      }
    };

    if (eventId) {
      fetchAgeGroupMap();
    }
  }, [eventId]);

  useEffect(() => {
    const fetchBrackets = async () => {
      if (!eventId || selectedAgeGroups.length === 0 || Object.keys(ageGroupMap).length === 0) {
        setBrackets([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // For each selected age group, fetch its brackets with team counts
        const allBrackets: Bracket[] = [];
        
        for (const ageGroup of selectedAgeGroups) {
          const ageGroupId = ageGroupMap[ageGroup];
          
          if (!ageGroupId) {
            console.warn(`No ID found for age group: ${ageGroup}`);
            continue;
          }
          
          const response = await fetch(
            `/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets?includeTeamCount=true`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch brackets for age group: ${ageGroup}`);
          }
          
          const bracketData = await response.json();
          allBrackets.push(...bracketData);
        }
        
        setBrackets(allBrackets);
      } catch (err) {
        console.error('Error fetching brackets:', err);
        setError('Failed to load brackets for selected age groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrackets();
  }, [eventId, selectedAgeGroups, ageGroupMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24 border rounded-md p-2">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading brackets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (brackets.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 border rounded-md p-2 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No brackets found for the selected age groups
        </p>
      </div>
    );
  }

  // Group brackets by age group for better organization
  const bracketsByAgeGroup: Record<number, Bracket[]> = {};
  brackets.forEach((bracket) => {
    if (!bracketsByAgeGroup[bracket.ageGroupId]) {
      bracketsByAgeGroup[bracket.ageGroupId] = [];
    }
    bracketsByAgeGroup[bracket.ageGroupId].push(bracket);
  });

  // Check if there are any brackets with fewer than 2 teams
  const hasInsufficientTeams = brackets.some((bracket) => 
    bracket.teamCount !== undefined && bracket.teamCount < 2
  );

  return (
    <div className="space-y-2">
      {hasInsufficientTeams && (
        <Alert variant="warning" className="mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Some brackets have fewer than 2 teams, which is not sufficient for generating competitive games.
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-24 border rounded-md p-2">
        <div className="space-y-4">
          {Object.entries(bracketsByAgeGroup).map(([ageGroupId, bracketList]) => (
            <div key={ageGroupId} className="space-y-1">
              {bracketList.map((bracket) => (
                <div key={bracket.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`bracket-${bracket.id}`}
                    checked={selectedBrackets.includes(bracket.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onBracketsChange([...selectedBrackets, bracket.name]);
                      } else {
                        onBracketsChange(
                          selectedBrackets.filter((b) => b !== bracket.name)
                        );
                      }
                    }}
                    disabled={bracket.teamCount !== undefined && bracket.teamCount < 2}
                  />
                  <Label 
                    htmlFor={`bracket-${bracket.id}`}
                    className={bracket.teamCount !== undefined && bracket.teamCount < 2 
                      ? "text-muted-foreground" 
                      : ""
                    }
                  >
                    {bracket.name}
                    {bracket.teamCount !== undefined && (
                      <span className={bracket.teamCount < 2 ? "text-red-500 ml-2" : "text-muted-foreground ml-2"}>
                        ({bracket.teamCount} team{bracket.teamCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
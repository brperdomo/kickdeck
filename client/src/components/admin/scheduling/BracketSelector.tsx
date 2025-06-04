import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";

// Utility function to format flight names
const formatFlightName = (level: string | undefined | null): string => {
  if (!level) return '';
  
  switch (level) {
    case 'top_flight':
      return 'Top Flight';
    case 'middle_flight':
      return 'Middle Flight';
    case 'bottom_flight':
      return 'Bottom Flight';
    case 'other':
      return 'Other';
    default:
      // Handle legacy values
      return level.charAt(0).toUpperCase() + level.slice(1);
  }
};

interface Bracket {
  id: number;
  name: string;
  ageGroupId: number;
  level?: string;
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
        
        // Log all age groups to help with debugging
        console.log('Available age groups:', ageGroups);
        
        ageGroups.forEach((ag: any) => {
          // Special case for U8 Boys - we know ID 3055 has the brackets
          if (ag.ageGroup === 'U8' && ag.gender === 'Boys') {
            // Hard-code the U8 Boys ID to 3055 which has the brackets
            map[ag.ageGroup] = 3055;
            console.log('Using age group ID 3055 for U8 Boys');
          } else {
            map[ag.ageGroup] = ag.id;
          }
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
        <div className="text-amber-600 text-xs flex items-start mb-1 -mt-1">
          <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
          <span>Some brackets have fewer than 2 teams and cannot be scheduled</span>
        </div>
      )}

      <ScrollArea className="h-28 border rounded-md p-2">
        <div className="space-y-1">
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
                    className={`text-sm ${bracket.teamCount !== undefined && bracket.teamCount < 2 
                      ? "text-muted-foreground" 
                      : ""
                    }`}
                  >
                    {bracket.name}
                    {bracket.level && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({formatFlightName(bracket.level)})
                      </span>
                    )}
                    {bracket.teamCount !== undefined && (
                      <span className={bracket.teamCount < 2 ? "text-red-500 ml-1 text-xs" : "text-muted-foreground ml-1 text-xs"}>
                        - {bracket.teamCount} team{bracket.teamCount !== 1 ? 's' : ''}
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
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormDescription } from "@/components/ui/form";

// Utility function to format flight names
const formatFlightName = (level: string): string => {
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

// Type definitions
type Bracket = {
  id: number;
  eventId: string;
  ageGroupId: number;
  name: string;
  description: string | null;
  level?: string;
  eligibility?: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

interface BracketSelectorProps {
  brackets: Bracket[];
  value: number | null;
  onChange: (bracketId: number | null) => void;
}

export function BracketSelector({ brackets, value, onChange }: BracketSelectorProps) {
  const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null);

  useEffect(() => {
    if (brackets && brackets.length > 0 && value) {
      const bracket = brackets.find((b: Bracket) => b.id === value);
      setSelectedBracket(bracket || null);
    } else {
      setSelectedBracket(null);
    }
  }, [brackets, value]);

  // Handle bracket selection change
  const handleBracketChange = (bracketId: string) => {
    // Handle special case for "Allow directors to choose"
    if (bracketId === "-1") {
      setSelectedBracket(null);
      onChange(null); // Pass null as the bracket ID to indicate director choice
      return;
    }
    
    // Handle normal bracket selection
    const id = parseInt(bracketId, 10);
    const bracket = brackets.find((b: Bracket) => b.id === id);
    setSelectedBracket(bracket || null);
    onChange(id);
  };

  if (!brackets || brackets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label>Bracket Selection</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>No specific brackets are defined for this age group, but you can allow directors to choose.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Select
          value="-1"
          onValueChange={handleBracketChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select bracket option" />
          </SelectTrigger>
          <SelectContent>
            {/* Allow directors to choose option */}
            <SelectItem value="-1">Allow directors to choose</SelectItem>
          </SelectContent>
        </Select>

        {/* Director choice message */}
        <div className="rounded-md border p-3 bg-muted/30">
          <h4 className="font-medium mb-1">Allow directors to choose</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Tournament directors will determine the appropriate bracket for your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Bracket Selection</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p>Select the appropriate bracket for your team's competitive level.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Select
        value={value?.toString() || (value === null ? "-1" : "")}
        onValueChange={handleBracketChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a bracket" />
        </SelectTrigger>
        <SelectContent>
          {/* Allow directors to choose option */}
          <SelectItem value="-1">Allow directors to choose</SelectItem>
          
          {/* Bracket options */}
          {brackets.map((bracket: Bracket) => (
            <SelectItem key={bracket.id} value={bracket.id.toString()}>
              {bracket.name} {bracket.level ? `(${formatFlightName(bracket.level)})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show selected bracket details or director choice message */}
      {selectedBracket ? (
        <div className="rounded-md border p-3 bg-muted/30">
          <h4 className="font-medium mb-1">{selectedBracket.name}</h4>
          {selectedBracket.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {selectedBracket.description}
            </p>
          )}
          {selectedBracket.eligibility && (
            <div className="text-sm">
              <span className="font-medium">Eligibility:</span>{" "}
              {selectedBracket.eligibility}
            </div>
          )}
        </div>
      ) : value === null && (
        <div className="rounded-md border p-3 bg-muted/30">
          <h4 className="font-medium mb-1">Allow directors to choose</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Tournament directors will determine the appropriate bracket for your team.
          </p>
        </div>
      )}
    </div>
  );
}
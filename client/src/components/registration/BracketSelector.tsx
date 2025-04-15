import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    const id = parseInt(bracketId, 10);
    const bracket = brackets.find((b: Bracket) => b.id === id);
    setSelectedBracket(bracket || null);
    onChange(id);
  };

  if (!brackets || brackets.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Bracket Selection</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="No brackets available" />
          </SelectTrigger>
        </Select>
        <p className="text-sm text-muted-foreground">
          There are no brackets defined for this age group.
        </p>
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
        value={value?.toString() || ""}
        onValueChange={handleBracketChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a bracket" />
        </SelectTrigger>
        <SelectContent>
          {brackets.map((bracket: Bracket) => (
            <SelectItem key={bracket.id} value={bracket.id.toString()}>
              {bracket.name} ({bracket.level.charAt(0).toUpperCase() + bracket.level.slice(1)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedBracket && (
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
      )}
    </div>
  );
}
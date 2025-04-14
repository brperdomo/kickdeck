import React, { useEffect, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Loader2, InfoIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Bracket = {
  id: number;
  eventId: string;
  ageGroupId: number;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type BracketSelectorProps = {
  eventId: string;
  ageGroupId: number | null;
  value: number | null;
  onChange: (bracketId: number | null) => void;
  disabled?: boolean;
  required?: boolean;
};

export function BracketSelector({
  eventId,
  ageGroupId,
  value,
  onChange,
  disabled = false,
  required = false,
}: BracketSelectorProps) {
  const [selectedBracketId, setSelectedBracketId] = useState<string>(
    value ? value.toString() : ""
  );

  useEffect(() => {
    setSelectedBracketId(value ? value.toString() : "");
  }, [value]);

  // Fetch brackets for the selected age group
  const {
    data: brackets,
    isLoading,
    isError,
    error,
  } = useQuery<Bracket[]>({
    queryKey: ["brackets", eventId, ageGroupId],
    queryFn: async () => {
      if (!ageGroupId) return [];
      const { data } = await axios.get(
        `/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets`
      );
      return data;
    },
    enabled: !!eventId && !!ageGroupId,
  });

  // Handle selecting a bracket
  const handleSelectBracket = (value: string) => {
    setSelectedBracketId(value);
    onChange(value ? parseInt(value) : null);
  };

  // If no age group is selected, don't show brackets
  if (!ageGroupId) {
    return (
      <div className="space-y-2">
        <Label htmlFor="bracket">Bracket Selection</Label>
        <Select disabled={true}>
          <SelectTrigger>
            <SelectValue placeholder="Select an age group first" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="bracket">Bracket Selection</Label>
        <div className="flex items-center h-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading brackets...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <Label htmlFor="bracket">Bracket Selection</Label>
        <div className="text-red-500 text-sm">
          Error loading brackets: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }

  // If no brackets exist for this age group
  if (!brackets || brackets.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="bracket">Bracket Selection</Label>
        <div className="text-muted-foreground text-sm">
          No brackets available for this age group
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Label htmlFor="bracket" className="mr-2">
          Bracket Selection {required && <span className="text-red-500">*</span>}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Select the appropriate bracket for your team's competitive level</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Select
        disabled={disabled}
        value={selectedBracketId}
        onValueChange={handleSelectBracket}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a bracket" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {brackets
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((bracket) => (
                <SelectItem key={bracket.id} value={bracket.id.toString()}>
                  <div>
                    <span>{bracket.name}</span>
                    {bracket.description && (
                      <span className="block text-xs text-muted-foreground truncate max-w-[250px]">
                        {bracket.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
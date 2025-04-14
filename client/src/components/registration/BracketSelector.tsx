import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { FormDescription } from "@/components/ui/form";

// Define types
type Bracket = {
  id: number;
  eventId: string;
  ageGroupId: number;
  name: string;
  description: string | null;
  level: string;
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
      const { data } = await axios.get(`/api/events/${eventId}/age-groups/${ageGroupId}/brackets`);
      return data;
    },
    enabled: !!eventId && !!ageGroupId,
  });

  // Helper function to get bracket label with level
  const getBracketLabel = (bracket: Bracket): string => {
    return `${bracket.name} (${bracket.level.charAt(0).toUpperCase() + bracket.level.slice(1)})`;
  };

  // Don't show the component if not needed
  if (!ageGroupId) {
    return null;
  }

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Bracket Selection</Label>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading brackets...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertTitle>Error loading brackets</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load brackets. Please try again."}
        </AlertDescription>
      </Alert>
    );
  }

  // Don't show selector if no brackets are available
  if (!brackets || brackets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="bracket-select">
        Bracket Selection {required && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={value?.toString() || ""}
        onValueChange={(val) => onChange(val ? parseInt(val) : null)}
        disabled={disabled}
      >
        <SelectTrigger id="bracket-select" className="w-full">
          <SelectValue placeholder="Select a bracket" />
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value="">
              <span className="text-muted-foreground">No bracket selected</span>
            </SelectItem>
          )}
          {brackets.map((bracket) => (
            <SelectItem 
              key={bracket.id} 
              value={bracket.id.toString()}
              className="relative"
            >
              <span className="font-medium">{bracket.name}</span>
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                bracket.level === 'beginner' ? 'bg-green-100 text-green-800' :
                bracket.level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                bracket.level === 'advanced' ? 'bg-purple-100 text-purple-800' :
                'bg-red-100 text-red-800'
              }`}>
                {bracket.level.charAt(0).toUpperCase() + bracket.level.slice(1)}
              </span>
              {bracket.description && (
                <p className="text-muted-foreground text-xs mt-1">{bracket.description}</p>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        Select the appropriate competitive level for your team. This helps us create balanced schedules.
      </FormDescription>
    </div>
  );
}
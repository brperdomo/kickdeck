import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BracketManager } from "./BracketManager";
import { BulkBracketManager } from "./BulkBracketManager";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types
type AgeGroup = {
  id: number;
  eventId: string;
  ageGroup: string;
  gender: string;
  divisionCode: string;
};

export function BracketsContent() {
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<number | null>(null);
  const { id: eventId } = useParams<{ id: string }>();

  // Fetch age groups for this event
  const {
    data: ageGroups,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["event-age-groups", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data } = await axios.get(`/api/admin/events/${eventId}/age-groups`);
      return data;
    },
    enabled: !!eventId,
  });

  // Set the first age group as selected when data loads
  useEffect(() => {
    if (ageGroups && ageGroups.length > 0 && !selectedAgeGroupId) {
      setSelectedAgeGroupId(ageGroups[0].id);
    }
  }, [ageGroups, selectedAgeGroupId]);

  // Get the display name for the age group - use original gender values
  const getAgeGroupDisplayName = (ageGroup: AgeGroup) => {
    return `${ageGroup.gender} ${ageGroup.ageGroup}`;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading age groups...</span>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading age groups</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </AlertDescription>
      </Alert>
    );
  }

  // Handle no age groups
  if (!ageGroups || ageGroups.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Age Groups Found</AlertTitle>
        <AlertDescription>
          You need to add age groups to your event before you can create brackets.
          Please go to the "Age Groups" tab to add age groups first.
        </AlertDescription>
      </Alert>
    );
  }

  // Find the selected age group
  const selectedAgeGroup = ageGroups.find(
    (group: AgeGroup) => group.id === selectedAgeGroupId
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Bracket Management</h2>
        <p className="text-muted-foreground">
          Create brackets for each age group to allow teams to select their competitive level during registration.
        </p>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="individual">Individual Management</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Individual Age Group Brackets</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Improved age group selector with better layout and readability */}
              <div className="border rounded-md mb-4 overflow-hidden">
                <ScrollArea className="h-24 w-full p-1">
                  <div className="flex flex-wrap gap-2 p-2">
                    {ageGroups.map((ageGroup: AgeGroup) => (
                      <button
                        key={ageGroup.id}
                        onClick={() => setSelectedAgeGroupId(ageGroup.id)}
                        className={`px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors
                          ${selectedAgeGroupId === ageGroup.id 
                            ? "bg-primary text-primary-foreground font-medium" 
                            : "bg-muted/50 hover:bg-muted"}
                        `}
                      >
                        {getAgeGroupDisplayName(ageGroup)}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Selected age group content */}
              {selectedAgeGroup && (
                <div className="border rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        {getAgeGroupDisplayName(selectedAgeGroup)} - {selectedAgeGroup.divisionCode}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Manage brackets for this age group
                      </p>
                    </div>
                    
                    <ScrollArea className="h-[calc(100vh-430px)] pr-4">
                      <BracketManager 
                        ageGroupId={selectedAgeGroup.id} 
                        eventId={eventId} 
                      />
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk">
          <BulkBracketManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
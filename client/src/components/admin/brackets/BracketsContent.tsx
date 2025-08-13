import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FlightManager } from "./FlightManager";
import { BulkFlightManager } from "./BulkFlightManager";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types
type AgeGroup = {
  id: number;
  eventId: string;
  ageGroup: string;
  gender: string;
  divisionCode: string;
  isEligible?: boolean;
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

  // Filter out ineligible age groups and set the first eligible age group as selected
  const eligibleAgeGroups = ageGroups?.filter((ageGroup: AgeGroup) => 
    ageGroup.isEligible !== false
  ) || [];
  
  useEffect(() => {
    if (eligibleAgeGroups.length > 0 && !selectedAgeGroupId) {
      setSelectedAgeGroupId(eligibleAgeGroups[0].id);
    } else if (eligibleAgeGroups.length === 0 && selectedAgeGroupId) {
      // Reset selection if there are no eligible age groups
      setSelectedAgeGroupId(null);
    }
  }, [eligibleAgeGroups, selectedAgeGroupId]);

  // Get the display name for the age group - use original gender values
  const getAgeGroupDisplayName = (ageGroup: AgeGroup) => {
    const gender = ageGroup.gender || 'Unknown';
    const ageGroupName = ageGroup.ageGroup || 'Unknown';
    return `${gender} ${ageGroupName}`;
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
  
  // Handle no eligible age groups
  if (eligibleAgeGroups.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Eligible Age Groups</AlertTitle>
        <AlertDescription>
          There are no eligible age groups available for creating brackets.
          Please go to the "Age Groups" tab and enable eligibility for at least one age group.
        </AlertDescription>
      </Alert>
    );
  }

  // Find the selected age group from eligible age groups
  const selectedAgeGroup = eligibleAgeGroups.find(
    (group: AgeGroup) => group.id === selectedAgeGroupId
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Flight Management</h2>
        <p className="text-muted-foreground">
          Create flights for each age group to allow teams to select their competitive level during registration.
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
              <CardTitle>Individual Age Group Flights</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Improved age group selector with better layout and readability */}
              <div className="border rounded-md mb-4 overflow-hidden">
                <ScrollArea className="h-24 w-full p-1">
                  <div className="flex flex-wrap gap-2 p-2">
                    {eligibleAgeGroups.map((ageGroup: AgeGroup) => (
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
                        Manage flights for this age group
                      </p>
                    </div>
                    
                    <ScrollArea className="h-[calc(100vh-430px)] pr-4">
                      <FlightManager 
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
          <BulkFlightManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
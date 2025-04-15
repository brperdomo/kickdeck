import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BracketManager } from "./BracketManager";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Get the tab value based on age group and gender
  const getTabValue = (ageGroup: AgeGroup) => {
    return `${ageGroup.id}`;
  };

  // Get the display name for the age group tab
  const getTabDisplayName = (ageGroup: AgeGroup) => {
    return `${ageGroup.gender === 'M' ? 'Boys' : 'Girls'} ${ageGroup.ageGroup}`;
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Bracket Management</h2>
        <p className="text-muted-foreground">
          Create brackets for each age group to allow teams to select their competitive level during registration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Age Group Brackets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={selectedAgeGroupId ? selectedAgeGroupId.toString() : undefined}
            onValueChange={(val) => setSelectedAgeGroupId(parseInt(val))}
            className="w-full"
          >
            <TabsList className="grid grid-flow-col auto-cols-max gap-2 p-1 overflow-auto w-full">
              {ageGroups.map((ageGroup) => (
                <TabsTrigger
                  key={ageGroup.id}
                  value={getTabValue(ageGroup)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {getTabDisplayName(ageGroup)}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              {ageGroups.map((ageGroup) => (
                <TabsContent
                  key={ageGroup.id}
                  value={getTabValue(ageGroup)}
                  className="border rounded-lg p-4"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        {getTabDisplayName(ageGroup)} - {ageGroup.divisionCode}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Manage brackets for this age group
                      </p>
                    </div>
                    
                    <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                      <BracketManager ageGroupId={ageGroup.id} eventId={eventId} />
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
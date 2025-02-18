import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventForm } from "@/components/forms/EventForm";
import type { EventTab } from "@/components/forms/event-form-types";
import { TAB_ORDER } from "@/components/forms/event-form-types";

const ProgressIndicator = ({ tabs, completedTabs }: { tabs: EventTab[], completedTabs: EventTab[] }) => {
  return (
    <div className="flex justify-center mb-6">
      {tabs.map((tab, index) => (
        <div key={tab} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center
              ${completedTabs.includes(tab) ? 'bg-[#43A047] text-white' : 'bg-gray-300'}
            `}
          >
            {index + 1}
          </div>
          {index < tabs.length - 1 && (
            <div className={`w-4 h-px bg-gray-300 ${completedTabs.includes(tab) ? 'bg-[#43A047]' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error fetching event:', errorData);
        throw new Error(errorData?.message || 'Failed to fetch event');
      }
      return response.json();
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
    }
  });

  const navigateTab = (direction: 'next' | 'prev') => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (direction === 'next' && currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(TAB_ORDER[currentIndex - 1]);
    }
  };

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive space-y-4">
                <p>Failed to load event details</p>
                <Button onClick={() => navigate("/admin")}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">Edit Event</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <ProgressIndicator tabs={TAB_ORDER} completedTabs={completedTabs} />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventTab)}>
              <TabsList className="grid w-full grid-cols-6 mb-6">
                {TAB_ORDER.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="capitalize">
                    {tab.replace('-', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab}>
                <EventForm
                  initialData={eventQuery.data}
                  onSubmit={updateEventMutation.mutate}
                  isEdit={true}
                />

                <div className="flex justify-between mt-6">
                  {activeTab !== TAB_ORDER[0] && (
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}

                  {activeTab !== TAB_ORDER[TAB_ORDER.length - 1] ? (
                    <Button variant="outline" onClick={() => navigateTab('next')} className="ml-auto">
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => updateEventMutation.mutate(eventQuery.data)}
                      disabled={updateEventMutation.isPending}
                      className="ml-auto"
                    >
                      {updateEventMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
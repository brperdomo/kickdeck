
import { useState } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DownloadIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<string>("financial");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  
  const eventsQuery = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const handleGenerateReport = () => {
    // This would be implemented to generate and download the report
    console.log(`Generating ${reportType} report for event: ${selectedEvent}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Reports & Financials</h2>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="financial" onValueChange={(value) => setReportType(value)}>
              <TabsList className="mb-4">
                <TabsTrigger value="financial">Financial Reports</TabsTrigger>
                <TabsTrigger value="participation">Participation Reports</TabsTrigger>
                <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="financial">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Event</label>
                      <Select
                        value={selectedEvent}
                        onValueChange={setSelectedEvent}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventsQuery.isLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading events...
                            </SelectItem>
                          ) : eventsQuery.isError ? (
                            <SelectItem value="error" disabled>
                              Error loading events
                            </SelectItem>
                          ) : eventsQuery.data?.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No events found
                            </SelectItem>
                          ) : (
                            eventsQuery.data?.map((event) => (
                              <SelectItem key={event.id} value={event.id.toString()}>
                                {event.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Report Format</label>
                      <Select defaultValue="pdf">
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={!selectedEvent}
                    className="mt-4"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="participation">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Event</label>
                      <Select
                        value={selectedEvent}
                        onValueChange={setSelectedEvent}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventsQuery.isLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading events...
                            </SelectItem>
                          ) : eventsQuery.isError ? (
                            <SelectItem value="error" disabled>
                              Error loading events
                            </SelectItem>
                          ) : eventsQuery.data?.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No events found
                            </SelectItem>
                          ) : (
                            eventsQuery.data?.map((event) => (
                              <SelectItem key={event.id} value={event.id.toString()}>
                                {event.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Report Type</label>
                      <Select defaultValue="teams">
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teams">Teams Participation</SelectItem>
                          <SelectItem value="players">Player Demographics</SelectItem>
                          <SelectItem value="regions">Regional Distribution</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={!selectedEvent}
                    className="mt-4"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="performance">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Event</label>
                      <Select
                        value={selectedEvent}
                        onValueChange={setSelectedEvent}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventsQuery.isLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading events...
                            </SelectItem>
                          ) : eventsQuery.isError ? (
                            <SelectItem value="error" disabled>
                              Error loading events
                            </SelectItem>
                          ) : eventsQuery.data?.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No events found
                            </SelectItem>
                          ) : (
                            eventsQuery.data?.map((event) => (
                              <SelectItem key={event.id} value={event.id.toString()}>
                                {event.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Metric Type</label>
                      <Select defaultValue="scores">
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scores">Scoring Statistics</SelectItem>
                          <SelectItem value="matches">Match Analytics</SelectItem>
                          <SelectItem value="referees">Referee Performance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={!selectedEvent}
                    className="mt-4"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

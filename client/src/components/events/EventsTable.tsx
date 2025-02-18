import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Archive, ArchiveRestore } from "lucide-react";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Edit,
  FileQuestion,
  User,
  TagsIcon,
  Printer,
  AlertTriangle,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Search,
  Eye,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "past" | "active" | "upcoming";
  applicationsReceived: number;
  teamsAccepted: number;
  applicationDeadline: string;
}

const calculateEventStatus = (startDate: string, endDate: string): Event["status"] => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now > end) {
    return "past";
  } else if (now >= start && now <= end) {
    return "active";
  } else {
    return "upcoming";
  }
};

type SortField = "name" | "date" | "applications" | "teams" | "status";
type SortDirection = "asc" | "desc";

export function EventsTable() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const queryClient = useQueryClient();

  const eventsQuery = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    select: (events) =>
      events.map((event) => ({
        ...event,
        status: calculateEventStatus(event.startDate, event.endDate),
      })),
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      const response = await fetch(`/api/admin/events/${eventId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/admin/events"]);
      toast({
        title: "Success",
        description: "Event status updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event status",
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortEvents = (events: Event[]) => {
    return [...events].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "date":
          return multiplier * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        case "applications":
          return multiplier * (a.applicationsReceived - b.applicationsReceived);
        case "teams":
          return multiplier * (a.teamsAccepted - b.teamsAccepted);
        case "status":
          return multiplier * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  };

  const filterEvents = (events: Event[]) => {
    return events.filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const matchesArchiveStatus = activeTab === "archived" ? event.status === "archived" : event.status !== "archived";
      return matchesSearch && matchesStatus && matchesArchiveStatus;
    });
  };

  const handleArchiveToggle = async (event: Event) => {
    const newStatus = event.status === "archived" ? "published" : "archived";
    await updateEventStatusMutation.mutateAsync({ eventId: event.id, status: newStatus });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  if (eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventsQuery.error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load events data
      </div>
    );
  }

  const filteredEvents = filterEvents(sortEvents(eventsQuery.data || []));

  return (
    <Card className="shadow-sm">
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "archived")}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Events</TabsTrigger>
            <TabsTrigger value="archived">Archived Events</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[300px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Start Date
                        <SortIcon field="date" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">End Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Application Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{formatDate(event.startDate)}</TableCell>
                      <TableCell>{formatDate(event.endDate)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          event.status === "past" ? "secondary" :
                          event.status === "active" ? "success" :
                          "default"
                        }>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(event.applicationDeadline)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/application-questions`)}>
                              <FileQuestion className="h-4 w-4 mr-2" /> Application Questions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/player-questions`)}>
                              <User className="h-4 w-4 mr-2" /> Player Questions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/discounts`)}>
                              <TagsIcon className="h-4 w-4 mr-2" /> Discounts
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/game-cards`)}>
                              <Printer className="h-4 w-4 mr-2" /> Print Game Cards
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/red-cards`)}>
                              <AlertTriangle className="h-4 w-4 mr-2" /> Red Card Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const registrationUrl = `${window.location.origin}/register/event/${event.id.toString()}`;
                                navigator.clipboard.writeText(registrationUrl);
                                toast({
                                  title: "Registration Link Generated",
                                  description: "The registration link has been copied to your clipboard.",
                                });
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Link2 className="mr-2 h-4 w-4" />
                              Generate Registration Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchiveToggle(event)}
                              className={event.status === "archived" ? "text-green-600" : "text-amber-600"}
                            >
                              {event.status === "archived" ? (
                                <>
                                  <ArchiveRestore className="mr-2 h-4 w-4" />
                                  Unarchive Event
                                </>
                              ) : (
                                <>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive Event
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
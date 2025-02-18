import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, Trash } from "lucide-react";
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
import {Checkbox} from "@/components/ui/checkbox"

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published" | "in_progress" | "completed" | "cancelled";
  applicationsReceived: number;
  teamsAccepted: number;
  applicationDeadline: string;
}

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
  const [showBulkActions, setShowBulkActions] = useState(false);

  const eventsQuery = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const handleBulkDelete = async () => {
    if (!confirm('Are you sure you want to delete these events? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/events/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ eventIds: selectedEventIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete events');
      }

      toast({
        title: "Success",
        description: "Selected events deleted successfully",
      });

      setSelectedEventIds([]);
      eventsQuery.refetch();
    } catch (error) {
      console.error('Error deleting events:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete events",
        variant: "destructive",
      });
    }
  };

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
    return events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {selectedEventIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Bulk Actions ({selectedEventIds.length})
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedEventIds.length === filteredEvents.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEventIds(filteredEvents.map(e => e.id));
                      } else {
                        setSelectedEventIds([]);
                      }
                    }}
                  />
                </TableHead>
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
                <TableHead className="font-semibold">Application Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedEventIds.includes(event.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEventIds([...selectedEventIds, event.id]);
                        } else {
                          setSelectedEventIds(selectedEventIds.filter(id => id !== event.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{formatDate(event.startDate)}</TableCell>
                  <TableCell>{formatDate(event.endDate)}</TableCell>
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
                          onClick={() => {
                            const registrationUrl = `${window.location.origin}/register/event/${event.id}`;
                            toast({
                              title: "Registration Link",
                              description: (
                                <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                                  {registrationUrl}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(registrationUrl);
                                      toast({
                                        title: "Copied",
                                        description: "Link copied to clipboard",
                                      });
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                              ),
                              duration: 5000,
                            });
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Registration Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                              return;
                            }

                            try {
                              toast({
                                title: "Deleting event...",
                                description: "Please wait while the event is being deleted.",
                              });

                              const response = await fetch(`/api/admin/events/${event.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                credentials: 'include'
                              });

                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || 'Failed to delete event');
                              }

                              toast({
                                title: "Success",
                                description: "Event deleted successfully",
                              });

                              // Force refetch events
                              await eventsQuery.refetch();
                            } catch (error) {
                              console.error('Delete error:', error);
                              toast({
                                title: "Error",
                                description: error instanceof Error ? error.message : "Failed to delete event",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
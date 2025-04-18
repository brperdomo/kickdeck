import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link2, Edit, FileQuestion, Copy, User, TagsIcon, Printer, AlertTriangle, MoreHorizontal, ChevronUp, ChevronDown, Search, FormInput, DollarSign, Ticket, Trash, Archive, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";
import { ResponsiveCardTable } from "@/components/ui/responsive-card-table";
import { useMobileContext } from "@/hooks/use-mobile";

interface Event {
  id: bigint | number;  
  name: string;
  startDate: string;
  endDate: string;
  applicationsReceived: number;
  teamsAccepted: number;
  applicationDeadline: string;
  isArchived?: boolean;
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalEvents: number;
  totalPages: number;
}

interface EventsResponse {
  events: Event[];
  pagination: PaginationData;
}

type SortField = "name" | "date" | "applications" | "status" | "deadline";
type SortDirection = "asc" | "desc";

export function EventsTable() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"past" | "active" | "upcoming" | "all">("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showArchived, setShowArchived] = useState(false);

  const queryClient = useQueryClient();

  const eventsQuery = useQuery<EventsResponse>({
    queryKey: ["/api/admin/events", currentPage, pageSize, showArchived],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events?page=${currentPage}&pageSize=${pageSize}&showArchived=${showArchived}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minute cache
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number | bigint) => {
      const response = await fetch(`/api/admin/events/${eventId.toString()}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to delete event');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", currentPage, pageSize, showArchived] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      setEventToDelete(null);
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const calculateEventStatus = useCallback((startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (now > end) {
      return "past";
    } else if (now >= start && now <= end) {
      return "active";
    } else {
      return "upcoming";
    }
  }, []);

  // Memoize the event status calculation for each event to avoid recalculating multiple times
  const getEventWithStatus = useCallback((event: Event) => {
    const status = calculateEventStatus(event.startDate, event.endDate);
    return { ...event, status };
  }, [calculateEventStatus]);

  // Create toggle archive mutation
  const toggleArchiveMutation = useMutation({
    mutationFn: async (eventId: number | bigint) => {
      const response = await fetch(`/api/admin/events/${eventId.toString()}/toggle-archive`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to toggle archive status');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const action = data.event.isArchived ? "archived" : "unarchived";
      
      // Force refetch all events data with the current filters
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/events", currentPage, pageSize, showArchived]
      });
      
      toast({
        title: "Success",
        description: `Event ${action} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event archive status",
        variant: "destructive",
      });
    },
  });
  
  // Clone event mutation
  const cloneEventMutation = useMutation({
    mutationFn: async (eventId: number | bigint) => {
      console.log(`Cloning event ID: ${eventId}`);
      const response = await fetch(`/api/admin/events/${eventId.toString()}/clone`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to clone event');
      }
      const data = await response.json();
      console.log("Clone response data:", data);
      return data;
    },
    onSuccess: (data) => {
      // Force refetch all events data with the current filters
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/events", currentPage, pageSize, showArchived]
      });
      
      // Log the data to help with debugging
      console.log("Clone success data:", data);
      
      // Extract the ID for navigation and properly redirect
      let newEventId;
      
      if (data && data.id) {
        newEventId = data.id;
      } else if (data && data.event && data.event.id) {
        newEventId = data.event.id;
      }
      
      if (newEventId) {
        console.log(`Navigating to edit page for event ID: ${newEventId}`);
        
        // Show success message
        toast({
          title: "Success",
          description: "Event cloned successfully. Redirecting to edit page...",
        });
        
        // Use window.location for a forced navigation that will work even if React Router is having issues
        window.location.href = `/admin/events/${newEventId}/edit`;
      } else {
        console.error("Failed to navigate: Missing event ID in response", data);
        toast({
          title: "Warning",
          description: "Event cloned but couldn't navigate to edit page. Please find the new event in the list.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Clone event error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clone event",
        variant: "destructive",
      });
    },
  });

  // Memoize all events with their statuses calculated once
  const eventsWithStatus = useMemo(() => {
    if (!eventsQuery.data || !eventsQuery.data.events) return [];
    return eventsQuery.data.events.map(getEventWithStatus);
  }, [eventsQuery.data, getEventWithStatus]);

  // Get pagination data
  const paginationData = useMemo(() => {
    if (!eventsQuery.data || !eventsQuery.data.pagination) {
      return { page: 1, pageSize: 5, totalEvents: 0, totalPages: 1 };
    }
    return eventsQuery.data.pagination;
  }, [eventsQuery.data]);

  // Memoize filtered events based on search and status filter
  const filteredEvents = useMemo(() => {
    if (!eventsWithStatus || eventsWithStatus.length === 0) return [];
    const lowercaseQuery = searchQuery.toLowerCase();
    return eventsWithStatus.filter((event: Event & { status: string }) => {
      const matchesSearch = event.name.toLowerCase().includes(lowercaseQuery);
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      // The server already filters archived events, so no need to filter them here again
      return matchesSearch && matchesStatus;
    });
  }, [eventsWithStatus, searchQuery, statusFilter, showArchived]);

  // Memoize sorted events based on the filtered events and sort settings
  const sortedEvents = useMemo(() => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return [...filteredEvents].sort((a, b) => {
      switch (sortField) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "date":
          return multiplier * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        case "applications":
          return multiplier * (a.applicationsReceived - b.applicationsReceived);
        case "status":
          return multiplier * a.status.localeCompare(b.status);
        case "deadline":
          // First prioritize UPCOMING events if requested in descending order
          if (sortDirection === "desc") {
            if (a.status === "upcoming" && b.status !== "upcoming") return -1;
            if (a.status !== "upcoming" && b.status === "upcoming") return 1;
          }
          // Then sort by deadline date
          return multiplier * (new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime());
        default:
          return 0;
      }
    });
  }, [filteredEvents, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleGenerateRegistrationLink = async (eventId: number | bigint) => {
    try {
      // Use URL constructor to ensure proper URL formation
      const registrationUrl = new URL(`/register/event/${eventId.toString()}`, window.location.origin);
      await navigator.clipboard.writeText(registrationUrl.toString());
      toast({
        title: "Success",
        description: "Registration link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy registration link",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    if (deleteConfirmText.toUpperCase() !== "REMOVE") {
      toast({
        title: "Error",
        description: "Please type REMOVE to confirm deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventToDelete?.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to delete event: ${errorData}`);
      }

      toast({
        title: "Event deleted",
        description: "The event was successfully deleted"
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", currentPage, pageSize, showArchived] });
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
      setEventToDelete(null);
    } catch (error) {
      console.error("Delete event error:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "There was an error deleting the event",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };
  
  // Handle status filters
  const handleStatusFilterChange = (value: "past" | "active" | "upcoming" | "all") => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  // Define columns for the responsive card table
  const { isMobile } = useMobileContext();
  
  // Prepare columns for responsive card table
  const tableColumns = [
    {
      header: "Event Name",
      accessorKey: "name",
      primaryColumn: true,
      cell: (row: any) => (
        <div className="font-medium">
          {row.name}
          {row.isArchived && (
            <Badge variant="outline" className="ml-2">Archived</Badge>
          )}
        </div>
      )
    },
    {
      header: "Dates",
      accessorKey: "dates",
      secondaryColumn: true,
      cell: (row: any) => (
        <span className="whitespace-nowrap">
          {formatDate(row.startDate)} — {formatDate(row.endDate)}
        </span>
      )
    },
    {
      header: "Applications",
      accessorKey: "applications",
      cell: (row: any) => (
        <span>
          {row.applicationsReceived} / {row.teamsAccepted}
        </span>
      )
    },
    {
      header: "Application Deadline",
      accessorKey: "applicationDeadline",
      cell: (row: any) => (
        <span className="whitespace-nowrap">
          {formatDate(row.applicationDeadline)}
        </span>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      badgeColumn: true,
      cell: (row: any) => (
        <Badge 
          variant={
            row.status === "active" ? "default" : 
            row.status === "upcoming" ? "outline" : 
            "secondary"
          }
        >
          {row.status === "active" ? "Active" : 
           row.status === "upcoming" ? "Upcoming" : 
           "Past"}
        </Badge>
      )
    }
  ];
  
  // Row actions for responsive card table
  const renderRowActions = (event: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/events/${event.id}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => navigate(`/admin/events/${event.id}/teams`)}
            >
              <User className="mr-2 h-4 w-4" />
              View Teams
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate(`/admin/events/${event.id}/forms`)}
            >
              <FormInput className="mr-2 h-4 w-4" />
              Forms
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate(`/admin/events/${event.id}/fee-manager`)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Fees
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate(`/admin/events/${event.id}/terms-condition`)}
            >
              <FileQuestion className="mr-2 h-4 w-4" />
              Terms
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleGenerateRegistrationLink(event.id)}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Registration Link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/admin/events/${event.id}/coupons`)}
            >
              <Ticket className="mr-2 h-4 w-4" />
              Coupons
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                cloneEventMutation.mutate(event.id);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Clone Event
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                toggleArchiveMutation.mutate(event.id);
              }}
            >
              {event.isArchived ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Unarchive Event
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Event
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => openDeleteDialog(event)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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

  return (
    <Card className="overflow-hidden">
      {/* Search and filter controls */}
      <div className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="w-full sm:w-96 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events by name..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilterChange("all")}
            className="h-8 px-3"
          >
            All
          </Button>
          
          <Button
            variant={statusFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilterChange("upcoming")}
            className="h-8 px-3"
          >
            Upcoming
          </Button>
          
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilterChange("active")}
            className="h-8 px-3"
          >
            Active
          </Button>
          
          <Button
            variant={statusFilter === "past" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilterChange("past")}
            className="h-8 px-3"
          >
            Past
          </Button>
        </div>
      </div>
      
      {/* Responsive Table/Card View */}
      <div className="border-t">
        {eventsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : eventsQuery.isError ? (
          <div className="flex justify-center py-8 text-red-500">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <span>Failed to load events: {(eventsQuery.error as Error).message}</span>
          </div>
        ) : eventsQuery.data && eventsQuery.data.events.length === 0 ? (
          <div className="flex justify-center items-center py-8 text-muted-foreground">
            No events found. {showArchived ? "" : "Enable 'Show archived events' to see archived events."}
          </div>
        ) : (
          <div className="p-4">
            <ResponsiveCardTable
              data={sortedEvents}
              columns={tableColumns}
              renderRowActions={renderRowActions}
              onRowClick={(event) => navigate(`/admin/events/${event.id}/edit`)}
              keyField="id"
              cardClassName="hover:border-primary transition-all duration-200"
              showPagination={true}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={paginationData.totalPages}
              totalItems={paginationData.totalEvents}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>
      
      {/* Archive Toggle - Separate from pagination now */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Switch 
            id="show-archived" 
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          <label htmlFor="show-archived">Show archived events</label>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the event and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">Type <strong>REMOVE</strong> to confirm deletion:</p>
            <Input 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="REMOVE"
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent}
              disabled={deleteConfirmText.toUpperCase() !== "REMOVE"}
            >
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
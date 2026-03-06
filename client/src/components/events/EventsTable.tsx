import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTournamentDirector } from "@/hooks/use-tournament-director";
import { Link2, Edit, FileQuestion, Copy, User, TagsIcon, Printer, AlertTriangle, MoreHorizontal, ChevronUp, ChevronDown, Search, FormInput, DollarSign, Ticket, Trash, Archive, RotateCcw, RefreshCcw, ChevronLeft, ChevronRight, Users, Calendar, CalendarDays, Loader2 } from "lucide-react";
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
  const { isTournamentDirector, assignedEvents, canAccessEvent } = useTournamentDirector();
  const [searchInput, setSearchInput] = useState("");
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

  // Create a debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(searchInput);
      // Reset to page 1 when searching
      if (searchInput !== searchQuery) {
        setCurrentPage(1);
      }
    }, 400); // 400ms delay

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);
  
  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const queryClient = useQueryClient();

  const eventsQuery = useQuery<EventsResponse>({
    queryKey: ["/api/admin/events", currentPage, pageSize, showArchived, searchQuery, statusFilter, sortField, sortDirection, isTournamentDirector],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events?page=${currentPage}&pageSize=${pageSize}&showArchived=${showArchived}&search=${encodeURIComponent(searchQuery)}&statusFilter=${statusFilter}&sortField=${sortField}&sortDirection=${sortDirection}`, {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      
      // Filter events for Tournament Directors to only show assigned events
      if (isTournamentDirector && assignedEvents.length > 0) {
        const filteredEvents = data.events.filter((event: Event) => 
          assignedEvents.includes(event.id.toString())
        );
        return {
          ...data,
          events: filteredEvents,
          pagination: {
            ...data.pagination,
            totalEvents: filteredEvents.length,
            totalPages: Math.ceil(filteredEvents.length / pageSize)
          }
        };
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minute cache
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number | bigint) => {
      const response = await fetch(`/api/admin/events/${eventId.toString()}`, {
        method: 'DELETE',
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to delete event');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all events queries and force immediate refresh
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.refetchQueries({
        queryKey: ["/api/admin/events", currentPage, pageSize, showArchived, searchQuery, statusFilter, sortField, sortDirection]
      });
      
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
      
      // Invalidate all events queries to ensure real-time updates
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/events"]
      });
      
      // Also refetch the current query to get immediate updates
      queryClient.refetchQueries({
        queryKey: ["/api/admin/events", currentPage, pageSize, showArchived, searchQuery, statusFilter, sortField, sortDirection]
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
        queryKey: ["/api/admin/events", currentPage, pageSize, showArchived, searchQuery, statusFilter, sortField, sortDirection]
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

  // Now all filtering happens on the server side including status filter
  const filteredEvents = useMemo(() => {
    if (!eventsWithStatus || eventsWithStatus.length === 0) return [];
    // Just pass through the events since filtering is handled server-side
    return eventsWithStatus;
  }, [eventsWithStatus]);

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

      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", currentPage, pageSize, showArchived, searchQuery, statusFilter] });
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
    <Card className="shadow-md rounded-xl overflow-hidden border border-gray-200">
      <div className="p-6 bg-gradient-to-r from-indigo-50/30 to-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
              <Input
                placeholder="Search events..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 w-[300px] border-indigo-200 focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-[180px] border-indigo-200 focus:border-indigo-300">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] })}
              disabled={eventsQuery.isFetching}
              className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
              title="Refresh events"
            >
              {eventsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <Table className="event-list">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                <TableHead className="font-semibold cursor-pointer py-4 text-indigo-900 dark:text-blue-100" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Event Name
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer py-4 text-indigo-900 dark:text-blue-100" onClick={() => handleSort("date")}>
                  <div className="flex items-center">
                    Date
                    <SortIcon field="date" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">End Date</TableHead>
                <TableHead className="font-semibold cursor-pointer py-4 text-indigo-900 dark:text-blue-100" onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer py-4 text-indigo-900 dark:text-blue-100" onClick={() => handleSort("deadline")}>
                  <div className="flex items-center">
                    Registration Deadline
                    <SortIcon field="deadline" />
                  </div>
                </TableHead>
                <TableHead className="text-right py-4 text-indigo-900 dark:text-blue-100">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event, index) => (
                <TableRow 
                  key={event.id} 
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} 
                    hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors
                    ${event.isArchived ? 'opacity-70' : ''}
                  `}
                >
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{formatDate(event.startDate)}</TableCell>
                  <TableCell>{formatDate(event.endDate)}</TableCell>
                  <TableCell>
                    <Badge
                      className={`
                        px-3 py-1 text-xs font-medium shadow-sm
                        ${event.status === "past" 
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200" 
                          : event.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200" 
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200"}
                      `}
                    >
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(event.applicationDeadline)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[200px] shadow-lg">
                        <DropdownMenuLabel className="text-indigo-700 dark:text-indigo-300">Event Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                          className="event-edit-button"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/master-schedule`)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Master Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/scheduling`)}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          All Tournaments View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/fees`)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Manage Fees
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/application-form`)}>
                          <FormInput className="mr-2 h-4 w-4" />
                          Registration Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGenerateRegistrationLink(event.id)}>
                          <Link2 className="mr-2 h-4 w-4" />
                          Generate Registration Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/coupons`)}>
                          <Ticket className="mr-2 h-4 w-4" />
                          Create Coupons
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/event-financial-report/${event.id}`)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Financial Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/clubs`)}>
                          <Users className="mr-2 h-4 w-4" />
                          Participating Clubs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => cloneEventMutation.mutate(event.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Clone Event
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleArchiveMutation.mutate(event.id)}
                        >
                          {event.isArchived ? (
                            <>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Unarchive
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 event-delete-button"
                          onClick={() => openDeleteDialog(event)}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              This action cannot be undone. To confirm deletion, please type REMOVE in the field below.
              This will permanently delete the event "{eventToDelete?.name}" and all associated data.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type REMOVE to confirm"
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText("");
                setEventToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="event-delete-button"
              onClick={handleDeleteEvent}
              disabled={deleteConfirmText.toUpperCase() !== "REMOVE"}
            >
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pagination and Archive Toggle */}
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-100 gap-4 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Switch 
              id="show-archived" 
              checked={showArchived}
              onCheckedChange={setShowArchived}
              className="data-[state=checked]:bg-indigo-500"
            />
            <label htmlFor="show-archived" className="text-sm font-medium text-gray-700">
              Show archived events
            </label>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="page-size" className="text-sm font-medium text-gray-700">Show</label>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1); // Reset to page 1 when changing page size
            }}>
              <SelectTrigger className="w-[80px] h-8 border-indigo-200 focus:border-indigo-300" id="page-size">
                <SelectValue placeholder="5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">events per page</span>
          </div>
        </div>
        
        {/* Mobile-friendly pagination with horizontal scrolling if needed */}
        <div className="w-full sm:w-auto overflow-x-auto">
          <Pagination>
            <PaginationContent className="flex flex-wrap gap-1 sm:gap-0 shadow-sm">
              <PaginationItem>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 whitespace-nowrap flex-shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1 || eventsQuery.isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
              </PaginationItem>
              
              {/* Page numbers - hidden on small mobile screens */}
              <div className="hidden sm:flex items-center">
                {paginationData.totalPages > 0 && Array.from({ length: Math.min(paginationData.totalPages, 5) }).map((_, i) => {
                  // Show pages around current page
                  let pageToShow;
                  
                  if (paginationData.totalPages <= 5) {
                    // If we have 5 or fewer pages, show all pages
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    // If we're near the start, show first 5 pages
                    pageToShow = i + 1;
                  } else if (currentPage >= paginationData.totalPages - 2) {
                    // If we're near the end, show last 5 pages
                    pageToShow = paginationData.totalPages - 4 + i;
                  } else {
                    // Otherwise show 2 pages before and after current page
                    pageToShow = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageToShow}>
                      <PaginationLink 
                        onClick={() => setCurrentPage(pageToShow)}
                        isActive={currentPage === pageToShow}
                        className={currentPage === pageToShow ? 
                          "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 font-medium" : 
                          "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        }
                      >
                        {pageToShow}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {paginationData.totalPages > 5 && currentPage < paginationData.totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis className="text-indigo-400" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setCurrentPage(paginationData.totalPages)}
                        isActive={currentPage === paginationData.totalPages}
                        className={currentPage === paginationData.totalPages ? 
                          "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 font-medium" : 
                          "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        }
                      >
                        {paginationData.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
              </div>
              
              {/* Simple page indicator for mobile */}
              <div className="sm:hidden flex items-center px-3 py-1.5 bg-gray-50 rounded-md text-sm font-medium text-gray-700 border border-gray-200">
                Page {currentPage} of {paginationData.totalPages}
              </div>
              
              <PaginationItem>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 whitespace-nowrap flex-shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages))}
                  disabled={currentPage >= paginationData.totalPages || eventsQuery.isLoading}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </Card>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash,
  Link2,
  FormInput,
  DollarSign,
  Ticket
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

type SortField = "name" | "date" | "status";
type SortDirection = "asc" | "desc";

const calculateEventStatus = (startDate: string, endDate: string) => {
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
};

export function EventsTable() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"past" | "active" | "upcoming" | "all">("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const eventsQuery = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/events");
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch events");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch events",
          variant: "destructive"
        });
        return [];
      }
    },
  });

  const filterEvents = (events: Event[]) => {
    return events.filter((event) => {
      const status = calculateEventStatus(event.startDate, event.endDate);
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const sortEvents = (events: Event[]) => {
    return [...events].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "date":
          return multiplier * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        case "status":
          return multiplier * calculateEventStatus(a.startDate, a.endDate).localeCompare(calculateEventStatus(b.startDate, b.endDate));
        default:
          return 0;
      }
    });
  };

  const handleGenerateRegistrationLink = async (eventId: number) => {
    try {
      const registrationUrl = `${window.location.origin}/register/event/${eventId}`;
      await navigator.clipboard.writeText(registrationUrl);
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

  if (eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredEvents = filterEvents(sortEvents(eventsQuery.data || []));

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

  return (
    <Card className="shadow-sm">
      <div className="p-6">
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
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
              <TableRow>
                <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Event Name
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("date")}>
                  <div className="flex items-center">
                    Start Date
                    <SortIcon field="date" />
                  </div>
                </TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead>Application Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{formatDate(event.startDate)}</TableCell>
                  <TableCell>{formatDate(event.endDate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        calculateEventStatus(event.startDate, event.endDate) === "past"
                          ? "secondary"
                          : calculateEventStatus(event.startDate, event.endDate) === "active"
                          ? "default"
                          : "outline"
                      }
                    >
                      {calculateEventStatus(event.startDate, event.endDate).charAt(0).toUpperCase() +
                        calculateEventStatus(event.startDate, event.endDate).slice(1)}
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
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
                          Manage Coupons
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
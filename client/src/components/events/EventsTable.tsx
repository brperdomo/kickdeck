
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Edit,
  Trash2,
  FileQuestion,
  User,
  TagsIcon,
  Printer,
  AlertTriangle,
  MoreHorizontal,
  Plus,
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

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published" | "in_progress" | "completed" | "cancelled";
  applicationsReceived: number;
  teamsAccepted: number;
}

export function EventsTable() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);

  const eventsQuery = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

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

  const handleDelete = async (eventId: number) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      eventsQuery.refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-sm">
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Event Name</TableHead>
              <TableHead className="font-semibold">Date Range</TableHead>
              <TableHead className="font-semibold">Applications</TableHead>
              <TableHead className="font-semibold">Teams</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsQuery.data?.map((event) => (
              <TableRow key={event.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                  </div>
                </TableCell>
                <TableCell>{event.applicationsReceived}</TableCell>
                <TableCell>{event.teamsAccepted}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {event.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
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
                        onClick={() => handleDelete(event.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Calendar, Edit, Trash2, Copy } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published" | "in_progress" | "completed" | "cancelled";
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
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsQuery.data?.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {event.status}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                    className="inline-flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="ml-2">Edit Details</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center justify-center"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="ml-2">Duplicate</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    className="inline-flex items-center justify-center text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-2">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
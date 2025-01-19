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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Edit,
  FileText,
  Flag,
  MoreHorizontal,
  Percent,
  Printer,
  Trash2,
  Users,
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  applicationCount: number;
  teamCount: number;
  status: "draft" | "published" | "in_progress" | "completed" | "cancelled";
}

export function EventsTable() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);

  const eventsQuery = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-500";
      case "published":
        return "bg-blue-500";
      case "in_progress":
        return "bg-green-500";
      case "completed":
        return "bg-purple-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
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
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead className="text-center">Applications</TableHead>
              <TableHead className="text-center">Teams</TableHead>
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
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{event.applicationCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{event.teamCount}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(event.status)} text-white`}>
                    {event.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem onClick={() => navigate(`/admin/events/${event.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Application Questions
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="mr-2 h-4 w-4" />
                        Player Questions
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Percent className="mr-2 h-4 w-4" />
                        Discounts
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Game Cards
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Flag className="mr-2 h-4 w-4" />
                        Red Card Report
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteEventId(event.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
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

      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteEventId) return;

                try {
                  const response = await fetch(`/api/admin/events/${deleteEventId}`, {
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

                setDeleteEventId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

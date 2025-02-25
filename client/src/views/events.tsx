import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { EventsTable } from "@/components/events/EventsTable";

export function EventsView() {
  const navigate = useLocation()[1];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events</h2>
        <Button onClick={() => navigate("/admin/events/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>
      <EventsTable />
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function EventManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <Button>Create Event</Button>
      </div>
      
      <div className="rounded-md border">
        <div className="p-4">
          <p className="text-muted-foreground">No events created yet.</p>
        </div>
      </div>
    </div>
  );
}

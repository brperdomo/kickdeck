import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TeamManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Management</h2>
        <Button>Add Team</Button>
      </div>
      
      <div className="rounded-md border">
        <div className="p-4">
          <p className="text-muted-foreground">No teams registered yet.</p>
        </div>
      </div>
    </div>
  );
}

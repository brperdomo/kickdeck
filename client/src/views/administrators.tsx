import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function AdministratorsView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Administrators</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Administrator
        </Button>
      </div>
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No administrators available</p>
      </Card>
    </div>
  );
}

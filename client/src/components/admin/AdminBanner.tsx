import { Link } from "wouter";
import { Home, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AdminBanner component displays a navigation bar at the top of admin pages
 * for consistent navigation and access to common admin functions
 */
export function AdminBanner() {
  return (
    <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80">
            <Link href="/admin">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80">
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
        <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80">
          <Link href="/logout">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Link>
        </Button>
      </div>
    </div>
  );
}
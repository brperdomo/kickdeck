import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Link, useLocation } from "wouter";
import { MessageSquare } from "lucide-react";
import { LogoutOverlay } from "@/components/ui/logout-overlay";

export default function Profile() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const handleLogout = async () => {
    // First show the overlay
    setShowLogoutOverlay(true);
  };

  return (
    <>
      {showLogoutOverlay && (
        <LogoutOverlay onFinished={async () => {
          try {
            console.log("Initiating profile page logout process...");
            await logout();
            console.log("Profile logout API call completed");
            
            // After logout, we need to clear all storage and force page reload
            // to completely reset the application state and prevent back navigation
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            
            // Create cache control meta tags
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Cache-Control';
            meta.content = 'no-store, no-cache, must-revalidate, max-age=0';
            document.head.appendChild(meta);
            
            const pragmaMeta = document.createElement('meta');
            pragmaMeta.httpEquiv = 'Pragma';
            pragmaMeta.content = 'no-cache';
            document.head.appendChild(pragmaMeta);
            
            // Use a simpler approach that works with the router
            // Clear browser history and redirect to auth page
            window.history.pushState(null, "", "/");
            window.location.href = "/auth";
          } catch (error) {
            console.error("Profile logout failed:", error);
            // Force logout by clearing everything manually as a fallback
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            
            // Use a simpler approach that works with the router
            window.history.pushState(null, "", "/");
            window.location.href = "/auth";
          }
        }} />
      )}
      <div className="min-h-screen bg-background p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Username</label>
                <p>{user?.username}</p>
              </div>
              <div>
                <label className="font-medium">Role</label>
                <p>{user?.isParent ? "Parent" : "Player"}</p>
              </div>
              <div>
                <label className="font-medium">Name</label>
                <p>{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <label className="font-medium">Email</label>
                <p>{user?.email}</p>
              </div>
              {user?.phone && (
                <div>
                  <label className="font-medium">Phone</label>
                  <p>{user.phone}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="mt-8"
              >
                Logout
              </Button>
              <Link href="/chat">
                <Button 
                  variant="outline"
                  className="mt-8"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
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
            
            // Small delay to ensure all state is cleared before navigation
            setTimeout(() => {
              console.log("Redirecting from profile to auth page...");
              // Use setLocation for routing within the app
              setLocation("/auth?logged_out=true");
              
              // As a fallback, also clear any storage
              try {
                localStorage.removeItem("lastActiveView");
                sessionStorage.clear();
              } catch (e) {
                console.error("Failed to clear storage:", e);
              }
            }, 100);
          } catch (error) {
            console.error("Profile logout failed:", error);
            // Force logout by clearing everything manually as a fallback
            localStorage.clear();
            sessionStorage.clear();
            
            // Use setLocation for routing
            setLocation("/auth?forced=true");
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
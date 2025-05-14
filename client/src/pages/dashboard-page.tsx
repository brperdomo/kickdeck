import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, logoutMutation } = useAuth();

  useEffect(() => {
    console.log("Dashboard page mounted, current user:", user);
  }, [user]);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // If no user data, show message (should not happen due to ProtectedRoute)
  if (!user) {
    console.error("User reached dashboard while not authenticated");
    return <Redirect to="/auth" />;
  }

  // Decide which dashboard to show based on user role
  if (user.isAdmin) {
    return <Redirect to="/admin" />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              This is your member dashboard.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
          <p className="text-muted-foreground">
            You don't have any teams yet. Register for an event to add your team.
          </p>
        </div>
        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          <p className="text-muted-foreground">
            There are no upcoming events at this time.
          </p>
        </div>
      </div>
    </div>
  );
}
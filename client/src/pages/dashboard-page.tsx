import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { user, logoutMutation, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/auth");
  };

  const handleRefreshUser = async () => {
    setIsRefreshing(true);
    try {
      const userData = await refreshUser();
      if (userData) {
        toast({
          title: "User data refreshed",
          description: "Your user information has been updated.",
        });
      } else {
        toast({
          title: "Session lost",
          description: "Your session appears to be invalid. Please log in again.",
          variant: "destructive",
        });
        setLocation("/auth");
      }
    } catch (error) {
      toast({
        title: "Error refreshing user data",
        description: "There was a problem updating your user information.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // A simple authentication test
  const testAuth = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      const data = await response.json();
      
      toast({
        title: "Auth Test Result",
        description: `Status: ${response.status}, User ID: ${data.id || 'None'}`,
      });
    } catch (error) {
      toast({
        title: "Auth Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-bold">Member Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshUser}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh User"}
            </Button>
            <Button 
              variant="outline" 
              onClick={testAuth}
            >
              Test Auth
            </Button>
            <Button 
              variant="default" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your current account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <div className="font-medium">Name:</div>
                <div>{user?.firstName} {user?.lastName}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <div className="font-medium">Email:</div>
                <div>{user?.email}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <div className="font-medium">Role:</div>
                <div>{user?.isAdmin ? "Administrator" : "Regular Member"}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <div className="font-medium">User ID:</div>
                <div>{user?.id}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                Edit Profile
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 py-2">
                  <p className="text-sm font-medium">Login Successful</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
                <div className="border-l-4 border-border pl-4 py-2">
                  <p className="text-sm font-medium">Profile Viewed</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="border-l-4 border-border pl-4 py-2">
                  <p className="text-sm font-medium">Session Started</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full">View All Activity</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Session Info</CardTitle>
              <CardDescription>Details about your current session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-1">
                <div className="font-medium">Auth Status:</div>
                <div className="font-mono">{user ? "Authenticated" : "Not Authenticated"}</div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-1">
                <div className="font-medium">Session Type:</div>
                <div className="font-mono">Cookie-based</div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-1">
                <div className="font-medium">User Roles:</div>
                <div className="font-mono">{user?.roles?.join(", ") || "No roles assigned"}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
                End Session
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Debugging</CardTitle>
              <CardDescription>
                Tools for testing authentication state and functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={testAuth} variant="outline">Test API Authentication</Button>
                <Button onClick={handleRefreshUser} variant="outline">Refresh User Data</Button>
                <Button onClick={() => setLocation('/auth')} variant="outline">Go to Login Page</Button>
                {user?.isAdmin && (
                  <Button onClick={() => setLocation('/admin')} variant="outline">Go to Admin Dashboard</Button>
                )}
              </div>
              
              <div className="rounded-md bg-muted p-4">
                <div className="font-mono text-xs">
                  <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                    {JSON.stringify({
                      user: user,
                      isAuthenticated: !!user,
                      authState: "Using authentication from TanStack Query",
                      url: window.location.href,
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
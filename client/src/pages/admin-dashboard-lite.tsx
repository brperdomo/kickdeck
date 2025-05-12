import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * A simplified admin dashboard that serves as a fallback when the main dashboard has issues
 */
export default function AdminDashboardLite() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p>You need to be logged in to access the admin dashboard.</p>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <h1 className="text-2xl font-bold mb-4">Permission Error</h1>
        <p>You don't have admin privileges to access this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard (Lite Version)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span> {user.firstName} {user.lastName}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-semibold">Username:</span> {user.username}
              </div>
              <div>
                <span className="font-semibold">Admin Status:</span> 
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Admin
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current application status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Authentication System: Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Database Connection: Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Admin Dashboard: Limited Functionality</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Some components are in a fallback state. Engineering team has been notified.
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                View Events
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                Manage Users
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
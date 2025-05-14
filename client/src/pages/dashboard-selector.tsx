import React from 'react';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

/**
 * Emergency Dashboard Selector
 * 
 * This component provides direct links to both admin and member dashboards
 * to bypass any routing issues.
 */
export default function DashboardSelector() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Emergency Dashboard Access</CardTitle>
          <CardDescription className="text-center">
            Select which dashboard you want to access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Logged in as:</p>
                <p className="text-lg">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {user.isAdmin ? 'Administrator' : 'Member'}
                  </span>
                </div>
              </div>
              
              <div className="grid gap-4">
                <Button 
                  size="lg" 
                  className="w-full" 
                  variant="default"
                  asChild
                >
                  <Link href="/admin-direct">
                    Admin Dashboard
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  className="w-full" 
                  variant="outline"
                  asChild
                >
                  <Link href="/dashboard-direct">
                    Member Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">You need to be logged in to access dashboards.</p>
              <Button className="mt-4" asChild>
                <Link href="/auth">Log In</Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            This is an emergency access page to bypass routing issues.
            Once normal access is restored, you can use the regular navigation.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
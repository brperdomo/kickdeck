import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';

/**
 * Auth Diagnosis Page
 *
 * This component displays detailed information about the current authentication state
 * to help diagnose routing and permission issues.
 */
export default function AuthDiagnosisPage() {
  const { user, authState } = useAuth();
  const [location] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication Diagnosis</CardTitle>
          <CardDescription>
            This page shows detailed information about your current authentication state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Authentication State</h3>
            <div className="p-4 bg-muted rounded-lg">
              <p>
                <span className="font-semibold">Current Auth State:</span>{' '}
                <code className="bg-primary/10 px-2 py-1 rounded text-primary">
                  {authState}
                </code>
              </p>
              <p className="mt-2">
                <span className="font-semibold">Current Location:</span>{' '}
                <code className="bg-primary/10 px-2 py-1 rounded text-primary">
                  {location}
                </code>
              </p>
            </div>
          </div>

          {user ? (
            <div>
              <h3 className="text-lg font-medium mb-2">User Information</h3>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <span className="font-semibold">User ID:</span> {user.id}
                </p>
                <p>
                  <span className="font-semibold">Name:</span> {user.firstName} {user.lastName}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold">Role:</span>{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isAdmin
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.isAdmin ? 'Administrator' : 'Member'}
                  </span>
                </p>
                {user.householdId && (
                  <p>
                    <span className="font-semibold">Household ID:</span> {user.householdId}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg">
              <p className="font-medium">No user data available</p>
              <p className="text-sm mt-1">
                You are not currently authenticated or user data is loading.
              </p>
            </div>
          )}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="raw-data">
              <AccordionTrigger>View Raw User Data</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Navigation</CardTitle>
          <CardDescription>
            Access dashboard routes directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="default" className="w-full">
              <Link href="/emergency-access">Dashboard Selector</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin-direct">Admin Dashboard (Direct)</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard-direct">Member Dashboard (Direct)</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth">Login Page</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';
import { BookOpen, AlertTriangle, Bug, LucideIcon, Users, UserCheck, Key, Database, Terminal, LayoutDashboard, ArrowRight } from 'lucide-react';
import RouteDebugger from '@/components/dev/RouteDebugger';

interface SessionInfoProps {
  title: string;
  value: any;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ title, value }) => (
  <div className="mb-2">
    <span className="font-medium">{title}:</span>{' '}
    <code className="bg-muted px-1 py-0.5 rounded text-sm">
      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
    </code>
  </div>
);

interface AuthDebugCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

const AuthDebugCard: React.FC<AuthDebugCardProps> = ({ title, description, icon: Icon, children }) => (
  <Card className="mb-5">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default function DevDebugPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, error } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Fetch session data
  const fetchSessionData = async () => {
    setSessionLoading(true);
    setSessionError(null);

    try {
      const response = await fetch('/api/dev/session-debug');
      if (!response.ok) {
        throw new Error('Failed to fetch session data');
      }
      const data = await response.json();
      setSessionData(data);
    } catch (error) {
      console.error('Session data fetch error:', error);
      setSessionError((error as Error).message);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearSession = async () => {
    try {
      const response = await fetch('/api/dev/clear-session', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear session');
      }
      
      toast({
        title: 'Session cleared',
        description: 'The session has been cleared successfully.',
      });
      
      // Refresh session data
      fetchSessionData();
    } catch (error) {
      console.error('Clear session error:', error);
      toast({
        title: 'Error clearing session',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col items-start justify-between mb-6 gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Debug Tools</h1>
          <p className="text-muted-foreground mt-1">
            Tools to help with debugging application state and auth issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/dev-auth">
              <Key className="mr-2 h-4 w-4" /> Auth Bypass
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin-direct">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Direct
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="auth-debug">
        <TabsList className="mb-4">
          <TabsTrigger value="auth-debug">
            <UserCheck className="mr-2 h-4 w-4" />
            Auth Debug
          </TabsTrigger>
          <TabsTrigger value="route-debug">
            <ArrowRight className="mr-2 h-4 w-4" />
            Route Debug
          </TabsTrigger>
          <TabsTrigger value="session-debug">
            <Database className="mr-2 h-4 w-4" />
            Session Debug
          </TabsTrigger>
          <TabsTrigger value="docs">
            <BookOpen className="mr-2 h-4 w-4" />
            Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auth-debug">
          <Alert className="mb-5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Auth Debugging Information</AlertTitle>
            <AlertDescription>
              This panel provides real-time authentication state information to help debug auth issues.
            </AlertDescription>
          </Alert>

          <AuthDebugCard 
            title="Authentication State" 
            description="Current user authentication state from useAuth() hook"
            icon={UserCheck}
          >
            <div className="space-y-2">
              <SessionInfo title="Is Authenticated" value={!!user} />
              <SessionInfo title="Is Loading" value={isLoading} />
              <SessionInfo title="Has Error" value={!!error} />
              {error && <SessionInfo title="Error Message" value={error.message} />}
              <Separator className="my-3" />
              <SessionInfo title="User Object" value={user || 'null'} />
            </div>
          </AuthDebugCard>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Terminal className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="route-debug">
          <Alert className="mb-5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Route Debugging Information</AlertTitle>
            <AlertDescription>
              Current route and navigation state to help debug routing issues.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="pt-6">
              <RouteDebugger />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session-debug">
          <Alert className="mb-5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Session Debugging Information</AlertTitle>
            <AlertDescription>
              Raw session data from the server to help debug session-related issues.
            </AlertDescription>
          </Alert>

          <AuthDebugCard 
            title="Server Session Data" 
            description="Raw session data from the server"
            icon={Database}
          >
            {sessionLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : sessionError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{sessionError}</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </div>
            )}
          </AuthDebugCard>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSessionData}>
              <Terminal className="mr-2 h-4 w-4" />
              Refresh Session Data
            </Button>
            <Button variant="destructive" onClick={handleClearSession}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Clear Session
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <Alert className="mb-5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Developer Tools Documentation</AlertTitle>
            <AlertDescription>
              Information about the available developer tools and how to use them.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Developer Tools Overview</CardTitle>
              <CardDescription>
                These tools are available only in development mode and should be used for debugging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Auth Bypass</h3>
                  <p className="text-muted-foreground">
                    Located at <code className="bg-muted px-1 py-0.5 rounded text-sm">/dev-auth</code>, allows you to bypass the normal authentication flow and login as any user for testing.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">Admin Direct Dashboard</h3>
                  <p className="text-muted-foreground">
                    Located at <code className="bg-muted px-1 py-0.5 rounded text-sm">/admin-direct</code>, provides access to the admin dashboard in a way that bypasses the normal authentication flow.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">Auth Debug Panel</h3>
                  <p className="text-muted-foreground">
                    Shows the current authentication state from the useAuth hook, including user data, loading state, and errors.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">Route Debug Panel</h3>
                  <p className="text-muted-foreground">
                    Shows information about the current route, pathname, search parameters, etc. Helps with debugging routing issues.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">Session Debug Panel</h3>
                  <p className="text-muted-foreground">
                    Shows raw session data from the server. Can be used to debug session-related issues, identify session corruption, or verify session contents.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Alert variant="default" className="bg-primary/10 border-primary/50 w-full">
                <Bug className="h-4 w-4" />
                <AlertTitle>Development Mode Only</AlertTitle>
                <AlertDescription>
                  These tools are designed for development only and will not be available in production.
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
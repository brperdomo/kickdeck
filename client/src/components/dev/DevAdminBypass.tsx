import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LockOpen, LogIn, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Development-only component to bypass authentication for admin testing
 * Should NOT be included in production builds
 */
export default function DevAdminBypass() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('bperdomo@zoho.com');
  const [password, setPassword] = useState('adminadmin');
  const [error, setError] = useState<string | null>(null);
  const [isProductionMode, setIsProductionMode] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if we're in production mode
  useEffect(() => {
    // In real production, we'd check NODE_ENV, but for our Replit setup
    // we'll check for specific domains or environment variables
    const hostname = window.location.hostname;
    const isProd = hostname.includes('replit.app') || 
                  hostname.includes('repl.co') || 
                  hostname.includes('matchpro.ai');
    
    // If it's a production domain, set production mode flag
    setIsProductionMode(isProd);
  }, []);

  const handleDevLogin = async () => {
    if (isProductionMode) {
      setError('Dev bypass is disabled in production mode.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the special dev bypass endpoint
      const response = await fetch('/api/dev-login-bypass', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to bypass authentication');
      }

      const result = await response.json();
      console.log('Dev login success:', result);
      
      // Force a new check for the user state
      await fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache'
      });
      
      // Successfully bypassed login
      toast({
        title: 'Dev mode activated',
        description: 'You are now logged in as an admin in development mode.',
      });

      // Using window.location for a hard redirect to ensure session picks up
      window.location.href = '/admin-direct';
    } catch (err) {
      console.error('Dev login bypass error:', err);
      setError(err instanceof Error ? err.message : 'Failed to bypass authentication');
      
      toast({
        title: 'Dev login failed',
        description: err instanceof Error ? err.message : 'Failed to bypass authentication',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStandardLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the regular login endpoint
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Login failed');
      }

      const data = await response.json();
      console.log('Standard login success:', data);
      
      // Check if the user is an admin
      if (!data.isAdmin) {
        throw new Error('This user does not have administrator privileges');
      }
      
      // Force a new check for the user state
      await fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache'
      });

      // Successfully logged in
      toast({
        title: 'Logged in',
        description: 'You have been successfully authenticated as an admin.',
      });

      // Using window.location for a hard redirect to ensure session picks up
      window.location.href = '/admin';
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      
      toast({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Authentication failed',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LockOpen className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Development Authentication Bypass</CardTitle>
          </div>
          <CardDescription>
            This tool is for development and testing purposes only.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isProductionMode && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Dev bypass is disabled in production environments.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Admin Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleStandardLogin}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Loading...' : 'Standard Login'}
              <LogIn className="ml-2 h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleDevLogin}
              disabled={isLoading || isProductionMode}
              variant={isProductionMode ? 'destructive' : 'secondary'}
              className="flex-1"
            >
              {isLoading ? 'Loading...' : 'Dev Bypass'}
              <LockOpen className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚠️ This component should not be included in production builds.
            It bypasses normal authentication checks for testing purposes.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
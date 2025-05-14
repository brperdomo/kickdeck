import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

/**
 * Emergency Admin Login Page
 * 
 * This page provides a direct way to log in and access the admin dashboard,
 * bypassing any redirect issues that might be occurring in the normal auth flow.
 */
export default function EmergencyAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isLoading, authState, loginMutation } = useAuth();
  const { toast } = useToast();

  // If already logged in and is admin, redirect to admin dashboard directly
  useEffect(() => {
    if (user && !isLoading && user.isAdmin) {
      // Use setTimeout to ensure this happens after render to avoid state updates during render
      setTimeout(() => {
        // Use window.location to force a full page reload and bypass any cached states
        window.location.href = '/admin-direct';
      }, 500);
    }
  }, [user, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Required fields missing",
        description: "Please provide both email and password",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Using axios directly for more reliable error handling
      const response = await axios.post('/api/login', {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      // Success! Force reload to go directly to admin dashboard
      toast({
        title: "Login successful!",
        description: "Redirecting to admin dashboard..."
      });
      
      // Force a page reload to clear any cached states
      window.location.href = '/admin-direct';
      
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Emergency Admin Access</CardTitle>
          <CardDescription className="text-center">
            Use this form to bypass the regular login flow
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login to Admin Dashboard"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
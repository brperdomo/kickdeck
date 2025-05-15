import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * A development tool to debug routing and authentication issues
 * Only use this component during development
 */
export default function RouteDebugger() {
  const [location] = useLocation();
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    isAuthenticated: false,
    user: null as any,
    error: null as string | null
  });
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setAuthStatus({
              loading: false,
              isAuthenticated: false,
              user: null,
              error: 'Not authenticated'
            });
            return;
          }
          
          throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const user = await response.json();
        setAuthStatus({
          loading: false,
          isAuthenticated: true,
          user,
          error: null
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthStatus({
          loading: false,
          isAuthenticated: false,
          user: null,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
    
    checkAuth();
  }, []);
  
  const getUrl = () => {
    try {
      return window.location.href;
    } catch (e) {
      return 'Unable to get URL';
    }
  };
  
  return (
    <Card className="mb-6 border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-yellow-800">Route Debugger</CardTitle>
        <CardDescription className="text-yellow-700">
          Development Tool - Remove in Production
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <strong>Current route (location Wouter):</strong> {location}
        </div>
        <div>
          <strong>Current URL:</strong> {getUrl()}
        </div>
        <div className="pt-2 pb-1">
          <strong>Authentication Status:</strong> {' '}
          {authStatus.loading ? (
            <Badge variant="outline" className="bg-gray-100">Loading...</Badge>
          ) : authStatus.isAuthenticated ? (
            <Badge variant="default" className="bg-green-500">Authenticated</Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Not Authenticated</Badge>
          )}
        </div>
        
        {authStatus.error && (
          <div className="text-red-500">
            <strong>Error:</strong> {authStatus.error}
          </div>
        )}
        
        {authStatus.user && (
          <div className="p-2 bg-white/70 rounded border border-yellow-100">
            <div className="font-medium mb-1">User Info:</div>
            <ul className="pl-4 list-disc space-y-1">
              <li><strong>ID:</strong> {authStatus.user.id}</li>
              <li><strong>Email:</strong> {authStatus.user.email}</li>
              <li><strong>Username:</strong> {authStatus.user.username}</li>
              <li><strong>Admin:</strong> {authStatus.user.isAdmin ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/dev-auth'}
        >
          Go to Dev Auth
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/admin-direct'}
        >
          Direct Admin Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RouteDebugger from '@/components/dev/RouteDebugger';

/**
 * Development Debug Page
 * 
 * This page provides tools for debugging authentication and routing issues.
 * It should only be accessible in development environments.
 */
export default function DevDebugPage() {
  const [location, setLocation] = useLocation();
  const [isProductionMode, setIsProductionMode] = useState(false);
  const [activeTab, setActiveTab] = useState('route-debugger');
  
  // Check if we're in production mode
  useEffect(() => {
    const checkEnvironment = () => {
      // Check domain names that would indicate production
      const isProd = window.location.hostname.includes('replit.app') ||
                    !window.location.hostname.includes('localhost');
      
      // If it's a production domain, set production mode flag
      setIsProductionMode(isProd);
    };
    
    checkEnvironment();
  }, []);

  if (isProductionMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Production Environment Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The development debugging tools are disabled in production environments for security reasons.
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <span className="mr-3">Development Debugging Tools</span>
        <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Dev Only</span>
      </h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="route-debugger">Route Debugger</TabsTrigger>
          <TabsTrigger value="auth-tools">Authentication Tools</TabsTrigger>
          <TabsTrigger value="session-manager">Session Manager</TabsTrigger>
        </TabsList>
        
        <TabsContent value="route-debugger" className="space-y-4">
          <RouteDebugger />
          
          <Card>
            <CardHeader>
              <CardTitle>Navigation Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Test navigation to different parts of the application. Observe how routes and authentication behave.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setLocation('/')}>
                  Home Page
                </Button>
                <Button variant="outline" onClick={() => setLocation('/admin')}>
                  Admin Dashboard
                </Button>
                <Button variant="outline" onClick={() => setLocation('/dev-auth')}>
                  Dev Auth Page
                </Button>
                <Button variant="outline" onClick={() => setLocation('/admin-direct')}>
                  Direct Admin
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/api/logout'}>
                  Logout API
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="auth-tools">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                These tools help test and debug authentication flows in the application.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/dev-auth')}
                  className="w-full"
                >
                  Go to Dev Auth Bypass
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/api/logout'}
                  className="w-full"
                >
                  Force Logout
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/user', {
                        credentials: 'include',
                        cache: 'no-cache'
                      });
                      alert(JSON.stringify(await response.json(), null, 2));
                    } catch (err) {
                      alert('Error fetching user data: ' + err);
                    }
                  }}
                  className="w-full"
                >
                  Show User Data
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    document.cookie.split(';').forEach(c => {
                      document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    });
                    alert('Attempted to clear all cookies');
                    window.location.reload();
                  }}
                  className="w-full text-red-500 hover:text-red-700"
                >
                  Clear All Cookies
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="session-manager">
          <Card>
            <CardHeader>
              <CardTitle>Session Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View and manage browser storage and session data.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Cookies</h3>
                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-60">
                    {document.cookie || '(No cookies found)'}
                  </pre>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/api/dev-login-bypass'}
                    className="w-full"
                  >
                    Call Dev Login API Directly
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      window.localStorage.clear();
                      alert('Local storage cleared');
                    }}
                    className="w-full"
                  >
                    Clear Local Storage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>These tools are for development purposes only and should not be accessible in production.</p>
      </div>
    </div>
  );
}
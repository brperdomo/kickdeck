import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * A diagnostic dashboard component that helps diagnose rendering issues
 * by providing minimal UI with error tracking
 */
export default function DiagnosticDashboard() {
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [renderStage, setRenderStage] = useState<string>('initial');

  // Capture any unhandled errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setError(`Global error caught: ${event.message}`);
      console.error('DiagnosticDashboard caught error:', event);
      // Prevent the browser from showing the error
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  useEffect(() => {
    setRenderStage('mount-complete');
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-red-500">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>User is not authenticated. Please log in.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Diagnostic Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-md">
          <h3 className="text-lg font-semibold text-red-600">Error Detected</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rendering Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Current render stage:</strong> {renderStage}</p>
            <p><strong>Component loaded at:</strong> {new Date().toISOString()}</p>
            <p><strong>Browser:</strong> {navigator.userAgent}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
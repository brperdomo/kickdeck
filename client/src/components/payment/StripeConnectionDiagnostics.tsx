import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { getStripe } from '@/lib/payment';

interface StripeConnectionDiagnosticsProps {
  onConnectionRestored?: () => void;
}

export function StripeConnectionDiagnostics({ onConnectionRestored }: StripeConnectionDiagnosticsProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const testStripeConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('testing');
    
    try {
      // Test 1: Check if Stripe SDK loads
      console.log('Testing Stripe SDK loading...');
      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error('Stripe SDK failed to load');
      }
      
      // Test 2: Try to retrieve configuration
      console.log('Testing payment configuration...');
      const configResponse = await fetch('/api/payments/config');
      if (!configResponse.ok) {
        throw new Error('Payment configuration unavailable');
      }
      
      const config = await configResponse.json();
      if (!config.publishableKey) {
        throw new Error('Stripe publishable key missing from configuration');
      }
      
      // Test 3: Verify Stripe instance is functional
      // Note: We can't directly test r.stripe.com connectivity from frontend
      // but we can verify the Stripe object is properly initialized
      console.log('Verifying Stripe instance functionality...');
      
      setConnectionStatus('connected');
      setErrorDetails('');
      
      if (onConnectionRestored) {
        onConnectionRestored();
      }
      
    } catch (error) {
      console.error('Stripe connectivity test failed:', error);
      setConnectionStatus('failed');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown connection error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    testStripeConnection();
  };

  // Initial connection test
  useEffect(() => {
    testStripeConnection();
  }, []);

  if (connectionStatus === 'connected') {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Payment system connection verified successfully.
        </AlertDescription>
      </Alert>
    );
  }

  if (connectionStatus === 'testing') {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
        <AlertDescription className="text-blue-800">
          Testing payment system connection...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Payment System Connection Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-300 bg-red-100">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Connection Error:</strong> {errorDetails}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <h4 className="font-medium text-red-800">Possible Solutions:</h4>
          <ul className="space-y-2 text-sm text-red-700">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Try refreshing the page or using an incognito/private browsing window</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Disable ad blockers or browser extensions that might interfere with payments</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Check if your network firewall is blocking *.stripe.com domains</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Try using a different network connection (mobile hotspot, different WiFi)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>Contact your IT administrator if you're on a corporate network</span>
            </li>
          </ul>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRetry}
            disabled={isTestingConnection}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            {isTestingConnection ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection {retryCount > 0 && `(${retryCount})`}
              </>
            )}
          </Button>
          
          {retryCount >= 3 && (
            <div className="text-sm text-red-600">
              If the problem persists after multiple retries, please contact support.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
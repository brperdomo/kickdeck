import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { getSetupStatus } from "@/lib/payment";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SetupStatus {
  status: 'succeeded' | 'processing' | 'failed' | 'cancelled' | 'requires_payment_method' | 'unknown';
  setupIntent: string;
  paymentMethodId?: string;
  cardBrand?: string;
  cardLast4?: string;
  teamName?: string;
  eventName?: string;
  errorMessage?: string;
}

export default function PaymentSetupConfirmation() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        setIsLoading(true);
        
        // Get setup intent ID from URL
        const query = new URLSearchParams(window.location.search);
        const setupIntentId = query.get('setup_intent');
        const redirectStatus = query.get('redirect_status');
        
        if (!setupIntentId) {
          throw new Error('Missing setup intent ID');
        }
        
        // Get the status from the API
        const status = await getSetupStatus(setupIntentId);
        setSetupStatus(status);
        
        // Show toast based on the status
        if (status.status === 'succeeded') {
          toast({
            title: "Payment Setup Complete",
            description: "Your payment information has been saved successfully.",
          });
        } else if (status.status === 'failed') {
          toast({
            title: "Payment Setup Failed",
            description: status.errorMessage || "There was an issue with your payment method.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error checking setup status:", err);
        setError(err instanceof Error ? err.message : 'Failed to verify payment setup');
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to verify payment setup',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSetupStatus();
  }, [toast]);
  
  const getStatusColor = () => {
    if (!setupStatus) return 'bg-gray-100';
    
    switch (setupStatus.status) {
      case 'succeeded':
        return 'bg-green-50 border-green-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
      case 'cancelled':
      case 'requires_payment_method':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-100';
    }
  };
  
  const getStatusIcon = () => {
    if (!setupStatus) return <Loader2 className="h-8 w-8 animate-spin" />;
    
    switch (setupStatus.status) {
      case 'succeeded':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'failed':
      case 'cancelled':
      case 'requires_payment_method':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-500" />;
    }
  };
  
  const getStatusTitle = () => {
    if (!setupStatus) return 'Checking payment setup status...';
    
    switch (setupStatus.status) {
      case 'succeeded':
        return 'Payment Method Saved';
      case 'processing':
        return 'Processing Payment Setup';
      case 'failed':
        return 'Payment Setup Failed';
      case 'cancelled':
        return 'Payment Setup Cancelled';
      case 'requires_payment_method':
        return 'Payment Method Required';
      default:
        return 'Unknown Status';
    }
  };
  
  const getStatusDescription = () => {
    if (!setupStatus) return 'Verifying your payment setup...';
    
    switch (setupStatus.status) {
      case 'succeeded':
        return `Your payment method has been saved successfully. Your card ${setupStatus.cardBrand?.toUpperCase()} ending in ${setupStatus.cardLast4} is now on file. You will only be charged after your team registration is approved.`;
      case 'processing':
        return 'We are still processing your payment setup. This should only take a moment.';
      case 'failed':
        return setupStatus.errorMessage || 'There was an issue setting up your payment method. Please try again with a different card.';
      case 'cancelled':
        return 'The payment setup process was cancelled. Please try again when ready.';
      case 'requires_payment_method':
        return 'We need additional payment information. Please try again with a different card.';
      default:
        return 'We encountered an unexpected status with your payment setup.';
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying Payment Setup</CardTitle>
            <CardDescription>Please wait while we verify your payment information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary my-8" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Error</CardTitle>
            <CardDescription>We couldn't verify your payment setup</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
            >
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{getStatusTitle()}</CardTitle>
          <CardDescription>
            {setupStatus?.teamName ? `For: ${setupStatus.teamName}` : 'Team Registration'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="mb-6 mt-2">
            {getStatusIcon()}
          </div>
          
          <Alert className={`mb-4 ${getStatusColor()}`}>
            <AlertDescription>
              {getStatusDescription()}
            </AlertDescription>
          </Alert>
          
          {setupStatus?.status === 'succeeded' && (
            <div className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
                <span>
                  {setupStatus.cardBrand?.toUpperCase() || 'Card'} •••• {setupStatus.cardLast4 || '****'}
                </span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Saved
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={() => setLocation('/dashboard')}
            className="w-full"
            variant={setupStatus?.status === 'succeeded' ? 'default' : 'outline'}
          >
            Go to Dashboard
          </Button>
          
          {setupStatus?.status !== 'succeeded' && (
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, AlertCircle, CheckCircle, RefreshCw, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

interface PaymentStatus {
  status: 'success' | 'succeeded' | 'processing' | 'failed' | 'pending' | 'cancelled' | 'refunded' | 'unknown';
  paymentIntent: string;
  amount?: number;
  cardBrand?: string;
  cardLast4?: string;
  teamName?: string;
  eventName?: string;
  errorMessage?: string;
}

export default function PaymentConfirmation() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const refreshStatus = async (paymentIntentId: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/payments/status/${paymentIntentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPaymentStatus({
          status: data.status,
          paymentIntent: paymentIntentId,
          amount: data.amount,
          cardBrand: data.cardBrand,
          cardLast4: data.cardLast4,
          teamName: data.teamName,
          eventName: data.eventName,
          errorMessage: data.errorMessage,
        });
        setError(null);
      } else {
        setError(data.message || 'Failed to retrieve payment status');
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to retrieve payment status',
        });
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
      setError('There was a problem checking your payment status. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: 'There was a problem checking your payment status. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    
    if (!paymentIntentId) {
      setError('No payment information found. Please return to the registration process.');
      setIsLoading(false);
      return;
    }

    refreshStatus(paymentIntentId);
  }, [toast]);

  const handleReturnToDashboard = () => {
    setLocation('/dashboard');
  };

  const renderStatusContent = () => {
    if (!paymentStatus) return null;

    const {
      status,
      amount,
      cardBrand,
      cardLast4,
      teamName,
      eventName,
      errorMessage,
    } = paymentStatus;

    // Payment was successful
    if (status === 'success' || status === 'succeeded') {
      return (
        <>
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Payment Successful</AlertTitle>
            <AlertDescription>
              Your payment has been successfully processed. Thank you!
            </AlertDescription>
          </Alert>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {amount && (
              <>
                <dt className="font-medium text-gray-500">Amount Paid:</dt>
                <dd>${(amount / 100).toFixed(2)}</dd>
              </>
            )}
            {(cardBrand && cardLast4) && (
              <>
                <dt className="font-medium text-gray-500">Payment Method:</dt>
                <dd>{cardBrand} ending in {cardLast4}</dd>
              </>
            )}
            {teamName && (
              <>
                <dt className="font-medium text-gray-500">Team:</dt>
                <dd>{teamName}</dd>
              </>
            )}
            {eventName && (
              <>
                <dt className="font-medium text-gray-500">Event:</dt>
                <dd>{eventName}</dd>
              </>
            )}
            <dt className="font-medium text-gray-500">Transaction ID:</dt>
            <dd className="font-mono text-xs">{paymentStatus.paymentIntent}</dd>
          </dl>
        </>
      );
    }
    
    // Payment is still processing
    if (status === 'processing') {
      return (
        <>
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertTitle>Payment Processing</AlertTitle>
            <AlertDescription>
              Your payment is currently being processed. This may take a moment to complete.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => refreshStatus(paymentStatus.paymentIntent)}
            variant="outline"
            className="w-full mb-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Status
          </Button>
        </>
      );
    }
    
    // Payment has failed or been cancelled
    if (status === 'failed' || status === 'cancelled') {
      return (
        <>
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              {errorMessage || 'Your payment could not be processed. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.history.back()}
            variant="default"
            className="w-full mb-4"
          >
            Try Again
          </Button>
        </>
      );
    }

    // Payment has been refunded
    if (status === 'refunded') {
      return (
        <>
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-full bg-yellow-100 p-3">
              <RefreshCw className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <RefreshCw className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Payment Refunded</AlertTitle>
            <AlertDescription>
              Your payment has been refunded. The refund may take a few days to appear on your statement.
            </AlertDescription>
          </Alert>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {amount && (
              <>
                <dt className="font-medium text-gray-500">Refund Amount:</dt>
                <dd>${(amount / 100).toFixed(2)}</dd>
              </>
            )}
            <dt className="font-medium text-gray-500">Transaction ID:</dt>
            <dd className="font-mono text-xs">{paymentStatus.paymentIntent}</dd>
          </dl>
        </>
      );
    }

    // Unknown or pending status
    return (
      <>
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-full bg-gray-100 p-3">
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertTitle>Payment Status: {status}</AlertTitle>
          <AlertDescription>
            We've recorded your payment attempt, but we're still determining its status.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => refreshStatus(paymentStatus.paymentIntent)}
          variant="outline"
          className="w-full mb-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Check Status
        </Button>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Checking payment status...</p>
        </div>
      </div>
    );
  }

  if (error && !paymentStatus) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Confirmation</CardTitle>
            <CardDescription>There was a problem checking your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment Confirmation</CardTitle>
          <CardDescription>Review your payment status</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStatusContent()}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => refreshStatus(paymentStatus!.paymentIntent)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleReturnToDashboard}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
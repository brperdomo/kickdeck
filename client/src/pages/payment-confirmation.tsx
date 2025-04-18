import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentConfirmation() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'processing'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  // Get the payment_intent from the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
    const redirectStatus = urlParams.get('redirect_status');
    
    // If we have a payment intent, get its status
    const getPaymentStatus = async () => {
      if (!paymentIntentId) {
        setStatus('error');
        return;
      }
      
      try {
        const response = await apiRequest('GET', `/api/payments/status/${paymentIntentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to retrieve payment status');
        }
        
        const data = await response.json();
        setPaymentDetails(data);
        
        // Set status based on the payment intent status
        if (data.status === 'succeeded') {
          setStatus('success');
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
          });
          
          // Invalidate relevant queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['teams'] });
          queryClient.invalidateQueries({ queryKey: ['events'] });
        } else if (data.status === 'processing') {
          setStatus('processing');
          toast({
            title: 'Payment Processing',
            description: 'Your payment is still being processed. We will update you when it completes.',
          });
        } else {
          setStatus('error');
          toast({
            title: 'Payment Failed',
            description: data.message || 'Your payment could not be processed.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
        setStatus('error');
        toast({
          title: 'Error',
          description: 'Failed to check payment status. Please contact support.',
          variant: 'destructive',
        });
      }
    };
    
    getPaymentStatus();
  }, [toast, queryClient]);
  
  // Render appropriate UI based on status
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Checking payment status...</h2>
            <p className="text-muted-foreground max-w-md">
              Please wait while we verify your payment. This may take a few moments.
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-16 w-16 text-success mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground max-w-md mb-4">
              Your payment has been processed successfully. Thank you for your payment.
            </p>
            {paymentDetails && (
              <div className="w-full max-w-md bg-accent/10 rounded-lg p-4 mb-4 text-left">
                <p className="flex justify-between border-b pb-2 mb-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${(paymentDetails.amount / 100).toFixed(2)}</span>
                </p>
                <p className="flex justify-between border-b pb-2 mb-2">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{new Date(paymentDetails.created * 1000).toLocaleString()}</span>
                </p>
                <p className="flex justify-between border-b pb-2 mb-2">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <span className="font-mono text-xs">{paymentDetails.id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-success">Paid</span>
                </p>
              </div>
            )}
          </div>
        );
        
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-16 w-16 text-warning mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Payment Processing</h2>
            <p className="text-muted-foreground max-w-md mb-4">
              Your payment is currently being processed. This may take a few minutes.
              You will receive a confirmation when the payment is complete.
            </p>
            {paymentDetails && (
              <div className="w-full max-w-md bg-accent/10 rounded-lg p-4 mb-4 text-left">
                <p className="flex justify-between border-b pb-2 mb-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${(paymentDetails.amount / 100).toFixed(2)}</span>
                </p>
                <p className="flex justify-between border-b pb-2 mb-2">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{new Date(paymentDetails.created * 1000).toLocaleString()}</span>
                </p>
                <p className="flex justify-between border-b pb-2 mb-2">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <span className="font-mono text-xs">{paymentDetails.id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-warning">Processing</span>
                </p>
              </div>
            )}
          </div>
        );
        
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Payment Failed</h2>
            <p className="text-muted-foreground max-w-md mb-4">
              We were unable to process your payment. Please try again or contact support
              if the problem persists.
            </p>
            {paymentDetails && paymentDetails.message && (
              <div className="w-full max-w-md bg-destructive/10 text-destructive rounded-lg p-4 mb-4">
                {paymentDetails.message}
              </div>
            )}
          </div>
        );
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Payment Confirmation</CardTitle>
          <CardDescription className="text-center">
            Status of your recent payment transaction
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderContent()}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline"
          >
            Return to Dashboard
          </Button>
          
          {status === 'error' && (
            <Button 
              onClick={() => navigate('/payment')}
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
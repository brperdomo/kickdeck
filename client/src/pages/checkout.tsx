import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStripe, useElements, Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Initialize Stripe (lazy - null if no key configured)
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// The checkout form component that uses Stripe Elements
const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to your customer
        setPaymentError(error.message || 'An error occurred during payment processing.');
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: error.message || 'An error occurred during payment processing.',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment was successful, redirect to confirmation page
        toast({
          title: "Payment Successful",
          description: "Your payment has been successfully processed.",
        });
        setLocation(`/payment-confirmation?payment_intent=${paymentIntent.id}`);
      } else {
        // Handle other potential statuses or redirect for further action
        setLocation(`/payment-confirmation?payment_intent=${paymentIntent?.id || ''}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError('An unexpected error occurred. Please try again.');
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
      
      <PaymentElement />
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="w-full md:w-auto"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Complete Payment'
          )}
        </Button>
      </div>
    </form>
  );
};

// The main Checkout page component
export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { toast } = useToast();
  const [location] = useLocation();

  useEffect(() => {
    // Extract order ID and amount from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    const amount = params.get('amount');
    const teamId = params.get('team_id');
    const eventId = params.get('event_id');

    if (!orderId && !teamId) {
      setLoadingError('Missing order information. Please return to the registration process.');
      return;
    }

    if (!amount) {
      setLoadingError('Missing payment amount. Please return to the registration process.');
      return;
    }

    // Create or retrieve a payment intent when the component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest(
          'POST', 
          '/api/payments/create-intent', 
          { 
            orderId, 
            amount: parseFloat(amount),
            teamId,
            eventId
          }
        );
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to initialize payment');
        }
        
        setClientSecret(data.clientSecret);
        setOrderDetails({
          amount: parseFloat(amount),
          orderId: orderId || `Team-${teamId}`,
        });
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to initialize payment');
        toast({
          variant: "destructive",
          title: "Payment Setup Error",
          description: error instanceof Error ? error.message : 'Failed to initialize payment',
        });
      }
    };

    createPaymentIntent();
  }, [location, toast]);

  if (loadingError) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Error</CardTitle>
            <CardDescription>There was a problem setting up your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{loadingError}</AlertDescription>
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

  if (!clientSecret) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Order #{orderDetails?.orderId} - ${(orderDetails?.amount / 100).toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0A2540',
                  colorBackground: '#ffffff',
                  colorText: '#30313d',
                }
              }
            }}
          >
            <CheckoutForm />
          </Elements>
        </CardContent>
      </Card>

      <div className="mt-6 text-sm text-center text-muted-foreground">
        Your payment is secured through Stripe. We do not store your card details.
      </div>
    </div>
  );
}
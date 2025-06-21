import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, CreditCard, AlertTriangle, DollarSign } from "lucide-react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface TeamData {
  id: number;
  name: string;
  amount: number;
  eventName: string;
  ageGroup: string;
  contactEmail: string;
  setupIntentId?: string;
}

interface PaymentFormProps {
  team: TeamData;
  onPaymentComplete: () => void;
}

function PaymentForm({ team, onPaymentComplete }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const completePaymentMutation = useMutation({
    mutationFn: async ({ paymentMethodId }: { paymentMethodId: string }) => {
      const response = await fetch(`/api/payment-completion/complete/${team.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment setup failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-completion/validate-token'] });
      onPaymentComplete();
    },
    onError: (error: Error) => {
      setError(error.message);
      setIsProcessing(false);
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: team.contactEmail,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Failed to create payment method');
        setIsProcessing(false);
        return;
      }

      if (!paymentMethod) {
        setError('Failed to create payment method');
        setIsProcessing(false);
        return;
      }

      // Complete payment setup
      await completePaymentMutation.mutateAsync({
        paymentMethodId: paymentMethod.id
      });

    } catch (error) {
      console.error('Payment setup error:', error);
      setError(error instanceof Error ? error.message : 'Payment setup failed');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/20">
        <h3 className="font-medium mb-3">Payment Method</h3>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          Your card will be saved securely. Payment will be processed once your team is approved.
        </div>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="min-w-32"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Save Payment Method
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function PaymentSuccess({ team }: { team: TeamData }) {
  return (
    <div className="text-center space-y-4">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold text-green-700">Payment Setup Complete!</h2>
      <p className="text-muted-foreground">
        Your payment method has been saved successfully for <strong>{team.name}</strong>.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
        <h3 className="font-medium text-green-800">What happens next?</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Your team registration is now complete</li>
          <li>• Payment will be processed automatically once your team is approved</li>
          <li>• You'll receive a confirmation email with your receipt</li>
          <li>• Check your email for further event details</li>
        </ul>
      </div>
    </div>
  );
}

export default function CompletePayment() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Validate token and get team data
  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ['/api/payment-completion/validate-token', token],
    queryFn: async () => {
      if (!token) throw new Error('No payment token provided');
      
      const response = await fetch(`/api/payment-completion/validate-token/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid payment link');
      }
      
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Validating payment link...</p>
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Payment Link</CardTitle>
            <CardDescription>
              The payment link you followed is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || 'This payment link is no longer valid'}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation('/')} 
              variant="outline" 
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const team = teamData.team;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Complete Payment Setup
            </CardTitle>
            <CardDescription>
              Secure your team registration by adding a payment method
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Team Information */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  <p className="text-muted-foreground">{team.eventName}</p>
                  {team.ageGroup && (
                    <Badge variant="secondary" className="mt-1">
                      {team.ageGroup}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${(team.amount / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Registration Fee
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form or Success Message */}
            {paymentComplete ? (
              <PaymentSuccess team={team} />
            ) : (
              <Elements stripe={stripePromise}>
                <PaymentForm 
                  team={team} 
                  onPaymentComplete={() => setPaymentComplete(true)}
                />
              </Elements>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Having trouble? Contact support at{' '}
            <a href="mailto:support@matchpro.ai" className="underline">
              support@matchpro.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
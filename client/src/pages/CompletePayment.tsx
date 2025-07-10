import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payment';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface URLParams {
  setup_intent?: string;
  payment_intent?: string;
  payment_intent_client_secret?: string;
  team_id: string;
}

// Component for completing Payment Intents that require action
function PaymentIntentCompletionForm({ clientSecret, teamId, teamInfo }: { clientSecret: string; teamId: string; teamInfo: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        redirect: 'if_required'
      });

      if (confirmError) {
        setError(confirmError.message || 'Failed to confirm payment');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setIsComplete(true);
        toast({
          title: "Payment Completed",
          description: "Your payment has been successfully processed.",
        });
        
        // Notify backend to update team status and send emails
        try {
          await fetch(`/api/teams/${teamId}/complete-payment-intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id
            })
          });
        } catch (backendError) {
          console.error('Error notifying backend of payment completion:', backendError);
          // Don't show error to user since payment succeeded
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Payment Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your payment has been successfully processed.
          </p>
          
          {/* Payment Receipt Details */}
          {teamInfo && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
              <div className="text-sm text-green-800 font-medium mb-2">Payment Receipt</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Team:</span>
                  <span className="font-medium text-green-900">{teamInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Event:</span>
                  <span className="font-medium text-green-900">{teamInfo.eventName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-green-700 font-medium">Amount Paid:</span>
                  <span className="font-bold text-green-900">
                    {teamInfo.feeBreakdown ? teamInfo.feeBreakdown.totalAmountFormatted : `$${(teamInfo.totalAmount / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            You can now close this window. You should receive a confirmation email shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Complete Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Payment Amount Information */}
        {teamInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Team:</span>
                <span className="font-medium text-blue-900">{teamInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Event:</span>
                <span className="font-medium text-blue-900">{teamInfo.eventName}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-3 border-t border-blue-200">
                <span className="text-blue-700 font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-blue-900">
                  {teamInfo.feeBreakdown ? teamInfo.feeBreakdown.totalAmountFormatted : `$${(teamInfo.totalAmount / 100).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-gray-600 mb-4">
          Your payment requires additional verification. Click the button below to complete the payment process.
        </p>
        
        <Button 
          onClick={handleSubmit}
          className="w-full" 
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            teamInfo 
              ? `Complete Payment of ${teamInfo.feeBreakdown ? teamInfo.feeBreakdown.totalAmountFormatted : `$${(teamInfo.totalAmount / 100).toFixed(2)}`}`
              : 'Complete Payment'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function PaymentCompletionForm({ clientSecret, teamId, teamInfo }: { clientSecret: string; teamId: string; teamInfo: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Failed to submit payment information');
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/complete-payment?team_id=${teamId}&success=true`,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        setError(confirmError.message || 'Failed to confirm payment method');
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        setIsComplete(true);
        toast({
          title: "Payment Method Saved",
          description: "Your payment information has been securely saved. Processing payment...",
        });
        
        // Now process the actual payment
        await processTeamPayment(teamId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const processTeamPayment = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/complete-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Payment Processed",
          description: `Payment of $${result.amount} has been successfully processed.`,
        });
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Error",
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: "destructive"
      });
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Payment Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your payment method has been saved and your registration payment has been processed.
          </p>
          
          {/* Payment Receipt Details */}
          {teamInfo && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
              <div className="text-sm text-green-800 font-medium mb-2">Payment Receipt</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Team:</span>
                  <span className="font-medium text-green-900">{teamInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Event:</span>
                  <span className="font-medium text-green-900">{teamInfo.eventName}</span>
                </div>
                {teamInfo.paymentIntentId && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Transaction ID:</span>
                    <span className="font-mono text-xs text-green-900">{teamInfo.paymentIntentId}</span>
                  </div>
                )}
                {teamInfo.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Paid At:</span>
                    <span className="text-green-900">{new Date(teamInfo.paidAt).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-green-700 font-medium">Amount Paid:</span>
                  <span className="font-bold text-green-900">
                    {teamInfo.feeBreakdown ? teamInfo.feeBreakdown.totalAmountFormatted : `$${(teamInfo.totalAmount / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            You can now close this window. You should receive a confirmation email shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Complete Payment Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Payment Amount Information with Fee Breakdown */}
        {teamInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Team:</span>
                <span className="font-medium text-blue-900">{teamInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Event:</span>
                <span className="font-medium text-blue-900">{teamInfo.eventName}</span>
              </div>
              
              {/* Fee Breakdown */}
              {teamInfo.feeBreakdown ? (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-blue-600 mb-2 font-medium">Payment Breakdown:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tournament Cost:</span>
                      <span className="text-blue-900">{teamInfo.feeBreakdown.tournamentCostFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Platform Fee (4%):</span>
                      <span className="text-blue-900">{teamInfo.feeBreakdown.platformFeeFormatted}</span>
                    </div>
                  </div>
                </div>
              ) : null}
              
              <div className="flex justify-between items-center pt-2 mt-3 border-t border-blue-200">
                <span className="text-blue-700 font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-blue-900">
                  {teamInfo.feeBreakdown ? teamInfo.feeBreakdown.totalAmountFormatted : `$${(teamInfo.totalAmount / 100).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-md">
            <PaymentElement />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || !elements || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              teamInfo 
                ? `Submit Payment of ${teamInfo.feeBreakdown ? teamInfo.feeBreakdown.totalAmountFormatted : `$${(teamInfo.totalAmount / 100).toFixed(2)}`}`
                : 'Complete Payment Setup'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CompletePayment() {
  const [location] = useLocation();
  const [params, setParams] = useState<URLParams | null>(null);
  const [teamInfo, setTeamInfo] = useState<{
    id: number;
    name: string;
    eventName: string;
    totalAmount: number;
    paymentStatus: string;
    paymentIntentId?: string;
    paidAt?: string;
    feeBreakdown?: {
      tournamentCost: number;
      tournamentCostFormatted: string;
      platformFee: number;
      platformFeeFormatted: string;
      totalAmount: number;
      totalAmountFormatted: string;
      platformFeeRate: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get URL parameters from window.location.search instead of wouter location
    const urlParams = new URLSearchParams(window.location.search);
    const setupIntent = urlParams.get('setup_intent');
    const paymentIntent = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
    const teamId = urlParams.get('team_id');

    console.log('CompletePayment URL parsing:', {
      fullUrl: window.location.href,
      search: window.location.search,
      setupIntent,
      paymentIntent,
      paymentIntentClientSecret,
      teamId,
      allParams: Object.fromEntries(urlParams.entries())
    });

    if ((!setupIntent && !paymentIntent) || !teamId) {
      console.error('Missing required parameters:', { setupIntent, paymentIntent, teamId });
      setError('Invalid payment link. Please check the URL and try again.');
      setLoading(false);
      return;
    }

    setParams({ 
      setup_intent: setupIntent || undefined, 
      payment_intent: paymentIntent || undefined,
      payment_intent_client_secret: paymentIntentClientSecret || undefined,
      team_id: teamId 
    });

    // Fetch team information using the public payment info endpoint
    fetch(`/api/teams/${teamId}/payment-info`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        const teamData = {
          id: data.teamId,
          name: data.teamName,
          eventName: data.eventName,
          totalAmount: data.totalAmount,
          paymentStatus: data.paymentStatus,
          paymentIntentId: data.paymentIntentId,
          paidAt: data.paidAt,
          feeBreakdown: data.feeBreakdown
        };
        
        setTeamInfo(teamData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching team info:', err);
        setError('Failed to load team information');
        setLoading(false);
      });
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading payment setup...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !params) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-800">Payment Setup Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Invalid payment link'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if payment has already been completed
  if (teamInfo && (teamInfo.paymentStatus === 'paid' || teamInfo.paymentIntentId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Payment Already Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Payment for this team has already been successfully processed.
              </p>
            </div>

            {/* Payment Receipt Information */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">Payment Receipt</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Team:</span>
                  <span className="font-medium text-green-900">{teamInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Event:</span>
                  <span className="font-medium text-green-900">{teamInfo.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Amount Paid:</span>
                  <span className="font-medium text-green-900">
                    {teamInfo.feeBreakdown 
                      ? teamInfo.feeBreakdown.totalAmountFormatted 
                      : `$${(teamInfo.totalAmount / 100).toFixed(2)}`
                    }
                  </span>
                </div>
                {teamInfo.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Payment Date:</span>
                    <span className="font-medium text-green-900">
                      {new Date(teamInfo.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {teamInfo.paymentIntentId && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Transaction ID:</span>
                    <span className="font-mono text-xs text-green-900">{teamInfo.paymentIntentId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                If you need assistance or have questions about this payment, please contact support with the transaction ID above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stripe = getStripe();

  if (!stripe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Payment system unavailable. Please try again later.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {teamInfo && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Payment for {teamInfo.name}
            </h1>
            <p className="text-gray-600">
              {params.payment_intent ? 
                'Your payment requires additional verification to complete.' :
                'Please provide your payment information to complete your team registration.'
              }
            </p>
          </div>
        )}
        
        {/* Render appropriate component based on whether it's setup intent or payment intent */}
        {params.payment_intent && params.payment_intent_client_secret ? (
          // Payment Intent completion - needs Elements wrapper for Stripe authentication
          <Elements
            stripe={stripe}
            options={{
              clientSecret: params.payment_intent_client_secret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#2563eb',
                },
              },
            }}
          >
            <PaymentIntentCompletionForm 
              clientSecret={params.payment_intent_client_secret} 
              teamId={params.team_id}
              teamInfo={teamInfo}
            />
          </Elements>
        ) : params.setup_intent ? (
          // Setup Intent completion - needs Elements wrapper
          <Elements
            stripe={stripe}
            options={{
              clientSecret: params.setup_intent,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#2563eb',
                },
              },
            }}
          >
            <PaymentCompletionForm 
              clientSecret={params.setup_intent} 
              teamId={params.team_id}
              teamInfo={teamInfo}
            />
          </Elements>
        ) : (
          <Card className="w-full max-w-md mx-auto">
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>Invalid payment completion link. Missing required parameters.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
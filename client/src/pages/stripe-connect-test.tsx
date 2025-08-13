import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, TestTube, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Card element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      '::placeholder': {
        color: '#9ca3af',
      },
      backgroundColor: 'transparent',
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

function StripeConnectTestForm() {
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    teamName: 'Test Team FC',
    email: user?.email || '',
    phone: '555-123-4567',
    amount: 250 // Test amount in dollars
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Stripe Not Ready",
        description: "Stripe is still loading. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setTestResult(null);

    try {
      console.log('🧪 Starting Stripe Connect setup intent test...');
      
      // Create setup intent for Stripe Connect account
      const setupResponse = await fetch('/api/stripe-connect/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName: formData.teamName,
          email: formData.email,
          phone: formData.phone,
          testAmount: Math.round(formData.amount * 100), // Convert to cents
          testMode: true // Flag to indicate this is a test
        })
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Setup intent creation failed: ${setupResponse.status}`);
      }

      const { clientSecret, customerId, accountId } = await setupResponse.json();
      console.log('✅ Setup intent created:', { clientSecret, customerId, accountId });

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm setup intent with card
      console.log('💳 Confirming setup intent with card...');
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.teamName,
            email: formData.email,
            phone: formData.phone
          }
        }
      });

      if (error) {
        console.error('❌ Setup intent confirmation failed:', error);
        throw new Error(error.message || 'Payment setup failed');
      }

      console.log('✅ Setup intent confirmed successfully:', setupIntent);

      // Display test results
      setTestResult({
        success: true,
        setupIntentId: setupIntent.id,
        paymentMethodId: setupIntent.payment_method,
        customerId,
        accountId,
        status: setupIntent.status,
        testAmount: formData.amount
      });

      toast({
        title: "Test Successful",
        description: "Stripe Connect setup intent test completed successfully!",
        variant: "default"
      });

    } catch (error) {
      console.error('❌ Stripe Connect test error:', error);
      
      setTestResult({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Test Failed",
        description: error.message || "Setup intent test failed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Stripe Connect Testing Interface</h1>
          <p className="text-purple-200">Test setup intents for Stripe Connect accounts without affecting production</p>
        </div>

        <Alert className="border-yellow-400/30 bg-yellow-900/20 mb-6">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-100">
            <strong>Testing Environment:</strong> This interface creates setup intents in the Stripe Connect account. 
            It does not affect your production team registration workflow or process real payments.
          </AlertDescription>
        </Alert>

        <Card className="bg-black/30 border-purple-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TestTube className="h-5 w-5 text-purple-400" />
              Stripe Connect Setup Intent Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTestPayment} className="space-y-6">
              {/* Test Data Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamName" className="text-white">Team Name</Label>
                  <Input
                    id="teamName"
                    value={formData.teamName}
                    onChange={(e) => handleInputChange('teamName', e.target.value)}
                    className="bg-black/20 border-purple-400/30 text-white"
                    placeholder="Test Team FC"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-black/20 border-purple-400/30 text-white"
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-black/20 border-purple-400/30 text-white"
                    placeholder="555-123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="amount" className="text-white">Test Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="bg-black/20 border-purple-400/30 text-white"
                    placeholder="250"
                  />
                </div>
              </div>

              {/* Credit Card Input */}
              <div>
                <Label className="text-white mb-2 block">Credit Card Information</Label>
                <div className="p-4 bg-black/20 border border-purple-400/30 rounded-lg">
                  <CardElement options={cardElementOptions} />
                </div>
              </div>

              {/* Test Button */}
              <Button
                type="submit"
                disabled={isProcessing || !stripe}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Setup Intent...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Test Stripe Connect Setup Intent
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card className={`mt-6 ${testResult.success ? 'bg-green-900/20 border-green-400/30' : 'bg-red-900/20 border-red-400/30'} backdrop-blur-sm`}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResult.success ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Badge variant="outline" className="text-green-300 border-green-400/30 mb-2">
                        Setup Intent ID
                      </Badge>
                      <p className="text-sm text-green-200 font-mono break-all">
                        {testResult.setupIntentId}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-green-300 border-green-400/30 mb-2">
                        Customer ID
                      </Badge>
                      <p className="text-sm text-green-200 font-mono break-all">
                        {testResult.customerId}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-green-300 border-green-400/30 mb-2">
                        Account ID
                      </Badge>
                      <p className="text-sm text-green-200 font-mono break-all">
                        {testResult.accountId}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-green-300 border-green-400/30 mb-2">
                        Status
                      </Badge>
                      <p className="text-sm text-green-200">
                        {testResult.status}
                      </p>
                    </div>
                  </div>
                  <Alert className="border-green-400/30 bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-100">
                      Setup intent successfully created in Stripe Connect account. Customer can now be charged through the connected account.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert className="border-red-400/30 bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-100">
                      <strong>Test Failed:</strong> {testResult.error}
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-red-300">
                    Timestamp: {testResult.timestamp}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function StripeConnectTest() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-black/30 border-purple-400/30 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
            <p className="text-purple-200 mb-4">Please log in to access the Stripe Connect testing interface.</p>
            <Button onClick={() => window.location.href = '/auth'} className="bg-purple-600 hover:bg-purple-700">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeConnectTestForm />
    </Elements>
  );
}
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StripePaymentProvider from '@/components/payment/StripePaymentProvider';
import CheckoutForm from '@/components/payment/CheckoutForm';
import { useToast } from '@/hooks/use-toast';

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(3000); // Default $30.00
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to cents and ensure it's a valid number
    const newAmount = Math.round(parseFloat(e.target.value) * 100);
    setAmount(isNaN(newAmount) ? 0 : newAmount);
  };
  
  const handlePaymentSuccess = (paymentIntentId: string) => {
    toast({
      title: 'Payment Successful',
      description: `Payment ID: ${paymentIntentId}`,
    });
    
    // Redirect after a short delay to show the success message
    setTimeout(() => {
      navigate(`/payment-confirmation?payment_intent=${paymentIntentId}`);
    }, 1500);
  };
  
  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };
  
  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Complete your payment securely with Stripe</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={(amount / 100).toFixed(2)}
                onChange={handleAmountChange}
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Payment form */}
          {amount > 0 && (
            <StripePaymentProvider 
              amount={amount}
              description="Test payment"
              metadata={{ type: 'test_payment' }}
            >
              <CheckoutForm
                totalAmount={amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                buttonText="Pay Now"
              />
            </StripePaymentProvider>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
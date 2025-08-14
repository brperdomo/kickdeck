import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PaymentRetryButtonProps {
  teamId: number;
  teamName: string;
  paymentStatus: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

interface RetryEligibility {
  eligible: boolean;
  reasons: string[];
  hasPaymentMethod: boolean;
  isPaid: boolean;
  paymentStatus: string;
  recentFailureCount: number;
  attachmentErrors: number;
  canFixAttachment: boolean;
}

export function PaymentRetryButton({ 
  teamId, 
  teamName, 
  paymentStatus, 
  onSuccess,
  disabled = false 
}: PaymentRetryButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [eligibility, setEligibility] = useState<RetryEligibility | null>(null);
  const { toast } = useToast();

  const checkEligibility = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/admin/retry-payment/eligibility/${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to check retry eligibility');
      }
      
      const data = await response.json();
      setEligibility(data);
      
      if (!data.eligible) {
        toast({
          title: "Payment Retry Not Available",
          description: data.reasons.join(', '),
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast({
        title: "Error",
        description: "Failed to check payment retry eligibility",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const retryPayment = async () => {
    if (!eligibility?.eligible || isRetrying) return;
    
    setIsRetrying(true);
    try {
      const response = await fetch(`/api/admin/retry-payment/retry/${teamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "Payment Retry Successful!",
          description: `Payment for ${teamName} has been processed successfully.`,
          variant: "default",
        });
        onSuccess?.();
      } else {
        throw new Error(data.error || 'Payment retry failed');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast({
        title: "Payment Retry Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't show button if payment is already successful
  if (paymentStatus === 'paid') {
    return null;
  }

  // Show eligibility check button if we haven't checked yet
  if (!eligibility) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={checkEligibility}
              disabled={disabled || isChecking}
              className="gap-2"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {isChecking ? 'Checking...' : 'Retry Payment'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Check if payment can be retried for {teamName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show retry button if eligible
  if (eligibility.eligible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={retryPayment}
              disabled={disabled || isRetrying}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isRetrying ? 'Processing...' : 'Retry Payment'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-sm">
              <p className="font-medium">Ready to retry payment for {teamName}</p>
              {eligibility.canFixAttachment && (
                <p className="text-sm text-muted-foreground mt-1">
                  Will fix PaymentMethod attachment issue ({eligibility.attachmentErrors} errors detected)
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show why retry is not available
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={true}
            className="gap-2 opacity-50"
          >
            <AlertCircle className="h-4 w-4" />
            Cannot Retry
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-sm">
            <p className="font-medium">Payment retry not available:</p>
            <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
              {eligibility.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StripeConnectBankingViewProps {
  eventId: string;
}

interface ConnectAccountStatus {
  status: 'not_connected' | 'pending' | 'active' | 'rejected' | 'restricted';
  accountId: string | null;
  requirements: string[];
  eventuallyDue: string[];
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  businessProfile?: any;
  country?: string;
  defaultCurrency?: string;
  detailsSubmitted?: boolean;
}

export function StripeConnectBankingView({ eventId }: StripeConnectBankingViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Connect account status
  const { data: connectStatus, isLoading, error } = useQuery<ConnectAccountStatus>({
    queryKey: ['stripe-connect-account', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/connect-account`);
      if (!response.ok) {
        throw new Error('Failed to fetch Connect account status');
      }
      return response.json();
    },
  });

  // Create Connect account mutation
  const createAccountMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await fetch(`/api/events/${eventId}/connect-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, country: 'US', type: 'standard' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create Connect account');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe onboarding
      window.open(data.onboardingUrl, '_blank');
      
      toast({
        title: "Bank Account Setup Started",
        description: "Complete the setup process in the new window, then return here to check status.",
      });

      // Refresh status after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['stripe-connect-account', eventId] });
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create reauth link mutation
  const reauthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${eventId}/connect-account/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create reauth link');
      }

      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.onboardingUrl, '_blank');
      toast({
        title: "Continue Setup",
        description: "Complete the remaining setup steps in the new window.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get dashboard link mutation
  const dashboardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${eventId}/connect-account/dashboard`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get dashboard link');
      }

      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.dashboardUrl, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
      case 'restricted':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Setup</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'restricted':
        return <Badge variant="destructive">Restricted</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  const handleCreateAccount = () => {
    const email = prompt('Enter the email address for the bank account holder:');
    if (email) {
      createAccountMutation.mutate({ email });
    }
  };

  const refreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['stripe-connect-account', eventId] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load banking information. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tournament Banking Setup</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect a bank account to receive registration payments directly for this tournament.
          All registration fees will be automatically deposited to the connected account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectStatus && getStatusIcon(connectStatus.status)}
            Bank Account Status
            {connectStatus && getStatusBadge(connectStatus.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectStatus?.status === 'not_connected' ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Bank account setup required:</strong> To receive registration payments for this tournament, 
                  you'll need to connect a bank account through Stripe. This is a secure, one-time setup process.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">What you'll need:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Business or personal bank account details</li>
                  <li>• Tax identification number (SSN or EIN)</li>
                  <li>• Government-issued ID for verification</li>
                  <li>• Business documents (if applicable)</li>
                </ul>
              </div>

              <Button
                onClick={handleCreateAccount}
                disabled={createAccountMutation.isPending}
                className="w-full"
              >
                {createAccountMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Set Up Bank Account'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connectStatus?.accountId && (
                <div className="text-sm text-muted-foreground">
                  <strong>Account ID:</strong> {connectStatus.accountId}
                </div>
              )}

              {connectStatus?.country && (
                <div className="text-sm text-muted-foreground">
                  <strong>Country:</strong> {connectStatus.country.toUpperCase()}
                  {connectStatus.defaultCurrency && (
                    <span className="ml-2">
                      <strong>Currency:</strong> {connectStatus.defaultCurrency.toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {connectStatus?.payoutsEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    Payouts {connectStatus?.payoutsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {connectStatus?.chargesEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    Charges {connectStatus?.chargesEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {connectStatus?.requirements && connectStatus.requirements.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Action Required:</strong> Complete the following requirements:
                    <ul className="mt-2 space-y-1">
                      {connectStatus.requirements.map((req, index) => (
                        <li key={index} className="text-sm">• {req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {connectStatus?.eventuallyDue && connectStatus.eventuallyDue.length > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Eventually Due:</strong> These requirements will be needed in the future:
                    <ul className="mt-2 space-y-1">
                      {connectStatus.eventuallyDue.map((req, index) => (
                        <li key={index} className="text-sm">• {req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={refreshStatus}
                  size="sm"
                >
                  Refresh Status
                </Button>

                {connectStatus?.status === 'pending' && (
                  <Button
                    onClick={() => reauthMutation.mutate()}
                    disabled={reauthMutation.isPending}
                    size="sm"
                  >
                    {reauthMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Link...
                      </>
                    ) : (
                      <>
                        Continue Setup
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}

                {connectStatus?.status === 'active' && (
                  <Button
                    onClick={() => dashboardMutation.mutate()}
                    disabled={dashboardMutation.isPending}
                    size="sm"
                  >
                    {dashboardMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        View Dashboard
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {connectStatus?.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">✓ Ready to Receive Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your bank account is successfully connected and verified. Registration payments 
              for this tournament will be automatically deposited to your account, typically 
              within 2-7 business days.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
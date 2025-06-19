import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink, AlertCircle, CheckCircle, Clock, XCircle, Shield, Info, BarChart3, Users, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PaymentReportsView } from "./PaymentReportsView";
import { RegistrationAnalytics } from "./RegistrationAnalytics";

interface StripeConnectBankingViewProps {
  eventId: string;
}

// Secure form validation schema
const bankAccountSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
  confirmEmail: z.string()
    .email('Please enter a valid email address'),
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters')
    .optional(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Email addresses must match",
  path: ["confirmEmail"],
});

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
  const [showSetupForm, setShowSetupForm] = useState(false);

  // Check for success parameter from Stripe redirect
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      toast({
        title: "Banking Setup Progress",
        description: "Successfully completed step in Stripe. Your banking information has been updated.",
        duration: 5000,
      });
      
      // Clean up URL parameters
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      
      // Refresh account status
      queryClient.invalidateQueries({ queryKey: ['stripe-connect-account', eventId] });
    }
  }, [eventId, toast, queryClient]);

  // Secure form for bank account setup
  const form = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      email: '',
      confirmEmail: '',
      businessName: '',
    },
  });

  // Fetch Connect account status with enhanced error handling
  const { data: connectStatus, isLoading, error } = useQuery<ConnectAccountStatus>({
    queryKey: ['stripe-connect-account', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/connect-account`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please refresh the page and log in again.');
        }
        if (response.status === 403) {
          throw new Error('Admin privileges required for banking access.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load banking information');
      }
      return response.json();
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('Authentication') || error.message.includes('Admin privileges')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: 1000,
  });

  // Create Connect account mutation with secure form data
  const createAccountMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof bankAccountSchema>) => {
      const response = await fetch(`/api/events/${eventId}/connect-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          businessName: formData.businessName,
          country: 'US', 
          type: 'standard' 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorObj = new Error(error.error || 'Failed to create Connect account');
        // Attach additional error details for better handling
        (errorObj as any).details = error.details;
        (errorObj as any).actionRequired = error.actionRequired;
        (errorObj as any).helpUrl = error.helpUrl;
        throw errorObj;
      }

      return response.json();
    },
    onSuccess: (data) => {
      setShowSetupForm(false);
      form.reset();
      
      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
        toast({
          title: "Secure Account Created",
          description: "Complete the setup process in the new window, then return here to check status.",
        });
      }

      // Refresh status after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['stripe-connect-account', eventId] });
      }, 3000);
    },
    onError: (error: any) => {
      // Handle specific Stripe Connect setup error
      if (error.actionRequired === 'enable_stripe_connect' || error.message.includes('signed up for Connect')) {
        toast({
          title: "Stripe Connect Required",
          description: error.details || "Your Stripe account needs Stripe Connect enabled. Visit your Stripe Dashboard > Connect settings to enable this feature.",
          variant: "destructive",
        });
      } else if (error.message.includes('Authentication') || error.message.includes('Admin privileges')) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to set up banking. Please log in as an administrator.",
          variant: "destructive",
        });
      } else if (error.actionRequired === 'check_stripe_keys') {
        toast({
          title: "Configuration Error",
          description: "Stripe API credentials are invalid. Please check your configuration.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Setup Failed",
          description: error.message,
          variant: "destructive",
        });
      }
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
      
      // Show different messages based on dashboard type
      if (data.hasExpressDashboard) {
        toast({
          title: "Express Dashboard Opened",
          description: "You can manage your account settings and view payouts in the new window.",
        });
      } else {
        toast({
          title: "Stripe Dashboard Opened",
          description: "Access your Connect account through the main Stripe dashboard in the new window.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Dashboard Access Error",
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
    setShowSetupForm(true);
  };

  const onSubmitForm = (values: z.infer<typeof bankAccountSchema>) => {
    createAccountMutation.mutate(values);
  };

  const refreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['stripe-connect-account', eventId] });
  };

  // Reset banking verification mutation
  const resetBankingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${eventId}/connect-account`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset banking verification');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Banking Reset Complete",
        description: "Banking verification has been reset. You can now set up banking with correct information.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['stripe-connect-account', eventId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
          <strong>Banking Access Error:</strong> {error.message}
          {error.message.includes('Authentication') && (
            <div className="mt-2">
              <button 
                onClick={() => window.location.reload()} 
                className="text-sm underline hover:no-underline"
              >
                Click here to refresh and try again
              </button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tournament Banking & Payments</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your bank account setup and view comprehensive payment reports all in one place.
        </p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Banking Setup
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Registration Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Payment Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6 mt-6">
          <div className="space-y-6">

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

              {!showSetupForm ? (
                <Button
                  onClick={handleCreateAccount}
                  disabled={createAccountMutation.isPending}
                  className="w-full"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Set Up Secure Bank Account
                </Button>
              ) : (
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Shield className="h-5 w-5" />
                      Secure Bank Account Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4 border-blue-200 bg-blue-50">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        This form uses secure validation and encryption. Your information is protected 
                        and only shared with Stripe for account verification.
                      </AlertDescription>
                    </Alert>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Account Holder Email *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email"
                                  placeholder="Enter email address"
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Email Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email"
                                  placeholder="Confirm email address"
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business/Organization Name (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter business name"
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2 pt-4">
                          <Button
                            type="submit"
                            disabled={createAccountMutation.isPending}
                            className="flex-1"
                          >
                            {createAccountMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Secure Account...
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Create Secure Account
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowSetupForm(false);
                              form.reset();
                            }}
                            disabled={createAccountMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
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
                    <strong>Action Required:</strong> Your banking setup is incomplete. Complete the following requirements:
                    <ul className="mt-2 space-y-1">
                      {connectStatus.requirements.map((req, index) => (
                        <li key={index} className="text-sm">• {req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                    <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>How to resume:</strong> Click "Continue Setup" below to return to Stripe and complete the missing information. 
                        Your progress has been saved and you can pick up where you left off.
                      </p>
                    </div>
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
                
                <Button
                  variant="outline"
                  onClick={() => resetBankingMutation.mutate()}
                  disabled={resetBankingMutation.isPending}
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  {resetBankingMutation.isPending ? 'Resetting...' : 'Reset Banking Setup'}
                </Button>

                {connectStatus?.status === 'pending' && (
                  <Button
                    onClick={() => reauthMutation.mutate()}
                    disabled={reauthMutation.isPending}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {reauthMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening Stripe...
                      </>
                    ) : (
                      <>
                        Continue Banking Setup
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

      {connectStatus?.status === 'pending' && (
        <Card className="border-2 border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Banking Setup In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-md border border-yellow-200">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Setup Status:</strong> You've started the banking setup process but haven't completed all required steps.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">To resume your setup:</h4>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>1. Click "Continue Banking Setup" below</li>
                  <li>2. Complete any missing information in Stripe</li>
                  <li>3. Submit required verification documents</li>
                  <li>4. Return here to check your status</li>
                </ol>
              </div>

              {connectStatus?.requirements && connectStatus.requirements.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm text-red-800 font-medium">Still needed:</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {connectStatus.requirements.map((req, index) => (
                      <li key={index}>• {req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => reauthMutation.mutate()}
                disabled={reauthMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {reauthMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Stripe...
                  </>
                ) : (
                  <>
                    Continue Banking Setup
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={refreshStatus}
                size="default"
              >
                Check Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {connectStatus?.status === 'restricted' && (
        <Card className="border-2 border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Account Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-md border border-red-200">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Status:</strong> Your account has been restricted and requires immediate attention.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">To resolve restrictions:</h4>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>1. Click "View Dashboard" to access your Stripe account</li>
                  <li>2. Review and address all flagged issues</li>
                  <li>3. Provide any requested additional information</li>
                  <li>4. Contact Stripe support if needed</li>
                </ol>
              </div>

              {connectStatus?.requirements && connectStatus.requirements.length > 0 && (
                <div className="mt-3 p-3 bg-red-100 rounded-md border border-red-300">
                  <p className="text-sm text-red-800 font-medium">Required actions:</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {connectStatus.requirements.map((req, index) => (
                      <li key={index}>• {req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => dashboardMutation.mutate()}
                disabled={dashboardMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {dashboardMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Dashboard...
                  </>
                ) : (
                  <>
                    View Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={refreshStatus}
                size="default"
              >
                Check Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {connectStatus?.status === 'rejected' && (
        <Card className="border-2 border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Account Application Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-md border border-red-200">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Status:</strong> Your banking setup application has been rejected.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Next steps:</h4>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>1. Review the rejection reasons in your Stripe dashboard</li>
                  <li>2. Address any issues with your business information</li>
                  <li>3. Contact Stripe support for guidance</li>
                  <li>4. Start a new application once issues are resolved</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => dashboardMutation.mutate()}
                disabled={dashboardMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {dashboardMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Dashboard...
                  </>
                ) : (
                  <>
                    View Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSetupForm(true)}
                size="default"
              >
                Start New Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Banking Setup Guide */}
      <Card className="border border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Banking Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Account Status Meanings:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                    <span><strong>Not Connected:</strong> No banking setup started</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    <span><strong>Pending:</strong> Setup in progress, verification needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span><strong>Active:</strong> Ready to receive payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span><strong>Restricted:</strong> Additional information required</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Typical Setup Timeline:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• Initial setup: 5-10 minutes</div>
                  <div>• Document verification: 1-3 business days</div>
                  <div>• Account activation: 1-7 business days</div>
                  <div>• First payout: 2-7 business days after first payment</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-md border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> You can safely leave and return to this page during setup. 
                Your progress is automatically saved and you can resume where you left off using the 
                "Continue Banking Setup" button when your status is pending.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <RegistrationAnalytics eventId={eventId} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          <PaymentReportsView eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
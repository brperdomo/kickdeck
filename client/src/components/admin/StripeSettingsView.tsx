import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const stripeConfigSchema = z.object({
  testMode: z.boolean(),
  publishableKey: z.string().min(1, "Publishable key is required"),
  secretKey: z.string().min(1, "Secret key is required"),
  webhookSecret: z.string().optional(),
  priceId: z.string().optional(),
});

type StripeConfigFormValues = z.infer<typeof stripeConfigSchema>;

export function StripeSettingsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stripeConfig, isLoading } = useQuery({
    queryKey: ["stripe-config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stripe-config");
      if (!response.ok) throw new Error("Failed to fetch Stripe configuration");
      return response.json();
    },
  });

  const form = useForm<StripeConfigFormValues>({
    resolver: zodResolver(stripeConfigSchema),
    defaultValues: {
      testMode: true,
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
      priceId: "",
    },
  });

  // Update form when data is loaded
  React.useEffect(() => {
    if (stripeConfig) {
      form.reset(stripeConfig);
    }
  }, [stripeConfig, form]);

  const mutation = useMutation({
    mutationFn: async (values: StripeConfigFormValues) => {
      const response = await fetch("/api/admin/stripe-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save Stripe configuration");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripe-config"] });
      toast({
        title: "Success",
        description: "Stripe configuration saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save Stripe configuration",
        variant: "destructive",
      });
    },
  });

  const testConnection = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields correctly",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/admin/stripe-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.getValues()),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Connection test failed");
      }

      toast({
        title: "Success",
        description: "Stripe connection test successful",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to test Stripe connection",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Payment Gateway Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="testMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Test Mode</FormLabel>
                      <FormDescription>
                        Enable test mode to use Stripe's test environment
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publishableKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publishable Key</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={form.watch("testMode") ? "pk_test_..." : "pk_live_..."}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Your Stripe publishable key for {form.watch("testMode") ? "test" : "live"} mode
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder={form.watch("testMode") ? "sk_test_..." : "sk_live_..."}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Your Stripe secret key for {form.watch("testMode") ? "test" : "live"} mode
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhookSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Secret</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="whsec_..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Your Stripe webhook signing secret for secure webhook handling
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Price ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="price_..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: The default Stripe Price ID for subscriptions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  className="flex-1"
                >
                  Test Connection
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
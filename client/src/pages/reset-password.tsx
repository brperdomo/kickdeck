import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowLeft, Loader2 } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [location] = useLocation();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Extract token from the URL query params
    const queryParams = new URLSearchParams(location.split('?')[1]);
    const resetToken = queryParams.get('token');
    
    if (!resetToken) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Reset token is missing from the URL",
      });
      return;
    }

    // Set the token in state
    setToken(resetToken);

    // Verify the token on component mount
    verifyToken(resetToken);
  }, [location, toast]);

  const verifyToken = async (token: string) => {
    try {
      console.log('Verifying token:', token);
      // Create a URL that uses the current origin to avoid domain mismatches
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/api/auth/verify-reset-token`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Token verification failed:', await response.text());
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      console.log('Token verification response:', data);

      if (data.valid) {
        setIsTokenValid(true);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Token",
          description: "This reset link is invalid or has expired. Please request a new one.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify reset token. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Reset token is missing",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Create a URL that uses the current origin to avoid domain mismatches
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/api/auth/reset-password`;
      console.log('Making reset password request to:', url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: data.password,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });

      // Clear the form
      form.reset();
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur text-center p-6">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          </div>
          <h2 className="text-lg font-medium">Verifying your reset link...</h2>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!isTokenValid && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">This password reset link is invalid or has expired.</p>
            <Link href="/forgot-password">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Request a new reset link
              </Button>
            </Link>
            <div className="text-center mt-4">
              <Link href="/">
                <Button variant="link" className="text-sm text-green-600" type="button">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating Password..." : "Reset Password"}
              </Button>

              <div className="text-center mt-4">
                <Link href="/">
                  <Button variant="link" className="text-sm text-green-600" type="button">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
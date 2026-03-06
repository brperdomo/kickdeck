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
import { ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/layouts/AuthLayout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

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
    // Extract token from the URL query params - use window.location for full URL with query params
    console.log('Current location path:', location);
    console.log('Full URL:', window.location.href);
    
    try {
      // Use window.location.search to get the query string instead of parsing location from wouter
      const queryString = window.location.search.startsWith('?') 
        ? window.location.search.substring(1) 
        : window.location.search;
      
      console.log('Query string:', queryString);
      
      if (!queryString) {
        throw new Error('No query string found');
      }
      
      const queryParams = new URLSearchParams(queryString);
      const resetToken = queryParams.get('token');
      console.log('Extracted token:', resetToken);
      
      if (!resetToken) {
        throw new Error('Token parameter not found');
      }

      // Set the token in state
      setToken(resetToken);

      // Verify the token on component mount
      verifyToken(resetToken);
    } catch (error) {
      console.error('Error extracting token:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Reset token is missing from the URL",
      });
    }
  }, [location, toast]);

  const verifyToken = async (token: string) => {
    try {
      console.log('Verifying token:', token);
      // Create a URL that uses the current origin to avoid domain mismatches
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/api/auth/verify-reset-token`;
      console.log('Making request to:', url);
      console.log('Request body:', JSON.stringify({ token }));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Array.from(response.headers.entries())));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token verification failed:', errorText);
        throw new Error(`Token verification failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('Token verification response:', data);

      if (data.valid) {
        console.log('Token is valid, updating state');
        setIsTokenValid(true);
      } else {
        console.log('Token is invalid according to server response');
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
      <AuthLayout>
        <div className="relative">
          <AnimatedBackground type="neon" primaryColor="#7c3aed" secondaryColor="#a855f7" speed="medium" />

          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto">
              <Card className="w-full bg-[#0f0f23]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15),0_0_60px_rgba(6,182,212,0.08)]">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
                  </div>
                  <h2 className="text-lg font-medium text-white">Verifying your reset link...</h2>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Invalid token
  if (!isTokenValid && !isLoading) {
    return (
      <AuthLayout>
        <div className="relative">
          <AnimatedBackground type="neon" primaryColor="#7c3aed" secondaryColor="#a855f7" speed="medium" />

          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto">
              <Card className="w-full bg-[#0f0f23]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15),0_0_60px_rgba(6,182,212,0.08)]">
                <CardHeader className="space-y-3 pb-6">
                  <div className="flex justify-center">
                    <div className="w-64">
                      <img
                        src="/uploads/KickDeck_Linear_White.png"
                        alt="KickDeck Logo"
                        className="w-full h-full object-contain"
                        style={{ filter: "drop-shadow(0 0 20px rgba(124,58,237,0.3))" }}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-white">
                    Invalid Reset Link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center mb-6 text-gray-300">This password reset link is invalid or has expired.</p>
                  <Link href="/forgot-password">
                    <Button className="w-full h-11 text-base bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                      Request a new reset link
                    </Button>
                  </Link>
                  <div className="text-center mt-4">
                    <Link href="/">
                      <Button variant="link" className="w-full text-sm text-gray-400 p-0 h-auto font-medium hover:text-purple-400 transition-colors" type="button">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Valid token - show reset form
  return (
    <AuthLayout>
      <div className="relative">
        <AnimatedBackground type="neon" primaryColor="#7c3aed" secondaryColor="#a855f7" speed="medium" />

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto">
            <Card className="w-full bg-[#0f0f23]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15),0_0_60px_rgba(6,182,212,0.08)]">
              <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center">
                  <div className="w-64">
                    <img
                      src="/uploads/KickDeck_Linear_White.png"
                      alt="KickDeck Logo"
                      className="w-full h-full object-contain"
                      style={{ filter: "drop-shadow(0 0 20px rgba(124,58,237,0.3))" }}
                    />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-white">
                    Set New Password
                  </CardTitle>
                  <p className="text-sm text-gray-400">Choose a strong password</p>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-300">New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              className="neon-input h-11 text-base px-4 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-purple-500/20 focus:shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-300">Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              className="neon-input h-11 text-base px-4 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-purple-500/20 focus:shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-11 text-base bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        'Set New Password'
                      )}
                    </Button>

                    <div className="text-center">
                      <Link href="/">
                        <Button variant="link" className="w-full text-sm text-gray-400 p-0 h-auto font-medium hover:text-purple-400 transition-colors" type="button">
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
        </div>
      </div>
    </AuthLayout>
  );
}

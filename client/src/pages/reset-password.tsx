
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
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
import { PasswordStrength } from "@/components/ui/password-strength";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setIsTokenChecking(false);
      return;
    }

    setToken(tokenParam);
    
    // Verify token validity
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/verify-reset-token?token=${tokenParam}`);
        if (response.ok) {
          setIsValidToken(true);
        } else {
          toast({
            title: "Invalid or Expired Token",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Verification Error",
          description: "Failed to verify the reset token.",
          variant: "destructive",
        });
      } finally {
        setIsTokenChecking(false);
      }
    };

    verifyToken();
  }, [toast]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reset-password/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been successfully reset. You can now log in with your new password.",
      });
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTokenChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
            <p className="text-center">Verifying your reset token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken && !isTokenChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">This password reset link is invalid or has expired.</p>
            <Link href="/forgot-password">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
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
                    <PasswordStrength password={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
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
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
              </Button>

              <div className="text-center mt-4">
                <Link href="/login">
                  <Button variant="link" className="text-sm sm:text-base text-green-600 hover:text-green-700" type="button">
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

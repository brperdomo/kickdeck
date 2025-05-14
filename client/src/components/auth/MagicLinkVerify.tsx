import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MagicLinkVerify = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("GET", `/api/auth/magic-link/verify?token=${token}`);
      return res.json();
    },
    onSuccess: (data) => {
      setStatus("success");
      // Update the cached user data
      queryClient.setQueryData(["/api/user"], data.user);
      
      // Redirect after a brief delay to show success message
      setTimeout(() => {
        setLocation(data.redirectTo || "/");
      }, 1500);
      
      toast({
        title: "Successfully logged in",
        description: "Welcome back to MatchPro!",
      });
    },
    onError: (error: Error) => {
      setStatus("error");
      setErrorMessage(error.message || "Invalid or expired link");
      toast({
        title: "Login failed",
        description: error.message || "Invalid or expired link",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    
    if (token) {
      verifyMutation.mutate(token);
    } else {
      setStatus("error");
      setErrorMessage("No authentication token found in URL");
    }
  }, []);

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifying your login...</CardTitle>
          <CardDescription>
            Please wait while we authenticate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <p className="text-center">
            Logging you in securely...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Successful</CardTitle>
          <CardDescription>
            You've been authenticated successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-center">
            Redirecting you to your dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login Failed</CardTitle>
        <CardDescription>
          We couldn't verify your authentication link.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-6">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-center mb-6">
          {errorMessage || "Your login link may have expired or already been used."}
        </p>
        <Button onClick={() => setLocation("/auth")}>
          Return to Login
        </Button>
      </CardContent>
    </Card>
  );
};

export default MagicLinkVerify;
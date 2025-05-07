import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import AuthLayout from "@/components/layouts/AuthLayout";
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
import { Trophy, Loader2 } from "lucide-react";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { loginMutation, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);

  // Check for an existing user session and redirect immediately if found
  useEffect(() => {
    // If the user is already authenticated when the auth page loads, handle redirect immediately
    if (user) {
      console.log("User is already logged in at auth page, handling redirect...");
      
      // First check session storage for the redirectAfterAuth value
      const sessionRedirect = sessionStorage.getItem('redirectAfterAuth');
      if (sessionRedirect) {
        console.log("Found redirect in session storage:", sessionRedirect);
        sessionStorage.removeItem('redirectAfterAuth'); // Clear it to prevent future redirects
        window.location.href = sessionRedirect;
        return;
      }
      
      // Fallback to URL query parameter if session storage isn't available
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get('redirect');
      
      if (redirectParam) {
        try {
          // Decode the encoded URL parameter properly
          console.log("Raw redirect param:", redirectParam);
          const decodedPath = decodeURIComponent(redirectParam);
          console.log("Decoded redirect path:", decodedPath);
          
          // Handle special case: Extract event ID from various URL patterns
          let eventId = null;
          
          // Match "/register/event/{id}" pattern
          if (decodedPath.includes('/register/event/')) {
            const matches = decodedPath.match(/\/register\/event\/(\d+)/);
            if (matches && matches[1]) {
              eventId = matches[1];
            }
          }
          
          // If we found a valid event ID, redirect to the registration page
          if (eventId) {
            console.log("Auth page: Already logged in, redirecting to event registration with ID:", eventId);
            window.location.href = `/register/event/${eventId}`;
            return;
          }
          
          // Default case: redirect to the provided path
          console.log("Auth page: Already logged in, redirecting to:", decodedPath);
          window.location.href = decodedPath;
        } catch (e) {
          console.error("Error processing redirect URL:", e);
          // Fallback to dashboard if there's an error
          window.location.href = user.isAdmin ? '/admin' : '/dashboard';
        }
      } else if (user.isAdmin) {
        // No redirect parameter - go to admin dashboard for admins
        window.location.href = '/admin';
      } else {
        // No redirect parameter - go to regular dashboard
        window.location.href = '/dashboard';
      }
    }
  }, [user]);

  // Check for logout message from sessionStorage or URL params
  useEffect(() => {
    console.log("AuthPage useEffect - checking for logout params");
    console.log("Current search params:", window.location.search);
    
    // First check if we have a message in sessionStorage (from LogoutHandler)
    const logoutMsg = sessionStorage.getItem('logout_message');
    if (logoutMsg) {
      // Clear the message so it's only shown once
      sessionStorage.removeItem('logout_message');
      
      console.log("Found logout message in sessionStorage:", logoutMsg);
      setLogoutMessage(logoutMsg);
      toast({
        title: "Logged out",
        description: logoutMsg,
        variant: "default"
      });
      return;
    }
    
    // Fallback to URL params (for backwards compatibility)
    const searchParams = new URLSearchParams(window.location.search);
    console.log("Searching URL parameters:", Object.fromEntries(searchParams.entries()));
    
    // Check for both 'logged_out' and 'logged_out=true' formats
    const loggedOut = searchParams.get('logged_out');
    const hasLoggedOutParam = window.location.search.includes('logged_out');
    const forced = searchParams.get('forced');
    
    console.log("loggedOut param value:", loggedOut);
    console.log("hasLoggedOutParam:", hasLoggedOutParam);
    
    if (loggedOut || hasLoggedOutParam) {
      console.log("Setting logout message from URL param");
      setLogoutMessage("You have been successfully logged out");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        variant: "default"
      });
    } else if (forced) {
      setLogoutMessage("Session expired. You have been logged out.");
      toast({
        title: "Session expired",
        description: "You have been automatically logged out for security reasons",
        variant: "destructive"
      });
    }
  }, [location, toast]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle redirect after successful login
  useEffect(() => {
    // Only process if we have user data and authentication is complete
    if (!user) return;
    
    console.log("Auth page detected logged in user, handling redirect", { user });
    
    // Get the redirect URL from query parameters - primary method
    const searchParams = new URLSearchParams(window.location.search);
    const redirectParam = searchParams.get('redirect');
    
    // Then check session storage as fallback/legacy method
    const redirectPath = sessionStorage.getItem('redirectAfterAuth');
    
    if (redirectParam) {
      try {
        console.log("Found redirect parameter:", redirectParam);
        // Properly decode the URL-encoded path
        const decodedPath = decodeURIComponent(redirectParam);
        console.log("Decoded redirect path:", decodedPath);
        
        // Check if this is an event registration path with the correct format
        if (decodedPath.includes('/register/event/')) {
          // Extract the event ID from the path - this is more reliable
          const matches = decodedPath.match(/\/register\/event\/(\d+)/);
          if (matches && matches[1]) {
            const eventId = matches[1];
            console.log("Redirecting to event registration:", eventId);
            window.location.href = `/register/event/${eventId}`;
            return;
          }
        }
        
        // For other valid paths, redirect directly
        console.log("Redirecting to:", decodedPath);
        window.location.href = decodedPath;
      } catch (error) {
        console.error("Error processing redirect parameter:", error);
        // Fallback to default dashboards
        window.location.href = user.isAdmin ? '/admin' : '/dashboard';
      }
    } 
    // Fallback to sessionStorage if URL param isn't available
    else if (redirectPath) {
      try {
        console.log("Redirecting using session storage path:", redirectPath);
        sessionStorage.removeItem('redirectAfterAuth'); // Clear it to prevent future redirects
        window.location.href = redirectPath;
      } catch (error) {
        console.error("Error processing sessionStorage redirect:", error);
        // Fallback to default dashboards
        window.location.href = user.isAdmin ? '/admin' : '/dashboard';
      }
    } 
    // Default behavior if no redirect info is available
    else if (user.isAdmin) {
      console.log("No redirect params found, user is admin, redirecting to admin dashboard");
      window.location.href = '/admin';
    } else {
      console.log("No redirect params found, redirecting to dashboard");
      window.location.href = '/dashboard';
    }
  }, [user]);

  async function onSubmit(data: LoginFormData) {
    try {
      loginForm.clearErrors();
      await loginMutation.mutateAsync(data);
      
      // Login success is handled in useEffect for redirects
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show detailed error messages
      if (error.message?.toLowerCase().includes("password")) {
        loginForm.setError("password", { 
          message: "Invalid password" 
        });
      } else if (error.message?.toLowerCase().includes("email") || 
                error.message?.toLowerCase().includes("user not found")) {
        loginForm.setError("email", { 
          message: "Email not found or invalid" 
        });
      } else {
        // Generic error
        loginForm.setError("root.serverError", { 
          message: error.message || "Login failed. Please check your credentials and try again."
        });
        
        toast({
          title: "Login failed",
          description: error.message || "An error occurred during login",
          variant: "destructive"
        });
      }
    }
  }

  return (
    <AuthLayout>
      <div className="min-h-screen w-full relative">
        <AnimatedBackground type="particles" primaryColor="#3d3a98" secondaryColor="#2d2a88" speed="medium" />

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto">
            <Card className="w-full bg-[#3d3a98]/70 backdrop-blur-md shadow-xl border-0 ring-4 ring-[#6a67ff]/60 ring-offset-4 ring-offset-[#3d3a98]/20 shadow-[0_0_20px_5px_rgba(106,103,255,0.4)]">
              <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center">
                  <div className="w-100 h-100">
                    <img
                      src="/uploads/MatchProAI_Linear_BlackNOBUFFER.png"
                      alt="MatchPro Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-white">
                  Let's get you signed in
                </CardTitle>
                {logoutMessage && (
                  <div className={`mt-2 px-4 py-2 rounded-md text-sm font-medium ${
                    window.location.search.includes('forced') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {logoutMessage}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onSubmit)}
                    className="space-y-5"
                    id="login-form"
                    name="login"
                    autoComplete="on"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="username email"
                              className="h-11 text-base px-4 bg-white/90 border-white/50 focus:border-white focus:ring-white/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-yellow-200" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="current-password"
                              className="h-11 text-base px-4 bg-white/90 border-white/50 focus:border-white focus:ring-white/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-yellow-200" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-11 text-base bg-white hover:bg-white/90 text-[#3d3a98] font-medium transition-colors"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                    {loginForm.formState.errors.root?.serverError && (
                      <div className="p-3 text-sm font-medium text-white bg-red-500 rounded-md">
                        {loginForm.formState.errors.root.serverError.message}
                      </div>
                    )}
                    <Link href="/forgot-password">
                      <Button variant="link" className="w-full text-sm text-yellow-200 p-0 h-auto font-semibold hover:text-yellow-100">
                        Forgot Password?
                      </Button>
                    </Link>
                    <div className="text-center">
                      <p className="text-sm sm:text-base text-white">
                        New to MatchPro?{" "}
                        <Link href={`/register${window.location.search}`}>
                          <Button variant="link" className="p-0 h-auto font-semibold text-yellow-300 hover:text-yellow-100">
                            Register Here
                          </Button>
                        </Link>
                      </p>
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
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
import { Loader2 } from "lucide-react";
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

  // Check for logout message in session storage or URL param, and handle eventId parameter
  useEffect(() => {
    // Handle logout message — check sessionStorage first, then URL param as fallback
    const message = sessionStorage.getItem('logout_message');
    const urlParams = new URLSearchParams(window.location.search);
    const hasLoggedOut = urlParams.get('logged_out') === 'true';

    if (message) {
      console.log('Found logout message in session storage:', message);
      setLogoutMessage(message);
      sessionStorage.removeItem('logout_message');
    } else if (hasLoggedOut) {
      console.log('Detected logged_out URL param, showing default message');
      setLogoutMessage('You have been successfully logged out');
    }

    // Clean the logged_out param from URL if present
    if (hasLoggedOut) {
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('logged_out');
        window.history.replaceState({}, '', newUrl.toString());
      } catch (e) {
        console.error('Failed to clean URL:', e);
      }
    }

    // Look for redirect in URL parameters
    const redirectParam = urlParams.get('redirect');
    const eventId = urlParams.get('eventId');
    
    // Check for direct redirect parameter first (highest priority)
    if (redirectParam) {
      console.log('Found redirect parameter:', redirectParam);
      const decodedRedirect = decodeURIComponent(redirectParam);
      console.log('Setting redirectAfterAuth to:', decodedRedirect);
      sessionStorage.setItem('redirectAfterAuth', decodedRedirect);
    }
    // Check for eventId as a fallback
    else if (eventId) {
      console.log('Found eventId in URL parameters:', eventId);
      const redirectUrl = `/register/event/${eventId}`;
      console.log('Setting redirectAfterAuth to:', redirectUrl);
      sessionStorage.setItem('redirectAfterAuth', redirectUrl);
    }
    
    // If no explicit redirect is set, check current URL and store it for after-login redirect
    if (!redirectParam && !eventId) {
      const currentPath = window.location.pathname;
      
      // If we're on a protected page (not auth pages), store it for redirect
      if (currentPath !== '/' && currentPath !== '/auth' && 
          !currentPath.includes('/register') && 
          !currentPath.includes('/login') &&
          !currentPath.includes('/forgot-password') &&
          !currentPath.includes('/reset-password')) {
        console.log('Setting redirect based on current protected URL:', currentPath);
        sessionStorage.setItem('redirectAfterAuth', currentPath);
      }
      
      // Also check the referring page to catch event registration redirects
      const referrer = document.referrer;
      if (referrer && !sessionStorage.getItem('redirectAfterAuth')) {
        try {
          const referrerUrl = new URL(referrer);
          const path = referrerUrl.pathname;
          
          // If the referrer was a registration page, set it as the redirect
          if ((path.includes('/register/') || path.includes('/event/')) && 
              path !== '/register' && 
              !path.includes('/reset-password')) {
            console.log('Setting redirect based on referrer:', path);
            sessionStorage.setItem('redirectAfterAuth', path);
          }
        } catch (e) {
          console.error('Error parsing referrer URL:', e);
        }
      }
    }
  }, []);

  // AUTH REDIRECT WITH PROPER TIMING
  useEffect(() => {
    // Only process if we have user data
    if (!user) return;
    
    console.log("AUTH REDIRECT: User logged in, handling redirect");
    
    // Add a small delay to ensure authentication state is fully established
    const timer = setTimeout(() => {
      // Check for redirectAfterAuth in session storage
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      
      // Check if we're in the middle of an event registration flow
      const isDirectEventRegistration = window.location.pathname.includes('/register/event/') || 
                                        window.location.pathname.includes('/event/') && 
                                        window.location.pathname.includes('/register');
                                        
      // If we're already on a registration page, don't redirect anywhere
      if (isDirectEventRegistration) {
        console.log("Already on event registration page - not redirecting to dashboard");
        return;
      }
      
      if (redirectPath) {
        console.log("Found redirect path:", redirectPath);
        
        // Set a simple flag to indicate auth is complete
        sessionStorage.setItem('authRedirectCompleted', 'true');
        
        // Set a timestamp to ensure we can track when this redirect happened
        sessionStorage.setItem('authRedirectTime', Date.now().toString());
        
        // Clear the redirect path
        sessionStorage.removeItem('redirectAfterAuth');
        
        // Use page refresh for reliable redirect after authentication
        if (redirectPath.includes('/register/event/')) {
          // Special handling for event registration to ensure step advancement
          const eventPath = redirectPath + (redirectPath.includes('?') ? '&' : '?') + 'auth_complete=true';
          console.log("Enhanced event registration redirect path:", eventPath);
          window.location.href = eventPath;
        } else {
          // Standard redirect for other paths
          console.log("Redirecting to:", redirectPath);
          window.location.href = redirectPath;
        }
        return;
      }
      
      // Check if we should do default redirect logic
      const isAuthPage = window.location.pathname === '/auth' || window.location.pathname === '/';
      console.log("Current path:", window.location.pathname, "isAuthPage:", isAuthPage);
      
      if (isAuthPage) {
        const defaultPath = user.isAdmin ? '/admin' : '/dashboard';
        console.log("On auth page, redirecting with page refresh to:", defaultPath);
        window.location.href = defaultPath;
      } else {
        console.log("On a non-auth page while logged in, not redirecting");
      }
    }, 100); // Small delay to ensure state synchronization
    
    return () => clearTimeout(timer);
  }, [user]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      console.log('Submitting login with email:', data.email);
      loginForm.clearErrors();
      
      // Login request with improved error handling
      await loginMutation.mutateAsync(data);
      
      console.log('Login mutation completed successfully');
      
      // Additional step: explicitly fetch user data to ensure session is established
      try {
        console.log('Performing explicit user data fetch after login');
        const userResponse = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-No-Cache': Date.now().toString()
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('User data retrieved after login:', userData ? 'success' : 'not found');
        } else {
          console.warn('Failed to fetch user data after login:', userResponse.status);
        }
      } catch (userFetchError) {
        console.error('Error fetching user data after login:', userFetchError);
      }
      
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
                    Welcome back
                  </CardTitle>
                  <p className="text-sm text-gray-400">Sign in to your account</p>
                </div>
                {logoutMessage && (
                  <div className={`mt-2 px-4 py-2 rounded-md text-sm font-medium ${
                    window.location.search.includes('forced') ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'
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
                          <FormLabel className="text-sm text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="username email"
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
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-300">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="current-password"
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
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    {loginForm.formState.errors.root?.serverError && (
                      <div className="p-3 text-sm font-medium text-red-300 bg-red-500/20 border border-red-500/30 rounded-md">
                        {loginForm.formState.errors.root.serverError.message}
                      </div>
                    )}
                    <Link href="/forgot-password">
                      <Button variant="link" className="w-full text-sm text-gray-400 p-0 h-auto font-medium hover:text-purple-400 transition-colors">
                        Forgot Password?
                      </Button>
                    </Link>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">
                        New to KickDeck?{" "}
                        <Link href={`/register${window.location.search}`}>
                          <Button variant="link" className="p-0 h-auto font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
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
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
  const { loginMutation, user, authState, setAuthState } = useAuth();
  const [location, setLocation] = useLocation();
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);

  // Check for logout message in session storage and handle eventId parameter
  useEffect(() => {
    // Handle logout message
    const message = sessionStorage.getItem('logout_message');
    if (message) {
      console.log('Found logout message in session storage:', message);
      setLogoutMessage(message);
      sessionStorage.removeItem('logout_message');
    }

    // Look for redirect in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
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
    
    // Check the referring page to catch event registration redirects that didn't include parameters
    const referrer = document.referrer;
    if (!redirectParam && !eventId && referrer) {
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
  }, []);

  // Enhanced redirection approach with authState
  useEffect(() => {
    // Only process if we have user data and are in a stable authenticated state
    if (!user || authState !== 'authenticated') {
      console.log("Auth redirect: Not redirecting due to auth state:", { authState, hasUser: !!user });
      return;
    }
    
    console.log("AUTH REDIRECT - ENHANCED: User logged in, handling redirect", {
      isAdmin: user.isAdmin,
      authState,
      currentPath: window.location.pathname,
      userInfo: `${user.firstName} ${user.lastName} (${user.email})`
    });
    
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
      
      // Signal that we're starting a redirect
      setAuthState('redirecting');
      
      // Set a simple flag to indicate auth is complete
      sessionStorage.setItem('authRedirectCompleted', 'true');
      
      // Set a timestamp to ensure we can track when this redirect happened
      sessionStorage.setItem('authRedirectTime', Date.now().toString());
      
      // Clear the redirect path
      sessionStorage.removeItem('redirectAfterAuth');
      
      // Ensure we add a special query parameter to force the event registration page
      // to recognize we're coming from login and move to the next step
      if (redirectPath.includes('/register/event/')) {
        // Special handling for event registration to ensure step advancement
        const eventPath = redirectPath + (redirectPath.includes('?') ? '&' : '?') + 'auth_complete=true';
        console.log("Enhanced event registration redirect path:", eventPath);
        
        // Short timeout to allow UI to update with redirecting state
        setTimeout(() => {
          window.location.href = eventPath;
        }, 50);
      } else {
        // Standard redirect for other paths
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 50);
      }
      return;
    }
    
    // No redirect path found, go to default location
    // Check if we're on the login page (could be /auth or /)
    // Use more robust detection for the auth page
    const isAuthPage = window.location.pathname === '/auth' || window.location.pathname === '/';
    console.log("Current path:", window.location.pathname, "isAuthPage:", isAuthPage);
    
    // Check all possible flags that indicate we're in a registration flow
    const inRegistrationFlow = sessionStorage.getItem('inRegistrationFlow') === 'true';
    
    // Also check the registrationData object which may contain more detailed state
    let registrationData = null;
    try {
      registrationData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
    } catch (e) {
      console.error('Failed to parse registrationData:', e);
    }
    
    const preventRedirectFromData = registrationData && registrationData.preventRedirect === true;
    const hasRegistrationStep = registrationData && registrationData.currentStep;
    
    // If any flag indicates we're in registration, don't redirect
    if (inRegistrationFlow || preventRedirectFromData || hasRegistrationStep) {
      console.log("AUTH: User is in registration flow, not redirecting to dashboard");
      console.log("Registration state flags:", { 
        inRegistrationFlow, 
        preventRedirectFromData, 
        currentStep: hasRegistrationStep ? registrationData.currentStep : null,
        timestamp: sessionStorage.getItem('registrationFlowTimestamp')
      });
      
      // DO NOT clear these flags - they need to persist throughout the process
      return;
    }
    
    // Handle the default case where we're on the auth page or related paths
    if (isAuthPage) {
      const defaultPath = user.isAdmin ? '/admin' : '/dashboard';
      console.log("On auth page, redirecting to:", defaultPath);
      
      // Signal that we're starting a redirect
      setAuthState('redirecting');
      
      // Use a short timeout to ensure this happens after other useEffects
      setTimeout(() => {
        window.location.href = defaultPath;
      }, 50);
    } else {
      // If we're on an admin page but we're not an admin, redirect to dashboard
      if (window.location.pathname.startsWith('/admin') && !user.isAdmin) {
        console.log("Non-admin user on admin page, redirecting to dashboard");
        setAuthState('redirecting');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 50);
        return;
      }
      
      // If we're on a dashboard page but we're an admin, redirect to admin panel
      if (window.location.pathname.startsWith('/dashboard') && user.isAdmin) {
        console.log("Admin user on dashboard page, redirecting to admin panel");
        setAuthState('redirecting');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 50);
        return;
      }
      
      console.log("On a non-auth page while logged in, not redirecting");
    }
  }, [user, authState, setAuthState]);

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
      
      // Update auth state to indicate login is in progress
      setAuthState('logging-in');
      
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
          
          // Update auth state to authenticated now that we have confirmed the session
          setAuthState('authenticated');
        } else {
          console.warn('Failed to fetch user data after login:', userResponse.status);
          // If we can't confirm the session, still try to set authenticated state
          // as the redirect mechanism will check user data anyways
          setAuthState('authenticated');
        }
      } catch (userFetchError) {
        console.error('Error fetching user data after login:', userFetchError);
        // Even if this fails, we should still set authenticated state since the login mutation succeeded
        setAuthState('authenticated');
      }
      
      // Login success is handled in useEffect for redirects
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Reset auth state on failure
      setAuthState('unauthenticated');
      
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
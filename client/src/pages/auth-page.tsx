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
import { useEffect, useState, useRef } from "react";

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
  
  // Store redirectAfterAuth in a ref to preserve it between renders
  const redirectPathRef = useRef<string | null>(null);

  // Check for logout message in session storage and handle eventId parameter
  useEffect(() => {
    // Handle logout message
    const message = sessionStorage.getItem('logout_message');
    if (message) {
      console.log('Found logout message in session storage:', message);
      setLogoutMessage(message);
      sessionStorage.removeItem('logout_message');
    }

    // Check URL parameters for both eventId and from parameters
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const fromRegistration = urlParams.get('from') === 'registration';
    
    console.log('⚙️ AUTH-PAGE INIT - URL parameters:', { 
      eventId, 
      fromRegistration,
      currentPath: window.location.pathname + window.location.search,
      allParams: Object.fromEntries(urlParams.entries()),
      currentSessionStorage: Object.fromEntries(
        Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])
      ),
      referrer: document.referrer
    });
    
    // Special case: When coming from event registration flow
    if (eventId && fromRegistration) {
      console.log('REGISTRATION FLOW: Found eventId in URL parameters:', eventId);
      // Set redirect back to step 2 (personal details)
      const redirectUrl = `/register/event/${eventId}`;
      console.log('Setting redirectAfterAuth to:', redirectUrl);
      sessionStorage.setItem('redirectAfterAuth', redirectUrl);
      redirectPathRef.current = redirectUrl; // Also store in React ref
      return; // Exit early since we've handled this case
    }
    
    // Regular case: Just eventId without from=registration (direct link)
    if (eventId && !fromRegistration) {
      console.log('DIRECT LINK: Found eventId in URL parameters:', eventId);
      const redirectUrl = `/register/event/${eventId}`;
      console.log('Setting redirectAfterAuth to:', redirectUrl);
      sessionStorage.setItem('redirectAfterAuth', redirectUrl);
      redirectPathRef.current = redirectUrl; // Also store in React ref
      return; // Exit early
    }
    
    // If we don't have an eventId but we're coming from registration, try to parse other parameters
    if (!eventId && fromRegistration) {
      console.log('Coming from registration flow without specific eventId in URL parameter...');
      
      // Check for eventId in the referrer URL, if available
      const referrer = document.referrer;
      if (referrer && referrer.includes('/register/event/')) {
        const matches = referrer.match(/\/register\/event\/(\d+)/);
        if (matches && matches[1]) {
          const eventIdFromReferrer = matches[1];
          console.log('Found eventId in referrer URL:', eventIdFromReferrer);
          const redirectUrl = `/register/event/${eventIdFromReferrer}`;
          sessionStorage.setItem('redirectAfterAuth', redirectUrl);
          redirectPathRef.current = redirectUrl; // Also store in React ref
        } else {
          // Default to dashboard if we can't get a specific eventId
          console.log('No eventId found in referrer, redirecting to dashboard instead');
          const dashboardUrl = '/dashboard';
          sessionStorage.setItem('redirectAfterAuth', dashboardUrl);
          redirectPathRef.current = dashboardUrl; // Also store in React ref
        }
      } else {
        // Default to dashboard if no referrer
        console.log('No referrer URL available, redirecting to dashboard instead');
        const dashboardUrl = '/dashboard';
        sessionStorage.setItem('redirectAfterAuth', dashboardUrl);
        redirectPathRef.current = dashboardUrl; // Also store in React ref
      }
    }
  }, []);

  // SIMPLIFIED DIRECT NAVIGATION - If user is already logged in, redirect immediately
  useEffect(() => {
    // Skip if not logged in or still loading
    if (!user) return;
    
    console.log("CRITICAL AUTH CHECK: User is already logged in, preparing to redirect", { 
      userId: user.id,
      isAdmin: user.isAdmin,
      urlParams: window.location.search
    });
    
    // Check URL parameters first - highest priority
    const urlParams = new URLSearchParams(window.location.search);
    const eventIdFromUrl = urlParams.get('eventId');
    const fromRegistration = urlParams.get('from') === 'registration';
    
    // Next check sessionStorage for redirectAfterAuth
    const storedRedirectPath = sessionStorage.getItem('redirectAfterAuth');
    
    console.log("Available redirect options:", {
      eventIdFromUrl,
      fromRegistration,
      storedRedirectPath,
      referrer: document.referrer
    });
    
    // Clear redirect path from storage regardless of what we do next
    sessionStorage.removeItem('redirectAfterAuth');
    
    // OPTION 1: If we have a stored redirect path, use it
    if (storedRedirectPath) {
      console.log("✅ DIRECT NAVIGATION: Using stored redirect path:", storedRedirectPath);
      
      // Simple validation to ensure it's a proper path with an event ID if needed
      if (storedRedirectPath.includes('/register/event/') && 
          !storedRedirectPath.match(/\/register\/event\/\d+/)) {
        console.error("Invalid redirect path (missing event ID):", storedRedirectPath);
        toast({
          title: "Navigation issue",
          description: "Could not return to registration. Missing event ID.",
          variant: "destructive"
        });
        
        // Navigate to default location
        window.location.href = user.isAdmin ? '/admin' : '/dashboard';
        return;
      }
      
      // Valid redirect path, navigate
      window.location.href = storedRedirectPath;
      return;
    }
    
    // OPTION 2: If we have an event ID in the URL and coming from registration
    if (eventIdFromUrl && fromRegistration) {
      const registrationUrl = `/register/event/${eventIdFromUrl}`;
      console.log("✅ DIRECT NAVIGATION: Using eventId from URL:", registrationUrl);
      window.location.href = registrationUrl;
      return;
    } 
    
    // OPTION 3: If we just have an event ID (not explicitly from registration)
    // but we're on the auth page, it's likely intended for registration
    if (eventIdFromUrl) {
      const registrationUrl = `/register/event/${eventIdFromUrl}`;
      console.log("✅ DIRECT NAVIGATION: Using eventId from URL as best guess:", registrationUrl);
      window.location.href = registrationUrl;
      return;
    }
    
    // OPTION 4: Default - go to admin or dashboard based on user role
    console.log("➡️ DIRECT NAVIGATION: No special redirect info, going to default:", 
      user.isAdmin ? '/admin' : '/dashboard');
    window.location.href = user.isAdmin ? '/admin' : '/dashboard';
    
  }, [user, toast]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    // Get parameters from URL to preserve for post-login
    const urlParams = new URLSearchParams(window.location.search);
    const eventIdFromUrl = urlParams.get('eventId');
    const fromRegistration = urlParams.get('from') === 'registration';
    
    console.log('🔑 LOGIN SUBMIT - Critical Data Check:', {
      // Primary source of truth - URL params
      eventIdFromUrl,
      fromRegistration,
      
      // Backup source of truth - sessionStorage
      redirectAfterAuth: sessionStorage.getItem('redirectAfterAuth'),
      
      // Debug data - all session storage and ref state
      redirectRef: redirectPathRef.current,
      allStorageKeys: Object.keys(sessionStorage),
    });

    // PRIORITY ORDER FOR REDIRECT:
    // 1. Stored redirectAfterAuth in sessionStorage (already set by RegistrationAuthChecker)
    // 2. URL parameters (eventId + from=registration)
    // 3. redirectPathRef as fallback
    
    // If no redirectAfterAuth in sessionStorage, but we have eventId in URL
    if (!sessionStorage.getItem('redirectAfterAuth') && eventIdFromUrl && fromRegistration) {
      const redirectPath = `/register/event/${eventIdFromUrl}`;
      console.log('🛠️ Setting redirectAfterAuth from URL params:', redirectPath);
      sessionStorage.setItem('redirectAfterAuth', redirectPath);
    }
    // If still no redirectAfterAuth but we have a ref value, use that
    else if (!sessionStorage.getItem('redirectAfterAuth') && redirectPathRef.current) {
      console.log('🛠️ Setting redirectAfterAuth from ref:', redirectPathRef.current);
      sessionStorage.setItem('redirectAfterAuth', redirectPathRef.current);
    }

    try {
      loginForm.clearErrors();
      
      // Store current redirect path value before login
      const storedPath = sessionStorage.getItem('redirectAfterAuth');
      
      // Perform login
      await loginMutation.mutateAsync(data);
      
      // Login success should be handled by the useEffect for redirects
      // But add an immediate redirect as a backup if we have a path and auth succeeded
      if (storedPath) {
        console.log('🏃‍♂️ Immediate post-login redirect to:', storedPath);
        window.location.href = storedPath;
      }
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
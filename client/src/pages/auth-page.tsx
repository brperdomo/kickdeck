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

  // BACK TO BASICS APPROACH - MUCH SIMPLER
  useEffect(() => {
    // Only process if we have user data and authentication is complete
    if (!user) return;
    
    console.log("AUTH REDIRECT - ORIGINAL APPROACH: User logged in, now handling redirect", { 
      user, 
      redirectPath: sessionStorage.getItem('redirectAfterAuth'),
    });
    
    // Check for redirectAfterAuth in session storage (highest priority)
    const redirectPath = sessionStorage.getItem('redirectAfterAuth');
    
    if (redirectPath) {
      console.log("Going to stored redirect path:", redirectPath);
      
      // Check if this is a registration process
      const isRegistrationProcess = 
        redirectPath.includes('/register/event/') || 
        redirectPath.includes('/event/') || 
        sessionStorage.getItem('in_registration_process') === 'true';
      
      // Set a flag with timestamp to indicate authentication redirect is complete
      // The registration page will detect this and force a fresh authentication check
      sessionStorage.setItem('authRedirectCompleted', Date.now().toString());
      console.log("Set authRedirectCompleted flag to:", sessionStorage.getItem('authRedirectCompleted'));
      
      // For event registrations, ensure we keep the in_registration_process flag
      if (isRegistrationProcess) {
        console.log("This is a registration process, keeping that flag active");
        sessionStorage.setItem('in_registration_process', 'true');
      }
      
      // Clear the stored redirect immediately to prevent future redirects
      // But keep it in memory for now
      const storedRedirectPath = redirectPath;
      sessionStorage.removeItem('redirectAfterAuth');
      
      // Add a parameter to indicate that this is a redirect completion
      // This helps the registration page detect the redirect in production environments
      const separator = storedRedirectPath.includes('?') ? '&' : '?';
      const redirectPathWithParam = `${storedRedirectPath}${separator}redirect=done`;
      
      // Use window.location for native navigation to ensure a clean slate
      window.location.href = redirectPathWithParam;
      return;
    }
    
    // Only if there's no explicit redirect path, go to default locations
    if (user.isAdmin) {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
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
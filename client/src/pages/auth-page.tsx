import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { z } from "zod";


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

  // Check for logout message and handle redirection parameters
  useEffect(() => {
    // Handle logout message
    const message = sessionStorage.getItem('logout_message');
    if (message) {
      console.log('Found logout message in session storage:', message);
      setLogoutMessage(message);
      sessionStorage.removeItem('logout_message');
    }

    // Handle redirect parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    const eventId = urlParams.get('eventId');
    
    if (redirectParam) {
      console.log('Found redirect parameter:', redirectParam);
      const decodedRedirect = decodeURIComponent(redirectParam);
      sessionStorage.setItem('redirectAfterAuth', decodedRedirect);
    } else if (eventId) {
      console.log('Found eventId in URL parameters:', eventId);
      const redirectUrl = `/register/event/${eventId}`;
      sessionStorage.setItem('redirectAfterAuth', redirectUrl);
    }
  }, []);

  // Form setup
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: LoginFormData) {
    try {
      console.log('Submitting login with email:', data.email);
      loginForm.clearErrors();
      
      // Update auth state to indicate login is in progress
      setAuthState('logging-in');
      
      // Perform login
      const userData = await loginMutation.mutateAsync(data);
      
      console.log('Login successful, user data:', userData);
      console.log('Login successful, user data type:', typeof userData);
      console.log('Login successful, user data fields:', userData ? Object.keys(userData) : 'No userData');
      
      // Check if the user has admin privileges - check if data is wrapped in a user or freshUserData object
      let userObject: any;
      if (userData && 'freshUserData' in userData) {
        userObject = userData.freshUserData;
        console.log('Using freshUserData:', userObject);
      } else if (userData && 'user' in userData) {
        userObject = userData.user;
        console.log('Using user object:', userObject);
      } else {
        userObject = userData;
        console.log('Using direct userData:', userObject);
      }
      
      const isAdmin = userObject && userObject.isAdmin;
      
      // Determine the appropriate dashboard - Admin and Dashboard are separate portals
      // For admin users, use the stable direct route to avoid potential issues
      const targetPath = isAdmin ? '/admin-direct' : '/dashboard';
      console.log(`Login successful, redirecting directly to ${targetPath} (isAdmin: ${isAdmin})`);
      
      // Set the authentication state to prevent redirect loops
      setAuthState('authenticated');
      
      // For admin users, we'll use window.location to ensure a fresh load of the admin dashboard
      // This helps avoid potential state issues with the complex admin dashboard
      if (isAdmin) {
        console.log('Admin user detected, using window.location for reliable redirect');
        window.location.href = targetPath;
        // Show loading state while redirecting
        return;
      } else {
        // For regular users, we can use the standard React router navigation
        setLocation(targetPath);
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      setAuthState('unauthenticated');
      
      // Show appropriate error messages
      if (error.message?.toLowerCase().includes("password")) {
        loginForm.setError("password", { message: "Invalid password" });
      } else if (error.message?.toLowerCase().includes("email") || 
                error.message?.toLowerCase().includes("user not found")) {
        loginForm.setError("email", { message: "Email not found or invalid" });
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

  // If already authenticated, redirect to dashboard
  if (user && authState === 'authenticated') {
    console.log("User already authenticated, redirecting to dashboard", user);
    console.log("User already authenticated, user type:", typeof user);
    console.log("User already authenticated, user fields:", user ? Object.keys(user) : 'No user');
    
    // Check if user has admin privileges - make sure we use the right property
    let userObject: any = user;
    if (user && typeof user === 'object' && 'user' in (user as any)) {
      userObject = (user as any).user;
      console.log('Auto-redirect: Using nested user object:', userObject);
    }
    const isAdmin = userObject && userObject.isAdmin;
                     
    console.log("User already authenticated, isAdmin:", isAdmin);
                     
    // Immediate redirect to dashboard - Admin and Dashboard are separate portals
    // Use the stable admin route for better reliability
    const directTarget = isAdmin ? '/admin-direct' : '/dashboard';
    
    // Direct redirect to appropriate dashboard
    console.log(`User already authenticated, redirecting to ${directTarget} (isAdmin: ${isAdmin})`);
    
    // For admin users, use window.location for a clean state reset
    if (isAdmin) {
      console.log('Already authenticated admin user, using window.location for reliable redirect');
      window.location.href = directTarget;
      // Return early to show a loading indicator
      return;
    } else {
      // For regular users, we can use the standard React router navigation
      setLocation(directTarget);
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h3 className="text-xl mb-2">You're already logged in!</h3>
        <p className="text-sm text-muted-foreground mb-4">Redirecting you to your dashboard...</p>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.location.href = '/admin-direct'} 
            className="bg-primary text-white px-3 py-1 rounded text-sm">
            Admin Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="bg-secondary px-3 py-1 rounded text-sm">
            Member Dashboard
          </button>
        </div>
      </div>
    );
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
                        "Sign In"
                      )}
                    </Button>

                    <div className="mt-4 text-center">
                      <Link to="/forgot-password" className="text-white hover:text-white/80 text-sm underline transition-colors">
                        Forgot password?
                      </Link>
                      <div className="mt-1">
                        <Link to="/register" className="text-white hover:text-white/80 text-sm underline transition-colors">
                          Create an account
                        </Link>
                      </div>
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
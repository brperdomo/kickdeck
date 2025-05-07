import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import AuthLayout from "@/components/layouts/AuthLayout";
import { PasswordStrength } from "@/components/ui/password-strength";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords must match",
      path: ["confirmPassword"],
    });
  }
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();
  const { register } = useUser();
  const [, setLocation] = useLocation();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState<{
    available: boolean;
    message?: string;
  } | null>(null);
  
  // Parse URL to check if registration was initiated from event registration
  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get('redirect') || '/';

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Debounced email validation
  useEffect(() => {
    const email = form.watch("email");
    let timeoutId: NodeJS.Timeout;

    const checkEmailAvailability = async () => {
      if (!email || !z.string().email().safeParse(email).success) {
        setEmailAvailability(null);
        return;
      }

      try {
        setIsCheckingEmail(true);
        const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error("Failed to check email availability");
        }

        const data = await response.json();
        setEmailAvailability(data);

        if (!data.available) {
          form.setError("email", {
            type: "manual",
            message: data.message || "This email is already registered"
          });
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailAvailability(null);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    if (email) {
      timeoutId = setTimeout(checkEmailAvailability, 500);
    } else {
      setEmailAvailability(null);
    }

    return () => clearTimeout(timeoutId);
  }, [form.watch("email")]);

  async function onSubmit(data: RegisterFormData) {
    // Double check email availability before submitting
    if (!emailAvailability?.available) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please use a different email address",
      });
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      const submitData: InsertUser = {
        username: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        phone: null,
        isParent: false,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };

      const result = await register(submitData);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: "Registration successful",
      });
      
      // Create a loading screen state to avoid showing 404 during state transition
      const processingRegistration = document.createElement('div');
      processingRegistration.className = 'fixed inset-0 bg-background flex items-center justify-center z-50';
      processingRegistration.innerHTML = `
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-lg font-medium">Setting up your account...</p>
          <p class="text-sm text-muted-foreground mt-2">Please wait a moment</p>
        </div>
      `;
      document.body.appendChild(processingRegistration);
      
      // Automatically log in the user after registration
      try {
        console.log('Fetching fresh user data after registration');
        // Actually await the user data to ensure we're authenticated
        const userResponse = await fetch('/api/user', { 
          credentials: 'include',
          cache: 'no-cache', // Force fresh data
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (userResponse.ok) {
          // Wait a moment for React Query to update
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (err) {
        console.error('Error fetching user after registration:', err);
      }
      
      // Redirect handling
      // Parse the redirect URL to handle special case for event registration
      const decodedUrl = decodeURIComponent(redirectUrl);
      
      // Set session variable to indicate we're freshly registered
      sessionStorage.setItem('just_registered', 'true');
      sessionStorage.setItem('registration_time', Date.now().toString());
      
      // Priority 1: If we came from an event registration page, go back to finish registration
      if (decodedUrl.includes('/register/event/')) {
        const eventId = decodedUrl.split('/register/event/')[1];
        if (eventId) {
          console.log('Redirecting to event registration', eventId);
          window.location.href = `/register/event/${eventId}`;
          return;
        }
      }
      
      // Priority 2: If we came from any registration page, return to it
      if (decodedUrl.includes('/register/') || decodedUrl.includes('/event/')) {
        console.log('Redirecting back to registration page', decodedUrl);
        window.location.href = decodedUrl;
        return;
      }
      
      // Priority 3: For all other URLs, redirect to dashboard
      console.log('Redirecting to dashboard after registration');
      window.location.href = '/dashboard';
      
      // Clean up loading screen after redirect
      setTimeout(() => {
        if (document.body.contains(processingRegistration)) {
          document.body.removeChild(processingRegistration);
        }
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  return (
    <AuthLayout>
      <div className="relative">
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
                  Create Your Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                    id="register-form"
                    name="register"
                    autoComplete="off"
                  >
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-white">First Name</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="given-name"
                              className="h-11 text-base px-4 bg-white/90 border-white/50 focus:border-white focus:ring-white/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-yellow-200" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-white">Last Name</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="family-name"
                              className="h-11 text-base px-4 bg-white/90 border-white/50 focus:border-white focus:ring-white/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-yellow-200" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-white">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="email"
                                autoComplete="email"
                                className={`h-11 text-base px-4 bg-white/90 border-white/50 focus:border-white focus:ring-white/50 ${
                                  emailAvailability?.available === false
                                    ? "border-red-500 focus:ring-red-500"
                                    : emailAvailability?.available
                                    ? "border-green-500 focus:ring-green-500"
                                    : ""
                                }`}
                                {...field}
                              />
                              {isCheckingEmail && (
                                <div className="absolute right-3 top-3">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage className="text-yellow-200" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              className="h-11 text-base px-4 bg-white/90 border-white/50 focus:border-white focus:ring-white/50"
                              {...field}
                            />
                          </FormControl>
                          <PasswordStrength password={field.value} />
                          <FormDescription className="text-white/80 text-sm">
                            Must be at least 8 characters with a number and special character
                          </FormDescription>
                          <FormMessage className="text-yellow-200" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base text-white">Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
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
                      disabled={isCheckingEmail || emailAvailability?.available === false}
                    >
                      Create Account
                    </Button>
                    <div className="text-center">
                      <Link href="/auth">
                        <Button variant="link" className="w-full text-sm text-yellow-200 p-0 h-auto font-semibold hover:text-yellow-100" type="button">
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
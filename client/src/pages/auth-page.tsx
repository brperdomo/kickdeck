import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, CheckCircle2, XCircle, Lock } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Shared password schema
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
});

// Registration schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords must match",
      path: ["confirmPassword"],
    });
  }
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

// Function to check email availability
async function checkEmailAvailability(email: string): Promise<{ available: boolean }> {
  const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to check email availability");
  }
  return response.json();
}

export default function AuthPage() {
  const { toast } = useToast();
  const { login, register: registerUser } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);
  const [userType, setUserType] = useState<"player" | "parent">("player");
  const [lastCheckedEmail, setLastCheckedEmail] = useState<string>("");
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

  // Email availability check mutation
  const emailCheckMutation = useMutation({
    mutationFn: checkEmailAvailability,
    onError: (error) => {
      console.error("Email check failed:", error);
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "all",
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
    mode: "all",
  });

  // Handle email validation
  const handleEmailValidation = async (email: string) => {
    if (email === lastCheckedEmail || !isRegistering) return;

    try {
      // Only check if email is valid
      const emailValidation = z.string().email().safeParse(email);
      if (emailValidation.success) {
        // Add a small delay to prevent too frequent API calls
        await new Promise(resolve => setTimeout(resolve, 300));
        setLastCheckedEmail(email);
        await emailCheckMutation.mutateAsync(email);
      }
    } catch (error) {
      console.error("Email validation error:", error);
    }
  };

  // Add password match check effect
  useEffect(() => {
    if (isRegistering) {
      const subscription = registerForm.watch((value, { name, type }) => {
        if (name === "password" || name === "confirmPassword" || type === "change") {
          const password = registerForm.getValues("password");
          const confirmPassword = registerForm.getValues("confirmPassword");

          if (password && confirmPassword) {
            setPasswordMatch(password === confirmPassword);
          } else {
            setPasswordMatch(null);
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [isRegistering, registerForm]);

  async function onSubmit(data: LoginFormData | RegisterFormData) {
    try {
      if (isRegistering) {
        const { confirmPassword, ...registerData } = data as RegisterFormData;
        const submitData: InsertUser = {
          ...registerData,
          phone: registerData.phone || null,
          isParent: userType === "parent",
          createdAt: new Date().toISOString(),
        };

        const result = await registerUser(submitData);
        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }
      } else {
        const loginData = data as LoginFormData;
        const result = await login({
          username: loginData.email,
          password: loginData.password,
          firstName: "",
          lastName: "",
          email: loginData.email,
          isParent: false,
          createdAt: new Date().toISOString(),
        });

        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: isRegistering ? "Registration successful" : "Login successful",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Soccer Registration System</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={isRegistering ? "register" : "login"}
            onValueChange={(v) => {
              setIsRegistering(v === "register");
              // Reset forms when switching between login and register
              loginForm.reset();
              registerForm.reset();
              setPasswordMatch(null);
              setLastCheckedEmail("");
              emailCheckMutation.reset();
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {isRegistering ? (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onSubmit)} className="space-y-4">
                  <RadioGroup
                    defaultValue="player"
                    value={userType}
                    onValueChange={(v) => setUserType(v as "player" | "parent")}
                    className="flex justify-center space-x-4 mb-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="player" id="player" />
                      <label htmlFor="player">Register as Player</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parent" id="parent" />
                      <label htmlFor="parent">Register as Parent</label>
                    </div>
                  </RadioGroup>

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              className={cn(
                                "pr-10",
                                emailCheckMutation.data?.available && "border-green-500 focus-visible:ring-green-500",
                                emailCheckMutation.data?.available === false && "border-red-500 focus-visible:ring-red-500"
                              )}
                              onChange={(e) => {
                                field.onChange(e);
                                const value = e.target.value;
                                if (value && value !== lastCheckedEmail) {
                                  handleEmailValidation(value);
                                }
                              }}
                            />
                          </FormControl>
                          {field.value && (
                            <div className="absolute right-3 top-2.5">
                              {emailCheckMutation.isPending ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                              ) : emailCheckMutation.data?.available ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : emailCheckMutation.data?.available === false ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : null}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                        {emailCheckMutation.data?.available === false && (
                          <p className="text-sm text-red-500 mt-1">
                            This email is already registered
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className={cn(
                                "pr-10",
                                passwordMatch && "border-green-500 focus-visible:ring-green-500",
                                passwordMatch === false && "border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                          {field.value && (
                            <div className="absolute right-3 top-2.5 transition-opacity duration-200">
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <FormDescription>
                          Must be at least 8 characters with a number and special character
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className={cn(
                                "pr-10",
                                passwordMatch && "border-green-500 focus-visible:ring-green-500",
                                passwordMatch === false && "border-red-500 focus-visible:ring-red-500"
                              )}
                              onPaste={(e) => e.preventDefault()} // Prevent pasting for security
                            />
                          </FormControl>
                          {field.value && (
                            <div className="absolute right-3 top-2.5 transition-transform duration-200 ease-in-out">
                              {passwordMatch ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 animate-in fade-in-0 zoom-in-95" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 animate-in fade-in-0 zoom-in-95" />
                              )}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                        {passwordMatch === false && (
                          <p className="text-sm text-red-500 mt-1 animate-in fade-in-0 slide-in-from-right-1">
                            Passwords do not match
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {userType === "player" ? "Player First Name" : "Parent First Name"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {userType === "player" ? "Player Last Name" : "Parent Last Name"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field: { value, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            {...fieldProps}
                            value={value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Register
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Login
                  </Button>
                </form>
              </Form>
            )}

            {!isRegistering && (
              <div className="text-center mt-4">
                <Link href="/forgot-password">
                  <Button variant="link" className="text-sm text-green-600" type="button">
                    Forgot Password?
                  </Button>
                </Link>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
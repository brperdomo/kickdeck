import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";
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
import { Trophy, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";
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
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState<{
    available: boolean;
    message?: string;
  } | null>(null);

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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      <SoccerFieldBackground className="opacity-50" />
      <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto relative z-10">
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 p-3">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
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
                      <FormLabel className="text-base">First Name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="given-name"
                          className="h-11 text-base px-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="family-name"
                          className="h-11 text-base px-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="email"
                            autoComplete="email"
                            className={`h-11 text-base px-4 ${
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
                      <FormMessage />
                      {emailAvailability?.available === false && (
                        <p className="text-sm text-red-500 mt-1">
                          {emailAvailability.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          className="h-11 text-base px-4"
                          {...field}
                        />
                      </FormControl>
                      <PasswordStrength password={field.value} />
                      <FormDescription className="text-sm">
                        Must be at least 8 characters with a number and special character
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          className="h-11 text-base px-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 text-base bg-green-600 hover:bg-green-700 transition-colors"
                  disabled={isCheckingEmail || emailAvailability?.available === false}
                >
                  Create Account
                </Button>
                <div className="pt-2 text-center">
                  <Link href="/">
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
    </div>
  );
}